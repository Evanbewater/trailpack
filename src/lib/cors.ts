import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function corsOptions() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function corsJson<T>(data: T, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    headers.set(k, v);
  }
  return NextResponse.json(data, { ...init, headers });
}
