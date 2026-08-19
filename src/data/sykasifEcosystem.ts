export type SyState = 'PASIF' | 'AKTIF' | 'ISLENIYOR' | 'TAMAMLANDI' | 'UYARI' | 'KRITIK';

export interface SyCategoryItem {
  id: number | string;
  name: string;
  category: string;
  state: SyState;
  value?: string | number;
}

export const STATE_COLORS: Record<SyState, { ring: string; glow: string; text: string }> = {
  PASIF: { ring: '#64748b', glow: 'rgba(100, 116, 139, 0.2)', text: '#94a3b8' },
  AKTIF: { ring: '#0284c7', glow: 'rgba(2, 132, 199, 0.4)', text: '#38bdf8' },
  ISLENIYOR: { ring: '#d97706', glow: 'rgba(217, 119, 6, 0.4)', text: '#fbbf24' },
  TAMAMLANDI: { ring: '#16a34a', glow: 'rgba(22, 163, 74, 0.4)', text: '#4ade80' },
  UYARI: { ring: '#ca8a04', glow: 'rgba(202, 138, 4, 0.4)', text: '#facc15' },
  KRITIK: { ring: '#dc2626', glow: 'rgba(220, 38, 38, 0.5)', text: '#f87171' },
};

export const SY_ECOSYSTEM_DATA: Record<string, SyCategoryItem[]> = {
  'RAPORLAMA': [
    { id: 1, name: 'RAPOR', category: 'KANIT', state: 'AKTIF' },
    { id: 4, name: 'CANLI RAPOR', category: 'KANIT', state: 'ISLENIYOR' },
    { id: 5, name: 'MÜHÜRLÜ RAPOR', category: 'KANIT', state: 'TAMAMLANDI', value: 'SHA-256' },
    { id: 9, name: 'SİNYAL RAPORU', category: 'KANIT', state: 'AKTIF' },
    { id: 14, name: 'SAHA RAPORU', category: 'KANIT', state: 'TAMAMLANDI' },
    { id: 24, name: 'RAPOR MÜHRÜ', category: 'KANIT', state: 'TAMAMLANDI', value: 'MÜHÜRLÜ' },
  ],
  'CİHAZLAR VE SENSÖRLER': [
    { id: 3, name: 'TABLET', category: 'SINYAL', state: 'AKTIF', value: 'SYK-TAB' },
    { id: 10, name: 'MİKROFON', category: 'SINYAL', state: 'AKTIF', value: '%85' },
    { id: 11, name: 'GPS', category: 'HARITA', state: 'TAMAMLANDI', value: '±1.8cm' },
    { id: 12, name: 'RTK', category: 'HARITA', state: 'TAMAMLANDI', value: 'FIX' },
    { id: 13, name: 'LIDAR', category: 'SINYAL', state: 'ISLENIYOR', value: '30 FPS' },
    { id: 28, name: 'PİL', category: 'SINYAL', state: 'AKTIF', value: '%92' },
    { id: 34, name: 'CİHAZ SAĞLIĞI', category: 'SINYAL', state: 'TAMAMLANDI', value: 'OPTİMAL' },
  ],
  'İLETİŞİM VE SES': [
    { id: 1, name: 'MİKROFON', category: 'SINYAL', state: 'AKTIF' },
    { id: 6, name: 'DİNLE', category: 'SINYAL', state: 'AKTIF' },
    { id: 7, name: 'KONUŞ (JARVIS)', category: 'SINYAL', state: 'AKTIF' },
    { id: 9, name: 'SES SEVİYESİ', category: 'SINYAL', state: 'TAMAMLANDI', value: '%75' },
    { id: 11, name: 'STT (SES->YAZI)', category: 'SINYAL', state: 'ISLENIYOR' },
    { id: 12, name: 'TTS (YAZI->SES)', category: 'SINYAL', state: 'TAMAMLANDI' },
  ],
  'SİSTEM VE AYARLAR': [
    { id: 1, name: 'AYARLAR', category: 'SINYAL', state: 'AKTIF' },
    { id: 5, name: 'TEMA', category: 'SINYAL', state: 'TAMAMLANDI', value: 'MONOLITH' },
    { id: 9, name: 'DİL', category: 'SINYAL', state: 'TAMAMLANDI', value: 'TR' },
    { id: 21, name: 'SİSTEM SAĞLIĞI', category: 'SINYAL', state: 'TAMAMLANDI', value: '%98' },
    { id: 22, name: 'PERFORMANS', category: 'SINYAL', state: 'TAMAMLANDI', value: '60 FPS' },
    { id: 26, name: 'SÜRÜM', category: 'SINYAL', state: 'TAMAMLANDI', value: 'v1.0.0' },
  ],
};