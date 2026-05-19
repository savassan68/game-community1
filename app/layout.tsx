import type { Metadata, Viewport } from "next"; // ⭐ Viewport 타입 추가됨
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header"; 
import { ThemeProvider } from "./components/ThemeProvider";
import RecentTabs from "./components/RecentTabs";
import { ToastProvider } from "./components/ToastProvider";
import FloatingChat from "./components/FloatingChat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ⭐ 주소창 다크모드 연동을 위한 설정 추가
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' }, // 라이트 모드 주소창 (흰색)
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },  // 다크 모드 주소창 (어두운 회색)
  ],
  width: 'device-width',
  initialScale: 1,
};

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
          <ToastProvider>
            {/* 상단 네비게이션 헤더 */}
            <Header />
            
            {/* 헤더 바로 아래에 최근 방문 탭 배치 (PC에서만 보임) */}
            <RecentTabs />

            {/* 메인 페이지 콘텐츠 */}
            {children}

            {/* <FloatingChat /> */}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}