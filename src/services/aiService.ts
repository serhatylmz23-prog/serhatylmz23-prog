// NOT: Bu servis eskiden dogrudan halka acik "text.pollinations.ai" servisine
// istek atiyordu; bu hem projenin kendi Cloudflare/Vercel altyapisiyla tutarsizdi
// hem de guvenilirligi/gizliligi belirsiz ucuncu parti bir servise bagimliydi.
// Artik projenin kendi guvenli sunucu tarafi uc noktasi olan /api/chat'i kullaniyor
// (bkz. api/chat.ts). Gizli anahtarlar sadece sunucuda kalir, tarayiciya hic gitmez.
export async function askKasifAI(prompt: string, screenContext?: string): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, screenContext }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data) {
      throw new Error(data?.error || 'AI servisine ulaşılamadı');
    }

    if (data.error) throw new Error(data.error);

    return (data.response || '').trim() || 'Analiz tamamlandı ancak sonuç boş döndü.';
  } catch (error) {
    console.error('Kâşif AI Hatası:', error);
    return 'Telemetri analiz edildi. Hedef sinyali kararlı görünüyor efendim.';
  }
}
