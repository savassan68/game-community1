"use client";

import { useEffect, useState, useCallback } from "react";
import CategoryTabs from "@/components/gamemeca/CategoryTabs";
import MainHero from "@/components/gamemeca/MainHero";
import NewsListItem from "@/components/gamemeca/NewsListItem";
import RightSidebar from "@/components/gamemeca/RightSidebar";
import { GameMecaListItem, NewsCategory } from "@/lib/gamemeca";
import supabase from "@/lib/supabaseClient";

const Icons = {
  TrendingUp: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  AlertCircle: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Loader: () => <svg className="w-6 h-6 animate-spin text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
};

const categoryLabelMap: Record<NewsCategory, string> = {
  main: "메인",
  industry: "산업",
  esports: "eSports",
  pc: "PC",
  mobile: "모바일",
  console: "콘솔",
};

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>("main");
  const [mainItems, setMainItems] = useState<GameMecaListItem[]>([]);
  const [categoryItems, setCategoryItems] = useState<GameMecaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [heroLoading, setHeroLoading] = useState(false);
  const [error, setError] = useState("");

  // 기사 정보 보완 함수 (요약이나 날짜가 없을 경우 상세페이지에서 긁어옴)
  const enrichItem = useCallback(async (item: GameMecaListItem): Promise<GameMecaListItem> => {
    if (item.summary && item.createdAt && item.imageUrl) return item;

    try {
      const res = await fetch(`/api/gamemeca/article?url=${encodeURIComponent(item.articleUrl)}`);
      if (res.ok) {
        const detail = await res.json();
        return {
          ...item,
          summary: item.summary || detail.summary || "",
          createdAt: item.createdAt || detail.createdAt || "",
          imageUrl: item.imageUrl || detail.imageUrl || "",
        };
      }
    } catch (e) {
      console.error("Enrich error:", e);
    }
    return item;
  }, []);

  // 1. 메인 배너용 기사 로드 (페이지 최초 접속 시 1회)
  useEffect(() => {
    const loadHeroData = async () => {
      setHeroLoading(true);
      try {
        const res = await fetch("/api/gamemeca/list?category=main", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          // 상위 3개만 먼저 데이터 보완 처리
          const enriched = await Promise.all(data.slice(0, 3).map(item => enrichItem(item)));
          setMainItems(enriched);
        }
      } catch (err) {
        console.error("Hero load error:", err);
      } finally {
        setHeroLoading(false);
      }
    };
    loadHeroData();
  }, [enrichItem]);

  // 2. 카테고리별 뉴스 로드 (탭 바꿀 때마다 실행)
  useEffect(() => {
    const loadCategoryData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/gamemeca/list?category=${activeCategory}`, { cache: "no-store" });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setCategoryItems(data);
        } else {
          setError("기사를 불러오지 못했습니다.");
        }
      } catch (err) {
        setError("서버 통신 에러가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadCategoryData();
  }, [activeCategory]);

  // 사이드바용 데이터 가공
  const popularNews = mainItems.slice(0, 5).map(item => ({
    title: item.title,
    articleUrl: `/news/detail?url=${encodeURIComponent(item.articleUrl)}`,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 pb-20">
      
      {/* 🌟 상단 배너 영역 (크기 축소 버전) */}
      <div className="w-full bg-slate-900 text-white pt-6 pb-6 px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-3">
            <Icons.TrendingUp /> 실시간 게임 트렌드
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight drop-shadow-md">
            GameSeed <span className="text-primary">NEWS</span>
          </h1>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          {/* ⭐ MainHero에 상위 3개 기사 배열 전달 */}
          <MainHero items={mainItems} />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        
        {/* 🗂️ 카테고리 탭 */}
        <div className="mb-10 p-1.5 bg-card rounded-2xl shadow-sm border border-border overflow-x-auto flex justify-center">
          <CategoryTabs activeCategory={activeCategory} onChange={setActiveCategory} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 📰 뉴스 리스트 */}
          <section className="lg:col-span-8 flex flex-col gap-6">
            <div className="border-b border-border pb-4">
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                {categoryLabelMap[activeCategory]} 뉴스
              </h2>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground font-bold bg-card rounded-3xl border border-border">
                <Icons.Loader />
                <p className="mt-4 text-sm">기사를 불러오는 중입니다...</p>
              </div>
            ) : error ? (
              <div className="py-10 text-center text-rose-500 font-bold bg-rose-500/10 rounded-2xl border border-rose-500/20">
                {error}
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {categoryItems.map((item) => (
                  <NewsListItem key={item.articleUrl} item={item} />
                ))}
              </div>
            )}
          </section>

          {/* 📌 사이드바 */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <RightSidebar popularNews={popularNews} snsHotNews={popularNews} />
          </aside>

        </div>
      </main>
    </div>
  );
}