import cors from "cors";
import express, { type Express } from "express";
import { pinoHttp } from "pino-http";

import { logger } from "./lib/logger";
import router from "./routes";

type LogRequest = {
  id?: string | number;
  method?: string;
  url?: string;
};

type LogResponse = {
  statusCode?: number;
};

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: LogRequest) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: LogResponse) {
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
