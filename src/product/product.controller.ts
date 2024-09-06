// nest imports
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

// Services
import { ProductService } from './product.service';
import { InteractionService } from 'src/middlewares/interaction.service';
import { GroqAIService } from 'src/middlewares/groqai.service';

// DTOs
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { TrackTimeSpentDto } from './dtos/track-time-spent.dto';
import { TrackClickDto } from './dtos/track-click.dto';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly interactionService: InteractionService,
    private readonly groqAIService: GroqAIService,
  ) {}

  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
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
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }

  @Post(':id/time-spend')
  async trackTimeSpent(
    @Param('id') productId: string,
    @Body() trackTimeSpentDto: TrackTimeSpentDto,
  ) {
    const { sessionId, timeSpend } = trackTimeSpentDto;
    return this.interactionService.recordTimeSpentInteraction(
      sessionId,
      productId,
      timeSpend,
    );
  }

  @Post(':id/click')
  async trackClick(
    @Param('id') productId: string,
    @Body() trackClickDto: TrackClickDto,
  ) {
    const { sessionId } = trackClickDto;
    return this.interactionService.recordClickInteraction(sessionId, productId);
  }

  @Get('groqai/recommendations')
  async getRecommendations(@Query('query') query: string) {
    return this.groqAIService.getRecommendations(query);
  }
}
