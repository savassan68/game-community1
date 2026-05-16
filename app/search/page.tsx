"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

const Icons = {
  Gamepad: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>,
  FileText: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>,
  // ⭐ 평론용 별 아이콘 추가
  Star: () => <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  ChevronLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
};

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const router = useRouter();

  // ⭐ activeTab에 'reviews' 추가
  const [activeTab, setActiveTab] = useState<"all" | "games" | "posts" | "reviews">("all");
  
  const [gameResults, setGameResults] = useState<any[]>([]);
  const [postResults, setPostResults] = useState<any[]>([]);
  const [reviewResults, setReviewResults] = useState<any[]>([]); // ⭐ 평론 결과 상태 추가
  
  const [totalGames, setTotalGames] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0); // ⭐ 평론 갯수 상태 추가
  
  const [loading, setLoading] = useState(true);

  // 페이징 상태
  const [postPage, setPostPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1); // ⭐ 평론 페이징 상태 추가
  const ITEMS_PER_PAGE = 10;

  // 검색어가 바뀌면 페이지와 탭 초기화
  useEffect(() => {
    setPostPage(1);
    setReviewPage(1); // 초기화 추가
    setActiveTab("all");
  }, [q]);

  useEffect(() => {
    if (!q) return;

    const fetchResults = async () => {
      setLoading(true);

      // 1. 게임 검색
      const { data: games, count: gCount } = await supabase
        .from("games")
        .select("*", { count: "exact" })
        .ilike("title", `%${q}%`)
        .limit(activeTab === "all" ? 5 : 20);

      // 2. 게시글 검색
      let postQuery = supabase
        .from("community")
        .select("*", { count: "exact" })
        .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
        .order("id", { ascending: false });

      if (activeTab === "all") {
        postQuery = postQuery.limit(5);
      } else if (activeTab === "posts") {
        const from = (postPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        postQuery = postQuery.range(from, to);
      }

      // ⭐ 3. 평론 검색 추가
      let reviewQuery = supabase
        .from("reviews")
        .select("*, games(title)", { count: "exact" }) // 어느 게임 리뷰인지 표시하기 위해 games(title) 가져옴
        .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
        .order("created_at", { ascending: false });

      if (activeTab === "all") {
        reviewQuery = reviewQuery.limit(5);
      } else if (activeTab === "reviews") {
        const from = (reviewPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        reviewQuery = reviewQuery.range(from, to);
      }

      // 병렬 요청 실행
      const [postRes, reviewRes] = await Promise.all([postQuery, reviewQuery]);

      setGameResults(games || []);
      setPostResults(postRes.data || []);
      setReviewResults(reviewRes.data || []); // 평론 데이터 저장

      if (gCount !== null) setTotalGames(gCount);
      if (postRes.count !== null) setTotalPosts(postRes.count);
      if (reviewRes.count !== null) setTotalReviews(reviewRes.count); // 평론 카운트 저장

      setLoading(false);
    };

    fetchResults();
  }, [q, activeTab, postPage, reviewPage]); // reviewPage 의존성 추가

  // 페이지네이션 번호 생성 함수
  const renderPagination = (total: number, current: number, setPage: (p: number) => void) => {
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-2 mt-10">
        <button 
          onClick={() => setPage(Math.max(1, current - 1))}
          disabled={current === 1}
          className="p-2 border border-border rounded-lg disabled:opacity-30 hover:bg-accent"
        >
          <Icons.ChevronLeft />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
          <button
            key={num}
            onClick={() => setPage(num)}
            className={`w-9 h-9 rounded-lg font-bold transition-all ${current === num ? "bg-primary text-white" : "hover:bg-accent"}`}
          >
            {num}
          </button>
        ))}
        <button 
          onClick={() => setPage(Math.min(totalPages, current + 1))}
          disabled={current === totalPages}
          className="p-2 border border-border rounded-lg disabled:opacity-30 hover:bg-accent"
        >
          <Icons.ChevronRight />
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-black italic text-foreground">SEARCH RESULTS</h1>
        <p className="text-muted-foreground mt-1">"<span className="text-primary font-bold">{q}</span>"에 대한 검색 결과입니다.</p>
      </div>

      {/* ⭐ 탭 메뉴 (평론 추가) */}
      <div className="flex gap-4 border-b border-border mb-8 overflow-x-auto scrollbar-hide">
        {[
          { id: "all", label: "전체", count: totalGames + totalPosts + totalReviews },
          { id: "games", label: "게임", count: totalGames },
          { id: "posts", label: "커뮤니티", count: totalPosts },
          { id: "reviews", label: "유저 평론", count: totalReviews },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 px-2 text-sm font-black transition-all relative whitespace-nowrap ${activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label} <span className="text-[10px] ml-1 opacity-60">{tab.count}</span>
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse font-bold text-muted-foreground">데이터를 불러오는 중...</div>
      ) : (
        <div className="space-y-12">
          
          {/* 게임 결과 */}
          {(activeTab === "all" || activeTab === "games") && gameResults.length > 0 && (
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="font-black flex items-center gap-2 text-lg text-foreground"><Icons.Gamepad /> 게임 정보</h2>
                {activeTab === "all" && totalGames > 5 && (
                  <button onClick={() => setActiveTab("games")} className="text-xs font-bold text-primary hover:underline">더보기 ({totalGames})</button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {gameResults.map(game => (
                  <div key={game.id} onClick={() => router.push(`/review/${game.id}`)} className="cursor-pointer group">
                    <div className="aspect-[3/4] bg-muted rounded-xl overflow-hidden mb-2 border border-border">
                      {game.image_url ? (
                        <img src={game.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={game.title}/>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                      )}
                    </div>
                    <div className="font-bold text-sm truncate text-foreground group-hover:text-primary transition-colors">{game.title}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 커뮤니티 결과 */}
          {(activeTab === "all" || activeTab === "posts") && postResults.length > 0 && (
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="font-black flex items-center gap-2 text-lg text-foreground"><Icons.FileText /> 커뮤니티</h2>
                {activeTab === "all" && totalPosts > 5 && (
                  <button onClick={() => setActiveTab("posts")} className="text-xs font-bold text-primary hover:underline">더보기 ({totalPosts})</button>
                )}
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <ul className="divide-y divide-border">
                  {postResults.map(post => (
                    <li key={post.id} onClick={() => router.push(`/community/${post.id}`)} className="p-4 hover:bg-accent/50 cursor-pointer transition-colors group">
                      <div className="text-xs text-primary font-bold mb-1 opacity-80">[{post.category || "자유"}]</div>
                      <div className="font-bold mb-1 text-foreground group-hover:text-primary transition-colors line-clamp-1">{post.title}</div>
                      <div className="text-xs text-muted-foreground">{post.author_name || "익명"} · {new Date(post.created_at).toLocaleDateString()}</div>
                    </li>
                  ))}
                </ul>
              </div>
              {/* 페이지네이션 (커뮤니티) */}
              {activeTab === "posts" && renderPagination(totalPosts, postPage, setPostPage)}
            </section>
          )}

          {/* ⭐ 평론(리뷰) 결과 섹션 추가 */}
          {(activeTab === "all" || activeTab === "reviews") && reviewResults.length > 0 && (
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="font-black flex items-center gap-2 text-lg text-foreground"><Icons.Star /> 유저 평론</h2>
                {activeTab === "all" && totalReviews > 5 && (
                  <button onClick={() => setActiveTab("reviews")} className="text-xs font-bold text-primary hover:underline">더보기 ({totalReviews})</button>
                )}
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <ul className="divide-y divide-border">
                  {reviewResults.map(review => (
                    <li key={review.id} onClick={() => router.push(`/review/${review.game_id}`)} className="p-4 hover:bg-accent/50 cursor-pointer transition-colors group flex flex-col gap-1">
                      <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md w-fit border border-primary/20">
                        {review.games?.title || "알 수 없는 게임"}
                      </div>
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mt-1">
                        {review.title}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{review.content}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {review.author_name || "익명"} · {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {/* 페이지네이션 (평론) */}
              {activeTab === "reviews" && renderPagination(totalReviews, reviewPage, setReviewPage)}
            </section>
          )}

          {/* 3개 다 검색 결과가 없을 때 */}
          {totalGames === 0 && totalPosts === 0 && totalReviews === 0 && (
            <div className="py-24 text-center border border-dashed border-border rounded-3xl">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-muted-foreground font-bold text-sm">해당 검색어에 대한 결과가 아무것도 없습니다.</p>
              <p className="text-xs text-muted-foreground mt-1">단어를 짧게 하거나 다른 키워드로 검색해 보세요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-muted-foreground">검색 페이지 로딩 중...</div>}>
      <SearchContent />
    </Suspense>
  );
}