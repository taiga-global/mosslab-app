export type GenerateMode = 'animated' | 'audiolized';

export interface JobMessage {
  jobId: string;
  key: string;
  mode: GenerateMode;
}
