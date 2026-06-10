import type { Metadata } from "next";
import { Fraunces, Geist_Mono, Nunito_Sans } from "next/font/google";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trailpack — 登山装备智能清单",
  description: "用自然语言描述路线，AI 与规则引擎智能推荐装备清单",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${fraunces.variable} ${nunito.variable} ${geistMono.variable} h-full`}
    >
      <body className="app-bg min-h-full flex flex-col text-paper antialiased">
        <Providers>
          <Header />
          <main className="page-wrap flex-1">{children}</main>
          <footer className="border-t border-[var(--line-subtle)] py-6 text-center text-xs text-fog">
            Trailpack · 装备建议仅供参考，请结合官方预警与实地情况决策
          </footer>
        </Providers>
      </body>
    </html>
  );
}
