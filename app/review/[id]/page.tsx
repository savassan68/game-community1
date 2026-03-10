"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { GAME_CATEGORIES } from "@/lib/constants";

const Icons = {
  ChevronLeft: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Heart: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
};

type Review = { id: number; content: string; rating: number; author: string; user_id: string | null; created_at: string; game_id?: number; likes?: number; };
type Game = { id: number; title: string; description: string; image_url: string; categories: string[]; metacritic_score?: number; opencritic_score?: number; };
type CriticReview = { id: number; outlet: string; author: string; rating: number; content: string; url: string; };

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const [game, setGame] = useState<Game | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [criticReviews, setCriticReviews] = useState<CriticReview[]>([]);
  const [user, setUser] = useState<any>(null);

  const [myReview, setMyReview] = useState("");
  const [myRating, setMyRating] = useState(80);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", image_url: "", categories: "" });

  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(80);

  const [loading, setLoading] = useState(true);

  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const toggleReview = (key: string) => setExpandedReviews(prev => ({ ...prev, [key]: !prev[key] }));

  const [steamReviews, setSteamReviews] = useState<Review[]>([]); 
  const siteReviews = reviews;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: gameData, error: gameError } = await supabase.from("games").select("*").eq("id", gameId).maybeSingle();
      if (gameError) console.error("게임 로드 실패:", gameError);
      setGame(gameData || null);

      if (gameData) {
        setEditForm({
          title: gameData.title,
          description: gameData.description || "",
          image_url: gameData.image_url || "",
          categories: gameData.categories ? gameData.categories.join(", ") : "",
        });
      }

      const { data: reviewData } = await supabase.from("reviews").select("*").eq("game_id", gameId).order("created_at", { ascending: false });
      setReviews(reviewData || []);

      const { data: steamData } = await supabase.from("steam_reviews").select("*").eq("game_id", gameId).order("created_at", { ascending: false });
      setSteamReviews(steamData || []);

      const { data: criticData } = await supabase.from("critic_reviews").select("*").eq("game_id", gameId);
      setCriticReviews(criticData || []);

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    fetchData();
  }, [gameId]);

  const handleUpdateGame = async () => {
    if (!confirm("게임 정보를 수정하시겠습니까?")) return;
    const categoryArray = editForm.categories.split(",").map((c) => c.trim()).filter(Boolean);
    const { error } = await supabase.from("games").update({ title: editForm.title, description: editForm.description, image_url: editForm.image_url, categories: categoryArray }).eq("id", gameId);
    if (error) alert("수정 실패: " + error.message); else window.location.reload();
  };

  const handleDeleteGame = async () => {
    if (!confirm("정말 이 게임을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("games").delete().eq("id", gameId);
    if (error) alert("삭제 실패: " + error.message); else { alert("삭제되었습니다."); router.push("/review"); }
  };

  const handleSubmitReview = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!myReview.trim()) return alert("내용을 입력해주세요.");
    const { error } = await supabase.from("reviews").insert({ game_id: gameId, content: myReview, rating: myRating, author: user.email, user_id: user.id, created_at: new Date().toISOString() });
    if (error) alert("등록 실패: " + error.message); else window.location.reload();
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await supabase.from("reviews").delete().eq("id", reviewId);
    window.location.reload();
  };

  const handleLikeReview = async (reviewId: number, currentLikes: number = 0) => {
    if (!user) return alert("로그인이 필요합니다.");
    const { error } = await supabase.from("reviews").update({ likes: currentLikes + 1 }).eq("id", reviewId);
    if (error) {
      alert("추천 실패: " + error.message);
    } else {
      window.location.reload(); 
    }
  };

  const startEditing = (review: Review) => { setEditingReviewId(review.id); setEditContent(review.content); setEditRating(review.rating); };
  const cancelEditing = () => { setEditingReviewId(null); setEditContent(""); };
  const saveEditedReview = async (reviewId: number) => {
    if (!editContent.trim()) return alert("내용을 입력해주세요.");
    const { error } = await supabase.from("reviews").update({ content: editContent, rating: editRating }).eq("id", reviewId);
    if (error) alert("수정 실패: " + error.message); else window.location.reload();
  };

  const getScoreStyle = (score: number) => {
    if (score >= 80) return "bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-emerald-200/50";
    if (score >= 50) return "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-orange-200/50";
    return "bg-gradient-to-br from-rose-400 to-red-600 text-white shadow-rose-200/50";
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  const cleanSteamContent = (text: string) => text.replace(/\[\/?h\d\]/g, "").replace(/\[\/?b\]/g, "").replace(/\[\/?i\]/g, "").replace(/\[\/?u\]/g, "").replace(/\[\/?quote\]/g, "");

  if (loading || !game) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-bold transition-colors">로딩 중...</div>;

  return (
    // ⭐ [수정] bg-slate-50 -> bg-background
    <div className="min-h-screen bg-background text-foreground pb-20 transition-colors duration-300">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary mb-6 transition-colors w-fit">
          <Icons.ChevronLeft /> 목록으로
        </button>

        {/* 🎮 게임 기본 정보 섹션 */}
        <section className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden mb-12 flex flex-col md:flex-row relative transition-colors">
          
          {isEditing ? (
            <div className="p-8 w-full flex flex-col gap-4">
              <input type="text" value={editForm.image_url} onChange={(e) => setEditForm({...editForm, image_url: e.target.value})} className="p-3 border border-border rounded-xl bg-muted text-foreground" placeholder="이미지 URL" />
              <input value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="text-2xl font-bold p-3 border border-border rounded-xl bg-muted text-foreground" placeholder="게임 제목" />
              <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="h-32 p-3 border border-border rounded-xl bg-muted text-foreground" placeholder="게임 설명" />
              <input value={editForm.categories} onChange={(e) => setEditForm({...editForm, categories: e.target.value})} className="p-3 border border-border rounded-xl bg-muted text-foreground" placeholder="태그 (쉼표로 구분)" />
              <div className="flex gap-2 mt-4">
                <button onClick={handleUpdateGame} className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all">저장</button>
                <button onClick={() => setIsEditing(false)} className="px-6 py-2 bg-secondary text-secondary-foreground rounded-xl font-bold hover:bg-muted transition-all">취소</button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-full md:w-[40%] h-72 md:h-auto relative bg-muted flex-shrink-0">
                {game.image_url ? (
                  <img src={game.image_url} alt={game.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">이미지 없음</div>
                )}
                {/* 다크 모드에서는 그라데이션을 더 어둡게 처리 */}
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 md:from-transparent to-transparent"></div>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-center relative z-10 -mt-20 md:mt-0 bg-card md:bg-transparent rounded-t-3xl md:rounded-none">
                
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {game.categories?.map((c) => (
                    <span key={c} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold tracking-wider border border-primary/20">
                      {GAME_CATEGORIES.find(cat => cat.slug === c)?.name || c}
                    </span>
                  ))}
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-4">{game.title}</h1>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8 line-clamp-4">{game.description}</p>

                <div className="flex gap-4 mb-4">
                  {game.opencritic_score && game.opencritic_score > 0 && (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">OpenCritic</span>
                      <span className={`text-xl font-black ${getScoreTextColor(game.opencritic_score)}`}>
                        {game.opencritic_score}
                      </span>
                    </div>
                  )}
                  {game.metacritic_score && game.metacritic_score > 0 && (
                    <div className={`flex flex-col ${game.opencritic_score && game.opencritic_score > 0 ? "pl-4 border-l border-border" : ""}`}>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Metacritic</span>
                      <span className={`text-xl font-black ${getScoreTextColor(game.metacritic_score)}`}>
                        {game.metacritic_score}
                      </span>
                    </div>
                  )}
                </div>

                {user && (
                  <div className="absolute top-4 right-4 md:top-6 md:right-6">
                    <button onClick={() => setIsEditing(true)} className="p-2 text-muted-foreground hover:text-primary transition-colors bg-card rounded-full shadow-sm hover:shadow-md border border-border" title="게임 정보 수정">
                      <Icons.Edit />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* 📝 리뷰 작성 및 GameSeed 유저 평론 */}
          <div className="lg:col-span-7 space-y-10">
            
            <section className="bg-card p-6 rounded-3xl border border-border shadow-sm relative overflow-hidden group transition-colors">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500"></div>
              <h2 className="text-lg font-black text-foreground mb-5">
                이 게임, 어떠셨나요?
              </h2>

              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-5 bg-muted/50 p-4 rounded-2xl border border-border transition-colors">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${getScoreStyle(myRating)}`}>
                      <span className="text-2xl font-black">{myRating}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
                        <span>0점 (비추천)</span>
                        <span className="text-primary">점수를 조절해주세요</span>
                        <span>100점 (강력 추천)</span>
                      </div>
                      <input type="range" min={0} max={100} value={myRating} onChange={(e) => setMyRating(Number(e.target.value))} className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
                    </div>
                  </div>

                  <textarea value={myReview} onChange={(e) => setMyReview(e.target.value)} className="w-full h-28 border border-border bg-muted/30 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all text-sm resize-none text-foreground placeholder:text-muted-foreground" placeholder="이 게임에 대한 솔직한 평가를 남겨주세요..." />
                  
                  <div className="flex justify-end">
                    <button onClick={handleSubmitReview} className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all">
                      리뷰 등록하기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center flex flex-col items-center justify-center bg-muted/30 rounded-2xl border border-border">
                  <p className="text-sm font-bold text-muted-foreground mb-3">리뷰를 작성하려면 로그인이 필요합니다.</p>
                  <button onClick={() => router.push('/auth/login')} className="px-5 py-2 bg-card border border-border text-primary font-bold rounded-xl shadow-sm hover:bg-muted transition-colors">
                    로그인하러 가기
                  </button>
                </div>
              )}
            </section>

            <section>
              <h3 className="text-base font-extrabold text-foreground mb-4 px-2">GameSeed 유저 평론</h3>
              <div className="space-y-4">
                {siteReviews.length > 0 ? siteReviews.map((r) => (
                  <div key={r.id} className="bg-card p-5 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all">
                    {editingReviewId === r.id ? (
                      <div className="animate-fade-in">
                        <div className="flex items-center gap-4 mb-3">
                          <input type="number" min={0} max={100} value={editRating} onChange={(e) => setEditRating(Number(e.target.value))} className="w-20 border border-border bg-muted p-2 rounded-xl text-center font-bold text-foreground" />
                          <input type="range" min={0} max={100} value={editRating} onChange={(e) => setEditRating(Number(e.target.value))} className="flex-1 accent-primary" />
                        </div>
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full h-24 border border-border bg-muted p-3 rounded-xl mb-3 focus:ring-2 focus:ring-primary/20 outline-none text-sm text-foreground" />
                        <div className="flex justify-end gap-2">
                          <button onClick={cancelEditing} className="px-4 py-2 bg-secondary text-secondary-foreground font-bold rounded-xl hover:bg-muted transition-colors">취소</button>
                          <button onClick={() => saveEditedReview(r.id)} className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-sm hover:opacity-90">수정 완료</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform hover:rotate-3 ${getScoreStyle(r.rating)}`}>
                          <span className="text-lg font-black">{r.rating}</span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-extrabold text-sm text-foreground">{r.author?.split("@")[0] ?? "익명"}</div>
                              <div className="text-[11px] font-medium text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <button onClick={() => handleLikeReview(r.id, r.likes)} className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-destructive transition-colors">
                                <Icons.Heart /> {r.likes || 0}
                              </button>
                              {user && user.id === r.user_id && (
                                <div className="flex gap-2 pl-3 border-l border-border">
                                  <button onClick={() => startEditing(r)} className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors">수정</button>
                                  <button onClick={() => handleDeleteReview(r.id)} className="text-[11px] font-bold text-muted-foreground hover:text-destructive transition-colors">삭제</button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="p-10 text-center border border-dashed border-border rounded-3xl text-muted-foreground text-sm font-bold bg-card transition-colors">
                    가장 먼저 리뷰를 남겨보세요!
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* 📡 외부(Steam) 및 전문가 평론 섹션 */}
          <aside className="lg:col-span-5 space-y-8">
            
            <div className="bg-card rounded-3xl border border-border p-6 shadow-sm transition-colors">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <h3 className="font-extrabold text-foreground text-base">외부(Steam) 유저 평론</h3>
              </div>
              <div className="space-y-5">
                {steamReviews.length > 0 ? steamReviews.map((r) => {
                  const content = cleanSteamContent(r.content);
                  const isLong = content.length > 150; 
                  const isExpanded = expandedReviews[`steam_${r.id}`];

                  return (
                    <div key={r.id} className="flex gap-4 group transition-all">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${getScoreStyle(r.rating)}`}>
                        <span className="text-sm font-black">{r.rating}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className="text-sm font-bold text-foreground truncate">{r.author}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className={`text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap transition-all ${!isExpanded && isLong ? "line-clamp-4" : ""}`}>
                          {content}
                        </p>
                        {isLong && (
                          <button onClick={() => toggleReview(`steam_${r.id}`)} className="text-xs font-bold text-primary hover:underline mt-1.5 transition-colors">
                            {isExpanded ? "접기 ▲" : "더보기 ▼"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }) : <div className="text-sm text-muted-foreground text-center py-6">스팀 평론이 없습니다.</div>}
              </div>
            </div>

            {criticReviews.length > 0 && (
              // 전문가 평론 영역: 다크 모드에선 bg-card/bg-muted 조합으로 변경 (너무 새까만색 방지)
              <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl border border-border p-6 shadow-lg text-white transition-colors">
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <h3 className="font-extrabold text-slate-100 text-base">전문가 평론</h3>
                </div>
                <div className="space-y-5">
                  {criticReviews.map((cr) => {
                    const isLong = cr.content.length > 120;
                    const isExpanded = expandedReviews[`critic_${cr.id}`];

                    return (
                      <div key={cr.id} className="block group">
                        <div className="flex justify-between items-center mb-2">
                          <a href={cr.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-amber-400 hover:text-amber-300 hover:underline transition-colors">{cr.outlet}</a>
                          <span className="text-sm font-black bg-slate-800 px-2.5 py-1 rounded-lg text-white border border-slate-700">{cr.rating}</span>
                        </div>
                        <p className={`text-sm text-slate-300 mb-1 leading-relaxed whitespace-pre-wrap transition-all ${!isExpanded && isLong ? "line-clamp-4" : ""}`}>
                          {cr.content}
                        </p>
                        {isLong && (
                          <button onClick={() => toggleReview(`critic_${cr.id}`)} className="text-xs font-bold text-amber-400 hover:text-amber-300 mb-2 transition-colors">
                            {isExpanded ? "접기 ▲" : "더보기 ▼"}
                          </button>
                        )}
                        <div className="text-xs text-slate-500">by {cr.author}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
          </aside>
        </div>
      </main>
    </div>
  );
}