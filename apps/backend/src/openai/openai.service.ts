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
      const response = await this.client.completions.create({
        model: 'gpt-3.5-turbo',
        prompt: description,
        temperature: 0.7,
        max_tokens: 50,
      });

      return response.choices[0].text.trim();
    } catch (error) {
      console.error('Error extracting mood from image:', error);
      throw new Error('Failed to extract mood from image');
    }
  }
}
