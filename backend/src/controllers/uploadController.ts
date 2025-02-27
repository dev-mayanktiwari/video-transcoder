import { Request, Response } from "express";
import asyncErrorHandler from "../utils/asyncErrorHandler";
import httpResponse from "../utils/httpResponse";
import { EResponseStatusCode } from "../constants/application";
import quicker from "../utils/quicker";
import dayjs from "dayjs";

export default {
  handleUpload: asyncErrorHandler(async (req: Request, res: Response) => {
    
  }),
};
