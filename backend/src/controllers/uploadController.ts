import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/asyncErrorHandler";
import httpResponse from "../utils/httpResponse";
import {
  EErrorStatusCode,
  EResponseStatusCode,
} from "../constants/application";
import quicker from "../utils/quicker";
import { AppConfig } from "../config";
import { s3Service } from "../utils/AWSS3Utils";
import httpError from "../utils/httpError";
import prisma from "../prisma/prismaClient";

export default {
  handleUpload: asyncErrorHandler(async (req: Request, res: Response) => {
    const key = quicker.generateKeyFilename();
    const bucketName = String(AppConfig.get("BUCKET_NAME_NORMAL_UPLOAD")) || "";
    const uploadUrl = await s3Service.getUploadUrl(key, bucketName);
    return httpResponse(
      req,
      res,
      EResponseStatusCode.OK,
      "URL Created successfully",
      {
        presignedUrl: uploadUrl,
        key: key,
        videoId: key,
      }
    );
  }),

  getDownloadUrl: asyncErrorHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { key } = req.body;

      if (!key) {
        return httpError(
          next,
          new Error("Body not provided."),
          req,
          EErrorStatusCode.BAD_REQUEST
        );
      }

      const bucketName =
        String(AppConfig.get("BUCKET_NAME_NORMAL_UPLOAD")) || "";
      const downloadUrl = await s3Service.getDownloadUrl(key, bucketName);

      return httpResponse(
        req,
        res,
        EResponseStatusCode.OK,
        "URL fetched successfully.",
        {
          accessUrl: downloadUrl,
        }
      );
    }
  ),

  postUploadedVideoLink: asyncErrorHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { videoId, videoLink } = req.body;
      if (!videoId || !videoLink) {
        return httpError(
          next,
          new Error("Invalid Input"),
          req,
          EErrorStatusCode.BAD_REQUEST
        );
      }

      const updatedLink = await prisma.links.create({
        data: {
          videoLink,
          videoId,
        },
      });

      return httpResponse(
        req,
        res,
        EResponseStatusCode.CREATED,
        "Link created successfully",
        {
          linkData: updatedLink,
        }
      );
    }
  ),

  getVideoLink: asyncErrorHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const videoId = req.params.videoId;
      if (!videoId) {
        return httpError(
          next,
          new Error("No videoId found"),
          req,
          EErrorStatusCode.BAD_REQUEST
        );
      }
    }
  ),
};
