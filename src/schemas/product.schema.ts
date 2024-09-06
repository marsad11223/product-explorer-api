// nest imports
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// third-party imports
import {
  validateOrReject,
  IsString,
  IsNumber,
  IsArray,
  IsUrl,
} from 'class-validator';
import { Document } from 'mongoose';

@Schema()
export class Product extends Document {
  @Prop({ required: true })
  @IsString()
  title: string;

  @Prop({ required: true })
  @IsString()
  description: string;

  @Prop({ required: true })
  @IsNumber()
  price: number;

  @Prop({ required: true })
  @IsNumber()
  discountPercentage: number;

  @Prop({ required: true })
  @IsNumber()
  rating: number;

  @Prop({ required: true })
  @IsNumber()
  stock: number;

  @Prop({ required: true })
  @IsString()
  brand: string;

  @Prop({ required: true })
  @IsString()
  category: string;

  @Prop({ required: true })
  @IsUrl()
  thumbnail: string;

  @Prop({ type: [String], default: [] })
  @IsArray()
  images: string[];

  async validate() {
    // Manually validate each URL in images array
    for (const url of this.images) {
      await validateOrReject(url, {
        message: `Invalid URL: ${url}`,
      });
    }
  }
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Optional: Add indexing for faster search
ProductSchema.index({
  title: 'text',
  description: 'text',
  category: 'text',
  brand: 'text',
});
