import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import companionRouter from "./companion";
import privacyRouter from "./privacy";
import supportRouter from "./support";
import emergencyShareRouter from "./emergencyShare";
import portalAuthRouter from "./portalAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(companionRouter);
router.use(privacyRouter);
router.use(supportRouter);
router.use(emergencyShareRouter);
router.use(portalAuthRouter);

export default router;
