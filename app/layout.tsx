import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header"; 
import { ThemeProvider } from "./components/ThemeProvider";

// ⭐ 1. 방금 만든 RecentTabs 컴포넌트 불러오기
import RecentTabs from "./components/RecentTabs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GameSeed",
  description: "게임 커뮤니티 및 평론 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          {/* 상단 네비게이션 헤더 */}
          <Header />
          
          {/* ⭐ 2. 헤더 바로 아래에 최근 방문 탭 배치 (PC에서만 보임) */}
          <RecentTabs />

          {/* 메인 페이지 콘텐츠 */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}