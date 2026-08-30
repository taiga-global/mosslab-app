import {
  DynamoDBClient,
  GetItemCommand,
  TransactWriteItemsCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Injectable } from '@nestjs/common';
import { GenerateMode, GenerateStage } from '../../type';

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

  async createPendingWithOutbox(
    jobId: string,
    inputKey: string,
    mode: GenerateMode,
  ) {
    const createdAt = new Date().toISOString();
    return this.ddb.send(
      new TransactWriteItemsCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.table,
              Item: marshall({
                jobId,
                status: 'PENDING',
                currentStage: 'PENDING',
                inputKey,
                mode,
                createdAt,
              }),
              ConditionExpression: 'attribute_not_exists(jobId)',
            },
          },
          {
            Put: {
              TableName: this.table,
              Item: marshall({
                jobId: `OUTBOX#${jobId}`,
                eventType: 'GenerateRequested',
                aggregateId: jobId,
                payload: { jobId, key: inputKey, mode },
                createdAt,
                expiresAt: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
              }),
              ConditionExpression: 'attribute_not_exists(jobId)',
            },
          },
        ],
      }),
    );
  }

  async markDone(jobId: string, outputKey: string) {
    return this.ddb.send(
      new UpdateItemCommand({
        TableName: this.table,
        Key: marshall({ jobId }),
        UpdateExpression:
          'SET #s = :s, currentStage = :stage, outputKey = :o, completedAt = :t REMOVE errorMessage',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: marshall({
          ':s': 'DONE',
          ':stage': 'DONE',
          ':o': outputKey,
          ':t': new Date().toISOString(),
        }),
      }),
    );
  }

  async saveCheckpoint(
    jobId: string,
    expectedStage: GenerateStage,
    nextStage: GenerateStage,
    artifacts: Record<string, string>,
  ) {
    const names: Record<string, string> = {
      '#status': 'status',
      '#stage': 'currentStage',
    };
    const values: Record<string, string> = {
      ':processing': 'PROCESSING',
      ':expected': expectedStage,
      ':next': nextStage,
      ':updatedAt': new Date().toISOString(),
    };
    const assignments = [
      '#status = :processing',
      '#stage = :next',
      'updatedAt = :updatedAt',
    ];

    Object.entries(artifacts).forEach(([field, value], index) => {
      const name = `#artifact${index}`;
      const token = `:artifact${index}`;
      names[name] = field;
      values[token] = value;
      assignments.push(`${name} = ${token}`);
    });

    return this.ddb.send(
      new UpdateItemCommand({
        TableName: this.table,
        Key: marshall({ jobId }),
        UpdateExpression: `SET ${assignments.join(', ')} REMOVE errorMessage`,
        ConditionExpression:
          '#stage = :expected OR (attribute_not_exists(#stage) AND :expected = :pending)',
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: marshall({
          ...values,
          ':pending': 'PENDING',
        }),
      }),
    );
  }

  async markFailed(jobId: string, errorMessage: string) {
    return this.ddb.send(
      new UpdateItemCommand({
        TableName: this.table,
        Key: marshall({ jobId }),
        UpdateExpression: 'SET #s = :s, errorMessage = :e, failedAt = :t',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: marshall({
          ':s': 'FAILED',
          ':e': errorMessage,
          ':t': new Date().toISOString(),
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
