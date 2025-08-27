import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  async extractMoodFromImage(imageUrl: string): Promise<string> {
    const description = `Analyze the mood of the image at this URL: ${imageUrl}`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: description }],
        max_tokens: 300,
      });

      return response.choices[0].message.content ?? '';
    } catch (error) {
      console.error('Error extracting mood from image:', error);
      throw new Error('Failed to extract mood from image');
    }
  }
}
