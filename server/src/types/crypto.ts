export interface cryptoCurrencyMapResponse {
  id: number;
  rank: number;
  name: string;
  symbol: string;
  slug: string;
  is_active: number;
  first_historical_data: string;
  last_historical_data: string;
  logo: string;
  platform?: any;
}

export interface historicalPriceListingResponse {
  id: number;
  quote: {
    USD: {
      price: number;
    };
  };
}
