import superAgent from "superagent";
import nodeCache from "node-cache";
import pino from "pino";

const logger = pino({ name: "servies/exchangeratesService.ts" });

const EXCHANGE_RATE_BASE_API = "http://api.exchangeratesapi.io/v1/";

const exchangeratesapiCache = new nodeCache({ stdTTL: 60 * 60 * 24 }); // cache ttl is 1 day

enum EXCHANGERATES_CACHE_KEYS {
  SUPPORTED_CURRENCIES = "SUPPORTED_CURRENCIES",
  EXCHANGERATES = "EXCHANGERATES",
}

export const getAllCurrencies = async (): Promise<
  Record<string, string> | undefined
> => {
  const cachedData = exchangeratesapiCache.get<Record<string, string>>(
    EXCHANGERATES_CACHE_KEYS.SUPPORTED_CURRENCIES
  );

  if (cachedData !== undefined) {
    return cachedData;
  } else {
    try {
      const resp = (
        await superAgent
          .get(EXCHANGE_RATE_BASE_API + "/symbols")
          .query({ access_key: "911473ac84beb16081e3092575765dcf" })
      ).body as { success: boolean; symbols: Record<string, string> };

      exchangeratesapiCache.set(
        EXCHANGERATES_CACHE_KEYS.SUPPORTED_CURRENCIES,
        resp.symbols
      );

      logger.info("sucessfully refreshed cahce for all currencies");

      return resp.symbols;
    } catch (e) {
      logger.error(e, "Failed to get list of currencies");
      return undefined;
    }
  }
};

export const getAllExchangeRates = async (): Promise<
  Record<string, number> | undefined
> => {
  const cachedData = exchangeratesapiCache.get<Record<string, number>>(
    EXCHANGERATES_CACHE_KEYS.EXCHANGERATES
  );

  if (cachedData !== undefined) {
    return cachedData;
  } else {
    try {
      const resp = (
        await superAgent.get(EXCHANGE_RATE_BASE_API + "/latest").query({
          access_key: "911473ac84beb16081e3092575765dcf",
          base: "EUR",
        })
      ).body as { success: boolean; rates: Record<string, number> };

      resp.rates["ERU"] = 1;

      exchangeratesapiCache.set(
        EXCHANGERATES_CACHE_KEYS.EXCHANGERATES,
        resp.rates
      );

      logger.info("successfully refreshed cahce for exchnage rates");

      return resp.rates;
    } catch (e) {
      logger.error(e, "Failed to get all exchange rates");
      return undefined;
    }
  }
};
