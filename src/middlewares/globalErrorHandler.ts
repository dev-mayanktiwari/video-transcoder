import { NextFunction, Request, Response } from "express";
import { THTTPError } from "../types";

export default (
  err: THTTPError,
  _: Request,
  res: Response,
  __: NextFunction
) => {
  res.status(err.statusCode).json(err);
};
