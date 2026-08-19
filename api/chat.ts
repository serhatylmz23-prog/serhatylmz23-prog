export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Yalnızca POST kabul edilir' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as { prompt?: string; screenContext?: string };
    const prompt = body?.prompt || 'Durum analizi yap';
    const screenContext = body?.screenContext || 'Telemetri aktif.';

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || 'ecf60f8138ddbbb17930f0e15e83201e';
    const apiToken = process.env.CLOUDFLARE_AI_TOKEN || 'cfut_zEGHAWJ0owbJuTihPdXYfnlkMywNrDXD5PWhHXf0cc7231f3';
    const model = '@cf/meta/llama-3.1-8b-instruct';

    const systemPrompt = `Sen KÂŞİF adlı profesyonel bir saha ve telemetri yapay zeka asistanısın.
Görevin kullanıcının sorularını ve emirlerini ekrandaki telemetri (GPS, Batarya, Hedef Tipi, Derinlik, Sinyal) verileriyle harmanlayıp net, doğrudan ve öz Türkçe ile yanıtlamaktır (maksimum 2 kısa cümle).

Canlı Telemetri:
${screenContext}`;

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
            { role: 'user', content: prompt },
          ],
          max_tokens: 200,
        }),
      }
    );

    const data: any = await cfResponse.json();

    if (data.result && data.result.response) {
      return new Response(JSON.stringify({ response: data.result.response.trim() }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ response: 'Veri analiz edildi ancak sonuç üretilemedi.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Sunucu hatası' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}