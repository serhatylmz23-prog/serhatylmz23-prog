export const playJarvisVoice = (text) => {
  if (!('speechSynthesis' in window)) {
    console.error("Tarayıcı ses sentezlemeyi desteklemiyor.");
    return;
  }

  // Takılı kalan ses kuyruğunu temizle ve motoru uyandır
  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'tr-TR';
  utterance.rate = 1.0;
  utterance.pitch = 0.95; // JARVIS tonu

  // Sistemdeki Türkçe sesi eşleştir
  const voices = window.speechSynthesis.getVoices();
  const trVoice = voices.find(v => v.lang === 'tr-TR' || v.lang.startsWith('tr'));
  if (trVoice) {
    utterance.voice = trVoice;
  }

  // Tarayıcının konuşmayı başlatması için ufak bir gecikme
  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 50);
};