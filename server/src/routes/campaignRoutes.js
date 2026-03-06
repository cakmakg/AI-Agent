import { Router } from "express";
import { getPendingCampaigns, getCampaignDetails, approveCampaign } from "../controllers/campaignController.js";

const router = Router();

router.get("/pending", getPendingCampaigns);
router.get("/:id", getCampaignDetails);
router.post("/:id/approve", approveCampaign);

export default router;
