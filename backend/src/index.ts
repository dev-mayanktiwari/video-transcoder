import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { AppConfig } from "./config";
import { ResponseMessage } from "./constants/responseMessage";
import httpError from "./utils/httpError";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import healthRouter from "./routes/healthRoutes";
import uploadRouter from "./routes/uploadRoutes";
import pollQueue from "./utils/pollMessages";

const app: Application = express();
const PORT = AppConfig.get("PORT");

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/upload", uploadRouter);

//404 Handler
app.use((req: Request, _: Response, next: NextFunction) => {
  try {
    throw new Error(ResponseMessage.NOT_FOUND);
  } catch (error) {
    httpError(next, error, req, 404);
  }
});

// Global Error Handler
app.use(globalErrorHandler);

async function init() {
  app.listen(PORT, () => {
    console.log(`The server is running on PORT ${PORT}`);
  });

  await pollQueue();
}

init();
