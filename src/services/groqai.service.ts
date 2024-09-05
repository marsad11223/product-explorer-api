import { Injectable } from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';

import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

@Injectable()
export class GroqAIService {
  constructor(private readonly httpService: HttpService) {}

  async getRecommendations(query: string): Promise<string> {
    try {
      const response: AxiosResponse<any> = await this.httpService
        .post(
          process.env.GROQ_API_URL,
          {
            messages: [
              {
                role: 'user',
                content: `Based on the query "${query}", provide a concise list of product recommendations without additional commentary. Format the recommendations as a list: 1. Product A 2. Product B, etc.`,
              },
            ],
            model: process.env.GROQ_MODEL,
            temperature: parseFloat(process.env.GROQ_TEMPERATURE),
            max_tokens: parseInt(process.env.GROQ_MAX_TOKENS, 10),
            top_p: 1,
            stream: false,
            stop: null,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        )
        .toPromise();

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw new Error('Failed to fetch recommendations');
    }
  }
}
