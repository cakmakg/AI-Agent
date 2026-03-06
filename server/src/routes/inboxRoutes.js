import { Router } from "express";
import { handleInbox } from "../controllers/inboxController.js";

const router = Router();

router.post("/", handleInbox);

export default router;
