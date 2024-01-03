import express, { Express } from "express";
import cors from "cors";
import pino from "pino";
import bodyParser from "body-parser";
import cryptoRoutes from "./routes/crypto";
require("dotenv").config();

const logger = pino({ name: "server.ts" });

const app: Express = express();
const port = Number(process.env.PORT);

app.use(bodyParser.json());
app.use(cors());

app.use("/crypto", cryptoRoutes);

app.listen(port, () => {
  logger.info(`I am running at https://localhost:${port}`);
});
