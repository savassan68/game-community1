"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { GAME_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const Icons = {
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  XCircle: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Filter: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
};

type Game = {
  id: number; title: string; image_url?: string; categories?: string[]; release_date?: string; metacritic_score?: number; opencritic_score?: number; recommend_count?: number; average_rating?: number;
};

type FilterType = "all" | "score90" | "score70" | "recommend" | "rating";

const getScoreBadgeStyle = (score: number) => {
  if (score >= 80) return "bg-emerald-500 text-white";
  if (score >= 50) return "bg-amber-500 text-white";
  return "bg-rose-500 text-white";
};

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");

  const initialSearch = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase.from("games").select("*").order("created_at", { ascending: false });
      if (selectedCategory !== "all") query = query.contains("categories", [selectedCategory]);
      if (searchQuery.trim()) query = query.ilike("title", `%${searchQuery}%`);
      const { data, error } = await query;
      if (!error) setGames(data || []);
      setLoading(false);
    };
    load();
  }, [selectedCategory, searchQuery]);

  const handleSearch = () => setSearchQuery(searchInput.trim());
  const getDisplayScore = (g: Game) => Math.max(g.opencritic_score || 0, g.metacritic_score || 0);
  const getAverageRating = (g: Game) => typeof g.average_rating === "number" ? g.average_rating : getDisplayScore(g);

  const filteredGames = useMemo(() => {
    let result = [...games];
    if (selectedFilter === "score90") result = result.filter((g) => getDisplayScore(g) >= 90);
    else if (selectedFilter === "score70") result = result.filter((g) => getDisplayScore(g) >= 70);
    else if (selectedFilter === "recommend") result.sort((a, b) => (b.recommend_count ?? 0) - (a.recommend_count ?? 0));
    else if (selectedFilter === "rating") result.sort((a, b) => getAverageRating(b) - getAverageRating(a));
    return result;
  }, [games, selectedFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-10">
        
        {/* 검색바 섹션 */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-1.5 mb-12 max-w-xl mx-auto flex items-center focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
          <div className="pl-4 text-slate-400"><Icons.Search /></div>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 px-3 py-2.5 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400"
            placeholder="게임 제목 검색..."
          />
          <button onClick={handleSearch} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black transition-all">검색</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* 좌측: 필터 (2칸) */}
          <aside className="lg:col-span-2 sticky top-28 hidden lg:block">
            <div className="bg-white p-4 border border-slate-200 rounded-[1.5rem] shadow-sm">
              <h3 className="text-[10px] font-black mb-4 text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                <Icons.Filter /> Filters
              </h3>
              <div className="space-y-1">
                {[
                  { id: "all", label: "전체 목록" },
                  { id: "score90", label: "90점 이상" },
                  { id: "score70", label: "70점 이상" },
                  { id: "recommend", label: "추천순" },
                  { id: "rating", label: "평점순" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFilter(f.id as FilterType)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-xl text-xs font-black transition-all",
                      selectedFilter === f.id 
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                        : "text-slate-500 hover:bg-slate-50"
                    )}
                  >{f.label}</button>
                ))}
              </div>
            </div>
          </aside>

          {/* 중앙: 본문 (8칸 - 시원한 그리드) */}
          <main className="lg:col-span-8">
            <div className="mb-6 flex items-baseline justify-between px-2">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {selectedCategory === "all" ? "전체 게임" : GAME_CATEGORIES.find((c) => c.slug === selectedCategory)?.name}
                <span className="ml-2 text-xs font-bold text-slate-400 italic">({filteredGames.length})</span>
              </h2>
            </div>

            {loading ? (
              <div className="py-40 text-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredGames.map((g) => {
                  const displayScore = getDisplayScore(g);
                  return (
                    <div key={g.id} onClick={() => router.push(`/review/${g.id}`)} className="group bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer">
                      <div className="h-40 bg-slate-200 overflow-hidden relative">
                        {g.image_url ? (
                          <img src={g.image_url} alt={g.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400 text-[10px] font-black">NO IMAGE</div>
                        )}
                        {displayScore > 0 && (
                          <div className={cn("absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-black shadow-lg backdrop-blur-md", getScoreBadgeStyle(displayScore))}>
                            {displayScore}
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-black text-slate-800 text-sm mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">{g.title}</h3>
                        <div className="flex items-center gap-2 mb-3 text-[9px] font-black uppercase">
                           <span className="text-indigo-600">★ {getAverageRating(g).toFixed(1)}</span>
                           <span className="text-slate-400">{g.release_date ? new Date(g.release_date).getFullYear() : "TBA"}</span>
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                           <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded-md uppercase truncate max-w-[80px]">
                             {GAME_CATEGORIES.find(s => s.slug === g.categories?.[0])?.name || g.categories?.[0]}
                           </span>
                           <div className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">더보기 →</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>

          {/* 우측: 장르 (2칸) */}
          <aside className="lg:col-span-2 sticky top-28 hidden lg:block max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-hide">
            <div className="bg-white p-4 border border-slate-200 rounded-[1.5rem] shadow-sm">
              <h3 className="text-[10px] font-black mb-4 text-slate-400 uppercase tracking-widest px-2">Genres</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    "w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all",
                    selectedCategory === "all" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                  )}
                >전체 보기</button>
                {GAME_CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={cn(
                      "w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all",
                      selectedCategory === cat.slug ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                    )}
                  >{cat.name}</button>
                ))}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}