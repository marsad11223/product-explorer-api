import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('interaction-trends')
  async getInteractionTrends(@Query('lastHours') lastHours: number) {
    return this.dashboardService.getInteractionTrends(lastHours);
  }

  @Get('most-interacted-products')
  async getMostInteractedProducts() {
    return this.dashboardService.getMostInteractedProducts();
  }

  @Get('conversion-funnel')
  async getConversionFunnel() {
    return this.dashboardService.getConversionFunnel();
  }
}
