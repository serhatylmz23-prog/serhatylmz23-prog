export async function askKasifAI(prompt: string, screenContext?: string): Promise<string> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        screenContext,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP Hata: ${res.status}`);
    }

    const data = await res.json();
    return data.response || 'Analiz tamamlandı.';
  } catch (error: any) {
    console.error('Kâşif Bağlantı Hatası:', error);
    return 'Kâşif sunucusuna erişilemedi. Lütfen bağlantınızı kontrol edin.';
  }
}