// interfaces.ts

export interface InteractionTrend {
  hour: number;
  searches: number;
  views: number;
  clicks: number;
  time_spend: number;
}

export interface ProductInteractionData {
  x: string;
  y: number;
}

export interface ProductInteraction {
  name: string;
  data: ProductInteractionData[];
}

export interface MostInteractedProductsResponse {
  searches: ProductInteraction[];
  products: ProductInteraction[];
}

export interface ConversionFunnel {
  searches: number;
  views: number;
  clicks: number;
  totalTimeSpent: number; // in minutes
}
