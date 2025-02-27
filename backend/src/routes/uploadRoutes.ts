import { Router } from "express";
import uploadController from "../controllers/uploadController";

const uploadRouter = Router();

uploadRouter.post("/transcode", uploadController.handleUpload);
