import { Router, Request, Response } from "express";
import pino from "pino";
import _ from "lodash";
import {
  getLatestEURPriceData,
  getTopCryptoCurrenciesWithMetaData,
} from "../services/coinmarketcapService";
import { cryptoCurrencyMapResponse } from "../types/crypto";
import {
  getAllCurrencies,
  getAllExchangeRates,
} from "../services/exchangeratesService";

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
    return res.status(500).send(errMsg);
  }

  try {
    resp["currenciesList"] = await getAllCurrencies();
  } catch (e) {
    const errMsg = "error while fetching currency list";
    logger.error(e, errMsg);
    return res.status(500).send(errMsg);
  }

  return res.send(resp);
});

cryptoRoutes.post("/convert", async (req: Request, res: Response) => {
  const { src, target, ammount } = req.body as {
    src: string;
    target: string;
    ammount: number;
  };

  if ([src, target].map(_.isString).includes(false)) {
    return res.status(400).send("src or target values need to be strings");
  }

  if (!_.isNumber(ammount) || _.isNative(ammount)) {
    return res.status(400).send("ammount needs to be a valid positive number");
  }

  const cryptoCurrenciesList = await getTopCryptoCurrenciesWithMetaData();
  if (_.isEmpty(cryptoCurrenciesList) || cryptoCurrenciesList === undefined) {
    return res
      .status(500)
      .send("Failed to check if src is a valid crypto currency");
  }

  const cryptoInfo = cryptoCurrenciesList.find((crypto) => crypto.slug === src);
  if (cryptoInfo === undefined) {
    return res.status(400).send(`${src} is not a supported crypto currency`);
  }

  const currenciesExchangeRateDate = await getAllExchangeRates();
  if (
    _.isEmpty(currenciesExchangeRateDate) ||
    currenciesExchangeRateDate === undefined
  ) {
    return res
      .status(500)
      .send("Failed to check if target is a supported currency");
  }

  const targetConversionRate = currenciesExchangeRateDate[target];

  if (targetConversionRate === undefined) {
    return res.status(400).send(`${target} is not a supported currency`);
  }

  const cryptoValueInERU = await getLatestEURPriceData(
    cryptoInfo.id.toString()
  );

  if (cryptoValueInERU === undefined) {
    return res.status(500).send(`unable to get ${src} value`);
  } else {
    return res.send({
      ...req.body,
      conversionRate: targetConversionRate,
      value: ammount * cryptoValueInERU * targetConversionRate,
    });
  }
});

export default cryptoRoutes;
