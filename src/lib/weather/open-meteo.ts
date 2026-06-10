export type WeatherSnapshot = {
  locationLabel: string;
  latitude: number;
  longitude: number;
  daily: {
    date: string;
    tempMax: number;
    tempMin: number;
    precipitationSum: number;
    windMax: number;
    weatherCode: number;
  }[];
  summary: string;
};

const REGION_COORDS: Record<string, { lat: number; lon: number; label: string }> =
  {
    川西: { lat: 31.0, lon: 102.5, label: "川西高原" },
    滇: { lat: 26.5, lon: 100.2, label: "云南高原" },
    藏: { lat: 29.6, lon: 91.1, label: "青藏高原" },
    新疆: { lat: 43.8, lon: 87.6, label: "天山北麓" },
    四姑娘: { lat: 31.0, lon: 102.9, label: "四姑娘山" },
    雨崩: { lat: 28.4, lon: 98.8, label: "雨崩" },
    武功山: { lat: 27.45, lon: 114.18, label: "武功山" },
    华山: { lat: 34.48, lon: 110.09, label: "华山" },
    黄山: { lat: 30.13, lon: 118.17, label: "黄山" },
    泰山: { lat: 36.25, lon: 117.1, label: "泰山" },
    北京: { lat: 40.0, lon: 116.4, label: "北京郊野" },
    浙江: { lat: 29.2, lon: 120.2, label: "浙江山区" },
    四川: { lat: 30.6, lon: 104.0, label: "四川盆地西缘" },
  };

const DEFAULT_COORD = { lat: 30.5, lon: 104.0, label: "成都平原西缘（默认）" };

function resolveCoords(region?: string): {
  lat: number;
  lon: number;
  label: string;
} {
  if (!region) return DEFAULT_COORD;
  for (const [key, coord] of Object.entries(REGION_COORDS)) {
    if (region.includes(key)) return coord;
  }
  return { ...DEFAULT_COORD, label: region };
}

function weatherCodeLabel(code: number): string {
  if (code === 0) return "晴";
  if (code <= 3) return "多云";
  if (code <= 48) return "雾";
  if (code <= 67) return "雨";
  if (code <= 77) return "雪";
  if (code <= 82) return "阵雨";
  return "多变";
}

export async function fetchWeather(
  region?: string,
  days = 3,
): Promise<WeatherSnapshot | null> {
  try {
    const { lat, lon, label } = resolveCoords(region);
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weathercode",
    );
    url.searchParams.set("timezone", "Asia/Shanghai");
    url.searchParams.set("forecast_days", String(Math.min(days, 7)));

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      daily?: {
        time?: string[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_sum?: number[];
        wind_speed_10m_max?: number[];
        weathercode?: number[];
      };
    };

    const d = json.daily;
    if (!d?.time?.length) return null;

    const daily = d.time.map((date, i) => ({
      date,
      tempMax: d.temperature_2m_max?.[i] ?? 0,
      tempMin: d.temperature_2m_min?.[i] ?? 0,
      precipitationSum: d.precipitation_sum?.[i] ?? 0,
      windMax: d.wind_speed_10m_max?.[i] ?? 0,
      weatherCode: d.weathercode?.[i] ?? 0,
    }));

    const first = daily[0];
    const summary = [
      `【天气参考 · ${label}】`,
      `${first.date}：${weatherCodeLabel(first.weatherCode)}，`,
      `${first.tempMin.toFixed(0)}~${first.tempMax.toFixed(0)}°C，`,
      `降水 ${first.precipitationSum.toFixed(1)}mm，阵风约 ${first.windMax.toFixed(0)} km/h。`,
      first.precipitationSum > 2
        ? "有降水可能，请强化防雨与防潮。"
        : "降水概率较低，仍建议携带硬壳。",
      first.tempMin < 0 ? "夜间可能低于 0°C，注意防寒与保暖层。" : "",
    ]
      .filter(Boolean)
      .join("");

    return {
      locationLabel: label,
      latitude: lat,
      longitude: lon,
      daily,
      summary,
    };
  } catch {
    return null;
  }
}
