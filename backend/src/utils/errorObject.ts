import { Request } from "express";
import { THTTPError } from "../types";
import { AppConfig } from "../config";
import { ResponseMessage } from "../constants/responseMessage";

export default (
  error: Error | unknown,
  req: Request,
  errorStatusCode: number = 500
): THTTPError => {
  const errorObject: THTTPError = {
    success: false,
    statusCode: errorStatusCode,
    request: {
      method: req.method,
      ip: req.ip,
      url: req.originalUrl,
    },
    message:
      error instanceof Error
        ? error.message || ResponseMessage.INTERNAL_SERVER_ERROR
        : ResponseMessage.INTERNAL_SERVER_ERROR,
    data: null,
    trace: error instanceof Error ? { error: error.stack } : null,
  };

  // Production ENV check
  if (AppConfig.get("ENV") === "production") {
    delete errorObject.request.ip;
    delete errorObject.trace;
  }

  return errorObject;
};
