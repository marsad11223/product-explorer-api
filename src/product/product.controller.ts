import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';

import { ProductService } from './product.service';
import { InteractionService } from 'src/services/interaction.service';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly interactionService: InteractionService,
  ) {}

  @Post()
  async create(@Body() createProductDto: any) {
    return this.productService.create(createProductDto);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1', // Default to page 1
    @Query('limit') limit: string = '10', // Default to 10 items per page
    @Query('search') search: string = '',
    @Query('sessionId') sessionId: string,
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Call service method to get paginated data
    return this.productService.findAll(pageNum, limitNum, search, sessionId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('sessionId') sessionId: string,
  ) {
    return this.productService.findOne(id, sessionId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: any) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }

  // user interaction endpoints
  @Post(':id/time-spent')
  async trackTimeSpent(
    @Param('id') productId: string,
    @Body() body: { sessionId: string; timeSpent: number },
  ) {
    const { sessionId, timeSpent } = body;

    if (!sessionId || !timeSpent || timeSpent <= 0) {
      throw new Error('Invalid sessionId or timeSpent value.');
    }

    return this.interactionService.recordTimeSpentInteraction(
      sessionId,
      productId,
      timeSpent,
    );
  }

  @Post(':id/click')
  async trackClick(
    @Param('id') productId: string,
    @Body() body: { sessionId: string },
  ) {
    const { sessionId } = body;

    if (!sessionId) {
      throw new Error('Invalid sessionId value.');
    }

    return this.interactionService.recordClickInteraction(sessionId, productId);
  }
}
