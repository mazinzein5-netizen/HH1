import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import companionRouter from "./companion";
import privacyRouter from "./privacy";
import supportRouter from "./support";
import emergencyShareRouter from "./emergencyShare";
import portalAuthRouter from "./portalAuth";
import practitionerRouter from "./practitioner";
import hiveBookingRouter from "./hiveBooking";
import stripeRouter from "./stripe";
import whopRouter from "./whop";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(companionRouter);
router.use(privacyRouter);
router.use(supportRouter);
router.use(emergencyShareRouter);
router.use(portalAuthRouter);
router.use(practitionerRouter);
router.use(hiveBookingRouter);
// Stripe routes stay registered so previously installed builds keep working;
// new builds pay through Whop (routes/whop.ts).
router.use(stripeRouter);
router.use(whopRouter);

export default router;
