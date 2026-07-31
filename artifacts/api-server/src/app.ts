import cors from "cors";
import express, { type Express } from "express";
import {
  pinoHttp,
  type SerializedRequest,
  type SerializedResponse,
} from "pino-http";

import { logger } from "./lib/logger";
import router from "./routes";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: SerializedRequest) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: SerializedResponse) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
