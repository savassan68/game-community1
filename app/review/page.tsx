"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { GAME_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const Icons = {
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  XCircle: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

// ⭐ 1. Game 타입에 점수 데이터 추가
type Game = {
  id: number;
  title: string;
  image_url?: string;
  categories?: string[];
  created_at?: string;
  release_date?: string; 
  metacritic_score?: number;
  opencritic_score?: number;
};

// ⭐ 2. 점수에 따른 뱃지 색상 함수
const getScoreBadgeStyle = (score: number) => {
  if (score >= 80) return "bg-emerald-500 text-white shadow-emerald-500/30 border border-emerald-400";
  if (score >= 50) return "bg-amber-500 text-white shadow-amber-500/30 border border-amber-400";
  return "bg-rose-500 text-white shadow-rose-500/30 border border-rose-400";
};

export default function ReviewPage() {
  const router = useRouter();

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [user, setUser] = useState<any>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase.from("games").select("*").order("created_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.contains("categories", [selectedCategory]);
      }
      if (searchQuery.trim()) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error(error);
        setGames([]);
      } else {
        setGames(data || []);
      }
      setLoading(false);
    };
    load();
  }, [selectedCategory, searchQuery]);

  const handleSearch = () => setSearchQuery(searchInput.trim());
  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") handleSearch(); };
  const clearSearch = () => { setSearchInput(""); setSearchQuery(""); };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center relative">
          <button onClick={() => router.push("/")} className="text-2xl font-extrabold font-sans text-indigo-600 hover:text-indigo-700">GameSeed</button>
          
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-sm font-bold">
            <button onClick={() => router.push("/community")} className="text-slate-500 hover:text-indigo-600 transition-colors">커뮤니티</button>
            <button onClick={() => router.push("/review")} className="text-indigo-600">평론</button>
            <button onClick={() => router.push("/recommend")} className="text-slate-500 hover:text-indigo-600 transition-colors">AI 추천</button>
            <button onClick={() => router.push("/news")} className="text-slate-500 hover:text-indigo-600 transition-colors">뉴스</button>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <button onClick={() => router.push("/mypage")} className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors">마이페이지</button>
                <button onClick={async () => { await supabase.auth.signOut(); router.refresh(); }} className="text-xs text-slate-500 hover:text-slate-800 font-medium">로그아웃</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => router.push("/auth/login")} className="text-sm font-semibold text-slate-600 px-3 py-2">로그인</button>
                <button onClick={() => router.push("/auth/signup")} className="text-sm font-semibold text-white bg-indigo-600 px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors">회원가입</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-2 mb-10 max-w-2xl mx-auto flex items-center transition-all focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-400">
          <div className="pl-4 text-slate-400"><Icons.Search /></div>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={onSearchKey}
            className="flex-1 px-4 py-3 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            placeholder="찾고 싶은 게임 제목을 검색해 보세요!"
          />
          {searchInput.length > 0 && (
            <button onClick={clearSearch} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Icons.XCircle /></button>
          )}
          <button onClick={handleSearch} className="px-6 py-3 ml-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all active:scale-95">검색</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-white p-5 border border-slate-200 rounded-3xl shadow-sm sticky top-24">
              <h3 className="text-sm font-extrabold mb-4 text-slate-800 px-2">장르별 모아보기</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-2xl text-sm font-bold transition-all",
                    selectedCategory === "all" ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                  )}
                >전체 보기</button>
                {GAME_CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-2xl text-sm font-bold transition-all",
                      selectedCategory === cat.slug ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                    )}
                  >{cat.name}</button>
                ))}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9">
            <div className="mb-6 flex items-end justify-between px-2">
              <h2 className="text-xl font-black text-slate-800">
                {selectedCategory === "all" ? "전체 게임" : GAME_CATEGORIES.find(c => c.slug === selectedCategory)?.name}
              </h2>
              <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">총 {games.length}개</span>
            </div>

            {loading ? (
              <div className="text-center text-slate-400 font-bold py-20 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse">게시글을 불러오는 중입니다...</div>
            ) : games.length === 0 ? (
              <div className="text-center py-24 bg-white border border-slate-200 shadow-sm rounded-3xl">
                <div className="text-4xl mb-4 opacity-50">🎮</div>
                <p className="text-slate-500 font-bold text-sm">조건에 맞는 게임이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((g) => {
                  // ⭐ 3. 표시할 대표 점수 계산 (오픈크리틱 우선, 없으면 메타크리틱)
                  const displayScore = (g.opencritic_score && g.opencritic_score > 0)
                    ? g.opencritic_score
                    : ((g.metacritic_score && g.metacritic_score > 0) ? g.metacritic_score : null);

                  return (
                    <div
                      key={g.id}
                      onClick={() => router.push(`/review/${g.id}`)}
                      className="group bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 cursor-pointer transition-all duration-300 flex flex-col h-full"
                    >
                      {/* 게임 썸네일 영역 */}
                      <div className="h-48 bg-slate-100 overflow-hidden relative">
                        {g.image_url ? (
                          <img src={g.image_url} alt={g.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-300 font-bold text-sm">No Image</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        {/* ⭐ 4. 우측 상단 점수 뱃지! */}
                        {displayScore && (
                          <div className={`absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black shadow-lg backdrop-blur-sm bg-opacity-90 z-10 ${getScoreBadgeStyle(displayScore)}`}>
                            {displayScore}
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-extrabold text-slate-800 text-lg mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">{g.title}</h3>
                        <div className="text-[11px] font-medium text-slate-400 mb-4">
                           {g.release_date ? `출시: ${new Date(g.release_date).toLocaleDateString()}` : "출시일 미정"}
                        </div>

                        <div className="mt-auto flex flex-wrap gap-1.5 items-center">
                          {g.categories?.slice(0, 3).map((slug) => {
                            const c = GAME_CATEGORIES.find((s) => s.slug === slug);
                            return <span key={slug} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-extrabold rounded-full border border-indigo-100">{c?.name ?? slug}</span>;
                          })}
                          {g.categories && g.categories.length > 3 && (
                            <span className="text-[10px] font-bold text-slate-400">+{g.categories.length - 3}</span>
                          )}
                          <div className="ml-auto w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}