"use client";

import { useState } from "react";
import Link from "next/link"; // ⭐ Link 컴포넌트 추가

type SidebarItem = {
  title: string;
  articleUrl: string;
};

type Props = {
  // ⭐ 데이터가 없을 경우를 대비해 기본값([]) 설정을 권장합니다.
  popularNews?: SidebarItem[];
  snsHotNews?: SidebarItem[];
};

export default function RightSidebar({ popularNews = [], snsHotNews = [] }: Props) {
  const [activeTab, setActiveTab] = useState<"popular" | "sns">("popular");

  // ⭐ 데이터가 들어오기 전 안전장치
  const currentItems = activeTab === "popular" ? popularNews : snsHotNews;

  return (
    <aside className="w-full">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-colors">
        {/* 탭 버튼 영역 */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("popular")}
            className={`flex-1 px-4 py-4 text-sm font-black transition-all ${
              activeTab === "popular"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            많이 본 뉴스
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sns")}
            className={`flex-1 px-4 py-4 text-sm font-black transition-all ${
              activeTab === "sns"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            SNS 화제
          </button>
        </div>

        {/* 리스트 영역 */}
        <div className="p-5">
          <ol className="space-y-4">
            {currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <li key={`${item.articleUrl}-${index}`} className="flex gap-3 group">
                  {/* 순위 표시 */}
                  <span className={`w-5 flex-shrink-0 text-sm font-black transition-colors ${
                    index < 3 ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {index + 1}
                  </span>

                  {/* ⭐ Link 컴포넌트로 변경하여 로딩 최적화 */}
                  <Link
                    href={item.articleUrl}
                    className="line-clamp-2 text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors"
                  >
                    {item.title}
                  </Link>
                </li>
              ))
            ) : (
              <div className="py-10 text-center text-xs text-muted-foreground font-bold italic">
                데이터를 불러오고 있습니다...
              </div>
            )}
          </ol>
        </div>
      </div>
    </aside>
  );
}