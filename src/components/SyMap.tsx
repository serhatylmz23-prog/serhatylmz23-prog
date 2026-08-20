import {
  useEffect,
  useRef,
  useState,
} from 'react';

import L, {
  type Map as LeafletMap,
  type TileLayer,
  type CircleMarker,
} from 'leaflet';

import {
  analyzeLocation,
} from '../services/analysisRunner';

import 'leaflet/dist/leaflet.css';

import { useSyContext } from './context/SyContext';

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

export function SyMap() {
  const {
  activeLayers,
  selectedLocation,
  setSelectedLocation,
  addAlert,
  setSystemStatus,

  setAgentStatus,
  applyAgentResults,
  setAnalysisRunning,
  setAnalysisResult,
  } = useSyContext();
  
  const runLocationAnalysis = async (
  latitude: number,
  longitude: number
) => {
  try {
    setAnalysisRunning(true);

    setSystemStatus(
      'Bölgesel analiz başlatılıyor'
    );

    addAlert(
      'Seçilen konum için ajan analizi başlatıldı.',
      'info'
    );

    const result =
      await analyzeLocation(
        latitude,
        longitude,
        10
      );

    applyAgentResults(
      result.orchestration.results
    );

    setAnalysisResult(
      result.analysis.totalSources,
      result.analysis.totalFindings,
      result.analysis.summary
    );

    setSystemStatus(
      'Analiz tamamlandı'
    );

    addAlert(
      `${result.orchestration.selectedAgents.length} ajan değerlendirildi.`,
      'success'
    );
  } catch (error) {
    setAnalysisRunning(false);

    setSystemStatus(
      'Analiz hatası'
    );

    addAlert(
      error instanceof Error
        ? error.message
        : 'Analiz sırasında bilinmeyen hata oluştu.',
      'danger'
    );
  }
};

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

    const [gpsState, setGpsState] =
    useState<GpsState>({
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
        attribution:
          '&copy; OpenStreetMap katkıcıları',
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
      map.remove();
      mapRef.current = null;
    };
  }, [
    addAlert,
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

    const layers =
      baseLayersRef.current;

    /*
     * Uydu
     */
    if (
      activeLayers.includes('uydu')
    ) {
      if (!map.hasLayer(layers.uydu)) {
        layers.uydu.addTo(map);
      }

      /*
       * Uydu aktifse normal harita
       * alttan kaldırılır.
       */
      if (map.hasLayer(layers.harita)) {
        map.removeLayer(layers.harita);
      }
    } else {
      if (
        !map.hasLayer(layers.harita)
      ) {
        layers.harita.addTo(map);
      }

      if (
        map.hasLayer(layers.uydu)
      ) {
        map.removeLayer(layers.uydu);
      }
    }

    /*
     * Topografya
     *
     * Topografya ayrı bir üst katman
     * olarak kullanılabilir.
     */
    if (
      activeLayers.includes(
        'topografya'
      )
    ) {
      if (
        !map.hasLayer(
          layers.topografya
        )
      ) {
        layers.topografya.addTo(map);
      }
    } else {
      if (
        map.hasLayer(
          layers.topografya
        )
      ) {
        map.removeLayer(
          layers.topografya
        );
      }
    }
  }, [activeLayers]);

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

    marker
      .bindPopup(
        `
        <strong>Seçilen Konum</strong><br/>
        Enlem: ${selectedLocation.lat.toFixed(
          6
        )}<br/>
        Boylam: ${selectedLocation.lng.toFixed(
          6
        )}<br/>
        ${selectedLocation.name}
        `
      )
      .addTo(map);

    selectedMarkerRef.current =
      marker;

  }, [selectedLocation]);

  /*
   * -------------------------------------------------------
   * GPS
   * -------------------------------------------------------
   */

  useEffect(() => {
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
    setSystemStatus,
  ]);

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
              : '#F59E0B',
          }}
        >
          ●{' '}
          {gpsState.active
            ? 'GPS AKTİF'
            : 'GPS BEKLENİYOR'}
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
          onClick={goToGps}
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
            color: '#93C5FD',
            cursor: 'pointer',
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