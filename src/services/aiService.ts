interface ChatResponse {
  response?: string;
  error?: string;
}

export async function askKasifAI(
  prompt: string,
  screenContext?: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    30_000
  );

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, screenContext }),
      signal: controller.signal,
    });
    const data = (await response
      .json()
      .catch(() => null)) as ChatResponse | null;

    if (!response.ok) {
      throw new Error(
        data?.error ||
          `AI servisi HTTP ${response.status} döndürdü.`
      );
    }

    const answer = data?.response?.trim();
    if (!answer) {
      throw new Error('AI servisi boş yanıt döndürdü.');
    }

    return answer;
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {
      throw new Error('AI isteği zaman aşımına uğradı.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
