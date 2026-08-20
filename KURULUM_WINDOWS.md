# SyKaşif Canlı Sistem — Windows Kurulum Sırası

## A. Hemen çalışan ücretsiz canlı ajanlar

```powershell
cd "D:\sykasif_ozeluclu - Kopya (2)"
npm install
Copy-Item .env.example .env.local -ErrorAction SilentlyContinue
npm run dev:all
```

Tarayıcı: <http://localhost:5173>

Harita modunda **Canlı Ekosistem** paneli görünmelidir. İlk senkronizasyondan sonra USGS, NASA EONET ve GDACS çevrimiçi; ajan ve olay sayıları sıfırdan büyük olmalıdır.

Kontrol:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/health
Invoke-RestMethod http://127.0.0.1:3000/api/runtime/snapshot
```

## B. Azure Türkçe kadın sesi

Azure Portal'da bir Speech kaynağı oluşturun ve F0 katmanını seçin. Kaynağın **Keys and Endpoint** ekranındaki Key 1 ve Region değerlerini `.env.local` içine yazın:

```dotenv
AZURE_SPEECH_KEY=BURAYA_KEY_1
AZURE_SPEECH_REGION=westeurope
```

Region değerini kendi kaynağınızın gerçek bölgesiyle değiştirin. Sunucuyu yeniden başlatın. Sağlık çıktısında `azureSpeechConfigured: true` görünmelidir.

Arayüzde sağ alttaki **KÂŞİF İLE KONUŞ** düğmesini açın. İlk kullanımda tarayıcının mikrofon iznini onaylayın. Azure kullanılamazsa uygulama cihazdaki Türkçe STT/TTS sesine düşer.

## C. Yerel dijital ikiz

Yönetici PowerShell:

```powershell
wsl --install
winget install -e --id Docker.DockerDesktop
```

Windows'u yeniden başlatın ve Docker Desktop'ı açın. Proje terminalinde:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\infrastructure\local-twin\check-windows.ps1
npm run twin:up
Invoke-RestMethod http://127.0.0.1:3001/info
```

Sonra `npm run dev:all`. Klasik Konsol → **DTSE Tarama** ekranında gerçek fotoğraf görevini oluşturun.

Bu donanımda hızlı profil ve 20-40 fotoğrafla başlayın. RX 570 CUDA için kullanılmaz; iş CPU'da çalışır ve uzun sürebilir.

## D. Bilgisayar kapalıyken Cloudflare ajanları

Node.js 22 kurun:

```powershell
winget install OpenJS.NodeJS.LTS
node --version
```

Sonra:

```powershell
cd cloudflare\runtime-worker
npm install
npx wrangler login
npx wrangler d1 create sykasif-runtime
```

Dönen database ID'yi `wrangler.toml` dosyasına yazın:

```powershell
npm run db:remote
npx wrangler secret put ADMIN_TOKEN
npm run deploy
```

Worker URL'sini ana `.env.local` içine yazın:

```dotenv
VITE_SYKASIF_RUNTIME_URL=https://sykasif-runtime.<hesap>.workers.dev
```

Ana uygulamayı yeniden başlatın.

## E. Son doğrulama

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Beklenen: sıfır lint hatası, tüm testler başarılı ve production build tamamlanmış olmalıdır.
