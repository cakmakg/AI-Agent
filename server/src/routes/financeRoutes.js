import { Router } from "express";
import { getFinanceSummary, handleStripeWebhook } from "../controllers/financeController.js";

const router = Router();

router.get("/summary", getFinanceSummary);
router.post("/stripe-webhook", handleStripeWebhook);

export default router;
