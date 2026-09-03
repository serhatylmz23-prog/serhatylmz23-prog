const https = require('https');
const fs = require('fs');

function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function scrapeTurkey() {
  console.log('Türkiye kamera dizini taranıyor...');
  const baseUrl = 'https://www.skylinewebcams.com';
  const html = await fetchHTML(`${baseUrl}/en/webcam/turkey.html`);

  const regionRE = /href="(\/en\/webcam\/turkey\/[^"]+\.html)"/g;
  const regions = new Set();
  let m;
  while ((m = regionRE.exec(html)) !== null) {
    if (!m[1].includes('index.html')) {
      regions.add(baseUrl + m[1]);
    }
  }

  const urlsToScrape = [baseUrl + '/en/webcam/turkey.html', ...regions];
  console.log(`Toplam ${urlsToScrape.length} sayfa taranacak...`);

  const cams = [];
  const camRE = /href="(\/en\/webcam\/turkey\/[^"]+\.html)"[^>]*>.*?<img[^>]*src="(https:\/\/cdn\d*\.skylinewebcams\.com\/[^"]+)"[^>]*>.*?<div class="title">([^<]+)<\/div>/gs;

  for (const url of urlsToScrape) {
    try {
      console.log('Taranıyor:', url);
      const pageHtml = await fetchHTML(url);
      while ((m = camRE.exec(pageHtml)) !== null) {
        const fullUrl = baseUrl + m[1];
        if (!cams.find(c => c.external_url === fullUrl)) {
          cams.push({
            external_url: fullUrl,
            feed_url: '/api/cctv/proxy?url=' + encodeURIComponent(m[2]),
            name: m[3].trim().replace(/&amp;/g, '&').replace(/&#039;/g, "'")
          });
        }
      }
    } catch (err) {
      console.error(`Hata (${url}):`, err.message);
    }
  }

  console.log(`\nToplam ${cams.length} adet Türkiye kamerası bulundu!`);
  fs.writeFileSync('turkey_skyline.json', JSON.stringify(cams, null, 2), 'utf-8');
  console.log('Veriler "turkey_skyline.json" dosyasına kaydedildi.');
}

scrapeTurkey().catch(console.error);
