// nest imports
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// third-party imports
import { Model } from 'mongoose';

// project imports
import { InteractionType } from 'src/middlewares/interaction.service';
import {
  UserInteraction,
  UserInteractionDocument,
} from 'src/schemas/interaction.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(UserInteraction.name)
    private userInteractionModel: Model<UserInteractionDocument>,
  ) {}

  async getInteractionTrends(lastHours: number) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - lastHours * 60 * 60 * 1000);

    const boundaries = Array.from(
      { length: lastHours + 1 },
      (_, i) => new Date(startDate.getTime() + i * 60 * 60 * 1000),
    );

    return this.userInteractionModel.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $bucket: {
          groupBy: {
            $dateTrunc: {
              date: '$timestamp',
              unit: 'hour',
              timezone: 'UTC',
            },
          },
          boundaries: boundaries.map((boundary) => boundary),
          default: 'Unknown',
          output: {
            searches: {
              $sum: {
                $cond: [{ $eq: ['$interactionType', 'search'] }, 1, 0],
              },
            },
            views: {
              $sum: {
                $cond: [{ $eq: ['$interactionType', 'view'] }, 1, 0],
              },
            },
            clicks: {
              $sum: {
                $cond: [{ $eq: ['$interactionType', 'click'] }, 1, 0],
              },
            },
            time_spend: {
              $sum: {
                $cond: [
                  { $eq: ['$interactionType', 'time_spend'] },
                  '$time_spend',
                  0,
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          hour: { $hour: { date: '$_id', timezone: 'UTC' } },
          searches: 1,
          views: 1,
          clicks: 1,
          time_spend: 1,
        },
      },
      {
        $sort: {
          hour: 1,
        },
      },
    ]);
  }

  async getMostInteractedProducts() {
    // Aggregation for searches
    const searches = await this.userInteractionModel.aggregate([
      { $match: { interactionType: InteractionType.SEARCH } },
      { $group: { _id: '$searchQuery', totalInteractions: { $sum: 1 } } },
      { $sort: { totalInteractions: -1 } },
    ]);

    // Transform searches into the desired format
    const formattedSearches = searches.map((search) => ({
      name: search._id,
      data: [{ x: 'Total Interactions', y: search.totalInteractions }],
    }));

    // Aggregation for products
    const products = await this.userInteractionModel.aggregate([
      {
        $match: {
          interactionType: {
            $in: [
              InteractionType.CLICK,
              InteractionType.VIEW,
              InteractionType.TIME_SPEND,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$productId',
          totalInteractions: { $sum: 1 },
          totalClicks: {
            $sum: {
              $cond: [
                { $eq: ['$interactionType', InteractionType.CLICK] },
                1,
                0,
              ],
            },
          },
          totalTimeSpent: {
            $sum: {
              $cond: [
                { $eq: ['$interactionType', InteractionType.TIME_SPEND] },
                '$time_spend',
                0,
              ],
            },
          },
        },
      },
      {
        $addFields: {
          productId: {
            $convert: {
              input: '$_id',
              to: 'objectId',
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      {
        $unwind: {
          path: '$productDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          name: {
            $ifNull: ['$productDetails.title', 'Unknown Product'],
          },
          totalInteractions: 1,
          totalClicks: 1,
          totalTimeSpent: 1,
        },
      },
      { $sort: { totalInteractions: -1 } },
    ]);

    // Transform products into the desired format
    const formattedProducts = products.map((product) => ({
      name: product.name,
      data: [
        { x: 'Total Interactions', y: product.totalInteractions },
        { x: 'Total Clicks', y: product.totalClicks },
        { x: 'Total Time Spent (sec)', y: product.totalTimeSpent },
      ],
    }));

    return {
      searches: formattedSearches,
      products: formattedProducts,
    };
  }

  async getConversionFunnel() {
    const [result] = await this.userInteractionModel.aggregate([
      {
        $facet: {
          searches: [
            { $match: { interactionType: InteractionType.SEARCH } },
            { $group: { _id: null, totalInteractions: { $sum: 1 } } },
          ],
          views: [
            { $match: { interactionType: InteractionType.VIEW } },
            { $group: { _id: null, totalInteractions: { $sum: 1 } } },
          ],
          clicks: [
            { $match: { interactionType: InteractionType.CLICK } },
            { $group: { _id: null, totalInteractions: { $sum: 1 } } },
          ],
          timeSpent: [
            { $match: { interactionType: InteractionType.TIME_SPEND } },
            { $group: { _id: null, totalTimeSpent: { $sum: '$time_spend' } } },
          ],
        },
      },
      {
        $project: {
          searches: { $arrayElemAt: ['$searches.totalInteractions', 0] },
          views: { $arrayElemAt: ['$views.totalInteractions', 0] },
          clicks: { $arrayElemAt: ['$clicks.totalInteractions', 0] },
          totalTimeSpent: { $arrayElemAt: ['$timeSpent.totalTimeSpent', 0] },
        },
      },
    ]);

    // Handle cases where there are no interactions (undefined counts or time)
    // sec to min

    const totalTimeSpentInMins = Math.floor(result.totalTimeSpent / 60) || 0;

    return {
      searches: result.searches || 0,
      views: result.views || 0,
      clicks: result.clicks || 0,
      totalTimeSpent: totalTimeSpentInMins,
    };
  }
}

// sec to min
