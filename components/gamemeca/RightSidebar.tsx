"use client";

import { useState } from "react";
import Link from "next/link";

type SidebarItem = {
  title: string;
  articleUrl: string;
};

type Props = {
  // 최신 뉴스로 활용할 데이터
  latestNews?: SidebarItem[];
  // 인기 뉴스로 활용할 데이터
  popularNews?: SidebarItem[];
};

export default function RightSidebar({ latestNews = [], popularNews = [] }: Props) {
  // 상태명을 latest(최신)와 popular(인기)로 정의했습니다.
  const [activeTab, setActiveTab] = useState<"latest" | "popular">("latest");

  const currentItems = activeTab === "latest" ? latestNews : popularNews;

  return (
    <aside className="w-full">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all">
        
        {/* 탭 버튼 영역 */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("latest")}
            className={`flex-1 px-4 py-4 text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === "latest"
                ? "bg-indigo-600 text-white shadow-inner"
                : "bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            최신 뉴스
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("popular")}
            className={`flex-1 px-4 py-4 text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === "popular"
                ? "bg-indigo-600 text-white shadow-inner"
                : "bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            인기 뉴스
          </button>
        </div>

        {/* 리스트 영역 */}
        <div className="p-6">
          <ol className="space-y-5">
            {currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <li key={`${item.articleUrl}-${index}`} className="group flex items-start gap-4">
                  
                  {/* 최신 탭일 때는 점(Dot) 형태, 인기 탭일 때는 숫자 배지로 구분하면 더 직관적입니다. */}
                  <span className={`flex-shrink-0 flex items-center justify-center transition-all ${
                    activeTab === "popular" 
                      ? `w-6 h-6 rounded-lg text-[11px] font-black ${index < 3 ? "bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`
                      : "w-6 h-6 text-indigo-500/50 group-hover:text-indigo-500"
                  }`}>
                    {activeTab === "popular" ? index + 1 : "•"}
                  </span>

                  <Link href={item.articleUrl} className="flex-1 min-w-0">
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </p>
                  </Link>
                </li>
              ))
            ) : (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xs text-slate-400 font-bold italic">기사를 불러오고 있습니다...</p>
              </div>
            )}
          </ol>
        </div>

        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
           <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-tighter">
             {activeTab === "latest" ? "Just Updated" : "Hottest Now"} @ GameSeed
           </p>
        </div>
      </div>
    </aside>
  );
}