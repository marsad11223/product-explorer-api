// nest imports
import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// project imports
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

  /**
   * Records a user interaction event.
   */
  async recordInteraction(
    sessionId: string,
    interactionType: InteractionType,
    productId?: string,
    searchQuery?: string,
    timeSpend?: number,
  ): Promise<UserInteraction> {
    // Validate input
    if (!sessionId) {
      throw new BadRequestException('Session ID is required.');
    }

    if (
      interactionType === InteractionType.TIME_SPEND &&
      (isNaN(timeSpend) || timeSpend < 0)
    ) {
      throw new BadRequestException(
        'Time spent must be a non-negative number.',
      );
    }

    try {
      const interaction = new this.interactionModel({
        sessionId,
        interactionType,
        productId,
        searchQuery,
        timestamp: new Date(),
        time_spend:
          interactionType === InteractionType.TIME_SPEND
            ? timeSpend
            : undefined,
      });
      return await interaction.save();
    } catch (error) {
      throw new HttpException(
        'Failed to record interaction',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Records a view interaction event.
   */
  async recordViewInteraction(
    sessionId: string,
    productId: string,
  ): Promise<UserInteraction> {
    return this.recordInteraction(sessionId, InteractionType.VIEW, productId);
  }

  /**
   * Records a search interaction event.
   */
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

  /**
   * Records a click interaction event.
   */
  async recordClickInteraction(
    sessionId: string,
    productId: string,
  ): Promise<UserInteraction> {
    return this.recordInteraction(sessionId, InteractionType.CLICK, productId);
  }

  /**
   * Records a time spent interaction event.
   */
  async recordTimeSpentInteraction(
    sessionId: string,
    productId: string,
    timeSpend: number,
  ): Promise<UserInteraction> {
    if (!sessionId) {
      throw new BadRequestException('Session ID is required.');
    }

    if (isNaN(timeSpend) || timeSpend < 0) {
      throw new BadRequestException(
        'Time spent must be a non-negative number.',
      );
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
