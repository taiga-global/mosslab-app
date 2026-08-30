# Mosslab backend worker

## Reliable job flow

Generation requests atomically write two items to `AWS_DDB_TABLE` using
`TransactWriteItems`:

1. the job item (`jobId=<uuid>`, `status=PENDING`)
2. the outbox item (`jobId=OUTBOX#<uuid>`, `eventType=GenerateRequested`)

Enable DynamoDB Streams with `NEW_IMAGE` and deploy
`src/outbox/outbox.handler.ts` as a Lambda subscribed to the stream. The Lambda
must receive these environment variables:

- `AWS_DDB_TABLE`
- `AWS_SQS_URL`
- `AWS_REGION`

Its role needs `sqs:SendMessage` on the work queue and `dynamodb:UpdateItem` on
the table. The stream event-source mapping should use this filter so job item
updates do not invoke the handler unnecessarily:

```json
{
  "Filters": [
    {
      "Pattern": "{\"eventName\":[\"INSERT\"],\"dynamodb\":{\"NewImage\":{\"eventType\":{\"S\":[\"GenerateRequested\"]}}}}"
    }
  ]
}
```

Configure the SQS work queue with a redrive policy to a DLQ. Set its visibility
timeout to at least `SQS_VISIBILITY_TIMEOUT_SECONDS` (default 300 seconds), and
set `maxReceiveCount` equal to `SQS_MAX_RECEIVES` (default 3). Use a small Lambda
event-source batch size (10 is sufficient); a failed batch can be delivered
again, which is safe because the worker is idempotent for completed jobs.

Enable DynamoDB TTL on the `expiresAt` attribute to clean dispatched outbox
records after seven days. Stream/Lambda and SQS are at-least-once systems, so
duplicate messages remain possible; the worker checks for an already `DONE`
job before processing.

## Resumable generation checkpoints

Every external generation result is copied to S3 before its stage is advanced
in DynamoDB. Animated jobs progress through `PENDING`, `IMAGE_CLEANED`,
`VIDEO_GENERATED`, `GIF_GENERATED`, and `DONE`. Audio jobs progress through
`PENDING`, `MOOD_EXTRACTED`, `AUDIO_GENERATED`, and `DONE`. When SQS redelivers
a failed job, the worker reads `currentStage` and starts after the last durable
checkpoint instead of repeating completed AI calls.

## Timeouts

- `EXTERNAL_HTTP_TIMEOUT_MS` defaults to 60 seconds.
- `EXTERNAL_JOB_TIMEOUT_MS` defaults to 10 minutes.
- `OPENAI_TIMEOUT_MS` defaults to 60 seconds.
- `SQS_VISIBILITY_TIMEOUT_SECONDS` defaults to 300 seconds and is renewed while
  a job is running.

## Commands

```bash
pnpm --filter backend build
pnpm --filter backend test --runInBand
```
