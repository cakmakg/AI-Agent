import { Router } from "express";
import { streamEvents, analyzeTask, runRndTask } from "../controllers/agentController.js";

const router = Router();

router.get("/events/:threadId", streamEvents);
router.post("/analyze", analyzeTask);
router.post("/rnd", runRndTask);

export default router;
