"use client";

import Link from "next/link";
import { GameMecaListItem } from "@/lib/gamemeca";

type Props = {
  // ⭐ 공통 타입을 사용하여 데이터 일관성을 맞춥니다.
  item: GameMecaListItem;
};

export default function NewsListItem({ item }: Props) {
  // 데이터가 없을 경우를 대비한 안전장치
  if (!item) return null;

  const detailUrl = `/news/detail?url=${encodeURIComponent(item.articleUrl)}`;

  return (
    <Link href={detailUrl} className="block group">
      <article className="flex items-start gap-5 py-6 px-4 transition-all hover:bg-muted/50 rounded-2xl border-b border-border/50 group-last:border-none">
        
        {/* 텍스트 컨텐츠 영역 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            {item.category && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider">
                {item.category}
              </span>
            )}
            <span className="text-[11px] font-bold text-muted-foreground">
              {item.createdAt || "최근 소식"}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {item.title}
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2 font-medium">
            {item.summary || "본문 내용을 확인하려면 클릭하세요."}
          </p>
        </div>

        {/* 썸네일 이미지 영역 */}
        <div className="relative h-[80px] w-[120px] sm:h-[100px] sm:w-[150px] flex-shrink-0 overflow-hidden rounded-xl bg-muted border border-border shadow-sm">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-600">
              <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}