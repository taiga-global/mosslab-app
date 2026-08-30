export type GenerateMode = 'animated' | 'audiolized';

export type GenerateStage =
  | 'PENDING'
  | 'IMAGE_CLEANED'
  | 'VIDEO_GENERATED'
  | 'GIF_GENERATED'
  | 'MOOD_EXTRACTED'
  | 'AUDIO_GENERATED'
  | 'DONE';

export interface GenerateJob {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
  currentStage?: GenerateStage;
  inputKey: string;
  mode: GenerateMode;
  cleanedImageKey?: string;
  generatedVideoKey?: string;
  extractedMood?: string;
  outputKey?: string;
  errorMessage?: string;
}

export interface JobMessage {
  jobId: string;
  key: string;
  mode: GenerateMode;
}
