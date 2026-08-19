export default async function handler(req: any, res: any) {
  // CORS Başlıkları
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST istekleri kabul edilir.' });
  }

  try {
    const { prompt, screenContext } = req.body;

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || 'ecf60f8138ddbbb17930f0e15e83201e';
    const apiToken = process.env.CLOUDFLARE_AI_TOKEN || 'cfut_zEGHAWJ0owbJuTihPdXYfnlkMywNrDXD5PWhHXf0cc7231f3';
    const model = '@cf/meta/llama-3.1-8b-instruct';

    const systemPrompt = `Sen KÂŞİF adlı profesyonel bir saha ve telemetri yapay zeka asistanısın.
Görevin kullanıcının sorularını ve emirlerini ekrandaki telemetri (GPS, Batarya, Hedef Tipi, Derinlik, Sinyal) verileriyle harmanlayıp net, doğrudan ve öz Türkçe ile yanıtlamaktır (maksimum 2 kısa cümle).

Canlı Telemetri:
${screenContext || 'Telemetri aktif.'}`;

    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 200,
        }),
      }
    );

    const data: any = await cfResponse.json();

    if (data.result && data.result.response) {
      return res.status(200).json({ response: data.result.response.trim() });
    }

    return res.status(200).json({ response: 'Veri analiz edildi ancak anlamlı sonuç üretilemedi.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Sunucu hatası' });
  }
}