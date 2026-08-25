import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import L, {
  type Map as LeafletMap,
  type TileLayer,
  type CircleMarker,
  type LayerGroup,
} from 'leaflet';

import {
  analyzeLocation,
} from '../services/analysisRunner';

import 'leaflet/dist/leaflet.css';

import { useSyContext } from './context/useSyContext';
import { useLiveRuntime } from './context/useLiveRuntime';

interface GpsState {
  active: boolean;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
}

const DEFAULT_CENTER: L.LatLngExpression = [
  39.0,
  35.0,
];

const DEFAULT_ZOOM = 6;
const AGENT_IDS = [
  'jeoloji',
  'arkeoloji',
  'sismoloji',
  'meteoroloji',
  'uydu',
] as const;

export function SyMap() {
  const {
    activeLayers,
    selectedLocation,
    setSelectedLocation,
    addAlert,
    setSystemStatus,
    applyAgentResults,
    resetAgents,
    setAgentStatus,
    setAnalysisRunning,
    setAnalysisResult,
  } = useSyContext();
  const { snapshot: liveSnapshot } = useLiveRuntime();
  const analysisRunRef = useRef(0);

  const runLocationAnalysis = useCallback(
    async (latitude: number, longitude: number) => {
      const runId = ++analysisRunRef.current;

      try {
        resetAgents();
        for (const agentId of AGENT_IDS) {
          setAgentStatus(agentId, 'çalışıyor');
        }
        setAnalysisRunning(true);
        setSystemStatus('Bölgesel analiz başlatılıyor');
        addAlert(
          'Seçilen konum için gerçek veri sağlayıcıları sorgulanıyor.',
          'info'
        );

        const result = await analyzeLocation(
          latitude,
          longitude,
          10
        );

        // Kullanıcı bu sırada başka bir konuma tıkladıysa eski yanıtı yok say.
        if (analysisRunRef.current !== runId) return;

        applyAgentResults(result.orchestration.results);
        setAnalysisResult(
          result.analysis.totalSources,
          result.analysis.totalFindings,
          result.analysis.summary,
          result.analysis.findings,
          result.analysis.sources
        );
        setSelectedLocation((current) =>
          current.lat === latitude && current.lng === longitude
            ? {
                ...current,
                name:
                  result.regionalData.displayName ||
                  result.regionalData.district ||
                  current.name,
              }
            : current
        );
        setSystemStatus('Analiz tamamlandı');

        const failedCount = result.orchestration.results.filter(
          (agent) => agent.status === 'hata'
        ).length;
        addAlert(
          failedCount === 0
            ? `${result.orchestration.selectedAgents.length} ajan tamamlandı.`
            : `${failedCount} ajan veri sağlayıcısına ulaşamadı.`,
          failedCount === 0 ? 'success' : 'warning'
        );
      } catch (error) {
        if (analysisRunRef.current !== runId) return;
        setAnalysisRunning(false);
        setSystemStatus('Analiz hatası');
        addAlert(
          error instanceof Error
            ? error.message
            : 'Analiz sırasında bilinmeyen hata oluştu.',
          'danger'
        );
      }
    },
    [
      addAlert,
      applyAgentResults,
      resetAgents,
      setAgentStatus,
      setAnalysisResult,
      setAnalysisRunning,
      setSelectedLocation,
      setSystemStatus,
    ]
  );

  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<LeafletMap | null>(null);

  const baseLayersRef =
    useRef<Record<string, TileLayer>>({});

  const gpsMarkerRef =
    useRef<CircleMarker | null>(null);

  const selectedMarkerRef =
    useRef<CircleMarker | null>(null);

  const liveEventsLayerRef =
    useRef<LayerGroup | null>(null);

  const [gpsTrackingEnabled, setGpsTrackingEnabled] =
    useState(false);
  const [gpsState, setGpsState] = useState<GpsState>({
    active: false,
    lat: null,
    lng: null,
    accuracy: null,
  });

  /*
   * -------------------------------------------------------
   * HARİTA OLUŞTURMA
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (
      !mapContainerRef.current ||
      mapRef.current
    ) {
      return;
    }

    const map = L.map(
      mapContainerRef.current,
      {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: true,
      }
    );

    mapRef.current = map;

    /*
     * Açık Harita
     */
    const openStreetMap = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">Açık Sokak Haritası </a> Katkıda Bulunanlar | SyKaşif Harita Katmanı',
      }
    );

    /*
     * Uydu
     */
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution:
          'Tiles &copy; Esri',
      }
    );

    /*
     * Topografya
     */
    const topography = L.tileLayer(
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 17,
        attribution:
          '&copy; OpenTopoMap katkıcıları',
      }
    );

    baseLayersRef.current = {
      harita: openStreetMap,
      uydu: satellite,
      topografya: topography,
    };

    /*
     * Başlangıç katmanı
     */
    openStreetMap.addTo(map);

    /*
     * -----------------------------------------------------
     * HARİTA TIKLAMA
     * -----------------------------------------------------
     */

    map.on(
      'click',
      (event: L.LeafletMouseEvent) => {
        const { lat, lng } =
          event.latlng;

        setSelectedLocation({
          lat,
          lng,
          name: 'Seçilen konum',
        });

        void runLocationAnalysis(
  lat,
  lng
);

        addAlert(
          `Yeni konum seçildi: ${lat.toFixed(
            5
          )}, ${lng.toFixed(5)}`,
          'info'
        );
      }
    );

    setSystemStatus(
      'Harita aktif'
    );

    return () => {
      analysisRunRef.current += 1;
      map.remove();
      mapRef.current = null;
    };
  }, [
    addAlert,
    runLocationAnalysis,
    setSelectedLocation,
    setSystemStatus,
  ]);

  /*
   * -------------------------------------------------------
   * KATMAN YÖNETİMİ
   * -------------------------------------------------------
   */

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const layers = baseLayersRef.current;
    const selectedBaseLayer =
      activeLayers.find((id) => id in layers) || 'harita';

    for (const [id, layer] of Object.entries(layers)) {
      if (id === selectedBaseLayer) {
        if (!map.hasLayer(layer)) layer.addTo(map);
      } else if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    }
  }, [activeLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (liveEventsLayerRef.current) {
      liveEventsLayerRef.current.clearLayers();
      map.removeLayer(liveEventsLayerRef.current);
      liveEventsLayerRef.current = null;
    }

    if (!activeLayers.includes('canli_olaylar')) return;

    const colors = {
      low: '#38BDF8',
      medium: '#FBBF24',
      high: '#F97316',
      critical: '#EF4444',
    } as const;
    const group = L.layerGroup();

    for (const event of liveSnapshot.events) {
      if (!Number.isFinite(event.lat) || !Number.isFinite(event.lng)) continue;
      const popup = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = event.title;
      const description = document.createElement('div');
      description.textContent = event.summary;
      const timestamp = document.createElement('small');
      timestamp.textContent = new Date(event.observedAt).toLocaleString('tr-TR');
      popup.append(title, document.createElement('br'), description, timestamp);
      if (event.url) {
        const link = document.createElement('a');
        link.href = event.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Kaynağı aç';
        popup.append(document.createElement('br'), link);
      }

      L.circleMarker([event.lat, event.lng], {
        radius: event.severity === 'critical' ? 9 : event.severity === 'high' ? 7 : 5,
        color: '#FFFFFF',
        weight: 1,
        fillColor: colors[event.severity],
        fillOpacity: 0.82,
      })
        .bindPopup(popup)
        .addTo(group);
    }

    group.addTo(map);
    liveEventsLayerRef.current = group;
    return () => {
      group.clearLayers();
      if (map.hasLayer(group)) map.removeLayer(group);
      if (liveEventsLayerRef.current === group) {
        liveEventsLayerRef.current = null;
      }
    };
  }, [activeLayers, liveSnapshot.events]);

  /*
   * -------------------------------------------------------
   * SEÇİLEN KONUM MARKER'I
   * -------------------------------------------------------
   */

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (selectedMarkerRef.current) {
      map.removeLayer(
        selectedMarkerRef.current
      );
    }

    const marker =
      L.circleMarker(
        [
          selectedLocation.lat,
          selectedLocation.lng,
        ],
        {
          radius: 8,
          weight: 2,
          color: '#ffffff',
          fillColor: '#3b82f6',
          fillOpacity: 1,
        }
      );

    const popup = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = 'Seçilen Konum';
    popup.append(
      title,
      document.createElement('br'),
      `Enlem: ${selectedLocation.lat.toFixed(6)}`,
      document.createElement('br'),
      `Boylam: ${selectedLocation.lng.toFixed(6)}`,
      document.createElement('br'),
      selectedLocation.name
    );

    marker.bindPopup(popup).addTo(map);

    selectedMarkerRef.current =
      marker;

  }, [selectedLocation]);

  /*
   * -------------------------------------------------------
   * GPS
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (!gpsTrackingEnabled) return;

    if (
      !navigator.geolocation
    ) {
      addAlert(
        'Bu tarayıcı GPS konum bilgisini desteklemiyor.',
        'warning'
      );

      return;
    }

    const watchId =
      navigator.geolocation.watchPosition(
        (position) => {
          const {
            latitude,
            longitude,
            accuracy,
          } = position.coords;

          setGpsState({
            active: true,
            lat: latitude,
            lng: longitude,
            accuracy,
          });

          const map =
            mapRef.current;

          if (!map) {
            return;
          }

          /*
           * Eski GPS işaretini kaldır
           */
          if (
            gpsMarkerRef.current
          ) {
            map.removeLayer(
              gpsMarkerRef.current
            );
          }

          /*
           * Yeni GPS işareti
           */
          const marker =
            L.circleMarker(
              [
                latitude,
                longitude,
              ],
              {
                radius: 7,
                weight: 3,
                color: '#ffffff',
                fillColor: '#22c55e',
                fillOpacity: 1,
              }
            );

          marker
            .bindPopup(
              `
              <strong>GPS Konumu</strong><br/>
              Enlem: ${latitude.toFixed(
                6
              )}<br/>
              Boylam: ${longitude.toFixed(
                6
              )}<br/>
              Doğruluk: yaklaşık ${Math.round(
                accuracy
              )} m
              `
            )
            .addTo(map);

          gpsMarkerRef.current =
            marker;

          setSystemStatus(
            `GPS aktif • ±${Math.round(
              accuracy
            )} m`
          );
        },

        (error) => {
          setGpsState({
            active: false,
            lat: null,
            lng: null,
            accuracy: null,
          });

          switch (
            error.code
          ) {
            case 1:
              addAlert(
                'GPS konum izni verilmedi.',
                'warning'
              );
              break;

            case 2:
              addAlert(
                'GPS konumu alınamıyor.',
                'warning'
              );
              break;

            case 3:
              addAlert(
                'GPS konum isteği zaman aşımına uğradı.',
                'warning'
              );
              break;

            default:
              addAlert(
                'Bilinmeyen GPS hatası oluştu.',
                'danger'
              );
          }
        },

        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000,
        }
      );

    return () => {
      navigator.geolocation.clearWatch(
        watchId
      );
    };
  }, [
    addAlert,
    gpsTrackingEnabled,
    setSystemStatus,
  ]);

  const toggleGpsTracking = () => {
    if (gpsTrackingEnabled) {
      setGpsTrackingEnabled(false);
      setGpsState({
        active: false,
        lat: null,
        lng: null,
        accuracy: null,
      });

      const map = mapRef.current;
      if (map && gpsMarkerRef.current) {
        map.removeLayer(gpsMarkerRef.current);
        gpsMarkerRef.current = null;
      }
      setSystemStatus('GPS kapalı');
      return;
    }

    setGpsTrackingEnabled(true);
    setSystemStatus('GPS izni bekleniyor');
  };

  /*
   * -------------------------------------------------------
   * GPS'E GİT
   * -------------------------------------------------------
   */

  const goToGps = () => {
    if (
      !gpsState.active ||
      gpsState.lat === null ||
      gpsState.lng === null
    ) {
      addAlert(
        'Henüz geçerli GPS konumu alınmadı.',
        'warning'
      );

      return;
    }

    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    map.setView(
      [
        gpsState.lat,
        gpsState.lng,
      ],
      16,
      {
        animate: true,
      }
    );
  };

  /*
   * -------------------------------------------------------
   * ARAYÜZ
   * -------------------------------------------------------
   */

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        backgroundColor:
          '#020617',
      }}
    >
      <div
        ref={mapContainerRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
        }}
      />

      {/* ÜST BİLGİ PANELİ */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1000,
          padding: '12px 16px',
          borderRadius: 8,
          background:
            'rgba(2,6,23,0.92)',
          border:
            '1px solid rgba(59,130,246,0.35)',
          color: '#ffffff',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          SYKAŞİF
        </div>

        <div
          style={{
            marginTop: 4,
            color: '#60A5FA',
            fontSize: 12,
          }}
        >
          TÜRKİYE MONİTÖRÜ
        </div>
      </div>

      {/* GPS PANELİ */}
      <div
        style={{
          position: 'absolute',
          right: 20,
          top: 20,
          zIndex: 1000,
          minWidth: 220,
          padding: 14,
          borderRadius: 8,
          background:
            'rgba(2,6,23,0.92)',
          border:
            '1px solid rgba(148,163,184,0.25)',
          color: '#E2E8F0',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          KONUM DURUMU
        </div>

        <div
          style={{
            fontSize: 12,
            color: gpsState.active
              ? '#22C55E'
              : gpsTrackingEnabled
                ? '#F59E0B'
                : '#94A3B8',
          }}
        >
          ●{' '}
          {gpsState.active
            ? 'GPS AKTİF'
            : gpsTrackingEnabled
              ? 'GPS BEKLENİYOR'
              : 'GPS KAPALI'}
        </div>

        {gpsState.lat !== null &&
          gpsState.lng !== null && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                lineHeight: 1.6,
              }}
            >
              <div>
                Enlem:{' '}
                {gpsState.lat.toFixed(
                  6
                )}
              </div>

              <div>
                Boylam:{' '}
                {gpsState.lng.toFixed(
                  6
                )}
              </div>

              {gpsState.accuracy !==
                null && (
                <div>
                  Doğruluk: ±
                  {Math.round(
                    gpsState.accuracy
                  )}{' '}
                  m
                </div>
              )}
            </div>
          )}

        <button
          type="button"
          onClick={toggleGpsTracking}
          style={{
            width: '100%',
            marginTop: 10,
            padding: '8px 10px',
            borderRadius: 6,
            border: `1px solid ${gpsTrackingEnabled ? 'rgba(239,68,68,0.45)' : 'rgba(34,197,94,0.45)'}`,
            background: gpsTrackingEnabled
              ? 'rgba(239,68,68,0.12)'
              : 'rgba(34,197,94,0.12)',
            color: gpsTrackingEnabled ? '#FCA5A5' : '#86EFAC',
            cursor: 'pointer',
          }}
        >
          {gpsTrackingEnabled ? 'GPS TAKİBİNİ DURDUR' : 'GPS TAKİBİNİ BAŞLAT'}
        </button>

        <button
          type="button"
          onClick={goToGps}
          disabled={!gpsState.active}
          style={{
            width: '100%',
            marginTop: 10,
            padding:
              '8px 10px',
            borderRadius: 6,
            border:
              '1px solid rgba(59,130,246,0.4)',
            background:
              'rgba(59,130,246,0.15)',
            color: gpsState.active ? '#93C5FD' : '#64748B',
            cursor: gpsState.active ? 'pointer' : 'not-allowed',
          }}
        >
          GPS KONUMUNA GİT
        </button>
      </div>

      {/* SEÇİLEN KONUM */}
      <div
        style={{
          position: 'absolute',
          left: 20,
          bottom: 20,
          zIndex: 1000,
          padding:
            '10px 14px',
          borderRadius: 8,
          background:
            'rgba(2,6,23,0.92)',
          border:
            '1px solid rgba(148,163,184,0.25)',
          color: '#CBD5E1',
          fontSize: 11,
        }}
      >
        <div>
          SEÇİLEN KONUM
        </div>

        <div
          style={{
            marginTop: 5,
          }}
        >
          {selectedLocation.lat.toFixed(
            6
          )},{' '}
          {selectedLocation.lng.toFixed(
            6
          )}
        </div>

        <div
          style={{
            marginTop: 3,
            color: '#60A5FA',
          }}
        >
          {selectedLocation.name}
        </div>
      </div>
    </div>
  );
}