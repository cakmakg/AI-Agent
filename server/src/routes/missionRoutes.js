import { Router } from "express";
import { listMissions, getMissionDetails } from "../controllers/missionController.js";

const router = Router();

router.get("/", listMissions);
router.get("/:threadId", getMissionDetails);

export default router;
