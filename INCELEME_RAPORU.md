# SyKaşif Özel Uçlu — Kod İnceleme ve Düzeltme Raporu

**İncelenen depo:** `serhatylmz23-prog/sykasif_ozeluclu`  
**İncelenen başlangıç commit'i:** `61b226d223ab5cd5d6caab2b3ce9c5ba2716a746`  
**İnceleme tarihi:** 20 Ağustos 2026

## Yönetici özeti

Başlangıç sürümü derleniyor ve TypeScript uygulama kontrolünden geçiyordu; ancak bu durum uygulamanın işlevsel veya güvenli olduğu anlamına gelmiyordu. İncelemede:

- Cloudflare yönetim token'ını geniş yollar için kullanan kritik bir genel proxy,
- Express 5 nedeniyle hiç başlamayan yerel proxy,
- geliştirmede çalışmayan `/api/chat` ve `/api/vision` akışı,
- 30 Mayıs 2026'da kullanımdan kaldırılmış metin modeli,
- gerçek veri toplamayan boş ajanlar,
- rastgele güven puanı ve sahte SHA-256 “doğrulaması”,
- AI hatasında başarılı analiz yapılmış gibi görünen sahte sonuçlar,
- otomatik GPS izin isteği,
- eski analiz yanıtının yeni konum sonucunu ezebildiği yarış durumu,
- API dosyalarını kapsamayan tip kontrolü,
- kullanıcıya ajan bulgularını göstermeyen durum modeli

tespit edildi.

Bu çalışma kopyasında kritik akışlar düzeltilmiş, gerçek açık veri bağlantıları eklenmiş ve testler oluşturulmuştur.

## Kritik ve yüksek öncelikli bulgular

### 1. Kritik: Kimlik doğrulamasız genel Cloudflare yönetim proxy'si

**Eski durum:** `api/cloudflare-proxy.js`, sunucu token'ını kullanarak `/accounts`, `/zones` ve `/workers` yollarına gelen yöntemleri ileri iletiyordu. Uç nokta kimlik doğrulamasızdı ve `DELETE` dahil yöntem kısıtlaması yoktu. Token izinlerine bağlı olarak hesap/zone/worker kaynakları okunabilir veya değiştirilebilirdi.

**Düzeltme:**

- Genel proxy kalıcı olarak `410 Gone` döndürecek şekilde kapatıldı.
- Uygulama yalnızca dar kapsamlı `/api/chat` ve `/api/vision` uç noktalarını kullanıyor.
- Token için README'de en az ayrıcalık ilkesi belirtildi.

### 2. Kritik: Yerel geliştirme sunucusu başlamıyordu

**Eski durum:** Express 5 ile `/api/cloudflare-proxy/:path(*)` rotası başlangıçta `PathError: Unexpected (` hatası veriyordu. Ayrıca Vite doğrudan Cloudflare API'ye yönlendiriliyor, yerel sunucunun sunduğu yol uygulama tarafından kullanılmıyordu.

**Düzeltme:**

- Eski `local-proxy.js` kaldırıldı.
- `local-api.js`, yalnızca `/api/chat` ve `/api/vision` sunacak biçimde eklendi.
- Vite `/api` çağrılarını `127.0.0.1:3000` adresine yönlendiriyor.
- `npm run dev:all` iki süreci birlikte ve hata halinde güvenli biçimde kapatıyor.

Express 5 rota değişikliği: <https://expressjs.com/en/guide/migrating-5/>

### 3. Kritik: Kullanımdan kaldırılmış Cloudflare metin modeli

**Eski durum:** `@cf/meta/llama-3.1-8b-instruct` sabitlenmişti. Cloudflare bu modeli 30 Mayıs 2026'da kullanımdan kaldırdı.

**Düzeltme:**

- Varsayılan metin modeli `@cf/zai-org/glm-4.7-flash` oldu.
- Metin ve vision modelleri ortam değişkeniyle değiştirilebilir hale geldi.
- Eski ve yeni Cloudflare yanıt biçimleri normalize ediliyor.

Kaynaklar:

- <https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct/>
- <https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/>

### 4. Kritik: Sahte analiz, sahte güven ve sahte doğrulama sonuçları

