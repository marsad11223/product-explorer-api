import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginatedProducts, Product } from 'src/schemas/product.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
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
  ): Promise<PaginatedProducts> {
    const skip = (page - 1) * limit; // Calculate the number of documents to skip

    // Fetch total documents count
    const totalDocuments = await this.productModel.countDocuments();

    // Fetch products with pagination
    const products = await this.productModel
      .find()
      .skip(skip)
      .limit(limit)
      .exec();

    // Return paginated data along with meta information
    return {
      page,
      limit,
      totalDocuments,
      totalPages: Math.ceil(totalDocuments / limit),
      data: products,
    };
  }

  async findOne(id: string): Promise<Product> {
    try {
      const product = await this.productModel.findById(id).exec();
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      return product;
    } catch (error) {
      if (error.kind === 'ObjectId') {
        throw new BadRequestException('Invalid product ID format');
      }
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
}
