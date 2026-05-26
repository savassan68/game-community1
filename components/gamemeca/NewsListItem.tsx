"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GameMecaListItem } from "@/lib/services/naverNews";

const Icons = {
  Image: () => <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
};

export default function NewsListItem({ item }: { item: GameMecaListItem }) {
  const router = useRouter();
  
  // ⭐ 1. 초기 이미지는 임시 이미지로 세팅
  const [imgSrc, setImgSrc] = useState(item.imageUrl); 
  const [isImgLoading, setIsImgLoading] = useState(true);

  // ⭐ 2. 화면에 뜨자마자 진짜 기사 이미지를 몰래 가져와서 바꿔치기!
  useEffect(() => {
    let isMounted = true;

    const fetchRealImage = async () => {
      // 이미 임시 이미지가 아니라 진짜 이미지가 있다면 패스
      if (!item.imageUrl.includes("unsplash")) {
        setIsImgLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/news/article?url=${encodeURIComponent(item.articleUrl)}`);
        if (res.ok) {
          const data = await res.json();
          // 진짜 이미지를 찾아왔다면 스르륵 교체!
          if (isMounted && data.imageUrl) {
            setImgSrc(data.imageUrl);
          }
        }
      } catch (error) {
        // 실패하면 그냥 임시 이미지 유지
      } finally {
        if (isMounted) setIsImgLoading(false);
      }
    };

    fetchRealImage();

    return () => { isMounted = false; };
  }, [item.articleUrl, item.imageUrl]);

  return (
    <div 
      onClick={() => router.push(`/news/detail?url=${encodeURIComponent(item.articleUrl)}`)} 
      className="flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
    >
      <div className="flex-shrink-0 w-32 h-24 sm:w-40 sm:h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative">
        {imgSrc ? (
          <>
            {/* 이미지가 로딩 중일 때 살짝 반투명하게 처리 */}
            <div className={`absolute inset-0 transition-opacity duration-500 z-10 ${isImgLoading ? "opacity-50 bg-slate-200 animate-pulse" : "opacity-0"}`} />
            <Image 
              src={imgSrc} 
              alt={item.title} 
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-500" 
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center relative z-10"><Icons.Image /></div>
        )}
      </div>

      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center gap-2 mb-1.5">
          {/* ⭐ 복잡한 조건문 싹 날리고 깔끔하게 영문 대문자만 씁니다! */}
          {item.category && (
            <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded uppercase">
              {item.category}
            </span>
          )}
          <span className="text-[12px] text-slate-400">{item.createdAt}</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1.5">
          {item.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {item.summary}
        </p>
      </div>
    </div>
  );
}