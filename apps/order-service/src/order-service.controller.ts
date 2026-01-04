import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrderServiceService } from './order-service.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrderStatus } from './entities/order.entity';

@Controller('orders')
export class OrderServiceController {
  constructor(private readonly orderServiceService: OrderServiceService) {}

  // Order endpoints

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderServiceService.create(createOrderDto);
  }

  @Get()
  async findAll(@Query() queryDto: QueryOrderDto) {
    return this.orderServiceService.findAll(queryDto);
  }

  @Get('table/:tableId')
  async findByTableId(@Param('tableId') tableId: string) {
    return this.orderServiceService.findByTableId(tableId);
  }

  @Get('table/:tableId/active')
  async findActiveByTableId(@Param('tableId') tableId: string) {
    return this.orderServiceService.findActiveByTableId(tableId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.orderServiceService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderServiceService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.orderServiceService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.orderServiceService.remove(id);
  }

  // OrderItem endpoints

  @Post(':orderId/items')
  @HttpCode(HttpStatus.CREATED)
  async addItem(
    @Param('orderId') orderId: string,
    @Body() createItemDto: CreateOrderItemDto,
  ) {
    return this.orderServiceService.addItem(orderId, createItemDto);
  }

  @Put(':orderId/items/:itemId')
  async updateItem(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() updateItemDto: UpdateOrderItemDto,
  ) {
    return this.orderServiceService.updateItem(orderId, itemId, updateItemDto);
  }

  @Delete(':orderId/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItem(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
  ) {
    await this.orderServiceService.removeItem(orderId, itemId);
  }
}
