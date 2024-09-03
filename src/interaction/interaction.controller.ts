import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { InteractionType } from './interaction.types';

@Controller('interactions')
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @Post()
  async logInteraction(
    @Body('sessionId') sessionId: string,
    @Body('interactionType') interactionType: InteractionType,
    @Body('productId') productId: string,
  ) {
    if (!sessionId || !interactionType || !productId) {
      throw new BadRequestException('Missing required fields');
    }

    switch (interactionType) {
      case InteractionType.SEARCH:
        return this.interactionService.recordSearchInteraction(sessionId);
      case InteractionType.VIEW:
        return this.interactionService.recordViewInteraction(
          sessionId,
          productId,
        );
      case InteractionType.CLICK:
        return this.interactionService.recordClickInteraction(
          sessionId,
          productId,
        );
      default:
        throw new BadRequestException('Invalid interaction type');
    }
  }
}
