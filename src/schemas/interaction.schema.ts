// nest imports
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// third-party imports
import { Document } from 'mongoose';

export type UserInteractionDocument = UserInteraction & Document;

@Schema()
export class UserInteraction {
  @Prop({ required: true })
  sessionId: string;

  @Prop({ required: true })
  interactionType: string;

  @Prop()
  productId?: string;

  @Prop()
  searchQuery?: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ default: 0 })
  time_spend: number;
}

export const UserInteractionSchema =
  SchemaFactory.createForClass(UserInteraction);
