import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginatedProducts, Product } from 'src/schemas/product.schema';
import { InteractionService } from '../interaction/interaction.service';
import { InteractionType } from '../interaction/interaction.types';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly interactionService: InteractionService, // Inject InteractionService
  ) {}

  async create(createProductDto: any): Promise<Product> {
    try {
      const createdProduct = new this.productModel(createProductDto);
      return await createdProduct.save();
    } catch (error) {
      throw new BadRequestException('Failed to create product');
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    sessionId: string, // Added sessionId parameter for interaction logging
  ): Promise<PaginatedProducts> {
    const skip = (page - 1) * limit;

    const query: any = {};
    if (search) {
      query.$text = { $search: search }; // Full-text search
    }

    // Fetch total documents count
    const totalDocuments = await this.productModel.countDocuments(query);

    // Fetch products with pagination and search
    const products = await this.productModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();

    // Log search interaction if a search query is provided
    if (search) {
      await this.interactionService.recordSearchInteraction(
        sessionId,
        search,
        search,
      );
    }

    return {
      page,
      limit,
      totalDocuments,
      totalPages: Math.ceil(totalDocuments / limit),
      data: products,
    };
  }

  async findOne(id: string, sessionId: string): Promise<Product> {
    try {
      const product = await this.productModel.findById(id).exec();
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      await this.interactionService.recordViewInteraction(sessionId, id);

      return product;
    } catch (error) {
      if (error.kind === 'ObjectId') {
        throw new BadRequestException('Invalid product ID format');
      }
      console.log(error, 'error');
      throw new NotFoundException('Failed to retrieve product');
    }
  }

  async update(id: string, updateProductDto: any): Promise<Product> {
    try {
      const updatedProduct = await this.productModel
        .findByIdAndUpdate(id, updateProductDto, { new: true })
        .exec();
      if (!updatedProduct) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      return updatedProduct;
    } catch (error) {
      if (error.kind === 'ObjectId') {
        throw new BadRequestException('Invalid product ID format');
      }
      throw new BadRequestException('Failed to update product');
    }
  }

  async delete(id: string): Promise<Product> {
    try {
      const result = await this.productModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      return result;
    } catch (error) {
      if (error.kind === 'ObjectId') {
        throw new BadRequestException('Invalid product ID format');
      }
      throw new BadRequestException('Failed to delete product');
    }
  }

  async logClickInteraction(
    sessionId: string,
    productId: string,
  ): Promise<void> {
    // This can be called from wherever you handle clicks
    await this.interactionService.recordClickInteraction(sessionId, productId);
  }
}
