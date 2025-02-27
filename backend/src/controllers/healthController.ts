import { Request, Response } from "express";
import asyncErrorHandler from "../utils/asyncErrorHandler";
import httpResponse from "../utils/httpResponse";
import { EResponseStatusCode } from "../constants/application";
import quicker from "../utils/quicker";
import dayjs from "dayjs";

export default {
  self: asyncErrorHandler(async (req: Request, res: Response) => {
    httpResponse(req, res, EResponseStatusCode.OK, "Hello World", {
      name: "Mayank Tiwari",
    });
  }),

  health: asyncErrorHandler(async (req: Request, res: Response) => {
    const healthData = {
      application: quicker.getApplicationHealth(),
      system: quicker.getSystemHealth(),
      time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    };
    httpResponse(req, res, EResponseStatusCode.OK, "Health Check", healthData);
  }),
};
