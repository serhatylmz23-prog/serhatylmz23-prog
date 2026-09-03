const https = require('https');
const fs = require('fs');

function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Referer': 'https://www.google.com/'
      }
    };
    https.get(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) redirectUrl = 'https://www.skylinewebcams.com' + redirectUrl;
        return fetchHTML(redirectUrl).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function scrapeTurkey() {
  console.log('SkylineWebcams Türkiye taranıyor...');
  const baseUrl = 'https://www.skylinewebcams.com';
  
  // Türkiye ve popüler alt bölge URL varyasyonları
  const targetUrls = [
    `${baseUrl}/en/webcam/turkey.html`,
    `${baseUrl}/en/webcam/turkiye.html`,
    `${baseUrl}/en/webcam/turkey/marmara/istanbul.html`,
    `${baseUrl}/en/webcam/turkey/anatolia-region.html`,
    `${baseUrl}/en/webcam/turkey/marmara.html`
  ];

  const cams = [];
  const linkSet = new Set();

  for (const pageUrl of targetUrls) {
    try {
      console.log(`Sayfa çekiliyor: ${pageUrl}`);
      const html = await fetchHTML(pageUrl);
      
      console.log(`Alınan HTML boyutu: ${html.length} karakter`);

      // Kamera bağlantılarını yakala
      const camRegex = /href="(\/en\/webcam\/(?:turkey|turkiye)\/[^"]+\.html)"/gi;
      let m;
      while ((m = camRegex.exec(html)) !== null) {
        const fullUrl = baseUrl + m[1];
        if (!fullUrl.endsWith('/turkey.html') && !fullUrl.endsWith('/turkiye.html')) {
          linkSet.add(fullUrl);
        }
      }

      // Canlı resim + Başlık içeren tam blokları yakala
      const blockRegex = /<a[^>]+href="(\/en\/webcam\/(?:turkey|turkiye)\/[^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/gi;
      let b;
      while ((b = blockRegex.exec(html)) !== null) {
        const camUrl = baseUrl + b[1];
        const content = b[2];

        const imgMatch = content.match(/(?:src|data-src)="(https:\/\/[^"]+(?:live|\.jpg|\.png)[^"]*)"/i);
        const titleMatch = content.match(/<div class="title">([^<]+)<\/div>/i) || content.match(/alt="([^"]+)"/i);

        if (imgMatch && titleMatch) {
          if (!cams.some(c => c.external_url === camUrl)) {
            cams.push({
              external_url: camUrl,
              feed_url: '/api/cctv/proxy?url=' + encodeURIComponent(imgUrl[1]),
              name: titleMatch[1].trim().replace(/&amp;/g, '&').replace(/&#039;/g, "'")
            });
          }
        }
      }
    } catch (err) {
      console.error(`Bağlantı hatası (${pageUrl}):`, err.message);
    }
  }

  console.log(`\nBulunan kamera linki sayısı: ${linkSet.size}`);
  console.log(`Bulunan ve ayrıştırılan kamera sayısı: ${cams.length}`);

  if (cams.length > 0) {
    fs.writeFileSync('turkey_skyline.json', JSON.stringify(cams, null, 2), 'utf-8');
    console.log('"turkey_skyline.json" kaydedildi.');
  }
}

scrapeTurkey().catch(console.error);