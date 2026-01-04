import { Test, TestingModule } from '@nestjs/testing';
import { FoodServiceController } from './food-service.controller';
import { FoodServiceService } from './food-service.service';

describe('FoodServiceController', () => {
  let foodServiceController: FoodServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FoodServiceController],
      providers: [FoodServiceService],
    }).compile();

    foodServiceController = app.get<FoodServiceController>(FoodServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(foodServiceController.getHello()).toBe('Hello World!');
    });
  });
});
