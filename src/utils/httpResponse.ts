import { Request, Response } from "express";
import { AppConfig } from "../config";
import { THTTPResponse } from "../types";
import { EApplicationEnvirontment } from "../constants/application";

export default (
  req: Request,
  res: Response,
  responseStatusCode: number,
  responseMessage: string,
  data: unknown = null
) => {
  const response: THTTPResponse = {
    success: true,
    statusCode: responseStatusCode,
    request: {
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
    },
    message: responseMessage,
    data: data,
  };

  //Production env check
  if (AppConfig.get("ENV") === EApplicationEnvirontment.PRODUCTION) {
    delete response.request.ip;
  }

  res.status(responseStatusCode).json(response);
};
