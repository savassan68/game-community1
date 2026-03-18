"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GameMecaListItem } from "@/lib/gamemeca";

type Props = {
  items?: GameMecaListItem[];
};

export default function MainHero({ items = [] }: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [giveUp, setGiveUp] = useState(false); // 5초 뒤 포기 알림

  useEffect(() => {
    // 5초간 데이터가 안 들어오면 무한 로딩 대신 메시지 전환
    const timer = setTimeout(() => {
      if (items.length === 0) setGiveUp(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [items.length]);

  useEffect(() => {
    if (!items || items.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items?.length, isPaused]);

  // 로딩 및 빈 데이터 처리
  if (!items || items.length === 0) {
    return (
      <div className="flex h-[250px] sm:h-[320px] items-center justify-center rounded-3xl bg-slate-800/50 text-slate-400 font-bold animate-pulse">
        {giveUp ? "현재 불러올 주요 뉴스가 없습니다. 📭" : "메인 기사를 불러오는 중... 📡"}
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <section 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="group relative w-full h-[250px] sm:h-[320px] bg-slate-900 overflow-hidden rounded-3xl border border-slate-700/50 shadow-2xl"
    >
      {items.map((item, index) => (
        <div
          key={`${item.articleUrl}-${index}`}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            currentIndex === index ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
          }`}
        >
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
        </div>
      ))}

      <div 
        onClick={() => router.push(`/news/detail?url=${encodeURIComponent(currentItem.articleUrl)}`)}
        className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end cursor-pointer z-20"
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-primary px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-tighter">HOT ISSUE</span>
          <span className="text-[11px] font-bold text-slate-300">{currentItem.createdAt || "최근 소식"}</span>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight line-clamp-2 drop-shadow-lg group-hover:text-primary transition-colors duration-300">
          {currentItem.title}
        </h2>
      </div>

      {/* 하단 인디케이터 버튼 */}
      <div className="absolute bottom-6 right-8 z-30 flex gap-3">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
            className={`h-3 transition-all duration-300 rounded-full border border-white/10 shadow-lg ${
              currentIndex === index ? "w-14 bg-primary border-primary" : "w-6 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}