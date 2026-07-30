import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import companionRouter from "./companion";
import emergencyShareRouter from "./emergencyShare";
import medExchangeRouter from "./medExchange";
import portalAuthRouter from "./portalAuth";
import practitionerRouter from "./practitioner";
import hiveBookingRouter from "./hiveBooking";
import stripeRouter from "./stripe";
import whopRouter from "./whop";
import appReleaseRouter from "./appRelease";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(companionRouter);
router.use(emergencyShareRouter);
router.use(medExchangeRouter);
router.use(portalAuthRouter);
router.use(practitionerRouter);
router.use(hiveBookingRouter);
// Stripe routes stay registered so previously installed builds keep working;
// new builds pay through Whop (routes/whop.ts).
router.use(stripeRouter);
router.use(whopRouter);
router.use(appReleaseRouter);

export default router;
