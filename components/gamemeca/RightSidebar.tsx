"use client";

import { useState } from "react";

type SidebarItem = {
  title: string;
  articleUrl: string;
};

type Props = {
  popularNews: SidebarItem[];
  snsHotNews: SidebarItem[];
};

export default function RightSidebar({ popularNews, snsHotNews }: Props) {
  const [activeTab, setActiveTab] = useState<"popular" | "sns">("popular");

  const currentItems = activeTab === "popular" ? popularNews : snsHotNews;

  return (
    <aside className="w-full xl:w-[320px]">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab("popular")}
            className={`flex-1 px-4 py-4 text-lg font-bold transition ${
              activeTab === "popular"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            많이 본 뉴스
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sns")}
            className={`flex-1 px-4 py-4 text-lg font-bold transition ${
              activeTab === "sns"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            SNS 화제
          </button>
        </div>

        <div className="p-4">
          <ol className="space-y-3">
            {currentItems.map((item, index) => (
              <li key={`${item.articleUrl}-${index}`} className="flex gap-3">
                <span className="w-5 flex-shrink-0 text-base font-bold text-gray-800">
                  {index + 1}
                </span>

                <a
                  href={item.articleUrl}
                  className="line-clamp-2 text-[15px] leading-6 text-gray-800 hover:text-blue-600"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </aside>
  );
}