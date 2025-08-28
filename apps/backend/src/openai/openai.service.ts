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
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze the mood of this image' },
              { type: 'image_url', image_url: { url: imageUrl } }, // 단순 URL은 public이어야 함
            ],
          },
        ],
      });
      console.log(completion);

      return completion.choices[0].message.content ?? '';
    } catch (error) {
      console.error('Error extracting mood from image:', error);
      throw new Error('Failed to extract mood from image');
    }
  }
}
