import { useEffect, useMemo, useState } from 'react';

interface TwinHealth {
  online: boolean;
  engine: string;
  endpoint: string;
  hardwareProfile?: string;
  error?: string;
  limits?: {
    maxImages: number;
    maxFileMb: number;
    maxTotalMb: number;
    concurrency: number;
  };
}

interface TwinTask {
  uuid: string;
  name?: string;
  status: number | string;
  progress?: number;
  imagesCount?: number;
  processingTime?: number;
  lastError?: string;
}

const STATUS_TEXT: Record<number, string> = {
  10: 'KUYRUKTA',
  20: 'ÇALIŞIYOR',
  30: 'HATA',
  40: 'TAMAMLANDI',
  50: 'İPTAL EDİLDİ',
};

function uploadTask(
  form: FormData,
  onProgress: (progress: number) => void
): Promise<{ uuid: string }> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', '/api/twin/tasks');
    request.responseType = 'json';
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.response as { uuid: string });
      } else {
        reject(
          new Error(
            request.response?.error || `Yükleme HTTP ${request.status} hatası.`
          )
        );
      }
    };
    request.onerror = () => reject(new Error('NodeODM yüklemesine ulaşılamadı.'));
    request.send(form);
  });
}

export function SyDigitalTwinRuntime() {
  const [health, setHealth] = useState<TwinHealth | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState('SyKaşif Saha Modeli');
  const [profile, setProfile] = useState<'fast' | 'quality'>('fast');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [task, setTask] = useState<TwinTask | null>(() => {
    const uuid = localStorage.getItem('sykasif-last-twin-task');
    return uuid ? { uuid, status: 'unknown' } : null;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalMb = useMemo(
    () => files.reduce((total, file) => total + file.size, 0) / 1024 / 1024,
    [files]
  );

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const response = await fetch('/api/twin/health');
        const result = (await response.json()) as TwinHealth;
        if (!cancelled) setHealth(result);
      } catch {
        if (!cancelled) {
          setHealth({
            online: false,
            engine: 'NodeODM CPU',
            endpoint: 'http://127.0.0.1:3001',
            error: 'Yerel API’ye ulaşılamadı.',
          });
        }
      }
    };
    void check();
    const interval = window.setInterval(check, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!task?.uuid) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const response = await fetch(
          `/api/twin/tasks/${encodeURIComponent(task.uuid)}`
        );
        const result = (await response.json()) as TwinTask & { error?: string };
        if (!response.ok) throw new Error(result.error || 'Görev bilgisi alınamadı.');
        if (!cancelled) {
          setTask(result);
          setError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Görev sorgulanamadı.');
        }
      }
    };
    void poll();
    const interval = window.setInterval(poll, 8_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [task?.uuid]);

  const createTask = async () => {
    if (files.length < 3) {
      setError('En az 3 örtüşen fotoğraf seçin; gerçek model için 20+ önerilir.');
      return;
    }
    if (!health?.online) {
      setError('NodeODM çevrimdışı. Önce npm run twin:up çalıştırın.');
      return;
    }

    setBusy(true);
    setError(null);
    setUploadProgress(0);
    const form = new FormData();
    form.append('name', name);
    form.append('profile', profile);
    for (const file of files) form.append('images', file, file.name);

    try {
      const created = await uploadTask(form, setUploadProgress);
      localStorage.setItem('sykasif-last-twin-task', created.uuid);
      setTask({ uuid: created.uuid, name, status: 10, progress: 0 });
      setFiles([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Görev oluşturulamadı.');
    } finally {
      setBusy(false);
    }
  };

  const numericStatus = typeof task?.status === 'number' ? task.status : 0;
  const completed = numericStatus === 40;

  return (
    <div
      style={{
        background: '#030712',
        color: '#E2E8F0',
        border: '1px solid rgba(34,211,238,.3)',
        borderRadius: '12px',
        padding: '18px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#22D3EE', fontSize: '1.05rem' }}>
            SYK DİJİTAL İKİZ — GERÇEK NODEODM İŞ AKIŞI
          </h2>
          <div style={{ marginTop: '5px', color: '#94A3B8', fontSize: '.74rem' }}>
            Çoklu fotoğraf → kamera çözümü → nokta bulutu → mesh → ortofoto
          </div>
        </div>
        <div
          style={{
            color: health?.online ? '#4ADE80' : '#F87171',
            fontSize: '.72rem',
            fontWeight: 800,
          }}
        >
          ● {health?.online ? 'NODEODM ÇEVRİMİÇİ' : 'NODEODM ÇEVRİMDIŞI'}
        </div>
      </div>

      <div
        style={{
          marginTop: '12px',
          padding: '10px',
          background: 'rgba(15,23,42,.85)',
          borderRadius: '7px',
          fontSize: '.72rem',
          lineHeight: 1.6,
        }}
      >
        <strong>Donanım profili:</strong>{' '}
        {health?.hardwareProfile || 'i3-9100F / 16 GB / RX 570 — CPU modu'}
        <br />
        <strong>Güvenli sınır:</strong> en fazla 80 fotoğraf, 600 MB, tek görev.
        RX 570 CUDA uyumlu olmadığı için fotogrametri CPU üzerinde çalışır.
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px,1fr) minmax(220px,.7fr)',
          gap: '12px',
          marginTop: '12px',
        }}
      >
        <div>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            placeholder="Görev adı"
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px' }}
          />
          <select
            value={profile}
            onChange={(event) =>
              setProfile(event.target.value === 'quality' ? 'quality' : 'fast')
            }
            style={{ width: '100%', marginTop: '7px', padding: '9px' }}
          >
            <option value="fast">Hızlı CPU — bu bilgisayar için önerilen</option>
            <option value="quality">Kalite CPU — yalnızca küçük veri seti</option>
          </select>
          <label
            style={{
              display: 'block',
              marginTop: '8px',
              padding: '16px',
              border: '2px dashed #155E75',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              color: '#A5F3FC',
            }}
          >
            Örtüşen fotoğrafları seç
            <input
              type="file"
              accept="image/jpeg,image/png,image/tiff"
              multiple
              hidden
              onChange={(event) =>
                setFiles(Array.from(event.target.files || []).slice(0, 80))
              }
            />
          </label>
          <div style={{ marginTop: '6px', color: '#94A3B8', fontSize: '.7rem' }}>
            {files.length} fotoğraf • {totalMb.toFixed(1)} MB
          </div>
          <button
            type="button"
            onClick={() => void createTask()}
            disabled={busy || !health?.online}
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '11px',
              border: 0,
              borderRadius: '7px',
              background: busy || !health?.online ? '#334155' : '#0891B2',
              color: '#FFF',
              cursor: busy ? 'wait' : 'pointer',
              fontWeight: 900,
            }}
          >
            {busy ? `YÜKLENİYOR %${uploadProgress}` : 'DİJİTAL İKİZ GÖREVİNİ BAŞLAT'}
          </button>
        </div>

        <div
          style={{
            padding: '12px',
            border: '1px solid rgba(148,163,184,.18)',
            borderRadius: '8px',
            background: '#07101F',
          }}
        >
          <div style={{ color: '#67E8F9', fontSize: '.72rem' }}>SON GÖREV</div>
          {task ? (
            <>
              <div style={{ marginTop: '7px', fontSize: '.78rem', fontWeight: 800 }}>
                {task.name || task.uuid}
              </div>
              <div style={{ marginTop: '7px', color: completed ? '#4ADE80' : '#FBBF24' }}>
                {typeof task.status === 'number'
                  ? STATUS_TEXT[task.status] || `DURUM ${task.status}`
                  : String(task.status).toUpperCase()}
              </div>
              <div
                style={{
                  height: '8px',
                  marginTop: '9px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#1E293B',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, task.progress || 0))}%`,
                    background: '#22D3EE',
                  }}
                />
              </div>
              <div style={{ color: '#94A3B8', fontSize: '.68rem', marginTop: '4px' }}>
                %{Math.round(task.progress || 0)} • {task.imagesCount || 0} fotoğraf
              </div>
              {completed && (
                <div style={{ display: 'grid', gap: '5px', marginTop: '10px' }}>
                  {[
                    ['Tüm çıktılar', 'all.zip'],
                    ['Dokulu 3B model', 'textured_model.zip'],
                    ['Nokta bulutu', 'georeferenced_model.laz'],
                    ['Ortofoto', 'orthophoto.tif'],
                  ].map(([label, asset]) => (
                    <a
                      key={asset}
                      href={`/api/twin/tasks/${encodeURIComponent(task.uuid)}/download/${asset}`}
                      style={{ color: '#7DD3FC', fontSize: '.72rem' }}
                    >
                      {label} indir
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ color: '#64748B', marginTop: '8px', fontSize: '.72rem' }}>
              Henüz gerçek işleme görevi yok.
            </div>
          )}
        </div>
      </div>

      {(error || health?.error) && (
        <div
          style={{
            marginTop: '10px',
            padding: '9px',
            color: '#FCA5A5',
            background: 'rgba(127,29,29,.25)',
            borderRadius: '6px',
            fontSize: '.72rem',
          }}
        >
          {error || health?.error}
        </div>
      )}
    </div>
  );
}
