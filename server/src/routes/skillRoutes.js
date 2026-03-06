import { Router } from "express";
import { getAvailableSkills } from "../controllers/skillController.js";

const router = Router();

router.get("/", getAvailableSkills);

export default router;
