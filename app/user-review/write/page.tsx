"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function UserReviewWritePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  const [gameTitle, setGameTitle] = useState("");
  const [title, setTitle] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(80);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        alert("로그인이 필요합니다.");
        router.push("/auth/login");
      } else {
        setUser(data.session.user);
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async () => {
    if (!gameTitle.trim() || !title.trim() || !content.trim()) {
      return alert("게임 이름, 리뷰 제목, 내용을 모두 입력해주세요!");
    }

    setSubmitting(true);
    const { error } = await supabase.from("user_reviews").insert({
      user_id: user.id,
      author: user.email,
      game_title: gameTitle.trim(),
      title: title.trim(),
      thumbnail_url: thumbnailUrl.trim() || null,
      content: content.trim(),
      rating: rating,
    });

    setSubmitting(false);

    if (error) {
      alert("등록 실패: " + error.message);
    } else {
      alert("리뷰가 성공적으로 등록되었습니다!");
      router.push("/user-review");
    }
  };

  const getScoreStyle = (score: number) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 50) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-rose-500 bg-rose-500/10 border-rose-500/20";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 transition-colors duration-300">
      <main className="max-w-3xl mx-auto bg-card p-8 sm:p-10 rounded-3xl border border-border shadow-sm">
        <h1 className="text-2xl font-black mb-8 border-b border-border pb-4">✏️ 유저 리뷰 작성</h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">어떤 게임을 리뷰하시나요?</label>
            <input 
              type="text" 
              value={gameTitle} 
              onChange={(e) => setGameTitle(e.target.value)} 
              placeholder="예: 이름없는 인디게임 2026" 
              className="w-full p-4 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-foreground font-bold" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">리뷰 제목</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="이 게임의 매력을 한 줄로 표현한다면?" 
              className="w-full p-4 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-foreground font-bold" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">대표 이미지 URL (선택)</label>
            <input 
              type="text" 
              value={thumbnailUrl} 
              onChange={(e) => setThumbnailUrl(e.target.value)} 
              placeholder="목록에 보여질 썸네일 이미지 주소를 넣어주세요" 
              className="w-full p-4 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-foreground text-sm" 
            />
          </div>

          <div className="bg-muted/50 p-6 rounded-2xl border border-border">
            <label className="block text-sm font-bold text-muted-foreground mb-4">내 맘대로 주는 별점</label>
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl border shadow-sm ${getScoreStyle(rating)}`}>
                {rating}
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs font-bold text-muted-foreground mb-3">
                  <span>0점</span>
                  <span className="text-primary">슬라이더를 움직여주세요</span>
                  <span>100점</span>
                </div>
                <input 
                  type="range" min={0} max={100} 
                  value={rating} 
                  onChange={(e) => setRating(Number(e.target.value))} 
                  className="w-full accent-primary h-2.5 bg-muted rounded-lg appearance-none cursor-pointer" 
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">리뷰 내용</label>
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="게임에 대한 솔직한 생각을 자유롭게 적어주세요. 사진 링크나 html 태그를 사용하셔도 좋습니다!" 
              className="w-full h-80 p-4 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-foreground resize-none leading-relaxed" 
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <button onClick={() => router.back()} className="px-6 py-3 font-bold text-muted-foreground bg-muted rounded-xl hover:bg-accent transition-colors">취소</button>
            <button onClick={handleSubmit} disabled={submitting} className="px-8 py-3 font-bold text-primary-foreground bg-primary rounded-xl shadow-md hover:opacity-90 transition-all disabled:opacity-50">
              {submitting ? "등록 중..." : "리뷰 등록하기"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}