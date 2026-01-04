import { PaginatedResponseDto } from '@app/common/dto/paginated-response.dto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { FindOptionsWhere, Repository } from 'typeorm';
import { REDIS_CLIENT } from './config/redis.config';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateDishDto } from './dto/create-dish.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { QueryDishDto } from './dto/query-dish.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { Category } from './entities/category.entity';
import { Dish, DishStatus } from './entities/dish.entity';

@Injectable()
export class FoodServiceService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
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
      console.warn(`[FoodService] Failed to publish Redis event: ${error}`);
    }
  }

  // Category CRUD Operations

  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    // Check if category name already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category with name "${createCategoryDto.name}" already exists`,
      );
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      isActive: createCategoryDto.isActive ?? true,
      displayOrder: createCategoryDto.displayOrder ?? 0,
    });

    const savedCategory = await this.categoryRepository.save(category);

    // Emit category.created event to Redis
    await this.safePublishRedisEvent(
      'category.created',
      JSON.stringify({
        categoryId: savedCategory.id,
        name: savedCategory.name,
      }),
    );

    return savedCategory;
  }

  async findAllCategories(
    queryDto: QueryCategoryDto,
  ): Promise<PaginatedResponseDto<Category>> {
    const { isActive, page = 1, limit = 10 } = queryDto;

    const where: FindOptionsWhere<Category> = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await this.categoryRepository.findAndCount({
      where,
      relations: ['dishes'],
      order: { displayOrder: 'ASC', name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const pageIndex: number = page;
    const pageSize: number = limit;
    return new PaginatedResponseDto<Category>(data, total, pageIndex, pageSize);
  }

  async findOneCategory(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['dishes'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOneCategory(id);

    // Check if name is being updated and conflicts with existing
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory) {
        throw new ConflictException(
          `Category with name "${updateCategoryDto.name}" already exists`,
        );
      }
    }

    Object.assign(category, updateCategoryDto);
    const updatedCategory = await this.categoryRepository.save(category);

    // Emit category.updated event to Redis
    await this.safePublishRedisEvent(
      'category.updated',
      JSON.stringify({
        categoryId: updatedCategory.id,
        name: updatedCategory.name,
      }),
    );

    return updatedCategory;
  }

  async removeCategory(id: string): Promise<void> {
    const category = await this.findOneCategory(id);

    // Check if category has dishes
    const dishCount = await this.dishRepository.count({
      where: { categoryId: id },
    });

    if (dishCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${dishCount} dish(es). Please remove or reassign dishes first.`,
      );
    }

    await this.categoryRepository.remove(category);

    // Emit category.deleted event to Redis
    await this.safePublishRedisEvent(
      'category.deleted',
      JSON.stringify({
        categoryId: id,
      }),
    );
  }

  // Dish CRUD Operations

  async createDish(createDishDto: CreateDishDto): Promise<Dish> {
    // Verify category exists
    const category = await this.categoryRepository.findOne({
      where: { id: createDishDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createDishDto.categoryId} not found`,
      );
    }

    const dish = this.dishRepository.create({
      ...createDishDto,
      status: createDishDto.status ?? DishStatus.AVAILABLE,
      displayOrder: createDishDto.displayOrder ?? 0,
    });

    const savedDish = await this.dishRepository.save(dish);

    // Emit dish.created event to Redis
    await this.safePublishRedisEvent(
      'dish.created',
      JSON.stringify({
        dishId: savedDish.id,
        name: savedDish.name,
        categoryId: savedDish.categoryId,
        price: savedDish.price,
        status: savedDish.status,
      }),
    );

    return savedDish;
  }

  async findAllDishes(
    queryDto: QueryDishDto,
  ): Promise<PaginatedResponseDto<Dish>> {
    const {
      status,
      categoryId,
      isVegetarian,
      isVegan,
      isGlutenFree,
      search,
      page = 1,
      limit = 10,
    } = queryDto;

    const where: FindOptionsWhere<Dish> = {};
    if (status) {
      where.status = status;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (isVegetarian !== undefined) {
      where.isVegetarian = isVegetarian;
    }
    if (isVegan !== undefined) {
      where.isVegan = isVegan;
    }
    if (isGlutenFree !== undefined) {
      where.isGlutenFree = isGlutenFree;
    }

    const queryBuilder = this.dishRepository
      .createQueryBuilder('dish')
      .leftJoinAndSelect('dish.category', 'category')
      .where(where);

    // Add search functionality
    if (search) {
      queryBuilder.andWhere(
        '(dish.name ILIKE :search OR dish.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Order by category display order, then dish display order, then name
    queryBuilder
      .orderBy('category.displayOrder', 'ASC')
      .addOrderBy('dish.displayOrder', 'ASC')
      .addOrderBy('dish.name', 'ASC');

    // Pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    const pageIndex: number = page;
    const pageSize: number = limit;
    return new PaginatedResponseDto<Dish>(data, total, pageIndex, pageSize);
  }

  async findOneDish(id: string): Promise<Dish> {
    const dish = await this.dishRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!dish) {
      throw new NotFoundException(`Dish with ID ${id} not found`);
    }

    return dish;
  }

  async updateDish(id: string, updateDishDto: UpdateDishDto): Promise<Dish> {
    const dish = await this.findOneDish(id);

    // Verify category exists if being updated
    if (
      updateDishDto.categoryId &&
      updateDishDto.categoryId !== dish.categoryId
    ) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateDishDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateDishDto.categoryId} not found`,
        );
      }
    }

    Object.assign(dish, updateDishDto);
    const updatedDish = await this.dishRepository.save(dish);

    // Emit dish.updated event to Redis
    await this.safePublishRedisEvent(
      'dish.updated',
      JSON.stringify({
        dishId: updatedDish.id,
        name: updatedDish.name,
        categoryId: updatedDish.categoryId,
        price: updatedDish.price,
        status: updatedDish.status,
      }),
    );

    return updatedDish;
  }

  async updateDishStatus(id: string, status: DishStatus): Promise<Dish> {
    const dish = await this.findOneDish(id);
    dish.status = status;
    const updatedDish = await this.dishRepository.save(dish);

    // Emit dish.status.changed event to Redis
    await this.safePublishRedisEvent(
      'dish.status.changed',
      JSON.stringify({
        dishId: updatedDish.id,
        name: updatedDish.name,
        status: updatedDish.status,
        previousStatus: dish.status,
      }),
    );

    return updatedDish;
  }

  async removeDish(id: string): Promise<void> {
    const dish = await this.findOneDish(id);
    await this.dishRepository.remove(dish);

    // Emit dish.deleted event to Redis
    await this.safePublishRedisEvent(
      'dish.deleted',
      JSON.stringify({
        dishId: id,
      }),
    );
  }

  // Additional query methods

  async findDishesByCategory(
    categoryId: string,
    queryDto: QueryDishDto,
  ): Promise<PaginatedResponseDto<Dish>> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return this.findAllDishes({
      ...queryDto,
      categoryId,
    });
  }

  async findAvailableDishes(
    queryDto: QueryDishDto,
  ): Promise<PaginatedResponseDto<Dish>> {
    return this.findAllDishes({
      ...queryDto,
      status: DishStatus.AVAILABLE,
    });
  }
}
