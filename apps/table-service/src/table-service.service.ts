import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { FindOptionsWhere, Repository } from 'typeorm';
import { REDIS_CLIENT } from '../config/redis.config';
import { CreateTableQRDto } from './dto/create-table-qr.dto';
import { CreateTableDto } from './dto/create-table.dto';
import { QueryTableDto } from './dto/query-table.dto';
import { QueryTableQRDto } from './dto/query-table-qr.dto';
import { QueryTableByLocationDto } from './dto/query-table-by-location.dto';
import { UpdateTableQRDto } from './dto/update-table-qr.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { TableQR } from './entities/table-qr.entity';
import { Table, TableStatus } from './entities/table.entity';
import { PaginatedResponseDto } from '@app/common/dto/paginated-response.dto';

@Injectable()
export class TableServiceService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(TableQR)
    private readonly tableQRRepository: Repository<TableQR>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
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
      console.warn(`[TableService] Failed to publish Redis event: ${error}`);
    }
  }

  // Table CRUD Operations

  async create(createTableDto: CreateTableDto): Promise<Table> {
    // Check if table number already exists
    const existingTable = await this.tableRepository.findOne({
      where: { tableNumber: createTableDto.tableNumber },
    });

    if (existingTable) {
      throw new ConflictException(
        `Table with number ${createTableDto.tableNumber} already exists`,
      );
    }

    const table = this.tableRepository.create({
      ...createTableDto,
      status: createTableDto.status || TableStatus.AVAILABLE,
    });

    const savedTable = await this.tableRepository.save(table);

    // Emit table.created event to Redis
    await this.safePublishRedisEvent(
      'table.created',
      JSON.stringify({
        tableId: savedTable.id,
        tableNumber: savedTable.tableNumber,
        status: savedTable.status,
      }),
    );

    return savedTable;
  }

  async findAll(queryDto: QueryTableDto): Promise<PaginatedResponseDto<Table>> {
    const { status, location, page = 1, limit = 10 } = queryDto;

    const where: FindOptionsWhere<Table> = {};
    if (status) {
      where.status = status;
    }
    if (location) {
      where.location = location;
    }

    const [data, total] = await this.tableRepository.findAndCount({
      where,
      relations: ['qrCodes'],
      order: { tableNumber: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const pageIndex: number = page;
    const pageSize: number = limit;
    return new PaginatedResponseDto<Table>(data, total, pageIndex, pageSize);
  }

  async findOne(id: string): Promise<Table> {
    const table = await this.tableRepository.findOne({
      where: { id },
      relations: ['qrCodes'],
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }

    return table;
  }

  async findByTableNumber(tableNumber: string): Promise<Table> {
    const table = await this.tableRepository.findOne({
      where: { tableNumber },
      relations: ['qrCodes'],
    });

    if (!table) {
      throw new NotFoundException(`Table with number ${tableNumber} not found`);
    }

    return table;
  }

  async update(id: string, updateTableDto: UpdateTableDto): Promise<Table> {
    const table = await this.findOne(id);

    // Check if table number is being updated and conflicts with existing
    if (
      updateTableDto.tableNumber &&
      updateTableDto.tableNumber !== table.tableNumber
    ) {
      const existingTable = await this.tableRepository.findOne({
        where: { tableNumber: updateTableDto.tableNumber },
      });

      if (existingTable) {
        throw new ConflictException(
          `Table with number ${updateTableDto.tableNumber} already exists`,
        );
      }
    }

    Object.assign(table, updateTableDto);
    const updatedTable = await this.tableRepository.save(table);

    // Emit table.updated event to Redis
    await this.safePublishRedisEvent(
      'table.updated',
      JSON.stringify({
        tableId: updatedTable.id,
        tableNumber: updatedTable.tableNumber,
        status: updatedTable.status,
      }),
    );

    return updatedTable;
  }

  async remove(id: string): Promise<void> {
    const table = await this.findOne(id);
    await this.tableRepository.remove(table);

    // Emit table.deleted event to Redis
    await this.safePublishRedisEvent(
      'table.deleted',
      JSON.stringify({
        tableId: id,
      }),
    );
  }

  async updateStatus(
    id: string,
    status: TableStatus,
    currentOrderId?: string,
  ): Promise<Table> {
    const table = await this.findOne(id);

    table.status = status;
    if (currentOrderId !== undefined) {
      table.currentOrderId = currentOrderId;
    }

    const updatedTable = await this.tableRepository.save(table);

    // Emit table.status.changed event to Redis
    await this.safePublishRedisEvent(
      'table.status.changed',
      JSON.stringify({
        tableId: updatedTable.id,
        tableNumber: updatedTable.tableNumber,
        status: updatedTable.status,
        currentOrderId: updatedTable.currentOrderId,
      }),
    );

    return updatedTable;
  }

  // TableQR CRUD Operations

  async createQR(createTableQRDto: CreateTableQRDto): Promise<TableQR> {
    // Check if QR token already exists
    const existingQR = await this.tableQRRepository.findOne({
      where: { qrToken: createTableQRDto.qrToken },
    });

    if (existingQR) {
      throw new ConflictException(
        `QR code with token ${createTableQRDto.qrToken} already exists`,
      );
    }

    // Deactivate other QR codes for this table if new one is active
    if (createTableQRDto.isActive !== false) {
      await this.tableQRRepository.update(
        { tableId: createTableQRDto.tableId, isActive: true },
        { isActive: false },
      );
    }

    const tableQR = this.tableQRRepository.create({
      ...createTableQRDto,
      isActive: createTableQRDto.isActive ?? true,
    });

    const savedQR = await this.tableQRRepository.save(tableQR);

    // Emit table.qr.created event to Redis
    await this.safePublishRedisEvent(
      'table.qr.created',
      JSON.stringify({
        qrId: savedQR.id,
        tableId: savedQR.tableId,
        qrToken: savedQR.qrToken,
      }),
    );

    return savedQR;
  }

  async findAllQRs(
    queryDto: QueryTableQRDto,
  ): Promise<PaginatedResponseDto<TableQR>> {
    const { tableId, page = 1, limit = 10 } = queryDto;

    const where: FindOptionsWhere<TableQR> = {};
    if (tableId) {
      where.tableId = tableId;
    }

    const [data, total] = await this.tableQRRepository.findAndCount({
      where,
      relations: ['table'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const pageIndex: number = page;
    const pageSize: number = limit;
    return new PaginatedResponseDto<TableQR>(data, total, pageIndex, pageSize);
  }

  async findOneQR(id: string): Promise<TableQR> {
    const qr = await this.tableQRRepository.findOne({
      where: { id },
      relations: ['table'],
    });

    if (!qr) {
      throw new NotFoundException(`QR code with ID ${id} not found`);
    }

    return qr;
  }

  async findByQRToken(qrToken: string): Promise<TableQR> {
    const qr = await this.tableQRRepository.findOne({
      where: { qrToken, isActive: true },
      relations: ['table'],
    });

    if (!qr) {
      throw new NotFoundException(
        `Active QR code with token ${qrToken} not found`,
      );
    }

    return qr;
  }

  async updateQR(
    id: string,
    updateTableQRDto: UpdateTableQRDto,
  ): Promise<TableQR> {
    const qr = await this.findOneQR(id);

    // Check if QR token is being updated and conflicts with existing
    if (updateTableQRDto.qrToken && updateTableQRDto.qrToken !== qr.qrToken) {
      const existingQR = await this.tableQRRepository.findOne({
        where: { qrToken: updateTableQRDto.qrToken },
      });

      if (existingQR) {
        throw new ConflictException(
          `QR code with token ${updateTableQRDto.qrToken} already exists`,
        );
      }
    }

    // If activating this QR, deactivate others for the same table
    if (updateTableQRDto.isActive === true && !qr.isActive) {
      await this.tableQRRepository.update(
        { tableId: qr.tableId, isActive: true },
        { isActive: false },
      );
    }

    Object.assign(qr, updateTableQRDto);
    const updatedQR = await this.tableQRRepository.save(qr);

    // Emit table.qr.updated event to Redis
    await this.safePublishRedisEvent(
      'table.qr.updated',
      JSON.stringify({
        qrId: updatedQR.id,
        tableId: updatedQR.tableId,
        qrToken: updatedQR.qrToken,
      }),
    );

    return updatedQR;
  }

  async removeQR(id: string): Promise<void> {
    const qr = await this.findOneQR(id);
    await this.tableQRRepository.remove(qr);

    // Emit table.qr.deleted event to Redis
    await this.safePublishRedisEvent(
      'table.qr.deleted',
      JSON.stringify({
        qrId: id,
      }),
    );
  }

  // Location-based queries

  /**
   * Get all unique locations
   */
  async findAllLocations(): Promise<string[]> {
    const tables = await this.tableRepository.find({
      select: ['location'],
    });

    const locations = [
      ...new Set(tables.map((table) => table.location).filter(Boolean)),
    ] as string[];

    return locations.sort();
  }

  /**
   * Get all tables grouped by location
   */
  async findAllGroupedByLocation(queryDto: QueryTableByLocationDto): Promise<
    PaginatedResponseDto<{
      location: string;
      tables: Table[];
      count: number;
    }>
  > {
    const { page = 1, limit = 10 } = queryDto;

    const tables = await this.tableRepository.find({
      relations: ['qrCodes'],
      order: { tableNumber: 'ASC' },
    });

    // Group tables by location
    const grouped = tables.reduce(
      (acc, table) => {
        const location = table.location || 'Unassigned';
        if (!acc[location]) {
          acc[location] = [];
        }
        acc[location].push(table);
        return acc;
      },
      {} as Record<string, Table[]>,
    );

    // Convert to array format
    const groupedArray = Object.entries(grouped)
      .map(([location, tables]) => ({
        location,
        tables,
        count: tables.length,
      }))
      .sort((a, b) => a.location.localeCompare(b.location));

    // Paginate the location groups
    const total = groupedArray.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = groupedArray.slice(startIndex, endIndex);

    const pageIndex: number = page;
    const pageSize: number = limit;
    return new PaginatedResponseDto<{
      location: string;
      tables: Table[];
      count: number;
    }>(paginatedData, total, pageIndex, pageSize);
  }

  /**
   * Get tables by specific location
   */
  async findAllByLocation(
    location: string,
    queryDto: QueryTableByLocationDto,
  ): Promise<PaginatedResponseDto<Table>> {
    const { page = 1, limit = 10 } = queryDto;

    const [data, total] = await this.tableRepository.findAndCount({
      where: { location },
      relations: ['qrCodes'],
      order: { tableNumber: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const pageIndex: number = page;
    const pageSize: number = limit;
    return new PaginatedResponseDto<Table>(data, total, pageIndex, pageSize);
  }
}
