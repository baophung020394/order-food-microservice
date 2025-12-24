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
import { TableServiceService } from './table-service.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { CreateTableQRDto } from './dto/create-table-qr.dto';
import { UpdateTableQRDto } from './dto/update-table-qr.dto';
import { QueryTableDto } from './dto/query-table.dto';
import { QueryTableQRDto } from './dto/query-table-qr.dto';
import { QueryTableByLocationDto } from './dto/query-table-by-location.dto';
import { TableStatus } from './entities/table.entity';

@Controller('tables')
export class TableServiceController {
  constructor(private readonly tableServiceService: TableServiceService) {}

  // Table endpoints

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTableDto: CreateTableDto) {
    return this.tableServiceService.create(createTableDto);
  }

  @Get()
  async findAll(@Query() queryDto: QueryTableDto) {
    return this.tableServiceService.findAll(queryDto);
  }

  @Get('number/:tableNumber')
  async findByTableNumber(@Param('tableNumber') tableNumber: string) {
    return this.tableServiceService.findByTableNumber(tableNumber);
  }

  @Get('by-location')
  async findAllGroupedByLocation(@Query() queryDto: QueryTableByLocationDto) {
    return this.tableServiceService.findAllGroupedByLocation(queryDto);
  }

  @Get('locations')
  async findAllLocations() {
    return this.tableServiceService.findAllLocations();
  }

  @Get('location/:location')
  async findAllByLocation(
    @Param('location') location: string,
    @Query() queryDto: QueryTableByLocationDto,
  ) {
    return this.tableServiceService.findAllByLocation(location, queryDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tableServiceService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTableDto: UpdateTableDto,
  ) {
    return this.tableServiceService.update(id, updateTableDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TableStatus,
    @Body('currentOrderId') currentOrderId?: string,
  ) {
    return this.tableServiceService.updateStatus(id, status, currentOrderId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.tableServiceService.remove(id);
  }

  // TableQR endpoints

  @Post('qr')
  @HttpCode(HttpStatus.CREATED)
  async createQR(@Body() createTableQRDto: CreateTableQRDto) {
    return this.tableServiceService.createQR(createTableQRDto);
  }

  @Get('qr')
  async findAllQRs(@Query() queryDto: QueryTableQRDto) {
    return this.tableServiceService.findAllQRs(queryDto);
  }

  @Get('qr/token/:qrToken')
  async findByQRToken(@Param('qrToken') qrToken: string) {
    return this.tableServiceService.findByQRToken(qrToken);
  }

  @Get('qr/:id')
  async findOneQR(@Param('id') id: string) {
    return this.tableServiceService.findOneQR(id);
  }

  @Put('qr/:id')
  async updateQR(
    @Param('id') id: string,
    @Body() updateTableQRDto: UpdateTableQRDto,
  ) {
    return this.tableServiceService.updateQR(id, updateTableQRDto);
  }

  @Delete('qr/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeQR(@Param('id') id: string) {
    await this.tableServiceService.removeQR(id);
  }
}
