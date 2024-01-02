import { Router, Request, Response } from "express";
import pino from "pino";
import { getTopCryptoCurrenciesWithMetaData } from "../services/coinmarketcapService";
import { cryptoCurrencyMapResponse } from "../types/crypto";
import { getAllCurrencies } from "../services/exchangeratesService";

const cryptoRoutes = Router();
const logger = pino({ name: "routes/crypto.ts" });

cryptoRoutes.get("/list", async (req: Request, res: Response) => {
  let resp = {
    cryptoCurrenciesList: undefined,
    currenciesList: undefined,
  } as Record<
    string,
    cryptoCurrencyMapResponse[] | Record<string, string> | undefined
  >;

  try {
    resp["cryptoCurrenciesList"] = await getTopCryptoCurrenciesWithMetaData();
  } catch (e) {
    const errMsg = "error while fetching top cryptocurrencies";
    logger.error(e, errMsg);
    return res.sendStatus(500).send(errMsg);
  }

  try {
    resp["currenciesList"] = await getAllCurrencies();
  } catch (e) {
    const errMsg = "error while fetching currency list";
    logger.error(e, errMsg);
    return res.sendStatus(500).send(errMsg);
  }

  return res.send(resp);
});

export default cryptoRoutes;
