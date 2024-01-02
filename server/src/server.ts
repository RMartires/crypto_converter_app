import express, { Express, Request, Response } from "express";
import pino from "pino";
import cryptoRoutes from "./routes/crypto";

const logger = pino({ name: "server.ts" });

const app: Express = express();
const port = 3000;

app.use("/crypto", cryptoRoutes);

app.listen(port, () => {
  logger.info(`I am running at https://localhost:${port}`);
});
