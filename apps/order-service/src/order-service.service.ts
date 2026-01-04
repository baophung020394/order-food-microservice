import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { FindOptionsWhere, Repository, DataSource } from 'typeorm';
import { REDIS_CLIENT } from './config/redis.config';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { PaginatedResponseDto } from '@app/common/dto/paginated-response.dto';

@Injectable()
export class OrderServiceService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Safely publish Redis events without crashing if Redis is unavailable
   */
  private async safePublishRedisEvent(
    channel: string,
    message: string,
  ): Promise<void> {
    try {
      if (this.redis.status === 'ready') {
        await this.redis.publish(channel, message);
      }
    } catch (error) {
      // Silently ignore Redis errors - service can work without Redis events
      console.warn(`[OrderService] Failed to publish Redis event: ${error}`);
    }
  }

  /**
   * Calculate total amount from order items
   */
  private calculateTotalAmount(items: OrderItem[]): number {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  // Order CRUD Operations

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create order using the transaction's entity manager
      const order = queryRunner.manager.create(Order, {
        tableId: createOrderDto.tableId,
        status: OrderStatus.PENDING,
        notes: createOrderDto.notes,
        createdBy: createOrderDto.createdBy,
        totalAmount: 0, // Will be calculated after items are created
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      // Create order items using the transaction's entity manager
      const orderItems = createOrderDto.items.map((itemDto) =>
        queryRunner.manager.create(OrderItem, {
          orderId: savedOrder.id,
          dishId: itemDto.dishId,
          dishName: itemDto.dishName,
          quantity: itemDto.quantity,
          price: itemDto.price,
          notes: itemDto.notes,
        }),
      );

      const savedItems = await queryRunner.manager.save(OrderItem, orderItems);

      // Calculate and update total amount
      savedOrder.totalAmount = this.calculateTotalAmount(savedItems);
      const finalOrder = await queryRunner.manager.save(Order, savedOrder);

      await queryRunner.commitTransaction();

      // Load items for response
      finalOrder.items = savedItems;

      // Emit order.created event to Redis
      await this.safePublishRedisEvent(
        'order.created',
        JSON.stringify({
          orderId: finalOrder.id,
          tableId: finalOrder.tableId,
          status: finalOrder.status,
          totalAmount: finalOrder.totalAmount,
          itemCount: savedItems.length,
        }),
      );

      return finalOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(queryDto: QueryOrderDto): Promise<PaginatedResponseDto<Order>> {
    const { status, tableId, createdBy, page = 1, limit = 10 } = queryDto;

    const where: FindOptionsWhere<Order> = {};
    if (status) {
      where.status = status;
    }
    if (tableId) {
      where.tableId = tableId;
    }
    if (createdBy) {
      where.createdBy = createdBy;
    }

    const [data, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const pageIndex: number = page;
    const pageSize: number = limit;
    return new PaginatedResponseDto<Order>(data, total, pageIndex, pageSize);
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByTableId(tableId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { tableId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveByTableId(tableId: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: [
        { tableId, status: OrderStatus.PENDING },
        { tableId, status: OrderStatus.CONFIRMED },
        { tableId, status: OrderStatus.PREPARING },
      ],
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    // Use transaction if items are being updated
    if (updateOrderDto.items && updateOrderDto.items.length > 0) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Load order WITHOUT items relation to avoid TypeORM relation sync issues
        // When items are loaded via relation, TypeORM tracks the relation and may
        // sync it incorrectly, causing order_id to be set to null
        const order = await queryRunner.manager.findOne(Order, {
          where: { id },
        });

        if (!order) {
          throw new NotFoundException(`Order with ID ${id} not found`);
        }

        // Prevent updating completed or cancelled orders
        if (
          order.status === OrderStatus.COMPLETED ||
          order.status === OrderStatus.CANCELLED
        ) {
          throw new BadRequestException(
            `Cannot update order with status ${order.status}`,
          );
        }

        // Load existing items SEPARATELY without relation to avoid sync issues
        // This prevents TypeORM from tracking the 'order' relation which can cause
        // order_id to be set to null during save
        const existingItems = await queryRunner.manager.find(OrderItem, {
          where: { orderId: id },
        });

        // Strategy: MERGE items (add/update, keep existing items not in update)
        // Logic: "Thêm món" = ADD new items or UPDATE existing items by dishId
        // Items not in update request are KEPT (not deleted)
        // This matches mobile app behavior where users add items to existing order

        // Process each item in update request: update existing or create new
        for (const itemDto of updateOrderDto.items) {
          // Find existing item with same dishId
          const existingItem = existingItems.find(
            (item) => item.dishId === itemDto.dishId,
          );

          if (existingItem) {
            // UPDATE existing item: Update quantity, price, dishName, notes
            // CRITICAL: Explicitly set orderId to prevent TypeORM from syncing
            // relation and setting order_id to null
            const updateData: Partial<OrderItem> = {
              orderId: id, // EXPLICITLY set orderId to prevent null
              dishName: itemDto.dishName,
              quantity: itemDto.quantity,
              price: itemDto.price,
            };
            // Only set notes if provided (don't set null)
            if (itemDto.notes !== undefined) {
              updateData.notes = itemDto.notes;
            }
            await queryRunner.manager.update(
              OrderItem,
              { id: existingItem.id },
              updateData,
            );
          } else {
            // CREATE new item: Add new dish to order
            const newItem = queryRunner.manager.create(OrderItem, {
              orderId: id,
              dishId: itemDto.dishId,
              dishName: itemDto.dishName,
              quantity: itemDto.quantity,
              price: itemDto.price,
              notes: itemDto.notes,
            });
            await queryRunner.manager.save(OrderItem, newItem);
          }
        }

        // KEEP items that are not in update request (merge strategy)
        // These items remain unchanged in the order
        // No action needed - they stay in database

        // Reload ALL items (updated + new + kept) for total calculation
        // This ensures we have the latest data after all updates
        const allSavedItems = await queryRunner.manager.find(OrderItem, {
          where: { orderId: id },
        });

        // Calculate total amount from all items
        const newTotalAmount = this.calculateTotalAmount(allSavedItems);

        // Update order fields
        // Use QueryBuilder.update() to avoid relation sync issues
        await queryRunner.manager.update(
          Order,
          { id },
          {
            status: updateOrderDto.status || order.status,
            notes:
              updateOrderDto.notes !== undefined
                ? updateOrderDto.notes
                : order.notes,
            totalAmount: newTotalAmount,
          },
        );

        // Reload order with items for response
        const updatedOrder = await queryRunner.manager.findOne(Order, {
          where: { id },
        });

        if (!updatedOrder) {
          throw new NotFoundException(
            `Order with ID ${id} not found after update`,
          );
        }

        // Assign items for response
        updatedOrder.items = allSavedItems;

        await queryRunner.commitTransaction();

        // Emit order.updated event to Redis
        await this.safePublishRedisEvent(
          'order.updated',
          JSON.stringify({
            orderId: updatedOrder.id,
            tableId: updatedOrder.tableId,
            status: updatedOrder.status,
            totalAmount: updatedOrder.totalAmount,
          }),
        );

        return updatedOrder;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } else {
      // Simple update without items
      const order = await this.findOne(id);

      // Prevent updating completed or cancelled orders
      if (
        order.status === OrderStatus.COMPLETED ||
        order.status === OrderStatus.CANCELLED
      ) {
        throw new BadRequestException(
          `Cannot update order with status ${order.status}`,
        );
      }

      Object.assign(order, updateOrderDto);
      const updatedOrder = await this.orderRepository.save(order);

      // Emit order.updated event to Redis
      await this.safePublishRedisEvent(
        'order.updated',
        JSON.stringify({
          orderId: updatedOrder.id,
          tableId: updatedOrder.tableId,
          status: updatedOrder.status,
          totalAmount: updatedOrder.totalAmount,
        }),
      );

      return updatedOrder;
    }
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);

    // Validate status transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [], // Terminal state
      [OrderStatus.CANCELLED]: [], // Terminal state
    };

    const allowedStatuses = validTransitions[order.status];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${status}`,
      );
    }

    order.status = status;
    const updatedOrder = await this.orderRepository.save(order);

    // Emit order.status.changed event to Redis
    await this.safePublishRedisEvent(
      'order.status.changed',
      JSON.stringify({
        orderId: updatedOrder.id,
        tableId: updatedOrder.tableId,
        status: updatedOrder.status,
        previousStatus: order.status,
      }),
    );

    return updatedOrder;
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);

    // Only allow deletion of pending or cancelled orders
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot delete order with status ${order.status}. Only pending or cancelled orders can be deleted.`,
      );
    }

    await this.orderRepository.remove(order);

    // Emit order.deleted event to Redis
    await this.safePublishRedisEvent(
      'order.deleted',
      JSON.stringify({
        orderId: id,
      }),
    );
  }

  // OrderItem Operations

  async addItem(
    orderId: string,
    createItemDto: CreateOrderItemDto,
  ): Promise<OrderItem> {
    const order = await this.findOne(orderId);

    // Prevent adding items to completed or cancelled orders
    if (
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot add items to order with status ${order.status}`,
      );
    }

    const item = this.orderItemRepository.create({
      orderId,
      ...createItemDto,
    });

    const savedItem = await this.orderItemRepository.save(item);

    // Recalculate total amount
    const items = await this.orderItemRepository.find({
      where: { orderId },
    });
    order.totalAmount = this.calculateTotalAmount(items);
    await this.orderRepository.save(order);

    // Emit order.item.added event to Redis
    await this.safePublishRedisEvent(
      'order.item.added',
      JSON.stringify({
        orderId,
        itemId: savedItem.id,
        dishId: savedItem.dishId,
        quantity: savedItem.quantity,
      }),
    );

    return savedItem;
  }

  async updateItem(
    orderId: string,
    itemId: string,
    updateItemDto: UpdateOrderItemDto,
  ): Promise<OrderItem> {
    const order = await this.findOne(orderId);

    // Prevent updating items in completed or cancelled orders
    if (
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot update items in order with status ${order.status}`,
      );
    }

    const item = await this.orderItemRepository.findOne({
      where: { id: itemId, orderId },
    });

    if (!item) {
      throw new NotFoundException(
        `Order item with ID ${itemId} not found in order ${orderId}`,
      );
    }

    Object.assign(item, updateItemDto);
    const updatedItem = await this.orderItemRepository.save(item);

    // Recalculate total amount
    const items = await this.orderItemRepository.find({
      where: { orderId },
    });
    order.totalAmount = this.calculateTotalAmount(items);
    await this.orderRepository.save(order);

    // Emit order.item.updated event to Redis
    await this.safePublishRedisEvent(
      'order.item.updated',
      JSON.stringify({
        orderId,
        itemId: updatedItem.id,
      }),
    );

    return updatedItem;
  }

  async removeItem(orderId: string, itemId: string): Promise<void> {
    const order = await this.findOne(orderId);

    // Prevent removing items from completed or cancelled orders
    if (
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot remove items from order with status ${order.status}`,
      );
    }

    const item = await this.orderItemRepository.findOne({
      where: { id: itemId, orderId },
    });

    if (!item) {
      throw new NotFoundException(
        `Order item with ID ${itemId} not found in order ${orderId}`,
      );
    }

    // Prevent removing the last item
    const itemCount = await this.orderItemRepository.count({
      where: { orderId },
    });

    if (itemCount === 1) {
      throw new BadRequestException(
        'Cannot remove the last item from an order. Delete the order instead.',
      );
    }

    await this.orderItemRepository.remove(item);

    // Recalculate total amount
    const items = await this.orderItemRepository.find({
      where: { orderId },
    });
    order.totalAmount = this.calculateTotalAmount(items);
    await this.orderRepository.save(order);

    // Emit order.item.removed event to Redis
    await this.safePublishRedisEvent(
      'order.item.removed',
      JSON.stringify({
        orderId,
        itemId,
      }),
    );
  }
}
