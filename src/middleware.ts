import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const protectedPaths = ["/dashboard", "/trips", "/gear"];

  if (protectedPaths.some((p) => path.startsWith(p)) && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/trips/:path*", "/gear/:path*"],
};
