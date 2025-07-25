import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private client = new OpenAI();
  async getTextFromImageDescription(description: string): Promise<string> {
    // OpenAI API 호출 로직
    const response = await this.client.completions.create({
      model: 'gpt-3.5-turbo',
      prompt: description,
      temperature: 0.7,
      max_tokens: 30,
    });

    return response.object.;
  }
}
