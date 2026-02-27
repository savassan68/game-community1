"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { GAME_CATEGORIES } from "@/lib/constants";

// 아이콘 (커뮤니티/메인과 통일)
const Icons = {
  ChevronLeft: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  Star: () => <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
};

type Review = { id: number; content: string; rating: number; author: string; user_id: string | null; created_at: string; game_id?: number; };
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

  const steamReviews = reviews.filter((r) => !r.user_id || r.author?.startsWith("SteamUser_"));
  const siteReviews = reviews.filter((r) => r.user_id);

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

  const startEditing = (review: Review) => { setEditingReviewId(review.id); setEditContent(review.content); setEditRating(review.rating); };
  const cancelEditing = () => { setEditingReviewId(null); setEditContent(""); };
  const saveEditedReview = async (reviewId: number) => {
    if (!editContent.trim()) return alert("내용을 입력해주세요.");
    const { error } = await supabase.from("reviews").update({ content: editContent, rating: editRating }).eq("id", reviewId);
    if (error) alert("수정 실패: " + error.message); else window.location.reload();
  };

// 기존 코드: 점수 뱃지 디자인 (색상 & 그라데이션)
  const getScoreStyle = (score: number) => {
    if (score >= 80) return "bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-emerald-200";
    if (score >= 50) return "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-orange-200";
    return "bg-gradient-to-br from-rose-400 to-red-600 text-white shadow-rose-200";
  };

  // ⭐ 새로 추가할 코드: 텍스트 전용 점수 색상 (OpenCritic, Metacritic 용)
  const getScoreTextColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  const cleanSteamContent = (text: string) => text.replace(/\[\/?h\d\]/g, "").replace(/\[\/?b\]/g, "").replace(/\[\/?i\]/g, "").replace(/\[\/?u\]/g, "").replace(/\[\/?quote\]/g, "");

  if (loading || !game) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-bold">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* 🔹 통일된 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center relative">
          <button onClick={() => router.push("/")} className="text-2xl font-extrabold font-sans text-indigo-600 hover:text-indigo-700">GameSeed</button>
          
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-sm font-bold">
            <button onClick={() => router.push("/community")} className="text-slate-500 hover:text-indigo-600 transition-colors">커뮤니티</button>
            <button onClick={() => router.push("/review")} className="text-indigo-600">평론</button>
            <button onClick={() => router.push("/recommend")} className="text-slate-500 hover:text-indigo-600 transition-colors">AI 추천</button>
            <button onClick={() => router.push("/news")} className="text-slate-500 hover:text-indigo-600 transition-colors">뉴스</button>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <button onClick={() => router.push("/mypage")} className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors">마이페이지</button>
                <button onClick={async () => { await supabase.auth.signOut(); router.refresh(); }} className="text-xs text-slate-500 hover:text-slate-800 font-medium">로그아웃</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => router.push("/auth/login")} className="text-sm font-semibold text-slate-600 px-3 py-2">로그인</button>
                <button onClick={() => router.push("/auth/signup")} className="text-sm font-semibold text-white bg-indigo-600 px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors">회원가입</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* 뒤로가기 버튼 */}
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-indigo-600 mb-6 transition-colors w-fit">
          <Icons.ChevronLeft /> 목록으로
        </button>

        {/* 🔹 게임 정보 섹션 (웅장한 디자인) */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-12 flex flex-col md:flex-row relative">
          
          {/* 어드민 수정 모드일 때 */}
          {isEditing ? (
            <div className="p-8 w-full flex flex-col gap-4">
              <input type="text" value={editForm.image_url} onChange={(e) => setEditForm({...editForm, image_url: e.target.value})} className="p-3 border rounded-xl bg-slate-50" placeholder="이미지 URL" />
              <input value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="text-2xl font-bold p-3 border rounded-xl bg-slate-50" placeholder="게임 제목" />
              <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="h-32 p-3 border rounded-xl bg-slate-50" placeholder="게임 설명" />
              <input value={editForm.categories} onChange={(e) => setEditForm({...editForm, categories: e.target.value})} className="p-3 border rounded-xl bg-slate-50" placeholder="태그 (쉼표로 구분)" />
              <div className="flex gap-2 mt-4">
                <button onClick={handleUpdateGame} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">저장</button>
                <button onClick={() => setIsEditing(false)} className="px-6 py-2 bg-slate-200 text-slate-600 rounded-xl font-bold">취소</button>
              </div>
            </div>
          ) : (
            <>
              {/* 왼쪽: 게임 포스터 */}
              <div className="w-full md:w-[40%] h-72 md:h-auto relative bg-slate-100 flex-shrink-0">
                {game.image_url ? (
                  <img src={game.image_url} alt={game.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">이미지 없음</div>
                )}
                {/* 그라데이션 마스크 (포스터와 텍스트 경계선을 부드럽게) */}
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900/80 md:from-transparent to-transparent"></div>
              </div>

              {/* 오른쪽: 게임 상세 텍스트 */}
              <div className="p-8 flex-1 flex flex-col justify-center relative z-10 -mt-20 md:mt-0 bg-white md:bg-transparent rounded-t-3xl md:rounded-none">
                
                {/* 카테고리 뱃지 */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {game.categories?.map((c) => (
                    <span key={c} className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-extrabold tracking-wider border border-indigo-100">
                      {GAME_CATEGORIES.find(cat => cat.slug === c)?.name || c}
                    </span>
                  ))}
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-4">{game.title}</h1>
                <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-4">{game.description}</p>

{/* 외부 점수 표기 */}
                <div className="flex gap-4 mb-4">
                  {/* ⭐ 조건에 game.opencritic_score > 0 을 추가해서 -1 이면 안 보이게 숨깁니다! */}
                  {game.opencritic_score && game.opencritic_score > 0 && (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OpenCritic</span>
                      {/* ⭐ 고정된 빨간색 대신 점수별 색상 함수 적용! */}
                      <span className={`text-xl font-black ${getScoreTextColor(game.opencritic_score)}`}>
                        {game.opencritic_score}
                      </span>
                    </div>
                  )}
                  {game.metacritic_score && game.metacritic_score > 0 && (
                    <div className={`flex flex-col ${game.opencritic_score && game.opencritic_score > 0 ? "pl-4 border-l border-slate-200" : ""}`}>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metacritic</span>
                      {/* ⭐ 여기도 점수별 색상 적용! */}
                      <span className={`text-xl font-black ${getScoreTextColor(game.metacritic_score)}`}>
                        {game.metacritic_score}
                      </span>
                    </div>
                  )}
                </div>

                {/* 어드민 버튼 */}
                {user && (
                  <div className="absolute top-4 right-4 md:top-6 md:right-6">
                    <button onClick={() => setIsEditing(true)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors bg-white rounded-full shadow-sm hover:shadow-md border border-slate-100" title="게임 정보 수정">
                      <Icons.Edit />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* ⭐ 왼쪽 8, 오른쪽 4 비율을 -> 왼쪽 7, 오른쪽 5 비율로 수정하여 우측을 넓혔습니다 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* 🔹 왼쪽: 유저 리뷰 작성 & 목록 */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* 리뷰 작성 박스 */}
            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <h2 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-2">
                <Icons.Star /> 이 게임, 어떠셨나요?
              </h2>

              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${getScoreStyle(myRating)}`}>
                      <span className="text-2xl font-black">{myRating}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                        <span>0점 (비추천)</span>
                        <span className="text-indigo-600">점수를 조절해주세요</span>
                        <span>100점 (강력 추천)</span>
                      </div>
                      <input type="range" min={0} max={100} value={myRating} onChange={(e) => setMyRating(Number(e.target.value))} className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                  </div>

                  <textarea value={myReview} onChange={(e) => setMyReview(e.target.value)} className="w-full h-28 border border-slate-200 bg-slate-50 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-sm resize-none" placeholder="이 게임에 대한 솔직한 평가를 남겨주세요..." />
                  
                  <div className="flex justify-end">
                    <button onClick={handleSubmitReview} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 active:scale-95 transition-all">
                      리뷰 등록하기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-400 mb-3">리뷰를 작성하려면 로그인이 필요합니다.</p>
                  <button onClick={() => router.push('/auth/login')} className="px-5 py-2 bg-white border border-slate-200 text-indigo-600 font-bold rounded-xl shadow-sm hover:bg-slate-50">
                    로그인하러 가기
                  </button>
                </div>
              )}
            </section>

            {/* 사이트 유저 리뷰 목록 */}
            <section>
              <h3 className="text-base font-extrabold text-slate-800 mb-4 px-2">🔥 GameSeed 유저 평론</h3>
              <div className="space-y-4">
                {siteReviews.length > 0 ? siteReviews.map((r) => (
                  <div key={r.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    {editingReviewId === r.id ? (
                      <div className="animate-fade-in">
                        <div className="flex items-center gap-4 mb-3">
                          <input type="number" min={0} max={100} value={editRating} onChange={(e) => setEditRating(Number(e.target.value))} className="w-20 border border-slate-200 p-2 rounded-xl text-center font-bold" />
                          <input type="range" min={0} max={100} value={editRating} onChange={(e) => setEditRating(Number(e.target.value))} className="flex-1 accent-indigo-600" />
                        </div>
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full h-24 border border-slate-200 p-3 rounded-xl mb-3 focus:ring-2 focus:ring-indigo-100 outline-none text-sm" />
                        <div className="flex justify-end gap-2">
                          <button onClick={cancelEditing} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl">취소</button>
                          <button onClick={() => saveEditedReview(r.id)} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-sm">수정 완료</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${getScoreStyle(r.rating)}`}>
                          <span className="text-lg font-black">{r.rating}</span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-extrabold text-sm text-slate-800">{r.author?.split("@")[0] ?? "익명"}</div>
                              <div className="text-[11px] font-medium text-slate-400">{new Date(r.created_at).toLocaleDateString()}</div>
                            </div>
                            {user && user.id === r.user_id && (
                              <div className="flex gap-2">
                                <button onClick={() => startEditing(r)} className="text-[11px] font-bold text-slate-400 hover:text-indigo-600">수정</button>
                                <button onClick={() => handleDeleteReview(r.id)} className="text-[11px] font-bold text-slate-400 hover:text-rose-600">삭제</button>
                              </div>
                            )}
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="p-10 text-center border border-dashed border-slate-200 rounded-3xl text-slate-400 text-sm font-bold bg-white">
                    가장 먼저 리뷰를 남겨보세요!
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* 🔹 오른쪽: 외부(스팀/전문가) 리뷰 사이드바 (사이즈 대폭 확대!) */}
          <aside className="lg:col-span-5 space-y-8">
            
            {/* 스팀 리뷰 */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <h3 className="font-extrabold text-slate-800 text-base">외부(Steam) 유저 평론</h3>
              </div>
              <div className="space-y-5">
                {steamReviews.length > 0 ? steamReviews.map((r) => (
                  <div key={r.id} className="flex gap-4 group">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${getScoreStyle(r.rating)}`}>
                      <span className="text-sm font-black">{r.rating}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-sm font-bold text-slate-800 truncate">{r.author}</span>
                        <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed">{cleanSteamContent(r.content)}</p>
                    </div>
                  </div>
                )) : <div className="text-sm text-slate-400 text-center py-6">스팀 평론이 없습니다.</div>}
              </div>
            </div>

            {/* 전문가 리뷰 */}
            {criticReviews.length > 0 && (
              <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 shadow-lg text-white">
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <h3 className="font-extrabold text-slate-100 text-base">전문가 평론</h3>
                </div>
                <div className="space-y-5">
                  {criticReviews.map((cr) => (
                    <a key={cr.id} href={cr.url} target="_blank" rel="noreferrer" className="block group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-amber-400 group-hover:underline">{cr.outlet}</span>
                        <span className="text-sm font-black bg-slate-700 px-2.5 py-1 rounded-lg text-white">{cr.rating}</span>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-4 mb-2 leading-relaxed">{cr.content}</p>
                      <div className="text-xs text-slate-400">by {cr.author}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            
          </aside>
        </div>
      </main>
    </div>
  );
}