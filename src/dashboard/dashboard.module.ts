import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { UserInteractionSchema } from 'src/schemas/interaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'UserInteraction', schema: UserInteractionSchema },
    ]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
