"use client";

import { useEffect, useState } from "react";

type Props = {
  item?: {
    id: string;
    title: string;
    summary: string;
    imageUrl: string;
    articleUrl: string;
  } | null;
};

// 바로 표시되는 실제 이미지 CDN 주소들
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=1600&q=80",
];

export default function MainHero({ item }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  if (!item) {
    return (
      <div className="mb-8 flex h-[320px] items-center justify-center rounded-2xl bg-gray-200 text-gray-500">
        메인 기사를 불러오는 중...
      </div>
    );
  }

  const handleClick = () => {
    const target = `/news/${item.id}?url=${encodeURIComponent(item.articleUrl)}`;
    window.location.href = target;
  };

  return (
    <section
      onClick={handleClick}
      className="mb-8 cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white"
    >
      <div className="relative h-[320px] w-full overflow-hidden bg-gray-100">
        {HERO_IMAGES.map((src, index) => (
          <img
            key={src}
            src={src}
            alt={`메인 배너 이미지 ${index + 1}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              currentIndex === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {HERO_IMAGES.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`h-2.5 w-2.5 rounded-full transition ${
                currentIndex === index ? "bg-white" : "bg-white/50"
              }`}
              aria-label={`배너 ${index + 1}번 보기`}
            />
          ))}
        </div>
      </div>

      <div className="bg-black px-6 py-5 text-white">
        <h1 className="text-3xl font-bold leading-snug">{item.title}</h1>
        <p className="mt-2 text-sm text-gray-200 line-clamp-2">
          {item.summary || "요약이 없습니다."}
        </p>
      </div>
    </section>
  );
}