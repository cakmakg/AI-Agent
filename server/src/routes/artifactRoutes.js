import { Router } from "express";
import { getLatestArtifact, getArtifactByThreadId } from "../controllers/artifactController.js";

const router = Router();

router.get("/latest", getLatestArtifact);
router.get("/:threadId", getArtifactByThreadId);

export default router;
