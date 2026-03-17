"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

const Icons = {
  ArrowLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Star: () => <svg className="w-6 h-6 text-amber-400 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Gamepad: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
};

type UserReview = {
  id: number;
  user_id: string;
  author: string;
  game_title: string;
  title: string;
  content: string;
  rating: number;
  thumbnail_url?: string;
  views: number;
  likes: number;
  created_at: string;
};

export default function UserReviewDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [review, setReview] = useState<UserReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const initData = async () => {
      // 1. 유저 정보 확인
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);

      // 2. 리뷰 데이터 불러오기
      const { data, error } = await supabase
        .from("user_reviews")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("리뷰 로드 실패:", error);
      } else {
        setReview(data);
      }
      setLoading(false);
    };

    initData();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("정말 이 리뷰를 삭제하시겠습니까?")) return;
    
    const { error } = await supabase.from("user_reviews").delete().eq("id", id);
    if (error) {
      alert("삭제 실패: " + error.message);
    } else {
      alert("리뷰가 삭제되었습니다.");
      router.push("/user-review");
    }
  };

  const getScoreStyle = (score: number) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 50) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-rose-500 bg-rose-500/10 border-rose-500/20";
  };

  if (loading) return <div className="min-h-screen bg-background flex justify-center items-center font-bold text-muted-foreground">로딩 중...</div>;
  if (!review) return <div className="min-h-screen bg-background flex justify-center items-center font-bold text-muted-foreground">리뷰를 찾을 수 없습니다.</div>;

  const isAuthor = currentUser && currentUser.id === review.user_id;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 transition-colors duration-300">
      
      {/* 상단 썸네일 배너 영역 (이미지가 있을 때만 렌더링) */}
      {review.thumbnail_url && (
        <div className="w-full h-64 sm:h-96 relative bg-muted">
          <img src={review.thumbnail_url} alt={review.game_title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
        </div>
      )}

      <main className={`max-w-4xl mx-auto px-4 sm:px-6 ${review.thumbnail_url ? "-mt-32 relative z-10" : "mt-8"}`}>
        
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => router.push("/user-review")} 
            className={`flex items-center gap-1 text-sm font-bold transition-colors ${review.thumbnail_url ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-primary"}`}
          >
            <Icons.ArrowLeft /> 목록으로
          </button>

          {isAuthor && (
            <div className="flex gap-2">
              {/* 수정 기능은 추후 구현을 위해 라우팅만 연결해둡니다 */}
              <button onClick={() => router.push(`/user-review/edit/${id}`)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-foreground bg-card/80 backdrop-blur-md border border-border rounded-md hover:bg-accent transition-colors shadow-sm">
                <Icons.Edit /> 수정
              </button>
              <button onClick={handleDelete} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-destructive bg-card/80 backdrop-blur-md border border-destructive/20 rounded-md hover:bg-destructive/10 transition-colors shadow-sm">
                <Icons.Trash /> 삭제
              </button>
            </div>
          )}
        </div>

        <article className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden transition-colors">
          
          <div className="p-8 sm:p-10 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
              
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20">
                  <Icons.Gamepad /> {review.game_title}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-foreground leading-tight mb-4">
                  {review.title}
                </h1>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <span className="font-bold text-foreground">{review.author.split("@")[0]}</span>
                  <span>·</span>
                  <span>{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* 별점 박스 */}
              <div className={`flex-shrink-0 flex flex-col items-center justify-center p-4 rounded-2xl border shadow-sm min-w-[100px] ${getScoreStyle(review.rating)}`}>
                <Icons.Star />
                <span className="text-3xl font-black mt-1">{review.rating}</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider mt-1 opacity-70">User Score</span>
              </div>

            </div>
          </div>

          <div className="p-8 sm:p-10 min-h-[300px]">
            {/* HTML 컨텐츠 렌더링 영역 */}
            <div 
              className="prose dark:prose-invert prose-slate prose-lg max-w-none prose-img:rounded-2xl prose-img:shadow-md prose-headings:font-black prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: review.content }} 
            />
          </div>

        </article>
      </main>
    </div>
  );
}