**Eski durum:**

- Vision hatasında “insan müdahalesi ve astronomik yönelim” sonucu dönüyordu.
- Rastgele `%87-%99` güven puanı üretiliyordu.
- `Math.random()` değeri `SHA256-...` etiketiyle gösteriliyordu.
- Adli medya paneli her dosyayı `%94 orijinal` ilan ediyordu.
- AI hatasında `%98.2 doğrulandı` sonucu üretiliyordu.
- Dosyanın yalnızca adı modele gönderildiği halde içerik analiz edilmiş gibi gösteriliyordu.
- Görselde bitki sözcüğü geçerse doğrulanmamış tıbbi etki metni üretiliyordu.

**Düzeltme:**

- Hatalar artık açıkça hata olarak gösteriliyor; başarılı sonuç taklidi yapılmıyor.
- Rastgele güven puanı ve rastgele kutular kaldırıldı.
- Gerçek Web Crypto SHA-256 yalnızca **model çıktı özeti** olarak kullanılıyor; adli doğrulama iddiası yapılmıyor.
- Harici kaynak taranmadığı açıkça belirtiliyor.
- Adli doğrulama entegrasyonu olmayan panel sahte rapor üretmiyor.
- Medya envanter ekranı yalnızca dosya/link listesini özetlediğini belirtiyor.
- Tıbbi iddia kaldırıldı.

### 5. Yüksek: Ajanlar gerçek veri toplamıyordu

**Eski durum:** `sourceService` her zaman boş dizi döndürüyordu. Hava ve uydu ajanları doğrudan boş sonuç veriyordu. Analiz her koşulda “tamamlandı” görünse de tüm sayaçlar sıfırdı.

**Düzeltme:**

- Jeoloji: Macrostrat `geologic_units/map`
- Arkeoloji: OpenStreetMap Overpass
- Deprem: USGS FDSN Earthquake Catalog
- Hava: Open-Meteo
- Ters jeokodlama: Nominatim
- Uydu: Esri World Imagery kaynak kaydı; otomatik yorum yaptığı iddia edilmiyor

Ajan hataları birbirinden izole edildi (`Promise.allSettled`). Bir sağlayıcının hatası diğer ajanları düşürmüyor.

### 6. Yüksek: API doğrulama ve kaynak tüketimi korumaları eksikti

**Eski durum:** `Access-Control-Allow-Origin: *`, sınırsız prompt/görsel gövdesi, içerik türü kontrolü olmayan JSON ayrıştırma, zaman aşımı olmayan Cloudflare çağrısı ve kullanıcıya dönen ham sağlayıcı hata metni vardı.

**Düzeltme:**

- Aynı-origin/izinli-origin kontrolü
- `POST` ve `application/json` zorunluluğu
- Prompt ve bağlam uzunluğu sınırı
- Görsel base64, dosya imzası, MIME ve 2,5 MB sınırı
- 25 saniye sağlayıcı zaman aşımı
- `no-store`, `nosniff`, `Vary: Origin`
- Sağlayıcı hata ayrıntılarının yalnızca sunucu logunda kalması

Vercel Function gövde sınırı nedeniyle görseller istemcide küçültülüyor: <https://vercel.com/docs/functions/limitations#request-body-size>

### 7. Yüksek: Harita analiz yarış durumu

**Eski durum:** Kullanıcı hızla iki konuma tıklarsa önceki yavaş istek sonradan dönerek yeni konumun analizini ezebiliyordu. `useEffect` bağımlılığında `runLocationAnalysis` eksikti.

**Düzeltme:**

- Analiz çağrısı `useCallback` ile sabitlendi.
- Her çalıştırmaya sıra numarası verildi; eski yanıtlar yok sayılıyor.
- Ajanlar analiz sırasında gerçekten `çalışıyor` durumuna geçiyor.
- Lint bağımlılık uyarısı giderildi.

### 8. Yüksek: Bulgular ve kaynaklar kayboluyordu

**Eski durum:** Context yalnızca bulgu/kaynak sayılarını saklıyor, gerçek sonuçları atıyordu. Kullanıcı ajanların ne bulduğunu göremiyordu.

**Düzeltme:**

