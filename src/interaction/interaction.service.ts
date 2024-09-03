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
  ): Promise<UserInteraction> {
    const interactionData: Partial<UserInteraction> = {
      sessionId,
      interactionType,
      timestamp: new Date(),
    };

    if (interactionType !== InteractionType.SEARCH) {
      interactionData.productId = productId;
    }

    const interaction = new this.interactionModel(
      interactionData as UserInteraction,
    );
    return interaction.save();
  }

  async recordViewInteraction(
    sessionId: string,
    productId: string,
  ): Promise<UserInteraction> {
    return this.recordInteraction(sessionId, InteractionType.VIEW, productId);
  }

  async recordSearchInteraction(sessionId: string): Promise<UserInteraction> {
    return this.recordInteraction(sessionId, InteractionType.SEARCH);
  }

  async recordClickInteraction(
    sessionId: string,
    productId: string,
  ): Promise<UserInteraction> {
    return this.recordInteraction(sessionId, InteractionType.CLICK, productId);
  }
}
