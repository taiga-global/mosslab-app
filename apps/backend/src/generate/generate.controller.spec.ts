import { Test, TestingModule } from '@nestjs/testing';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';

describe('GenerateController', () => {
  let controller: GenerateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenerateController],
      providers: [
        {
          provide: GenerateService,
          useValue: { requestGenerate: jest.fn(), getDownloadUrl: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<GenerateController>(GenerateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
