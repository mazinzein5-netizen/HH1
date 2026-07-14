import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import companionRouter from "./companion";
import privacyRouter from "./privacy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(companionRouter);
router.use(privacyRouter);

export default router;
