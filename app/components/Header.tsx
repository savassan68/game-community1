"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
// ⭐ ThemeToggle 버튼 불러오기 (경로가 @/components/ThemeToggle 인지 확인!)
import ThemeToggle from "./ThemeToggle";

const Icons = {
  Menu: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  Close: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
};

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      {/* ⭐ 다크모드 배경색(dark:bg-slate-900/80)과 테두리색(dark:border-slate-800) 추가 */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center relative">
          
          <button onClick={() => router.push("/")} className="text-2xl font-extrabold font-sans text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 relative z-50 transition-colors">
            GameSeed
          </button>

          {/* 데스크톱 네비게이션 - 다크모드 텍스트색 추가 */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-sm font-bold">
            {["community", "review", "recommend", "news"].map((path) => (
              <button 
                key={path}
                onClick={() => router.push(`/${path}`)} 
                className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {path === "community" ? "커뮤니티" : path === "review" ? "평론" : path === "recommend" ? "AI 추천" : "뉴스"}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4 relative z-50">
            
            {/* 🌙 다크모드 토글 버튼 추가! */}
            <ThemeToggle />

            {/* 🔍 검색 바 (데스크톱) - 다크모드 스타일링 */}
            <div className="hidden sm:flex relative items-center mr-2">
              <div className="absolute left-3 text-slate-400">
                <Icons.Search />
              </div>
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && headerSearch.trim()) {
                    router.push(`/review?search=${encodeURIComponent(headerSearch.trim())}`);
                  }
                }}
                placeholder="게임 검색..."
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-400 transition-all duration-300 outline-none w-48 focus:w-64 shadow-sm"
              />
            </div>

            <div className="hidden md:flex items-center gap-4 border-l border-slate-200 dark:border-slate-700 pl-4">
              {user ? (
                <div className="flex items-center gap-3">
                   <button onClick={() => router.push("/mypage")} className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">마이페이지</button>
                   <button onClick={async () => { await supabase.auth.signOut(); router.refresh(); }} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium">로그아웃</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => router.push("/auth/login")} className="text-sm font-semibold text-slate-600 dark:text-slate-300 px-3 py-2 hover:text-indigo-600 transition-colors">로그인</button>
                  <button onClick={() => router.push("/auth/signup")} className="text-sm font-semibold text-white bg-indigo-600 px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors shadow-md">회원가입</button>
                </div>
              )}
            </div>

            {/* 📱 모바일 햄버거 버튼 */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
            >
              {isMobileMenuOpen ? <Icons.Close /> : <Icons.Menu />}
            </button>
          </div>
        </div>

        {/* 📱 모바일 메뉴창 - 다크모드 스타일링 */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl flex flex-col font-bold text-sm animate-in slide-in-from-top-2 z-40">
            {["community", "review", "recommend", "news"].map((path) => (
              <button 
                key={path}
                onClick={() => { router.push(`/${path}`); setIsMobileMenuOpen(false); }} 
                className="p-4 text-left text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-50 dark:border-slate-800 transition-colors"
              >
                {path === "community" ? "커뮤니티" : path === "review" ? "평론" : path === "recommend" ? "AI 추천" : "뉴스"}
              </button>
            ))}
            
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50">
              {user ? (
                <div className="flex flex-col gap-4">
                  <button onClick={() => { router.push("/mypage"); setIsMobileMenuOpen(false); }} className="text-left text-slate-600 dark:text-slate-300">마이페이지</button>
                  <button onClick={async () => { await supabase.auth.signOut(); router.refresh(); }} className="text-left text-slate-400">로그아웃</button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button onClick={() => { router.push("/auth/login"); setIsMobileMenuOpen(false); }} className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 text-center shadow-sm">로그인</button>
                  <button onClick={() => { router.push("/auth/signup"); setIsMobileMenuOpen(false); }} className="w-full py-2.5 bg-indigo-600 rounded-xl text-white text-center shadow-sm">회원가입</button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}