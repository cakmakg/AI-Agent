import { Router } from "express";
import { handleApproval } from "../controllers/approvalController.js";

const router = Router();

router.post("/", handleApproval);

export default router;
