# SyKaşif Heritage / Canlı Ekosistem

React + Vite arayüzü, gerçek açık veri ajanları, canlı SSE olay akışı, Cloudflare orkestrasyonu, Azure Türkçe ses ve yerel NodeODM dijital ikiz motoru.

## Çalışan gerçek modüller

- **Canlı Ekosistem:** USGS, NASA EONET ve GDACS akışlarını periyodik yeniler; olaylara göre dinamik ajan sayısı üretir.
- **Küresel olay katmanı:** Canlı olayları Leaflet haritasında önem rengiyle gösterir.
- **Konumsal ajanlar:** Macrostrat, OpenStreetMap Overpass, USGS, Open-Meteo ve Nominatim sorguları.
- **Onay kuyruğu:** Güvenilir kayıtlı kaynaklar otomatik yenilenir; yeni kaynak/model/kural onay ister.
- **KÂŞİF sohbet:** Konuşma geçmişini ve canlı ekosistem özetini kullanır.
- **Azure Speech:** `tr-TR-EmelNeural` Türkçe kadın sesi ve Azure STT; yapılandırma yoksa tarayıcı sesi/STT yedeği.
- **Dijital ikiz:** Çoklu fotoğrafları gerçek NodeODM görevine gönderir; nokta bulutu, mesh ve ortofoto çıktıları üretir.
- **Görsel analiz:** Cloudflare Workers AI vision; yapılmamış kaynak veya adli doğrulama iddiasında bulunmaz.

Eski “Ana Konsol”, “Dünya Monitörü” ve benzeri görsel panellerde bazı tasarım amaçlı sabit değerler hâlâ vardır ve arayüzde kapsam uyarısıyla işaretlenmiştir. Canlı Ekosistem ile DTSE görev ekranı bu sabit verileri kullanmaz.

## Donanım profili

Yerel dijital ikiz ayarları şu bilgisayara göre sınırlandırılmıştır:

- Intel Core i3-9100F
- 16 GB RAM
- AMD Radeon RX 570 8 GB
- Windows 10 x64

RX 570 CUDA uyumlu olmadığı için NodeODM CPU modunda çalışır. Aynı anda tek görev, hızlı profilde 20-80 fotoğraf önerilir. Ayrıntılar: `infrastructure/local-twin/README.md`.

## Gereksinimler

- Ana uygulama için Node.js 20.19+; Cloudflare Wrangler için Node.js 22 önerilir
- npm
- Canlı yerel çalışma için internet bağlantısı
- Dijital ikiz için WSL2 + Docker Desktop
- AI için Cloudflare Workers AI hesap kimliği ve dar yetkili token
- Doğal kadın sesi için Azure Speech F0 kaynağı

## Kurulum

PowerShell:

```powershell
npm config set registry https://registry.npmjs.org/ --location=user
npm install
Copy-Item .env.example .env.local
notepad .env.local
```

`.env.local`:

```dotenv
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_AI_TOKEN=...
CLOUDFLARE_TEXT_MODEL=@cf/zai-org/glm-4.7-flash
CLOUDFLARE_VISION_MODEL=@cf/llava-hf/llava-1.5-7b-hf

AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=westeurope

NODEODM_URL=http://127.0.0.1:3001
VITE_SYKASIF_RUNTIME_URL=
```

Azure kaynağınız başka bölgedeyse portalda yazan bölge kodunu kullanın. Gizli anahtarlara `VITE_` öneki eklemeyin.

## Canlı yerel çalışma

```powershell
npm run dev:all
```

- Arayüz: `http://localhost:5173`
- Yerel API: `http://127.0.0.1:3000`
- Sağlık: `http://127.0.0.1:3000/health`
- Canlı snapshot: `http://127.0.0.1:3000/api/runtime/snapshot`

Yerel runtime beş dakikada bir USGS, NASA EONET ve GDACS'i yeniler. SSE bağlantısı açık olduğu için ajan/olay değişiklikleri arayüze anında gönderilir.

Terminal çıktısını kopyalarken `Ctrl+C` kullanmayın; bu sunucuları durdurur. VS Code terminalinde `Ctrl+Shift+C` kullanın.

## Dijital ikiz motoru

Önkoşul denetimi:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\infrastructure\local-twin\check-windows.ps1
```

NodeODM:

```powershell
npm run twin:up
Invoke-RestMethod http://127.0.0.1:3001/info
npm run dev:all
```

Klasik Konsol → **DTSE Tarama** sekmesinden örtüşen fotoğrafları seçin. Tek fotoğraf ölçülü dijital ikiz değildir; en az 3, pratikte 20+ örtüşen fotoğraf gerekir.

Durdurma:

```powershell
npm run twin:down
```

## Cloudflare sürekli çalışma

Bilgisayar kapalıyken ajanların çalışması için `cloudflare/runtime-worker/README.md` adımlarını uygulayın. Worker dağıtıldıktan sonra URL'yi `.env.local` içine yazın:

```dotenv
VITE_SYKASIF_RUNTIME_URL=https://sykasif-runtime.<hesap>.workers.dev
```

Cloudflare Worker şunları içerir:

- Cron (`*/5 * * * *`)
- D1 olay/kaynak/onay kayıtları
- Durable Object SSE yayın hub'ı
- Dinamik kaynak ve olay ajanları
- Yönetici tokenlı onay işlemleri

## Doğrulama

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm audit
```

Cloudflare runtime ayrıca doğrulanabilir:

```powershell
cd cloudflare\runtime-worker
npm install
npm run typecheck
```

## Güvenlik ve doğruluk

- Genel Cloudflare yönetim proxy'si kapalıdır.
- AI, Azure ve onay anahtarları sunucu ortam değişkenlerinde kalır.
- Yeni kaynaklar otomatik olarak güvenilir ilan edilmez; onay kuyruğuna alınır.
- Kaynak verisi uzman görüşü, resmî afet uyarısı veya arkeolojik tescil yerine geçmez.
- Kamuya açık üretimde Cloudflare Access/Turnstile ve kalıcı rate limit eklenmelidir.
- KÂŞİF, ölçülmemiş sensör veya yapılmamış analiz sonucu üretmemesi için sistem talimatıyla sınırlandırılmıştır.

## Proje yapısı

- `server/live-runtime.js` — yerel gerçek zamanlı açık veri ajanları ve SSE
- `server/nodeodm-routes.js` — NodeODM görev/yükleme/çıktı API'si
- `cloudflare/runtime-worker/` — Cron + D1 + Durable Object bulut runtime
- `infrastructure/local-twin/` — donanıma özel Docker ve PowerShell kurulumları
- `src/components/SyLiveRuntimePanel.tsx` — dinamik ajan/kaynak/onay paneli
- `src/components/SyDigitalTwinRuntime.tsx` — gerçek fotogrametri görev ekranı
- `src/services/voiceService.ts` — Azure Emel Neural STT/TTS ve tarayıcı yedeği
- `api/speech-token.ts` — kısa ömürlü Azure Speech token uç noktası
- `api/chat.ts`, `api/vision.ts` — Vercel AI giriş noktaları
- `local-api.js` — yerel API bileşimi
