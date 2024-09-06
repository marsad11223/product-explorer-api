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
    timeSpend?: number,
  ): Promise<UserInteraction> {
    // Always create a new interaction record for each event
    const interaction = new this.interactionModel({
      sessionId,
      interactionType,
      productId,
      searchQuery,
      timestamp: new Date(),
      time_spend:
        interactionType === InteractionType.TIME_SPEND ? timeSpend : undefined,
    });
    return interaction.save();
  }

  async recordViewInteraction(
    sessionId: string,
    productId: string,
  ): Promise<UserInteraction> {
    return this.recordInteraction(sessionId, InteractionType.VIEW, productId);
  }

  async recordSearchInteraction(
    sessionId: string,
    searchQuery: string,
  ): Promise<UserInteraction> {
    return this.recordInteraction(
      sessionId,
      InteractionType.SEARCH,
      undefined,
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
    timeSpend: number,
  ): Promise<UserInteraction> {
    if (isNaN(timeSpend) || timeSpend < 0) {
      throw new Error('Time spent is required for time tracking');
    }
    return this.recordInteraction(
      sessionId,
      InteractionType.TIME_SPEND,
      productId,
      undefined,
      timeSpend,
    );
  }
}
