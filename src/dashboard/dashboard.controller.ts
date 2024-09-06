// nest imports
import { Controller, Get, Query } from '@nestjs/common';

// project imports
import { DashboardService } from './dashboard.service';
import {
  InteractionTrend,
  MostInteractedProductsResponse,
  ConversionFunnel,
} from './interfaces';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('interaction-trends')
  async getInteractionTrends(
    @Query('lastHours') lastHours: number,
  ): Promise<InteractionTrend[]> {
    return this.dashboardService.getInteractionTrends(lastHours);
  }

  @Get('most-interacted-products')
  async getMostInteractedProducts(): Promise<MostInteractedProductsResponse> {
    return this.dashboardService.getMostInteractedProducts();
  }

  @Get('conversion-funnel')
  async getConversionFunnel(): Promise<ConversionFunnel> {
    return this.dashboardService.getConversionFunnel();
  }
}
