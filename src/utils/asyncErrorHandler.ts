import { Request, Response, NextFunction } from "express";
import httpError from "./httpError";

const asyncErrorHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) =>
      httpError(next, err, req)
    );
  };

export default asyncErrorHandler;
