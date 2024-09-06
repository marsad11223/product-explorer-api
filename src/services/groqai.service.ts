import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { Model } from 'mongoose';
import { Product } from 'src/schemas/product.schema';
import { UserInteraction } from 'src/schemas/interaction.schema';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

@Injectable()
export class GroqAIService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(UserInteraction.name)
    private readonly interactionModel: Model<UserInteraction>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  /**
   * Fetches and sorts user interactions by timestamp.
   */
  private async fetchAndSortUserInteractions(): Promise<UserInteraction[]> {
    const userInteractions = await this.interactionModel.find({}).exec();
    return userInteractions.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  /**
   * Generates a history string from sorted user interactions.
   */
  private generateInteractionHistory(
    sortedInteractions: UserInteraction[],
  ): string {
    return sortedInteractions
      .map((interaction) => {
        if (interaction.searchQuery) {
          return `Searched for "${interaction.searchQuery}"`;
        } else if (interaction.productId) {
          return `Interacted with product ID ${interaction.productId}`;
        }
        return `Interaction of type "${interaction.interactionType}"`;
      })
      .slice(0, 10) // Limit to the most recent interactions
      .join(', ');
  }

  /**
   * Fetches all products from the database.
   */
  private async fetchAllProducts(): Promise<Product[]> {
    return await this.productModel.find().exec();
  }

  /**
   * Generates a detailed product description for each product.
   */
  private generateProductDescriptions(products: Product[]): string {
    return products
      .map((product) => {
        return `${product.title} by ${product.brand}, ${product.category}, Price: ${product.price}, Rating: ${product.rating}, Stock: ${product.stock}, ID: ${product._id}`;
      })
      .join('. ');
  }

  /**
   * Checks if a given query is sensitive or invalid using Groq AI.
   */

  private async checkSensitiveContent(query: string): Promise<boolean> {
    const moderationPrompt = `
      Evaluate the following user query to determine if it contains sensitive, inappropriate, or irrelevant content. 
      Sensitive content includes, but is not limited to, explicit, violent, illegal, or otherwise harmful material. 
      If the query is deemed sensitive or irrelevant to our product catalog, respond with "No". 
      If the query is appropriate and relevant, respond with "Yes". 
      Please provide a clear and direct answer. The query is: "${query}"
    `;

    try {
      const response: AxiosResponse<any> = await this.httpService
        .post(
          process.env.GROQ_API_URL,
          {
            messages: [
              {
                role: 'user',
                content: moderationPrompt,
              },
            ],
            model: process.env.GROQ_MODEL,
            temperature: 0, // Ensure deterministic responses
            max_tokens: 10, // Limit response length
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

      const aiResponse = response.data.choices[0].message.content.trim();

      // Normalize response to handle different cases
      return aiResponse.toLowerCase() === 'yes';
    } catch (error) {
      console.error(
        'Error checking sensitive content:',
        error.response?.data || error.message,
      );
      throw new Error('Failed to check sensitive content');
    }
  }

  /**
   * Calls the GROQ AI API to get product recommendations.
   */
  private async fetchAIRecommendations(prompt: string): Promise<string> {
    const response: AxiosResponse<any> = await this.httpService
      .post(
        process.env.GROQ_API_URL,
        {
          messages: [
            {
              role: 'user',
              content: prompt,
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
  }

  /**
   * Extracts product IDs from AI recommendations.
   */
  private extractProductIds(recommendations: string): string[] {
    return recommendations
      .split('\n')
      .map((line) => line.match(/Product ID: (\w+)/)?.[1])
      .filter((id) => id);
  }

  /**
   * Maps product IDs to actual product objects.
   */
  private mapProductsById(
    productIds: string[],
    products: Product[],
  ): Product[] {
    const productMap = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    return productIds
      .map((id) => productMap.get(id))
      .filter((product) => product);
  }

  /**
   * Generates a recommendation text for the provided products.
   */
  private generateRecommendationText(products: Product[]): string {
    return products
      .map(
        (product) =>
          `${product.title} by ${product.brand}, Price: ${product.price}`,
      )
      .join('\n');
  }

  private getPrompt(
    query: string,
    interactionHistory: string,
    productDescriptions: string,
  ) {
    const prompt = `Based on the user's query "${query}" and their recent interaction 
      history which includes ${interactionHistory}, recommend the most relevant products strictly 
      from the following options: ${productDescriptions}. Provide a concise list of product recommendations
      using product IDs for accurate identification: 1. Product ID: [productID1] 2. Product ID: [productID2], 
      etc. Ensure that only the products listed above are recommended and provide brief contextual assistance 
      related to each product.`;

    return prompt;
  }

  /**
   * Main function to get product recommendations.
   */
  async getRecommendations(
    query: string,
  ): Promise<{ recommendationText: string; recommendedProducts: Product[] }> {
    try {
      // Step 1: Check if query is sensitive or invalid
      const isSensitive = await this.checkSensitiveContent(query);
      if (!isSensitive) {
        return {
          recommendationText:
            'Oops! It looks like your query contains inappropriate or unrelated content. Please try searching for something else.',
          recommendedProducts: [],
        };
      }

      // Step 2: Fetch and process interactions and products
      const [sortedInteractions, allProducts] = await Promise.all([
        this.fetchAndSortUserInteractions(),
        this.fetchAllProducts(),
      ]);

      const interactionHistory =
        this.generateInteractionHistory(sortedInteractions);
      const productDescriptions = this.generateProductDescriptions(allProducts);

      const prompt = this.getPrompt(
        query,
        interactionHistory,
        productDescriptions,
      );

      // Step 3: Fetch AI Recommendations
      const recommendations = await this.fetchAIRecommendations(prompt);
      const recommendedProductIds = this.extractProductIds(recommendations);
      const recommendedProducts = this.mapProductsById(
        recommendedProductIds,
        allProducts,
      );

      let recommendationText =
        'Here are some product recommendations based on your query:';
      if (recommendedProducts.length === 0) {
        recommendationText = 'No products found that match your query.';
      } else {
        recommendationText =
          this.generateRecommendationText(recommendedProducts);
      }

      return {
        recommendationText,
        recommendedProducts,
      };
    } catch (error) {
      console.error(
        'Error fetching recommendations:',
        error.response?.data || error.message,
      );
      throw new Error('Failed to fetch recommendations');
    }
  }
}
