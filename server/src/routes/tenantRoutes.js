import { Router } from "express";
import { getTenantConfig, updateTenantConfig } from "../controllers/tenantController.js";

const router = Router();

router.get("/config", getTenantConfig);
router.put("/config", updateTenantConfig);

export default router;
