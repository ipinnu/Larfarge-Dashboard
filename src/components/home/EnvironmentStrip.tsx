import { useEffect, useMemo, useState, useRef } from 'react';
import {
  CircleHelp, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun,
  Droplets, MapPin, Navigation, Sun, type LucideIcon,
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { fetchIncidentEnvironment, type ResolvedEnvironment } from '../../services/environment';
import { deriveFleetLocationHubs, type FleetLocationHub } from '../../lib/fleetLocations';

const ROTATE_MS = 5000;

type SlideEnv = {
  weather: string;
  temp: string;
  humidity?: number;
  humidityLabel?: 'Humid' | 'Very humid';
  visualState: WeatherVisualState;
  traffic: string;
  trafficColor: string;
};

type WeatherVisualState = 'sunny' | 'partly-cloudy' | 'cloudy' | 'foggy' | 'drizzle'
  | 'rainy' | 'stormy' | 'unavailable';

const WEATHER_ICONS: Record<WeatherVisualState, LucideIcon> = {
  sunny: Sun,
  'partly-cloudy': CloudSun,
  cloudy: Cloud,
  foggy: CloudFog,
  drizzle: CloudDrizzle,
  rainy: CloudRain,
  stormy: CloudLightning,
  unavailable: CircleHelp,
};

const TRAFFIC_COLORS: Record<string, string> = {
  light: '#16a34a',
  moderate: '#d97706',
  heavy: '#CC0000',
};

function normalizeWeatherState(condition = ''): WeatherVisualState {
  const normalized = condition.trim().toLowerCase();
  if (!normalized || /unknown|unavailable/.test(normalized)) return 'unavailable';
  if (/thunder|lightning|storm|hail/.test(normalized)) return 'stormy';
  if (/snow|sleet|ice/.test(normalized)) return 'unavailable';
  if (/drizzle/.test(normalized)) return 'drizzle';
  if (/rain|shower/.test(normalized)) return 'rainy';
  if (/fog|mist|haze/.test(normalized)) return 'foggy';
  if (/partly/.test(normalized)) return 'partly-cloudy';
  if (/overcast|cloud/.test(normalized)) return 'cloudy';
  if (/clear|sun/.test(normalized)) return 'sunny';
  return 'unavailable';
}

function formatSlideEnv(env: ResolvedEnvironment): SlideEnv {
  const temp = env.temperature_c != null ? `${Math.round(env.temperature_c)}°C` : '—';
  const weather = env.weather_condition?.trim() || env.weather?.split(' · ')[0]?.trim() || 'Unavailable';
  const humidity = env.humidity_pct != null ? Math.round(env.humidity_pct) : undefined;
  const traffic = env.traffic_description
    || `${env.traffic_density.charAt(0).toUpperCase()}${env.traffic_density.slice(1)} traffic`;
  return {
    weather,
    temp,
    humidity,
    humidityLabel: humidity != null && humidity >= 80
      ? 'Very humid'
      : humidity != null && humidity >= 60 ? 'Humid' : undefined,
    visualState: normalizeWeatherState(weather),
    traffic,
    trafficColor: TRAFFIC_COLORS[env.traffic_density] || 'var(--cd-text)',
  };
}

export function EnvironmentStrip() {
  const { vehicles } = useFleet();
  const hubs = useMemo(() => deriveFleetLocationHubs(vehicles, 6), [vehicles]);
  const hubsKey = hubs.map(h => h.key).join('|');

  const [envByKey, setEnvByKey] = useState<Record<string, ResolvedEnvironment>>({});
  const [readyKeys, setReadyKeys] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [bootstrapping, setBootstrapping] = useState(true);
  const loadGen = useRef(0);

  // Load every hub up front — no slide until its env payload is ready
  useEffect(() => {
    if (!hubs.length) {
      setEnvByKey({});
      setReadyKeys([]);
      setBootstrapping(false);
      setIndex(0);
      return;
    }

    const gen = ++loadGen.current;
    setBootstrapping(true);
    setReadyKeys([]);
    setIndex(0);

    let cancelled = false;
    void Promise.all(
      hubs.map(async (hub) => {
        try {
          const env = await fetchIncidentEnvironment({
            latitude: hub.latitude,
            longitude: hub.longitude,
            address: hub.address || hub.label,
          });
          return { key: hub.key, env };
        } catch {
          return {
            key: hub.key,
            env: {
              weather: 'Unavailable',
              traffic_density: 'moderate' as const,
              road_type: 'highway' as const,
            } satisfies ResolvedEnvironment,
          };
        }
      }),
    ).then(results => {
      if (cancelled || gen !== loadGen.current) return;
      const next: Record<string, ResolvedEnvironment> = {};
      const keys: string[] = [];
      results.forEach(r => {
        next[r.key] = r.env;
        keys.push(r.key);
      });
      setEnvByKey(next);
      setReadyKeys(keys);
      setBootstrapping(false);
    });

    return () => { cancelled = true; };
  }, [hubsKey]); // eslint-disable-line react-hooks/exhaustive-deps -- hubsKey fingerprints hub set

  const readyHubs = useMemo(
    () => hubs.filter(h => readyKeys.includes(h.key) && envByKey[h.key]),
    [hubs, readyKeys, envByKey],
  );

  const count = readyHubs.length;
  const safeIndex = count === 0 ? 0 : ((index % count) + count) % count;
  const current: FleetLocationHub | null = count > 0 ? readyHubs[safeIndex] : null;

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setIndex(i => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(id);
  }, [count, hubsKey]);

  if (bootstrapping) {
    return (
      <div className="bpl-home-footer">
        <div className="bpl-card bpl-env-slider">
          <div className="bpl-env-slider-empty">Loading locations…</div>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="bpl-home-footer">
        <div className="bpl-card bpl-env-slider">
          <div className="bpl-env-slider-empty">No live asset locations yet for weather &amp; traffic</div>
        </div>
      </div>
    );
  }

  const slide = formatSlideEnv(envByKey[current.key]);
  const WeatherIcon = WEATHER_ICONS[slide.visualState];

  return (
    <div className="bpl-home-footer">
      <div className="bpl-card bpl-env-slider">
        <div className="bpl-env-slider-head">
          <div className="bpl-env-slider-place">
            <MapPin size={14} color="#0078D4" />
            <div>
              <div className="bpl-env-slider-label">{current.label}</div>
              <div className="bpl-env-slider-region">{current.regionHint}</div>
            </div>
          </div>
          <div className="bpl-env-slider-meta">
            <Navigation size={12} />
            {current.assetCount} asset{current.assetCount === 1 ? '' : 's'}
            {current.movingCount > 0 ? ` · ${current.movingCount} moving` : ''}
          </div>
        </div>

        <div className="bpl-env-slider-body">
          <div className={`bpl-env-slider-panel bpl-weather-panel bpl-weather-panel--${slide.visualState}`}>
            <div className="bpl-weather-decoration" aria-hidden="true"><span /><span /><span /></div>
            <div className="bpl-env-slider-panel-title">
              <WeatherIcon size={14} /> Weather
            </div>
            <div className="bpl-weather-panel-content">
              <div className="bpl-weather-icon-tile" aria-hidden="true">
                <WeatherIcon size={30} strokeWidth={1.8} />
              </div>
              <div className="bpl-weather-copy">
                <div className="bpl-env-slider-panel-value">{slide.weather}</div>
                <div className="bpl-weather-details">
                  <span className="bpl-env-slider-panel-sub">{slide.temp}</span>
                  {slide.humidityLabel && slide.humidity != null && (
                    <span className="bpl-weather-humidity">
                      <Droplets size={12} aria-hidden="true" />
                      {slide.humidityLabel} · {slide.humidity}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bpl-env-slider-panel">
            <div className="bpl-env-slider-panel-title">
              <Navigation size={13} /> Traffic
            </div>
            <div className="bpl-env-slider-panel-value" style={{ color: slide.trafficColor }}>{slide.traffic}</div>
            <div className="bpl-env-slider-panel-sub">Local corridor</div>
          </div>
        </div>

        {count > 1 && (
          <div className="bpl-env-slider-dots" aria-hidden>
            {readyHubs.map((h, i) => (
              <span
                key={h.key}
                className={`bpl-env-slider-dot${i === safeIndex ? ' active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
