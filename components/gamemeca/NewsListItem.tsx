"use client";

type Props = {
  item: {
    id: string;
    title: string;
    summary: string;
    imageUrl: string;
    articleUrl: string;
    createdAt: string;
  };
};

export default function NewsListItem({ item }: Props) {
  const handleClick = () => {
    const target = `/news/${item.id}?url=${encodeURIComponent(item.articleUrl)}`;
    window.location.href = target;
  };

  return (
    <article
      onClick={handleClick}
      className="flex cursor-pointer items-start gap-4 border-b border-gray-200 py-5 transition hover:bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <h2 className="text-2xl font-bold leading-snug text-gray-900">
          {item.title}
        </h2>

        <p className="mt-3 text-base leading-7 text-gray-600 line-clamp-3">
          {item.summary || "요약이 없습니다."}
        </p>

        <div className="mt-3 text-sm text-gray-400">
          {item.createdAt || "날짜 정보 없음"}
        </div>
      </div>

      <div className="h-[96px] w-[144px] flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            이미지 없음
          </div>
        )}
      </div>
    </article>
  );
}