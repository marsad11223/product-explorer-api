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

  /**
   * Main function to get product recommendations.
   */
  async getRecommendations(
    query: string,
  ): Promise<{ recommendationText: string; recommendedProducts: Product[] }> {
    try {
      const sortedInteractions = await this.fetchAndSortUserInteractions();
      const interactionHistory =
        this.generateInteractionHistory(sortedInteractions);

      const allProducts = await this.fetchAllProducts();
      const productDescriptions = this.generateProductDescriptions(allProducts);

      const prompt = `Based on the user's query "${query}" and their recent interaction 
      history which includes ${interactionHistory}, recommend the most relevant products strictly 
      from the following options: ${productDescriptions}. Provide a concise list of product recommendations
      using product IDs for accurate identification: 1. Product ID: [productID1] 2. Product ID: [productID2], 
      etc. Ensure that only the products listed above are recommended and provide brief contextual assistance 
      related to each product.`;

      const recommendations = await this.fetchAIRecommendations(prompt);
      const recommendedProductIds = this.extractProductIds(recommendations);
      const recommendedProducts = this.mapProductsById(
        recommendedProductIds,
        allProducts,
      );
      const recommendationText =
        this.generateRecommendationText(recommendedProducts);

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
