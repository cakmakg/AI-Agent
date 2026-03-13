Yeni dosya: server/src/services/googleSheetsService.js

Mevcut Gmail OAuth2 credential'larını yeniden kullanır (yeni paket gerekmez)
appendHotLead() fonksiyonu: Sheet'e yeni satır ekler
GOOGLE_SHEETS_ID yoksa sessizce uyarı verir, sistemi bozmaz
Güncellenen dosyalar:

server/src/services/cronService.js — Gmail poller'daki HOT_LEAD
server/src/controllers/inboxController.js — 3 ayrı HOT_LEAD noktası (operator, n8n webhook, legacy)
server/.env.example — GOOGLE_SHEETS_ID eklendi
Sheet kurulumu (bir kerelik):

Google Sheets'te yeni bir dosya aç
İlk sekmeyi HOT_LEADS olarak yeniden adlandır
A1:H1 hücrelerine başlık yaz: Tarih | Saat | Kaynak | Kimden | Konu | Özet | Thread ID | Durum
URL'den spreadsheet ID'yi kopyala: https://docs.google.com/spreadsheets/d/**BU_KISIM**/edit
.env dosyasına ekle: GOOGLE_SHEETS_ID="..."
Google Cloud Console'da aynı OAuth2 client'a Google Sheets API iznini etkinleştir
Bundan sonra her HOT_LEAD otomatik olarak Sheet'e düşer.