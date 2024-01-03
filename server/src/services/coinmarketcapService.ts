import superAgent from "superagent";
import nodeCache from "node-cache";
import {
  cryptoCurrencyMapResponse,
  historicalPriceListingResponse,
} from "../types/crypto";
import pino from "pino";

const Throttle = require("superagent-throttle");

const logger = pino({ name: "servies/coinmarketcapService.ts" });

const topCryptoListCache = new nodeCache({ stdTTL: 60 * 60 }); // cache ttl is 1 hour
const cryptoToEURPriceCache = new nodeCache({ stdTTL: 60 * 5 }); // cache ttl is 5 mins

const COIN_MARKETCAP_BASE_URL = "https://pro-api.coinmarketcap.com";

type topCryptoCurrencyListResp = { data: cryptoCurrencyMapResponse[] };

type topHistoricalPriceListResp = { data: historicalPriceListingResponse[] };

enum COIN_MARKETCAP_CACHE_KEYS {
  TOP_CRYPTO_CURRENCY_LIST = "TOP_CRYPTO_CURRENCY_LIST",
}

const throttle = new Throttle({
  active: true, // set false to pause queue
  rate: 25, // how many requests can be sent every `ratePer`
  ratePer: 1 * 60 * 1000, // number of ms in which `rate` requests may be sent
});

export const getTopCryptoCurrenciesWithMetaData = async (): Promise<
  topCryptoCurrencyListResp["data"] | undefined
> => {
  const cachedData = topCryptoListCache.get<topCryptoCurrencyListResp["data"]>(
    COIN_MARKETCAP_CACHE_KEYS.TOP_CRYPTO_CURRENCY_LIST
  );

  if (cachedData !== undefined) {
    return cachedData;
  } else {
    try {
      const resp = (
        await superAgent
          .get(COIN_MARKETCAP_BASE_URL + "/v1/cryptocurrency/map")
          .query({ limit: 100 })
          .set(
            "X-CMC_PRO_API_KEY",
            process.env.COIN_MARKETCAP_API_KEY as string
          )
      ).body as topCryptoCurrencyListResp;

      const ids = resp.data.map((d) => d.id.toString());
      const idChunks = chunk(ids, 100);

      const aggregateResponses = await Promise.all(
        idChunks.map(async (idChunk) => {
          const idList = idChunk.join(",");

          logger.info(idList);

          return superAgent
            .get(COIN_MARKETCAP_BASE_URL + "/v2/cryptocurrency/info")
            .query({ aux: "logo", id: idList })
            .use(throttle.plugin())
            .set(
              "X-CMC_PRO_API_KEY",
              process.env.COIN_MARKETCAP_API_KEY as string
            ) as Promise<{
            body: { data: Record<string, { logo: string }> };
          }>;
        })
      );

      const combinedMetaData = aggregateResponses.reduce(
        (acc, cu) => Object.assign(acc, cu.body.data),
        {} as Record<string, { logo: string }>
      );

      const topCryptoCurrencyListWithMetaData = resp.data.map((d) => ({
        ...d,
        logo: combinedMetaData[d.id].logo,
      }));

      topCryptoListCache.set(
        COIN_MARKETCAP_CACHE_KEYS.TOP_CRYPTO_CURRENCY_LIST,
        topCryptoCurrencyListWithMetaData
      );

      logger.info(
        "sucessfully refreshed top crypto currency list with metadata cache"
      );

      return topCryptoCurrencyListWithMetaData;
    } catch (e) {
      logger.error(e, "Failed to get top crypto currencies with metaData");
      return undefined;
    }
  }
};

export const getLatestEURPriceData = async (
  cmcId: string
): Promise<number | undefined> => {
  const cachedData = cryptoToEURPriceCache.get<number>(cmcId);

  if (cachedData !== undefined) {
    return cachedData;
  } else {
    try {
      const limit = 5000;
      let start = 1;
      const listingPriceData: topHistoricalPriceListResp["data"] = [];

      let resp = (
        await superAgent
          .get(COIN_MARKETCAP_BASE_URL + "/v1/cryptocurrency/listings/latest")
          .use(throttle.plugin())
          .query({ convert: "EUR", limit: limit })
          .set(
            "X-CMC_PRO_API_KEY",
            process.env.COIN_MARKETCAP_API_KEY as string
          )
      ).body as topHistoricalPriceListResp;
      listingPriceData.push(...resp.data);

      while (resp.data.length === limit) {
        start += limit;

        resp = (
          await superAgent
            .get(COIN_MARKETCAP_BASE_URL + "/v1/cryptocurrency/listings/latest")
            .use(throttle.plugin())
            .query({ convert: "EUR", start: start, limit: limit })
            .set(
              "X-CMC_PRO_API_KEY",
              process.env.COIN_MARKETCAP_API_KEY as string
            )
        ).body as topHistoricalPriceListResp;
        listingPriceData.push(...resp.data);
      }

      logger.info(`polled total ${listingPriceData.length} crypto prices`);

      listingPriceData.forEach((d) => {
        cryptoToEURPriceCache.set(d.id, d.quote.EUR.price);
      });

      logger.info("sucessfully refreshed crypto to EUR cache");

      return cryptoToEURPriceCache.get<number>(cmcId);
    } catch (e) {
      logger.error(e, "Failed to get latest EUR price data");
      return undefined;
    }
  }
};

function chunk<T>(list: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < list.length; i += chunkSize) {
    chunks.push(list.slice(i, i + chunkSize));
  }
  return chunks;
}
