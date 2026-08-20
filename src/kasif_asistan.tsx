import React, { useRef, useState } from 'react';
import { askKasifAI } from './services/aiService';
import {
  recognizeTurkishOnce,
  speakTurkishFemale,
} from './services/voiceService';
import { useLiveRuntime } from './components/context/useLiveRuntime';

type AssistantState =
  | 'HAZIR'
  | 'DİNLİYOR'
  | 'DÜŞÜNÜYOR'
  | 'KONUŞUYOR'
  | 'HATA';

interface ConversationMessage {
  role: 'user' | 'assistant';
  text: string;
  at: string;
}

const STATE_COLOR: Record<AssistantState, string> = {
  HAZIR: '#1E293B',
  DİNLİYOR: '#DC2626',
  DÜŞÜNÜYOR: '#D97706',
  KONUŞUYOR: '#16A34A',
  HATA: '#7F1D1D',
};

export const KasifAssistant: React.FC = () => {
  const { snapshot } = useLiveRuntime();
  const [state, setState] = useState<AssistantState>('HAZIR');
  const [input, setInput] = useState('');
  const [continuous, setContinuous] = useState(false);
  const [voiceEngine, setVoiceEngine] = useState<'azure' | 'browser' | 'unknown'>(
    'unknown'
  );
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      role: 'assistant',
      text: 'KÂŞİF hazır. Canlı ekosistem ve saha verileri hakkında konuşabiliriz.',
      at: new Date().toISOString(),
    },
  ]);
  const continuousRef = useRef(false);
  const operationRef = useRef(0);

  const setContinuousMode = (enabled: boolean) => {
    continuousRef.current = enabled;
    setContinuous(enabled);
  };

  const contextText = (history: ConversationMessage[]) => {
    const recent = history
      .slice(-8)
      .map((message) => `${message.role === 'user' ? 'Kullanıcı' : 'KÂŞİF'}: ${message.text}`)
      .join('\n');
    const events = snapshot.events
      .slice(0, 5)
      .map((event) => `${event.title} — ${event.summary}`)
      .join('\n');

    return `Canlı çalışma zamanı:
- Aktif ajan: ${snapshot.metrics.activeAgents}
- Canlı olay: ${snapshot.metrics.liveEvents}
- Çevrimiçi kaynak: ${snapshot.metrics.onlineSources}
- Son güncelleme: ${snapshot.lastUpdatedAt || 'Henüz yok'}

Son canlı olaylar:
${events || 'Canlı olay alınmadı.'}

Konuşma geçmişi:
${recent}`;
  };

  const processText = async (text: string) => {
    const normalized = text.trim();
    if (!normalized) return;
    const operationId = ++operationRef.current;
    const userMessage: ConversationMessage = {
      role: 'user',
      text: normalized,
      at: new Date().toISOString(),
    };
    const history = [...messages, userMessage];
    setMessages(history);
    setState('DÜŞÜNÜYOR');

    try {
      const answer = await askKasifAI(normalized, contextText(history));
      if (operationRef.current !== operationId) return;
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        text: answer,
        at: new Date().toISOString(),
      };
      setMessages((current) => [...current, assistantMessage]);
      setState('KONUŞUYOR');
      const engine = await speakTurkishFemale(answer);
      if (operationRef.current !== operationId) return;
      setVoiceEngine(engine);
      setState('HAZIR');

      if (continuousRef.current) {
        window.setTimeout(() => void listenOnce(), 350);
      }
    } catch (caught) {
      if (operationRef.current !== operationId) return;
      const message =
        caught instanceof Error ? caught.message : 'KÂŞİF servisine ulaşılamadı.';
      setMessages((current) => [
        ...current,
        { role: 'assistant', text: `Hata: ${message}`, at: new Date().toISOString() },
      ]);
      setState('HATA');
      setContinuousMode(false);
    }
  };

  const listenOnce = async () => {
    if (state === 'DİNLİYOR' || state === 'DÜŞÜNÜYOR') return;
    setState('DİNLİYOR');
    try {
      const recognized = await recognizeTurkishOnce();
      setInput('');
      await processText(recognized);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Mikrofon kullanılamadı.';
      setMessages((current) => [
        ...current,
        { role: 'assistant', text: `Hata: ${message}`, at: new Date().toISOString() },
      ]);
      setState('HATA');
      setContinuousMode(false);
    }
  };

  const stopConversation = () => {
    operationRef.current += 1;
    setContinuousMode(false);
    window.speechSynthesis?.cancel();
    setState('HAZIR');
  };

  const sendInput = () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    void processText(text);
  };

  return (
    <div
      style={{
        padding: '14px',
        backgroundColor: '#090D16',
        borderRadius: '10px',
        border: '1px solid rgba(56,189,248,.3)',
        maxWidth: '900px',
        margin: '0 auto 12px',
        color: '#FFF',
        boxShadow: '0 0 20px rgba(0,0,0,.5)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <span style={{ color: '#38BDF8', fontWeight: 900 }}>KÂŞİF CANLI ASİSTAN</span>
          <span
            style={{
              marginLeft: '8px',
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: STATE_COLOR[state],
              fontSize: '.65rem',
            }}
          >
            {state}
          </span>
          <div style={{ color: '#64748B', fontSize: '.65rem', marginTop: '3px' }}>
            Ses: {voiceEngine === 'azure' ? 'Azure Emel Neural' : voiceEngine === 'browser' ? 'Tarayıcı yedeği' : 'Henüz sınanmadı'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <label style={{ color: '#CBD5E1', fontSize: '.7rem' }}>
            <input
              type="checkbox"
              checked={continuous}
              onChange={(event) => setContinuousMode(event.target.checked)}
            />{' '}
            Karşılıklı sohbet
          </label>
          <button type="button" onClick={() => void listenOnce()}>
            {state === 'DİNLİYOR' ? 'Dinleniyor…' : '🎙️ Dinle'}
          </button>
          <button type="button" onClick={stopConversation}>
            Durdur
          </button>
        </div>
      </div>

      <div
        style={{
          maxHeight: '210px',
          overflowY: 'auto',
          display: 'grid',
          gap: '7px',
          marginTop: '11px',
          padding: '9px',
          borderRadius: '7px',
          background: '#030712',
        }}
      >
        {messages.slice(-12).map((message, index) => (
          <div
            key={`${message.at}-${index}`}
            style={{
              justifySelf: message.role === 'user' ? 'end' : 'start',
              maxWidth: '82%',
              padding: '7px 9px',
              borderRadius: '8px',
              background:
                message.role === 'user'
                  ? 'rgba(2,132,199,.28)'
                  : 'rgba(30,41,59,.85)',
              color: '#E2E8F0',
              fontSize: '.78rem',
              lineHeight: 1.45,
            }}
          >
            {message.text}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '7px', marginTop: '9px' }}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') sendInput();
          }}
          placeholder="KÂŞİF ile konuşun veya yazın…"
          disabled={state === 'DÜŞÜNÜYOR'}
          style={{ flex: 1, padding: '9px 11px' }}
        />
        <button
          type="button"
          onClick={sendInput}
          disabled={!input.trim() || state === 'DÜŞÜNÜYOR'}
        >
          Gönder
        </button>
      </div>
    </div>
  );
};
