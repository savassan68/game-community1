"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { GAME_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";


const Icons = {
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  XCircle: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

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

const getScoreBadgeStyle = (score: number) => {
  if (score >= 80) return "bg-emerald-500 text-white shadow-emerald-500/30 border border-emerald-400";
  if (score >= 50) return "bg-amber-500 text-white shadow-amber-500/30 border border-amber-400";
  return "bg-rose-500 text-white shadow-rose-500/30 border border-rose-400";
};

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [user, setUser] = useState<any>(null);

  const initialSearch = searchParams.get("search") || ""; 
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

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
    // ⭐ [수정] bg-slate-50 -> bg-background
    <div className="min-h-screen bg-background text-foreground pb-20 transition-colors duration-300">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        
        {/* 🔍 검색창 - bg-card, border-border */}
        <div className="bg-card border border-border shadow-sm rounded-2xl p-2 mb-10 max-w-2xl mx-auto flex items-center transition-all focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/40">
          <div className="pl-4 text-muted-foreground"><Icons.Search /></div>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={onSearchKey}
            className="flex-1 px-4 py-3 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground text-foreground"
            placeholder="찾고 싶은 게임 제목을 검색해 보세요!"
          />
          {searchInput.length > 0 && (
            <button onClick={clearSearch} className="p-2 text-muted-foreground hover:text-destructive transition-colors"><Icons.XCircle /></button>
          )}
          <button onClick={handleSearch} className="px-6 py-3 ml-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:opacity-90 transition-all active:scale-95">검색</button>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10">

          {/* 📂 장르 선택 사이드바 */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-card p-4 lg:p-5 border border-border rounded-2xl lg:rounded-3xl shadow-sm sticky top-20 z-10 transition-colors">
              <h3 className="text-sm font-extrabold mb-3 lg:mb-4 text-foreground px-1 lg:px-2">장르별 모아보기</h3>
              
              <div className="flex overflow-x-auto lg:flex-col gap-2 lg:gap-1 pb-2 lg:pb-0 scrollbar-hide -mx-2 px-2 lg:mx-0 lg:px-0">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    "flex-shrink-0 lg:w-full lg:text-left px-4 py-2.5 lg:py-2.5 rounded-full lg:rounded-2xl text-sm font-bold transition-all",
                    selectedCategory === "all" 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground bg-muted/50 lg:bg-transparent border border-border lg:border-transparent"
                  )}
                >
                  전체 보기
                </button>

                {GAME_CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={cn(
                      "flex-shrink-0 lg:w-full lg:text-left px-4 py-2.5 lg:py-2.5 rounded-full lg:rounded-2xl text-sm font-bold transition-all",
                      selectedCategory === cat.slug 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground bg-muted/50 lg:bg-transparent border border-border lg:border-transparent"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* 🎮 게임 목록 메인 */}
          <main className="lg:col-span-9">
            <div className="mb-6 flex items-end justify-between px-2">
              <h2 className="text-xl font-black text-foreground">
                {selectedCategory === "all" ? "전체 게임" : GAME_CATEGORIES.find(c => c.slug === selectedCategory)?.name}
              </h2>
              <span className="text-xs font-bold text-muted-foreground bg-card px-3 py-1 rounded-full border border-border transition-colors">총 {games.length}개</span>
            </div>

            {loading ? (
              <div className="text-center text-muted-foreground font-bold py-20 bg-card rounded-3xl border border-border shadow-sm animate-pulse transition-colors">게시글을 불러오는 중입니다...</div>
            ) : games.length === 0 ? (
              <div className="text-center py-24 bg-card border border-border shadow-sm rounded-3xl transition-colors">
                <div className="text-4xl mb-4 opacity-50">🎮</div>
                <p className="text-muted-foreground font-bold text-sm">조건에 맞는 게임이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((g) => {
                  const displayScore = (g.opencritic_score && g.opencritic_score > 0)
                    ? g.opencritic_score
                    : ((g.metacritic_score && g.metacritic_score > 0) ? g.metacritic_score : null);

                  return (
                    <div
                      key={g.id}
                      onClick={() => router.push(`/review/${g.id}`)}
                      className="group bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 cursor-pointer transition-all duration-300 flex flex-col h-full"
                    >
                      {/* 게임 썸네일 영역 */}
                      <div className="h-48 bg-muted overflow-hidden relative transition-colors">
                        {g.image_url ? (
                          <img src={g.image_url} alt={g.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground font-bold text-sm">No Image</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        {/* 점수 뱃지 (기존 컬러 유지하되 테두리만 살짝 조정) */}
                        {displayScore && (
                          <div className={`absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black shadow-lg backdrop-blur-sm bg-opacity-90 z-10 ${getScoreBadgeStyle(displayScore)}`}>
                            {displayScore}
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-extrabold text-foreground text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">{g.title}</h3>
                        <div className="text-[11px] font-medium text-muted-foreground mb-4">
                           {g.release_date ? `출시: ${new Date(g.release_date).toLocaleDateString()}` : "출시일 미정"}
                        </div>

                        <div className="mt-auto flex flex-wrap gap-1.5 items-center">
                          {g.categories?.slice(0, 3).map((slug) => {
                            const c = GAME_CATEGORIES.find((s) => s.slug === slug);
                            return <span key={slug} className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-extrabold rounded-full border border-primary/20 transition-colors">{c?.name ?? slug}</span>;
                          })}
                          {g.categories && g.categories.length > 3 && (
                            <span className="text-[10px] font-bold text-muted-foreground">+{g.categories.length - 3}</span>
                          )}
                          <div className="ml-auto w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
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