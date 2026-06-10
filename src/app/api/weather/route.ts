import { NextResponse } from "next/server";
import { fetchWeather } from "@/lib/weather/open-meteo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region") ?? undefined;
  const days = parseInt(searchParams.get("days") ?? "3", 10);
  const weather = await fetchWeather(region, days);
  if (!weather) {
    return NextResponse.json({ error: "天气获取失败" }, { status: 502 });
  }
  return NextResponse.json({ weather });
}
