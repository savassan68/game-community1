"use client";

import { useEffect, useState } from "react";
import CategoryTabs from "@/components/gamemeca/CategoryTabs";
import MainHero from "@/components/gamemeca/MainHero";
import NewsListItem from "@/components/gamemeca/NewsListItem";
import RightSidebar from "@/components/gamemeca/RightSidebar";
import { GameMecaListItem, NewsCategory } from "@/lib/gamemeca";
import supabase from "@/lib/supabaseClient";

const Icons = {
  TrendingUp: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  AlertCircle: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Loader: () => <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
};

const categoryLabelMap: Record<NewsCategory, string> = {
  main: "메인",
  industry: "산업",
  esports: "eSports",
  pc: "PC",
  mobile: "모바일",
  console: "콘솔",
};

type ArticleDetailResponse = {
  title?: string;
  summary?: string;
  imageUrl?: string;
  articleUrl?: string;
  createdAt?: string;
  bodyHtml?: string;
};

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>("main");
  const [hero, setHero] = useState<GameMecaListItem | null>(null);
  const [items, setItems] = useState<GameMecaListItem[]>([]);
  const [mainItems, setMainItems] = useState<GameMecaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [heroLoading, setHeroLoading] = useState(false);
  const [error, setError] = useState("");
  const [heroError, setHeroError] = useState("");
  const [fallbackImages, setFallbackImages] = useState<string[]>([]);

  useEffect(() => {
    const loadFallbackImages = async () => {
      const { data, error } = await supabase
        .from("news")
        .select("image_url")
        .not("image_url", "is", null);

      if (error) {
        console.error("fallback image load error:", error);
        return;
      }

      const urls = (data || [])
        .map((row: any) => row.image_url)
        .filter((url: string) => typeof url === "string" && url.trim() !== "");

      setFallbackImages(urls);
    };

    loadFallbackImages();
  }, []);

  const getFallbackImageByIndex = (index: number) => {
    if (!fallbackImages.length) return "";
    return fallbackImages[index % fallbackImages.length];
  };

  const enrichItem = async (
    item: GameMecaListItem,
    fallbackIndex: number
  ): Promise<GameMecaListItem> => {
    let nextItem = { ...item };

    const needsSummary = !nextItem.summary || !nextItem.summary.trim();
    const needsDate = !nextItem.createdAt || !nextItem.createdAt.trim();
    const needsImage = !nextItem.imageUrl || !nextItem.imageUrl.trim();

    if (needsSummary || needsDate || needsImage) {
      try {
        const articleRes = await fetch(
          `/api/gamemeca/article?url=${encodeURIComponent(nextItem.articleUrl)}`,
          { cache: "no-store" }
        );

        const articleData: ArticleDetailResponse = await articleRes.json();

        if (articleRes.ok) {
          nextItem = {
            ...nextItem,
            summary:
              nextItem.summary && nextItem.summary.trim()
                ? nextItem.summary
                : articleData.summary || "",
            createdAt:
              nextItem.createdAt && nextItem.createdAt.trim()
                ? nextItem.createdAt
                : articleData.createdAt || "",
            imageUrl:
              nextItem.imageUrl && nextItem.imageUrl.trim()
                ? nextItem.imageUrl
                : articleData.imageUrl || "",
          };
        }
      } catch (e) {
        console.error("article enrich error:", e);
      }
    }

    if (!nextItem.imageUrl || !nextItem.imageUrl.trim()) {
      nextItem = {
        ...nextItem,
        imageUrl: getFallbackImageByIndex(fallbackIndex),
      };
    }

    return nextItem;
  };

  useEffect(() => {
    const loadHero = async () => {
      try {
        setHeroLoading(true);
        setHeroError("");

        const res = await fetch("/api/gamemeca/list?category=main", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.detail || data?.error || "메인 기사 로드 실패");
        }

        if (!Array.isArray(data) || data.length === 0) {
          setHero(null);
          setMainItems([]);
          return;
        }

        setMainItems(data);

        const heroCandidate =
          data.find((item: GameMecaListItem) => item.imageUrl && item.imageUrl.trim()) ||
          data[0];

        const enrichedHero = await enrichItem(heroCandidate, 0);
        setHero(enrichedHero);
      } catch (err) {
        console.error("hero load error:", err);
        setHeroError(err instanceof Error ? err.message : "메인 기사 로드 실패");
      } finally {
        setHeroLoading(false);
      }
    };

    if (fallbackImages.length > 0) {
      loadHero();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallbackImages]);

  useEffect(() => {
    const loadCategoryNews = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/gamemeca/list?category=${activeCategory}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.detail || data?.error || "카테고리 기사 로드 실패");
        }

        if (!Array.isArray(data)) {
          setItems([]);
          return;
        }

        const filteredData =
          activeCategory === "main" && hero
            ? data.filter((item: GameMecaListItem) => item.articleUrl !== hero.articleUrl)
            : data;

        const mappedItems = await Promise.all(
          filteredData.map((item: GameMecaListItem, index: number) =>
            enrichItem(item, index + 1)
          )
        );

        setItems(mappedItems);
      } catch (err) {
        console.error("category load error:", err);
        setError(err instanceof Error ? err.message : "카테고리 기사 로드 실패");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (fallbackImages.length > 0) {
      loadCategoryNews();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, fallbackImages, hero]);

  const popularNews = mainItems.slice(0, 10).map((item) => ({
    title: item.title,
    articleUrl: `/news/${item.id}?url=${encodeURIComponent(item.articleUrl)}`,
  }));

  const snsHotNews = mainItems.slice(2, 12).map((item) => ({
    title: item.title,
    articleUrl: `/news/${item.id}?url=${encodeURIComponent(item.articleUrl)}`,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 pb-20">
      
      {/* 🌟 통합 히어로 배너 영역 */}
      <div className="w-full bg-slate-900 text-white pt-10 pb-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
        
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-bold border border-indigo-500/30 mb-4">
            <Icons.TrendingUp /> 실시간 게임 트렌드
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight drop-shadow-md">
            GameSeed <span className="text-indigo-400">NEWS</span>
          </h1>
        </div>

        {/* 히어로 컴포넌트 렌더링 영역 */}
        <div className="max-w-5xl mx-auto relative z-10">
          {heroLoading ? (
            <div className="flex h-[320px] sm:h-[400px] w-full items-center justify-center rounded-3xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-400 font-bold shadow-lg animate-pulse">
              <div className="flex flex-col items-center gap-3">
                <Icons.Loader /> 메인 기사를 불러오는 중...
              </div>
            </div>
          ) : heroError ? (
            <div className="flex h-[320px] items-center justify-center rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-400 font-bold backdrop-blur-sm shadow-lg">
              <div className="flex items-center gap-2"><Icons.AlertCircle /> {heroError}</div>
            </div>
          ) : (
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50">
              {hero && <MainHero item={hero} />}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        
        {/* 🗂️ 카테고리 탭 (기존 컴포넌트 감싸기) */}
        <div className="mb-10 p-2 bg-card rounded-2xl shadow-sm border border-border overflow-x-auto">
          <CategoryTabs
            activeCategory={activeCategory}
            onChange={setActiveCategory}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 📰 좌측 메인 뉴스 리스트 영역 */}
          <section className="lg:col-span-8 flex flex-col gap-6 min-w-0">
            <div className="border-b border-border pb-4 mb-2">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full"></span>
                {categoryLabelMap[activeCategory]} 뉴스
              </h2>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground font-bold bg-card rounded-3xl border border-border shadow-sm">
                <Icons.Loader />
                <p className="mt-4">기사를 불러오는 중입니다...</p>
              </div>
            ) : error ? (
              <div className="py-10 text-center text-rose-500 font-bold bg-rose-500/10 rounded-2xl border border-rose-500/20 flex justify-center items-center gap-2">
                <Icons.AlertCircle /> {error}
              </div>
            ) : items.length === 0 ? (
              <div className="py-24 text-center bg-card rounded-3xl border border-dashed border-border text-muted-foreground font-bold">
                <div className="text-4xl mb-3 opacity-50">📭</div>
                불러올 기사가 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.articleUrl} className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all overflow-hidden">
                    <NewsListItem item={item} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 📌 우측 사이드바 영역 */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
              <RightSidebar
                popularNews={popularNews}
                snsHotNews={snsHotNews}
              />
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}