import { Router } from "express";
import healthController from "../controllers/healthController";

const healthRouter = Router();

healthRouter.get("/self", healthController.self);
healthRouter.get("/health", healthController.health);

export default healthRouter;
