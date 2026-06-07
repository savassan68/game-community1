"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GameMecaListItem } from "@/lib/gamemeca";

type Props = {
  items?: GameMecaListItem[];
};

export default function MainHero({ items = [] }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [giveUp, setGiveUp] = useState(false);

  // 데이터 로딩 타임아웃
  useEffect(() => {
    const timer = setTimeout(() => {
      if (items.length === 0) setGiveUp(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [items.length]);

  // 슬라이드 자동 넘기기
  useEffect(() => {
    if (!items || items.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items, isPaused]);

  if (!items || items.length === 0) {
    return (
      <div className="flex h-[250px] sm:h-[320px] items-center justify-center rounded-3xl bg-slate-800/50 text-slate-400 font-bold animate-pulse">
        {giveUp ? "현재 불러올 주요 뉴스가 없습니다. 📭" : "메인 기사를 불러오는 중... 📡"}
      </div>
    );
  }

  // 현재 보여줄 아이템 정보
  const currentItem = items[currentIndex];

  return (
    <section 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="group relative w-full h-[250px] sm:h-[320px] bg-slate-900 overflow-hidden rounded-3xl border border-slate-700/50 shadow-2xl transition-all duration-500"
    >
      {/* 이미지 영역: 키(key)를 현재 인덱스로 주어 이미지가 바뀔 때 애니메이션이 트리거되게 함 */}
      <div className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out" key={currentIndex}>
        {currentItem.imageUrl ? (
          <Image 
            src={currentItem.imageUrl} 
            alt={currentItem.title} 
            fill 
            className="object-cover animate-fade-in" // 서서히 나타나는 애니메이션 추가
            priority
            unoptimized // 외부 이미지(게임메카 등) 링크일 경우 최적화 에러 방지 위해 추가 권장
          />
        ) : (
          <div className="w-full h-full bg-slate-800" />
        )}
        {/* 이미지 위 어두운 그라데이션 (글자 가독성용) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      </div>

      {/* 텍스트 정보 영역 */}
      <Link 
        href={`/news/detail?url=${encodeURIComponent(currentItem.articleUrl)}`}
        className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end z-20"
      >
        <div className="flex items-center gap-3 mb-2 animate-fade-in-up">
          <span className="bg-primary px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-tighter">HOT ISSUE</span>
          <span className="text-[11px] font-bold text-slate-300">{currentItem.createdAt || "최근 소식"}</span>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight line-clamp-2 drop-shadow-lg group-hover:text-primary transition-colors duration-300 animate-fade-in-up">
          {currentItem.title}
        </h2>
      </Link>

      {/* 하단 인디케이터 버튼 */}
      <div className="absolute bottom-6 right-8 z-30 flex gap-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={(e) => { 
              e.preventDefault(); 
              setCurrentIndex(index); 
            }}
            className={`h-2 transition-all duration-300 rounded-full border border-white/10 shadow-lg ${
              currentIndex === index ? "w-10 bg-primary border-primary" : "w-3 bg-white/30 hover:bg-white/60"
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>

      {/* 애니메이션용 스타일 (Tailwind 기본에 없는 경우를 대비) */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.8s ease-out; }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out; }
      `}</style>
    </section>
  );
}