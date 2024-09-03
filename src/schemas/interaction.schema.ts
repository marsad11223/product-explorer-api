import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserInteractionDocument = UserInteraction & Document;

@Schema()
export class UserInteraction {
  @Prop({ required: true })
  sessionId: string; // Unique identifier for the user's session

  @Prop({ required: true })
  interactionType: string; // e.g., 'SEARCH', 'CLICK', 'VIEW'

  @Prop()
  productId?: string; // Product ID if interaction is 'CLICK' or 'VIEW'

  @Prop()
  searchQuery?: string; // Search query if interaction is 'SEARCH'

  @Prop({ required: true })
  timestamp: Date; // When the interaction happened
}

export const UserInteractionSchema =
  SchemaFactory.createForClass(UserInteraction);
