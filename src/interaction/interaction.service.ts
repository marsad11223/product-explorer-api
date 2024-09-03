import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserInteraction } from 'src/schemas/interaction.schema';
import { InteractionType } from './interaction.types';

@Injectable()
export class InteractionService {
  constructor(
    @InjectModel(UserInteraction.name)
    private readonly interactionModel: Model<UserInteraction>,
  ) {}

  async recordInteraction(
    sessionId: string,
    interactionType: InteractionType,
    productId?: string,
    searchQuery?: string,
  ): Promise<UserInteraction> {
    // Find existing interaction record

    const query = { sessionId, interactionType, searchQuery, productId };
    const existingInteraction = await this.interactionModel.findOne(query);

    if (existingInteraction) {
      // Update the count for the existing interaction
      existingInteraction.count += 1;
      existingInteraction.timestamp = new Date();
      return existingInteraction.save();
    } else {
      // Create a new interaction record
      const interaction = new this.interactionModel({
        sessionId,
        interactionType,
        searchQuery,
        productId,
        timestamp: new Date(),
        count: 1,
      });
      return interaction.save();
    }
  }

  async recordViewInteraction(
    sessionId: string,
    productId: string,
  ): Promise<UserInteraction> {
    return this.recordInteraction(sessionId, InteractionType.VIEW, productId);
  }

  async recordSearchInteraction(
    sessionId: string,
    productId: string,
    searchQuery?: string,
  ): Promise<UserInteraction> {
    return this.recordInteraction(
      sessionId,
      InteractionType.SEARCH,
      productId,
      searchQuery,
    );
  }

  async recordClickInteraction(
    sessionId: string,
    productId: string,
  ): Promise<UserInteraction> {
    return this.recordInteraction(sessionId, InteractionType.CLICK, productId);
  }
}
