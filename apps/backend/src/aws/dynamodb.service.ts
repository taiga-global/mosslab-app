import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DynamoDBService {
  private client = new DynamoDBClient({ region: 'ap-northeast-2' });
  private tableName = process.env.DYNAMODB_TABLE_NAME;

  async putItem(item: any) {
    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: marshall(item),
    });
    await this.client.send(command);
  }
}
