import { Test, TestingModule } from '@nestjs/testing';
import { TableServiceController } from './table-service.controller';
import { TableServiceService } from './table-service.service';

describe('TableServiceController', () => {
  let tableServiceController: TableServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TableServiceController],
      providers: [TableServiceService],
    }).compile();

    tableServiceController = app.get<TableServiceController>(TableServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(tableServiceController.getHello()).toBe('Hello World!');
    });
  });
});
