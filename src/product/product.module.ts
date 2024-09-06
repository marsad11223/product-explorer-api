import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';

import { ProductSchema } from 'src/schemas/product.schema';
import { InteractionService } from 'src/middlewares/interaction.service';
import { GroqAIService } from 'src/middlewares/groqai.service';
import { UserInteractionSchema } from 'src/schemas/interaction.schema';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Product', schema: ProductSchema }]),
    MongooseModule.forFeature([
      { name: 'UserInteraction', schema: UserInteractionSchema },
    ]),
    HttpModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, InteractionService, GroqAIService],
})
export class ProductModule {}
