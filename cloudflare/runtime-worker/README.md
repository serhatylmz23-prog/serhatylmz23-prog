# SyKaşif Cloudflare Canlı Ajan Runtime

Bu Worker, bilgisayar kapalıyken de çalışan ücretsiz-kota odaklı ajan omurgasıdır.

## Özellikler

- 5 dakikalık Cron senkronizasyonu
- USGS, NASA EONET ve GDACS güvenilir canlı kaynakları
- D1 olay, kaynak, onay ve çalışma kayıtları
- Olay sayısına göre dinamik ajan üretimi
- Durable Object üzerinden SSE canlı yayın
- Yeni kaynak/model/kural için yönetici onay kuyruğu
- Güvenilir kayıtlı kaynaklarda otomatik veri yenileme

## Kurulum

```powershell
cd cloudflare/runtime-worker
npm install
npx wrangler login
npx wrangler d1 create sykasif-runtime
```

Komutun döndürdüğü `database_id` değerini `wrangler.toml` içindeki
`REPLACE_WITH_D1_DATABASE_ID` yerine yazın.

Şemayı uygulayın:

```powershell
npm run db:remote
```

Yönetici onay tokenı oluşturun ve secret olarak ekleyin:

```powershell
$token = -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
$token | npx wrangler secret put ADMIN_TOKEN
```

`wrangler.toml` içindeki `APP_ORIGIN` değerini gerçek arayüz alan adınızla değiştirin.

Dağıtım:

```powershell
npm run deploy
```

Dönen Worker URL'sini ana projenin `.env.local` dosyasına ekleyin:

```dotenv
VITE_SYKASIF_RUNTIME_URL=https://sykasif-runtime.<hesap>.workers.dev
```

Arayüzü yeniden başlatın.

## Güvenlik

- `ADMIN_TOKEN` hiçbir zaman `VITE_` değişkeni yapılmamalıdır.
- Yönetim işlemleri için sonraki aşamada Cloudflare Access önerilir.
- Yeni kaynaklar doğrudan çalıştırılmaz; onay kuyruğuna alınır.
- Worker yalnızca önceden kodda tanımlanan güvenilir connector'ları otomatik çalıştırır.
