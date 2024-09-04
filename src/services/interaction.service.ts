import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserInteraction } from 'src/schemas/interaction.schema';

export enum InteractionType {
  SEARCH = 'search',
  CLICK = 'click',
  VIEW = 'view',
  TIME_SPEND = 'time_spend',
}

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
    timeSpent?: number, // Added timeSpent parameter
  ): Promise<UserInteraction> {
    // Find existing interaction record
    const query = { sessionId, interactionType, searchQuery, productId };
    const existingInteraction = await this.interactionModel.findOne(query);

    if (existingInteraction) {
      // Update the existing interaction
      existingInteraction.count += 1;
      existingInteraction.timestamp = new Date();

      // Update time spent if it's a TIME_SPEND interaction
      if (interactionType === InteractionType.TIME_SPEND && timeSpent) {
        existingInteraction.time_spend =
          (existingInteraction.time_spend || 0) + timeSpent; // Add time spent
      }

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
        time_spend:
          interactionType === InteractionType.TIME_SPEND
            ? timeSpent
            : undefined, // Set time spent if applicable
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

  async recordTimeSpentInteraction(
    sessionId: string,
    productId: string,
    timeSpent: number,
  ): Promise<UserInteraction> {
    if (!timeSpent) {
      throw new Error('Time spent is required for time tracking');
    }
    return this.recordInteraction(
      sessionId,
      InteractionType.TIME_SPEND,
      productId,
      undefined,
      timeSpent,
    );
  }
}
