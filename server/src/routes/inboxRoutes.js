import { Router } from "express";
import { handleInbox } from "../controllers/inboxController.js";
import { webhookAuth } from "../middleware/webhook.js";

const router = Router();

// Operator UI çağrıları (source:"operator") da buradan geçer — secret yoksa middleware geçer.
router.post("/", webhookAuth, handleInbox);

export default router;
