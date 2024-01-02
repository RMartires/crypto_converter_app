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
const cryptoToUSDPriceCache = new nodeCache({ stdTTL: 60 * 5 }); // cache ttl is 5 mins

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
          .set("X-CMC_PRO_API_KEY", "39e30a5d-ca08-4ed9-9b01-311455b98975")
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
              "39e30a5d-ca08-4ed9-9b01-311455b98975"
            ) as Promise<{ body: { data: Record<string, { logo: string }> } }>;
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

export const getLatestUSDPriceData = async (
  cmcId: string
): Promise<number | undefined> => {
  const cachedData = cryptoToUSDPriceCache.get<number>(cmcId);

  if (cachedData !== undefined) {
    return cachedData;
  } else {
    try {
      const resp = (
        await superAgent
          .get(
            COIN_MARKETCAP_BASE_URL + "/v1/cryptocurrency/listings/historical"
          )
          .use(throttle.plugin())
          .set("X-CMC_PRO_API_KEY", "39e30a5d-ca08-4ed9-9b01-311455b98975")
      ).body as topHistoricalPriceListResp;

      resp.data.forEach((d) => {
        cryptoToUSDPriceCache.set(d.id, d.quote.USD.price);
      });

      logger.info("sucessfully refreshed crypto to USD cache");

      return cryptoToUSDPriceCache.get<number>(cmcId);
    } catch (e) {
      logger.error(e, "Failed to get latest USD price data");
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
