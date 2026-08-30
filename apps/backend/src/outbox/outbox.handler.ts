import { UpdateItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { unmarshall } from '@aws-sdk/util-dynamodb';

type StreamRecord = {
  eventName?: string;
  dynamodb?: { NewImage?: Record<string, unknown> };
};

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const sqs = new SQSClient({ region: process.env.AWS_REGION });

export async function handler(event: { Records?: StreamRecord[] }) {
  const tableName = requiredEnv('AWS_DDB_TABLE');
  const queueUrl = requiredEnv('AWS_SQS_URL');

  for (const record of event.Records ?? []) {
    if (record.eventName !== 'INSERT' || !record.dynamodb?.NewImage) continue;
    const item = unmarshall(
      record.dynamodb.NewImage as Parameters<typeof unmarshall>[0],
    ) as {
      jobId?: string;
      eventType?: string;
      payload?: unknown;
    };
    if (item.eventType !== 'GenerateRequested' || !item.jobId || !item.payload)
      continue;

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(item.payload),
      }),
    );

    await ddb.send(
      new UpdateItemCommand({
        TableName: tableName,
        Key: { jobId: { S: item.jobId } },
        UpdateExpression: 'SET dispatchedAt = :now',
        ExpressionAttributeValues: {
          ':now': { S: new Date().toISOString() },
        },
      }),
    );
  }
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}
