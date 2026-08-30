import { DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { JobProcessor } from './job.processor';

describe('JobProcessor', () => {
  const replicate = {
    cleanImage: jest.fn(),
    animateImage: jest.fn(),
    convertVideoToGif: jest.fn(),
    makeAudio: jest.fn(),
  };
  const s3 = { getDownloadUrl: jest.fn() };
  const db = {
    get: jest.fn(),
    saveCheckpoint: jest.fn(),
    markDone: jest.fn(),
    markFailed: jest.fn(),
  };
  const openAi = { extractMoodFromImage: jest.fn() };
  const backup = { copyFromUrl: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('persists every animated checkpoint before marking the job DONE', async () => {
    const order: string[] = [];
    db.get.mockResolvedValue({
      jobId: JOB_ID,
      status: 'PENDING',
      currentStage: 'PENDING',
      inputKey: 'uploads/input.jpg',
      mode: 'animated',
    });
    s3.getDownloadUrl.mockImplementation(async (key: string) => `url:${key}`);
    replicate.cleanImage.mockResolvedValue('cleaned');
    replicate.animateImage.mockResolvedValue('video');
    replicate.convertVideoToGif.mockResolvedValue('gif');
    backup.copyFromUrl.mockImplementation(async (_url, key) =>
      order.push(`backup:${key}`),
    );
    db.saveCheckpoint.mockImplementation(async (_id, _expected, next) =>
      order.push(`checkpoint:${next}`),
    );
    db.markDone.mockImplementation(async () => void order.push('done'));

    const processor = makeProcessor();
    const send = jest.fn(async (command) => {
      if (command instanceof DeleteMessageCommand) order.push('delete');
      return {};
    });
    (processor as any).sqs = { send };

    await (processor as any).handleMessage({
      Body: JSON.stringify({
        jobId: JOB_ID,
        key: 'uploads/input.jpg',
        mode: 'animated',
      }),
      ReceiptHandle: 'receipt',
      Attributes: { ApproximateReceiveCount: '1' },
    });

    expect(order).toEqual([
      `backup:checkpoints/${JOB_ID}/cleaned.jpg`,
      'checkpoint:IMAGE_CLEANED',
      `backup:checkpoints/${JOB_ID}/animated.mp4`,
      'checkpoint:VIDEO_GENERATED',
      `backup:results/${JOB_ID}.gif`,
      'checkpoint:GIF_GENERATED',
      'done',
      'delete',
    ]);
  });

  it('resumes animated generation after the last persisted checkpoint', async () => {
    db.get.mockResolvedValue({
      jobId: JOB_ID,
      status: 'PROCESSING',
      currentStage: 'VIDEO_GENERATED',
      inputKey: 'uploads/input.jpg',
      generatedVideoKey: `checkpoints/${JOB_ID}/animated.mp4`,
      mode: 'animated',
    });
    s3.getDownloadUrl.mockResolvedValue('video');
    replicate.convertVideoToGif.mockResolvedValue('gif');

    const processor = makeProcessor();
    (processor as any).sqs = { send: jest.fn().mockResolvedValue({}) };
    await (processor as any).handleMessage(message('animated'));

    expect(replicate.cleanImage).not.toHaveBeenCalled();
    expect(replicate.animateImage).not.toHaveBeenCalled();
    expect(replicate.convertVideoToGif).toHaveBeenCalledWith('video');
    expect(db.markDone).toHaveBeenCalledWith(JOB_ID, `results/${JOB_ID}.gif`);
  });

  it('resumes audio generation without analyzing the image again', async () => {
    db.get.mockResolvedValue({
      jobId: JOB_ID,
      status: 'PROCESSING',
      currentStage: 'MOOD_EXTRACTED',
      inputKey: 'uploads/input.jpg',
      extractedMood: 'calm forest',
      mode: 'audiolized',
    });
    replicate.makeAudio.mockResolvedValue('audio');

    const processor = makeProcessor();
    (processor as any).sqs = { send: jest.fn().mockResolvedValue({}) };
    await (processor as any).handleMessage(message('audiolized'));

    expect(openAi.extractMoodFromImage).not.toHaveBeenCalled();
    expect(replicate.makeAudio).toHaveBeenCalledWith('calm forest');
    expect(db.markDone).toHaveBeenCalledWith(JOB_ID, `results/${JOB_ID}.mp3`);
  });

  it('retains a failed message for retry', async () => {
    db.get.mockResolvedValue({
      jobId: JOB_ID,
      status: 'PENDING',
      currentStage: 'PENDING',
      inputKey: 'uploads/input.jpg',
      mode: 'animated',
    });
    s3.getDownloadUrl.mockRejectedValue(new Error('temporary'));
    const processor = makeProcessor();
    const send = jest.fn().mockResolvedValue({});
    (processor as any).sqs = { send };

    await (processor as any).handleMessage({
      Body: JSON.stringify({
        jobId: JOB_ID,
        key: 'uploads/input.jpg',
        mode: 'animated',
      }),
      ReceiptHandle: 'receipt',
      Attributes: { ApproximateReceiveCount: '1' },
    });

    expect(send).not.toHaveBeenCalledWith(expect.any(DeleteMessageCommand));
    expect(db.markFailed).not.toHaveBeenCalled();
  });

  function makeProcessor() {
    const processor = new JobProcessor(
      replicate as any,
      s3 as any,
      db as any,
      openAi as any,
      backup as any,
    );
    (processor as any).queueUrl = 'https://sqs.example.test/queue';
    return processor;
  }

  function message(mode: 'animated' | 'audiolized') {
    return {
      Body: JSON.stringify({
        jobId: JOB_ID,
        key: 'uploads/input.jpg',
        mode,
      }),
      ReceiptHandle: 'receipt',
      Attributes: { ApproximateReceiveCount: '1' },
    };
  }
});

const JOB_ID = '8e0ef786-93a7-4ca1-bf45-b707177e4f02';
