"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

const Icons = {
  Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Star: () => <svg className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
};

type UserReview = {
  id: number;
  author: string;
  game_title: string;
  title: string;
  rating: number;
  thumbnail_url?: string;
  created_at: string;
};

export default function UserReviewPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("user_reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("리뷰 로딩 에러:", error);
    if (data) setReviews(data);
    setLoading(false);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 80) return "text-emerald-500";
    if (rating >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  if (loading) return <div className="min-h-screen bg-background flex justify-center items-center font-bold text-muted-foreground">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 transition-colors duration-300">
      <main className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-black mb-2">자유 유저 리뷰</h1>
            <p className="text-muted-foreground text-sm font-medium">DB에 없는 게임이라도 자유롭게 평가하고 공유해보세요!</p>
          </div>
          <button 
            onClick={() => router.push("/user-review/write")}
            className="flex items-center gap-1.5 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            <Icons.Plus /> 리뷰 작성
          </button>
        </div>

        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {reviews.map((review) => (
              <div 
                key={review.id} 
                onClick={() => router.push(`/user-review/${review.id}`)}
                className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group flex flex-col"
              >
                {/* 썸네일 영역 */}
                <div className="w-full h-48 bg-muted relative overflow-hidden">
                  {review.thumbnail_url ? (
                    <img src={review.thumbnail_url} alt={review.game_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-xl bg-gradient-to-br from-muted to-accent">
                      {review.game_title[0]}
                    </div>
                  )}
                  {/* 별점 뱃지 */}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md border border-white/10">
                    <Icons.Star />
                    <span className={`text-xs font-black ${getRatingColor(review.rating)}`}>{review.rating}</span>
                  </div>
                </div>

                {/* 텍스트 영역 */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-xs font-bold text-primary mb-1.5 line-clamp-1">{review.game_title}</div>
                  <h3 className="text-base font-extrabold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">{review.title}</h3>
                  <div className="mt-auto pt-4 border-t border-border flex justify-between items-center text-[11px] text-muted-foreground font-medium">
                    <span>{review.author.split("@")[0]}</span>
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center bg-card rounded-3xl border border-dashed border-border text-center">
            <div className="text-5xl mb-4 opacity-50">🎮</div>
            <p className="text-lg font-bold text-foreground mb-2">아직 등록된 유저 리뷰가 없습니다.</p>
            <p className="text-sm text-muted-foreground">가장 먼저 나만의 게임 리뷰를 작성해보세요!</p>
          </div>
        )}
      </main>
    </div>
  );
}