# SyKaşif Heritage Edition

React + Vite tabanlı, saha/arkeoloji temalı bir operasyon konsolu. Harita katmanları,
medya/kanıt analizi, çoklu ajan istihbarat paneli ve Türkçe sesli asistan (KÂŞİF)
içerir.

## Kurulum

```bash
npm install
```

## Ortam Değişkenleri (.env)

AI asistanı (`/api/chat`) ve görüntü analizi (`/api/vision`) uç noktaları,
Cloudflare Workers AI kullanır. Proje kökünde bir `.env` dosyası oluşturup
kendi Cloudflare hesap bilgilerinizi girin:

```
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_AI_TOKEN=...
```

> Önemli: Bu değişkenlerin başına **asla** `VITE_` öneki eklemeyin. `VITE_`
> önekli değişkenler Vite tarafından tarayıcıya gönderilen JS paketine
> gömülür ve gizli anahtarınızı herkese açık hale getirir. Bu değişkenler
> yalnızca `api/*.ts` sunucu tarafı (Vercel Edge Function) kodunda okunmalıdır.

`.env` dosyası `.gitignore` içinde olduğu için commit edilmez.

## Geliştirme

```bash
npm run dev
```

`api/*.ts` uç noktaları Vercel Edge Functions olarak yazıldığından, bunları
yerelde test etmek için `vercel dev` kullanmanız gerekir; salt `vite`
geliştirme sunucusu bu uç noktaları servis etmez (bu durumda AI çağrıları
otomatik olarak sabit/yedek bir yanıta düşer).

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

- `src/components/SyAppShell.tsx` — sekmeli ana uygulama kabuğu (tüm
  panelleri birbirine bağlar).
- `src/components/SyMasterCore.tsx` — ana operasyon konsolu (harita, medya,
  spektral analiz, ajan sürüsü).
- `src/components/SyWorldMonitorCore.tsx` — Türkiye taktik GIS saha monitörü.
- `src/components/SyDTSECore.tsx` — 7 aşamalı dijital ikiz/tarama arayüzü.
- `src/components/SyFrameVisionAnalyzer.tsx` — çoklu medya anomali tespiti.
- `src/components/SyHeritageGlobalCore.tsx` — küresel miras/harita modu.
- `src/components/SyAgentSwarmDashboard.tsx` — çoklu ajan istihbarat paneli.
- `src/components/SyMediaUpload.tsx` — toplu kanıt yükleme ve analiz.
- `src/data/SyEcosystemDashboard.tsx` — sistem/ekosistem durum panosu.
- `src/kasif_asistan.tsx` — KÂŞİF sesli/metinli asistan bileşeni.
- `src/services/aiService.ts` — `/api/chat` için istemci sarmalayıcısı.
- `api/chat.ts`, `api/vision.ts` — Cloudflare Workers AI'a vekillik eden
  güvenli sunucu tarafı uç noktaları (gizli anahtarlar burada kalır).
