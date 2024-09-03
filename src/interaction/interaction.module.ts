import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InteractionService } from './interaction.service';
import { UserInteractionSchema } from '../schemas/interaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'UserInteraction', schema: UserInteractionSchema },
    ]),
  ],
  providers: [InteractionService],
  exports: [InteractionService],
})
export class InteractionModule {}
