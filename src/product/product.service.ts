// nest imports
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// project imports
import { Product } from 'src/schemas/product.schema';
import { InteractionService } from 'src/middlewares/interaction.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';

export interface PaginatedProductsResponse {
  page: number;
  limit: number;
  totalDocuments: number;
  totalPages: number;
  data: Product[];
}

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly interactionService: InteractionService, // Inject InteractionService
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
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
    sessionId: string,
  ): Promise<PaginatedProductsResponse> {
    const skip = (page - 1) * limit;

    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const totalDocuments = await this.productModel.countDocuments(query);

    const products = await this.productModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();

    if (search) {
      await this.interactionService.recordSearchInteraction(sessionId, search);
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

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
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
}
