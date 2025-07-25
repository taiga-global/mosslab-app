import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DynamoDbService {
  private ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
  private table = process.env.AWS_DDB_TABLE;

  // async putPending(
  //   jobId: string,
  //   inputKey: string,
  // ): Promise<PutItemCommandOutput> {
  //   const params: PutItemCommandInput = {
  //     TableName: this.table,
  //     Item: marshall({ jobId, status: 'PENDING', inputKey }),
  //   };

  //   // 제네릭 파라미터를 넣어 any 추론을 막는다
  //   return this.ddb.send(new PutItemCommand(params));
  // }

  async putPending(jobId: string, inputKey: string, mode: string) {
    return this.ddb.send(
      new PutItemCommand({
        TableName: this.table,
        Item: marshall({ jobId, status: 'PENDING', inputKey, mode }),
      }),
    );
  }

  async markDone(jobId: string, downloadUrl: string) {
    return this.ddb.send(
      new UpdateItemCommand({
        TableName: this.table,
        Key: marshall({ jobId }),
        UpdateExpression: 'SET #s = :s, downloadUrl = :d',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: marshall({
          ':s': 'DONE',
          ':d': downloadUrl,
        }),
      }),
    );
  }

  async markFailed(jobId: string, errorMessage: string) {
    return this.ddb.send(
      new UpdateItemCommand({
        TableName: this.table,
        Key: marshall({ jobId }),
        UpdateExpression: 'SET #s = :s, errorMessage = :e',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: marshall({
          ':s': 'FAILED',
          ':e': errorMessage,
        }),
      }),
    );
  }

  async get(jobId: string) {
    const res = await this.ddb.send(
      new GetItemCommand({ TableName: this.table, Key: marshall({ jobId }) }),
    );
    return res.Item && unmarshall(res.Item);
  }
}
