// ── Webhook Güvenlik Middleware ──
// n8n ve harici webhook çağrılarında X-Webhook-Secret header'ını doğrular.
// N8N_WEBHOOK_SECRET env boşsa → doğrulama yapılmaz (geliştirme modu).

export function webhookAuth(req, res, next) {
    const secret = process.env.N8N_WEBHOOK_SECRET;
    if (!secret) return next(); // Secret ayarlı değilse geç

    const incoming = req.headers["x-webhook-secret"];
    if (!incoming || incoming !== secret) {
        console.warn(`⛔ Webhook yetki hatası — IP: ${req.ip}, path: ${req.path}`);
        return res.status(401).json({ error: "Yetkisiz webhook isteği." });
    }
    next();
}
