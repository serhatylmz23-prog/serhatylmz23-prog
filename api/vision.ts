export const config = {
  runtime: 'edge',
};

// Bu uç nokta, syAgentSwarm.ts'in eskiden yaptigi gibi OpenAI API anahtarini
// dogrudan tarayicidan gondermesi yerine, gorsel analiz istegini sunucu
// tarafinda (gizli anahtar hic istemciye gitmeden) Cloudflare Workers AI
// vision modeline yonlendirir.
//
// NOT: Cloudflare Workers AI vision modellerinin ("@cf/llava-hf/llava-1.5-7b-hf"
// gibi) girdi/cikti semasi zamanla degisebilir; bu dosya genel/bilinen formata
// gore yazilmistir. Deploy sonrasi ilk denemede Cloudflare panelindeki güncel
// model dokümantasyonuyla input alanlarini (ör. "image" bayt dizisi mi yoksa
// "image_b64" mi bekliyor) karşılaştırıp gerekirse küçük bir düzeltme yapın.
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

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_AI_TOKEN;

  if (!accountId || !apiToken) {
    return new Response(
      JSON.stringify({
        error:
          'Sunucu yapılandırması eksik: CLOUDFLARE_ACCOUNT_ID ve CLOUDFLARE_AI_TOKEN ortam değişkenlerini tanımlayın.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = (await req.json()) as { prompt?: string; imageBase64?: string };
    const prompt = body?.prompt || 'Bu görseli analiz et.';
    const imageBase64 = body?.imageBase64;

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 alanı zorunludur (data URI veya saf base64).' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // "data:image/jpeg;base64,...." önekini varsa temizle
    const saf64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const binary = atob(saf64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const model = '@cf/llava-hf/llava-1.5-7b-hf';

    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: Array.from(bytes),
          prompt,
          max_tokens: 512,
        }),
      }
    );

    if (!cfResponse.ok) {
      const hataMetni = await cfResponse.text().catch(() => '');
      return new Response(
        JSON.stringify({ error: `Cloudflare Vision AI hatası (${cfResponse.status}): ${hataMetni || 'bilinmeyen hata'}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: any = await cfResponse.json();
    const yanit = data?.result?.description || data?.result?.response || 'Analiz motorundan yanıt alınamadı.';

    return new Response(JSON.stringify({ response: yanit }), {
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
