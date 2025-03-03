import { Router } from "express";
import uploadController from "../controllers/uploadController";

const uploadRouter = Router();

uploadRouter.get("/getPresignedUrl", uploadController.handleUpload);
uploadRouter.post("/getDownloadUrl", uploadController.getDownloadUrl);
uploadRouter.post("/upload-video-link", uploadController.postUploadedVideoLink);
uploadRouter.get("/video-link/:videoId", uploadController.getVideoLink);

export default uploadRouter;
