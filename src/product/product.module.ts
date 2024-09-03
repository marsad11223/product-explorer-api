import { Module } from '@nestjs/common';

import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductSchema } from 'src/schemas/product.schema';
import { InteractionModule } from 'src/interaction/interaction.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Product', schema: ProductSchema }]),
    InteractionModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
