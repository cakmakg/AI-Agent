import { Router } from "express";
import { getPendingTickets, approveTicket } from "../controllers/supportController.js";

const router = Router();

router.get("/pending", getPendingTickets);
router.post("/:ticketId/approve", approveTicket);

export default router;
