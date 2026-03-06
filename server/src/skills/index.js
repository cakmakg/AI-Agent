import { tool } from "@langchain/core/tools";
import { z } from "zod";

// DUMMY FUNCTIONS FOR SKILLS
const bookCalendarEvent = async (calendarId, date, customerName) => {
    console.log(`[SKILL: Google Calendar] Booking event on ${date} for ${customerName} in calendar ${calendarId}`);
    return `Başarıyla randevu oluşturuldu! (Tarih: ${date}, İsim: ${customerName})`;
};

const sendWhatsAppMessage = async (phoneNumber, message, apiKey) => {
    console.log(`[SKILL: WhatsApp] Sending message to ${phoneNumber}`);
    return `WhatsApp mesajı iletildi!`;
};

// ==========================================
// 🚀 SKILL REGISTRY (PLUGIN STORE)
// ==========================================
export const SKILL_REGISTRY = {
    knowledge_search: {
        name: "Bilgi Tabanı (RAG) Erişimi",
        description: "Müşterinin özel veritabanında arama yapar.",
        sector: ["all"],
        configSchema: {},
        getTool: (tenantConfig) => tool(
            async ({ query }) => {
                // Not actually a graph tool because the knowledge lookup happens before the graph (e.g., in customerBotAgent) 
                // BUT this tool could be used by Orchestrator or Writer to fetch more if needed
                return "Knowledge Search capability active.";
            },
            {
                name: "knowledge_search",
                description: "Veritabanında arama yapmak için kullanılır.",
                schema: z.object({
                    query: z.string().describe("Arama yapılacak kelime veya cümle")
                })
            }
        )
    },
    calendar_booking: {
        name: "Google Calendar Randevu",
        description: "Müşteri adına Google Calendar'a etkinlik ekler",
        sector: ["healthcare", "beauty", "consulting"],
        configSchema: { calendarId: "string", timezone: "string" },
        getTool: (tenantConfig) => tool(
            async ({ date, customerName }) => {
                const calendarId = tenantConfig?.skillConfigs?.calendar_booking?.calendarId || "default_calendar";
                return await bookCalendarEvent(calendarId, date, customerName);
            },
            {
                name: "book_appointment",
                description: "Verilen tarihe randevu oluşturur",
                schema: z.object({
                    date: z.string().describe("ISO Formatında Tarih (Örn: 2024-10-15T10:00:00)"),
                    customerName: z.string().describe("Müşterinin adı soyadı")
                })
            }
        )
    },
    whatsapp_send: {
        name: "WhatsApp Mesaj Gönderimi",
        description: "Müşterinin numarasına WhatsApp üzerinden mesaj atar.",
        sector: ["ecommerce", "real_estate"],
        configSchema: { apiKey: "string", senderNumber: "string" },
        getTool: (tenantConfig) => tool(
            async ({ phoneNumber, message }) => {
                const apiKey = tenantConfig?.skillConfigs?.whatsapp_send?.apiKey;
                return await sendWhatsAppMessage(phoneNumber, message, apiKey);
            },
            {
                name: "send_whatsapp",
                description: "Müşteriye WhatsApp mesajı gönderir.",
                schema: z.object({
                    phoneNumber: z.string().describe("Müşterinin telefon numarası"),
                    message: z.string().describe("Gönderilecek mesaj içeriği")
                })
            }
        )
    }
};

// ==========================================
// ⚙️ GET ENABLED TOOLS (Injects Config into Tools)
// ==========================================
export function getEnabledTools(tenantConfig) {
    if (!tenantConfig || !tenantConfig.enabledSkills) return [];

    return tenantConfig.enabledSkills
        .map(skillId => {
            const skill = SKILL_REGISTRY[skillId];
            return skill ? skill.getTool(tenantConfig) : null;
        })
        .filter(Boolean); // null'ları filtrele
}
