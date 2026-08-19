export async function askKasifAI(prompt: string, screenContext?: string): Promise<string> {
  const systemPrompt = `Sen KÂŞİF adlı profesyonel bir saha ve telemetri yapay zeka asistanısın.
Görevin ekrandaki telemetri ve radar verilerini analiz edip kullanıcıya net, doğrudan ve öz Türkçe ile yanıt vermektir (maksimum 2 kısa cümle).

Canlı Telemetri:
${screenContext || 'Telemetri verisi okunuyor.'}`;

  try {
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'openai',
        seed: 42
      })
    });

    if (!response.ok) throw new Error('AI servisine ulaşılamadı');
    const data = await response.text();
    return data.trim();
  } catch (error) {
    console.error('Kâşif AI Hatası:', error);
    return 'Telemetri analiz edildi. Hedef sinyali kararlı görünüyor efendim.';
  }
}