- Bulgular ve benzersiz kaynaklar context içinde saklanıyor.
- Yan panel ilk bulguları, açıklamalarını ve kaynak bağlantılarını gösteriyor.

### 9. Orta: GPS sayfa açılır açılmaz izin istiyordu

**Düzeltme:** GPS artık kullanıcı düğmeye basmadan başlamıyor. Takip açıkça başlatılabiliyor ve durdurulabiliyor; işaretçi ve watcher temizleniyor.

### 10. Orta: Harita katman modeli yanlıştı

**Eski durum:** Uydu ve opak topografya katmanları aynı anda “aktif” olabiliyor, üstteki katman alttakini tamamen kapatıyordu. Termal/GPR/arkeoloji seçenekleri hiçbir kod çalıştırmıyordu.

**Düzeltme:** Yalnızca gerçekten bulunan üç temel harita katmanı radyo seçimi olarak sunuluyor: OpenStreetMap, Esri uydu ve OpenTopoMap.

### 11. Orta: Object URL bellek sızıntıları

Dosya yükleme ekranlarında oluşturulan `blob:` URL'leri temizlenmiyordu.

**Düzeltme:** SyFrame, SyMediaUpload, SyDTSE ve SyMaster ekranlarında URL'ler değiştirilirken veya bileşen kapanırken `URL.revokeObjectURL` çağrılıyor.

### 12. Orta: Service worker yanlış kaynakları önbelleğe alıyordu

**Eski durum:** Aynı strateji tüm GET isteklerine uygulanıyor, eski hash'li varlıklar temizlenmiyor ve çevrimdışı hatada her kaynak için HTML dönebiliyordu.

**Düzeltme:**

- Yalnızca aynı-origin GET varlıkları cache'e giriyor.
- API ve harici harita karoları hariç tutuluyor.
- Navigasyon network-first, statik varlıklar cache-first/revalidate çalışıyor.
- Cache sürümü yükseltildi ve eski cache'ler siliniyor.

### 13. Orta: Test ve tip kontrol kapsamı eksikti

**Eski durum:** `npm run typecheck` yalnızca `src` dizisini kontrol ediyor; `api/*.ts` ve `vite.config.ts` kapsam dışında kalıyordu. Test yoktu.

**Düzeltme:**

- `tsconfig.api.json` eklendi.
- Node/Vite config de typecheck komutuna dahil edildi.
- Chat/vision doğrulama ve normalizasyonu için 5 Node testi eklendi.
- Oxc lint uyarıları sıfırlandı.
- GitHub Actions içinde typecheck, lint, test, build ve runtime audit adımları eklendi.

## Diğer düzeltmeler

- `.env.example` tekilleştirildi; model ve origin seçenekleri eklendi.
- `@types/leaflet` runtime bağımlılıklarından dev bağımlılıklarına taşındı.
- Node 20 ile uyumsuz `concurrently@10` yerine `concurrently@9` kullanıldı.
- PWA manifest adı, renkleri, başlangıç yolu ve HTML bağlantıları tamamlandı.
- Tam ekran isteği başarısız olduğunda arayüz artık yanlışlıkla tam ekran durumuna geçmiyor.
- Klasik konsola sürekli görünür prototip/demo uyarısı eklendi.
- Proje adı/sürümü `sykasif-ozeluclu@0.2.0` olarak düzenlendi.

## Doğrulama sonuçları

Aşağıdaki komutların tümü başarılıdır:

```text
npm run typecheck  → başarılı
npm run lint       → 0 uyarı, 0 hata
npm test           → 8/8 test başarılı
npm run build      → başarılı
npm audit          → 0 güvenlik açığı
```

Yerel API ayrıca gerçek süreç olarak başlatılıp doğrulandı:

- `GET /health` → `200 {"status":"ok"}`
- Eksik Cloudflare ayarında `POST /api/chat` → kontrollü `503`
- Vite üzerinden `/api/chat` proxy akışı → yerel API'ye başarıyla ulaşıyor
- Önizleme host'u → HTTP 200

Cloudflare hesabı/token'ı paylaşılmadığı için gerçek ücretli model çağrısı yapılmadı; uzak çağrı sözleşmesi testlerde mock yanıtla doğrulandı.

