import { Router } from "express";
import uploadController from "../controllers/uploadController";

const uploadRouter = Router();

uploadRouter.get("/getPresignedUrl", uploadController.handleUpload);
uploadRouter.post("/getDownloadUrl", uploadController.getDownloadUrl);
uploadRouter.post("/upload-video-link", uploadController.uploadVideoLink);

export default uploadRouter;
