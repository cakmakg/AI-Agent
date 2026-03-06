import { Router } from "express";
import multer from "multer";
import {
    listClientKnowledge,
    createKnowledge,
    deleteClientKnowledge,
    searchClientKnowledge,
    uploadPdfKnowledge,
    addUrlKnowledge
} from "../controllers/knowledgeController.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (_, file, cb) => {
        cb(null, file.mimetype === "application/pdf");
    },
});

const router = Router();

router.get("/:clientId", listClientKnowledge);
router.post("/", createKnowledge);
router.delete("/:clientId/:id", deleteClientKnowledge);
router.post("/search", searchClientKnowledge);
router.post("/upload", upload.single("file"), uploadPdfKnowledge);
router.post("/url", addUrlKnowledge);

export default router;
