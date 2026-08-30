import { Test, TestingModule } from '@nestjs/testing';
import { GenerateService } from './generate.service';
import { S3Service } from '../aws/s3.service';
import { DynamoDbService } from '../aws/dynamodb.service';

describe('GenerateService', () => {
  let service: GenerateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateService,
        { provide: S3Service, useValue: { getDownloadUrl: jest.fn() } },
        { provide: DynamoDbService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<GenerateService>(GenerateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
