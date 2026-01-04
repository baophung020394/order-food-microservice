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
import { FoodServiceService } from './food-service.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { QueryDishDto } from './dto/query-dish.dto';
import { DishStatus } from './entities/dish.entity';

@Controller('food')
export class FoodServiceController {
  constructor(private readonly foodServiceService: FoodServiceService) {}

  // Category endpoints

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.foodServiceService.createCategory(createCategoryDto);
  }

  @Get('categories')
  async findAllCategories(@Query() queryDto: QueryCategoryDto) {
    return this.foodServiceService.findAllCategories(queryDto);
  }

  @Get('categories/:id')
  async findOneCategory(@Param('id') id: string) {
    return this.foodServiceService.findOneCategory(id);
  }

  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.foodServiceService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCategory(@Param('id') id: string) {
    await this.foodServiceService.removeCategory(id);
  }

  // Dish endpoints

  @Post('dishes')
  @HttpCode(HttpStatus.CREATED)
  async createDish(@Body() createDishDto: CreateDishDto) {
    return this.foodServiceService.createDish(createDishDto);
  }

  @Get('dishes')
  async findAllDishes(@Query() queryDto: QueryDishDto) {
    return this.foodServiceService.findAllDishes(queryDto);
  }

  @Get('dishes/available')
  async findAvailableDishes(@Query() queryDto: QueryDishDto) {
    return this.foodServiceService.findAvailableDishes(queryDto);
  }

  @Get('dishes/category/:categoryId')
  async findDishesByCategory(
    @Param('categoryId') categoryId: string,
    @Query() queryDto: QueryDishDto,
  ) {
    return this.foodServiceService.findDishesByCategory(categoryId, queryDto);
  }

  @Get('dishes/:id')
  async findOneDish(@Param('id') id: string) {
    return this.foodServiceService.findOneDish(id);
  }

  @Put('dishes/:id')
  async updateDish(
    @Param('id') id: string,
    @Body() updateDishDto: UpdateDishDto,
  ) {
    return this.foodServiceService.updateDish(id, updateDishDto);
  }

  @Patch('dishes/:id/status')
  async updateDishStatus(
    @Param('id') id: string,
    @Body('status') status: DishStatus,
  ) {
    return this.foodServiceService.updateDishStatus(id, status);
  }

  @Delete('dishes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDish(@Param('id') id: string) {
    await this.foodServiceService.removeDish(id);
  }
}
