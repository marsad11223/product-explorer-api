import { Module } from '@nestjs/common';

import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductSchema } from 'src/schemas/product.schema';
import { UserInteractionSchema } from 'src/schemas/interaction.schema';
import { InteractionService } from 'src/services/interaction.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Product', schema: ProductSchema }]),
    MongooseModule.forFeature([
      { name: 'UserInteraction', schema: UserInteractionSchema },
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService, InteractionService],
})
export class ProductModule {}
