import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";

import { tenantMiddleware } from "./middleware/tenant.js";
import routes from "./routes/index.js";
import { startCronJobs } from "./services/cronService.js";
import { startTelegramBot } from "./services/telegramBotService.js";

const server = express();
server.use(helmet());
server.use(cors());
server.use(express.json());
server.use(tenantMiddleware);

mongoose.connect(process.env.MONGODB)
    .then(() => console.log("📦 MongoDB Atlas Bağlantısı Başarılı!"))
    .catch(err => console.error("❌ MongoDB Hatası:", err));

server.use("/api", routes);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`\n🌐 AI Orkestra Sunucusu Çalışıyor!`);
    console.log(`📡 Port: http://localhost:${PORT}`);
});

startCronJobs();
startTelegramBot();