## Canlı sistem genişletmesi (v0.2.0)

Kullanıcının canlı ürün talebi üzerine ayrıca şu gerçek çalışma bileşenleri eklendi:

- USGS, NASA EONET ve GDACS için beş dakikalık canlı yerel runtime
- Olaylara göre değişen kaynak ve olay ajanları
- Express SSE canlı yayın ve haritada küresel olay işaretleri
- D1 + Cron + Durable Object tabanlı Cloudflare runtime projesi
- Güvenilir kaynak otomasyonu ve yeni kaynak/model/kural onay kuyruğu
- Azure `tr-TR-EmelNeural` kadın sesi ve Azure STT token akışı
- Konuşma geçmişi ve canlı olay bağlamı kullanan KÂŞİF sohbet penceresi
- i3-9100F / 16 GB / RX 570 için CPU sınırlı NodeODM Docker profili
- Gerçek çoklu fotoğraf yükleme, NodeODM görev takibi ve çıktı indirme ekranı
- Windows donanım/WSL2/Docker denetim betiği

## Bilinen kalan sınırlamalar

1. **Klasik Konsol prototiptir.** İçindeki birçok cihaz, radar, MTA, RTK, LiDAR ve güven değeri statik demo verisidir. Uyarı eklendi; gerçek kullanım için her panel ayrı veri/sensör entegrasyonu ister.
2. **Kalıcı rate limit ve kullanıcı kimlik doğrulaması yoktur.** Origin kontrolü tarayıcı kaynaklı kötüye kullanımı azaltır fakat sunucudan sunucuya isteği engellemez. Kamuya açık üretimde Turnstile/WAF veya KV/Redis tabanlı limit eklenmelidir.
3. **Vision modeli yapılandırılabilir ama varsayılan LLaVA beta modelidir.** Model değiştirilirse giriş/çıkış sözleşmesi staging ortamında doğrulanmalıdır.
4. **Overpass, Nominatim, USGS, Macrostrat ve Open-Meteo dış sağlayıcılardır.** Kota, kapsam, CORS veya geçici erişilebilirlik sorunları olabilir.
5. **Arkeoloji sonucu OpenStreetMap etiketidir; resmî sit tescili değildir.** Resmî karar için Kültür Varlıkları kurum verileri gerekir.
6. **Video analizi tek kare üzerinden yapılır.** Zaman çizgisi boyunca nesne takibi uygulanmıyor.
7. **YouTube ve RTSP doğrudan desteklenmez.** Tarayıcı/codec/CORS ve akış dönüştürme katmanı gerekir.
8. **Adli medya doğrulama servisi yoktur.** EXIF, ELA ve tersine görsel arama için ayrı backend ve sağlayıcı anlaşmaları gerekir.
9. **Tarayıcı E2E testi henüz yoktur.** Playwright/Cypress ile mobil görünüm, harita tıklama, GPS izinleri ve dosya yükleme senaryoları eklenmelidir.
10. **Onaylanan rastgele bir URL otomatik connector'a dönüşmez.** Şema eşleme ve güvenlik doğrulaması kod incelemesi gerektirir; onay kaydı bu süreci başlatır.
11. **RX 570, NodeODM CUDA hızlandırmasında kullanılamaz.** Fotogrametri CPU'da ve tek görevle çalışır; büyük veri setleri bu bilgisayar için uygun değildir.
12. **Doğrudan LAS/LAZ yükleme ve Potree görüntüleme ikinci aşamadır.** NodeODM şu anda ürettiği nokta bulutu/mesh/ortofoto çıktılarının indirilmesini sağlar.

## Önerilen sonraki adımlar

1. Cloudflare token'ını yalnızca Workers AI çalıştırma izniyle Vercel'e ekleyin.
2. `npm run dev:all` ve staging ortamında gerçek chat/vision smoke testi yapın.
3. Turnstile + kalıcı rate limit ekleyin.
4. Klasik Konsol için hangi modüllerin gerçek ürüne dönüşeceğini belirleyin; kalan demo panellerini kaldırın.
5. Playwright E2E ve erişilebilirlik testlerini mevcut CI akışına ekleyin.
