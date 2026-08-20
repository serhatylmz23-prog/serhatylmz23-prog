# SyKaşif Heritage / Doğa Edition

React + Vite tabanlı saha/arkeoloji operasyon konsolu. İki ayrı ara yüz modu
içerir (uygulama içinde sağ üstten geçiş yapılabilir):

- **🗺️ Harita & Ajanlar** (varsayılan) — Leaflet tabanlı canlı harita, GPS
  takibi ve seçilen konum için 5 ajanlı (jeoloji, arkeoloji, sismoloji,
  meteoroloji, uydu) otomatik analiz orkestrasyonu.
- **⚜️ Klasik Konsol** — projenin ilk sürümündeki sekmeli panel grubu (Ana
  Konsol, Dünya Monitörü, DTSE Tarama, Görüntü Analizi, Miras Küresel, Ajan
  Ağı, Medya Merkezi, Ekosistem) ve KÂŞİF sesli/metinli asistan.

## Kurulum

```bash
npm install
```

## Ortam Değişkenleri (.env)

AI asistanı (`/api/chat`), görüntü analizi (`/api/vision`) ve genel
Cloudflare API vekil uç noktası (`/api/cloudflare-proxy`), Cloudflare
Workers AI kullanır. `.env.example` dosyasını `.env` olarak kopyalayıp kendi
Cloudflare hesap bilgilerinizi girin:

```
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_AI_TOKEN=...
```

> Önemli: Bu değişkenlerin başına **asla** `VITE_` öneki eklemeyin. `VITE_`
> önekli değişkenler Vite tarafından tarayıcıya gönderilen JS paketine
> gömülür ve gizli anahtarınızı herkese açık hale getirir. Bu değişkenler
> yalnızca `api/*.ts` / `api/*.js` sunucu tarafı (Vercel fonksiyonları) ve
> `local-proxy.js` içinde okunmalıdır.

`.env` ve `.env.local` dosyaları `.gitignore` içinde olduğu için commit
edilmez.

## Geliştirme

İki seçenek var:

**A) Sadece arayüz (AI çağrıları çalışmaz):**
```bash
npm run dev
```

**B) Arayüz + yerel Cloudflare vekil sunucusu (AI çağrıları çalışır):**
```bash
npm run dev:all
```
Bu komut `local-proxy.js`'i (port 3000, `/api/cloudflare-proxy/*`) ve Vite
sunucusunu (port 5173) birlikte başlatır.

**C) Vercel fonksiyonlarını da (api/chat.ts, api/vision.ts) yerelde test
etmek için:**
```bash
vercel dev
```

## Derleme

```bash
npm run build
```

## Tip Kontrolü / Lint

```bash
npm run typecheck
npm run lint
```

## Proje Yapısı

- `src/components/SyAppShell.tsx` — kök bileşen, mod anahtarını barındırır.
- `src/components/SyMap.tsx` + `src/components/context/SyContext.tsx` —
  harita, GPS ve paylaşılan uygulama durumu.
- `src/agents/` — ajan tipleri (`agentTypes.ts`), ajan uygulamaları
  (`agents/`) ve orkestrasyon mantığı (`agentOrchestrator.ts`).
- `src/services/analysisRunner.ts` — bir konum için bölgesel veri + ajan
  orkestrasyonu + çapraz analizi birleştirir.
- `src/components/SyClassicConsole.tsx` — eski sekmeli panel grubunu bir
  araya getiren kabuk.
- `src/kasif_asistan.tsx` — KÂŞİF sesli/metinli asistan bileşeni.
- `src/services/aiService.ts` — `/api/chat` için istemci sarmalayıcısı.
- `api/chat.ts`, `api/vision.ts` — Cloudflare Workers AI'a vekillik eden
  güvenli sunucu tarafı uç noktaları (Vercel Edge Functions).
- `api/cloudflare-proxy.js` / `local-proxy.js` — Cloudflare API'sinin genel
  (accounts/zones/workers) uç noktalarına güvenli vekillik eden Node
  fonksiyonu; biri Vercel'de, diğeri salt yerel `npm run dev:all` akışında
  çalışır.
