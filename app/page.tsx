"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

// 🔹 커뮤니티와 통일감 있는 깔끔한 아이콘 세트 적용
const Icons = {
  Fire: () => <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.45-.412-1.725a1 1 0 00-1.734-.636 4.965 4.965 0 00-.73 2.193 4.996 4.996 0 005.152 5.567 5.002 5.002 0 004.97-5.32 8.783 8.783 0 00-.916-4.522 9.426 9.426 0 00-1.127-1.928c-.167-.23-.335-.43-.497-.587zM8 12a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>,
  Heart: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  Star: () => <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  News: () => <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" /></svg>
};

type Review = { id: number; game_id?: number; title: string; content: string; rating?: number; likes?: number; author_name?: string; created_at?: string; source?: string; };
type Community = { id: number; title: string; likes?: number; author_name?: string; created_at?: string; };
type NewsPost = { id: number; title: string; category?: string; image_url?: string; created_at?: string; };

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const [latestReviews, setLatestReviews] = useState<Review[]>([]);
  const [topReviews, setTopReviews] = useState<Review[]>([]);
  const [latestCommunity, setLatestCommunity] = useState<Community[]>([]);
  const [topCommunity, setTopCommunity] = useState<Community[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [activeNewsCategory, setActiveNewsCategory] = useState<string>("all");

  const NEWS_CATEGORIES = ["all", "industry", "pc", "console", "mobile", "esports", "hot"];

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === "SIGNED_OUT") router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    const load = async () => {
      const latestRev = await supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(8);
      if (!latestRev.error) setLatestReviews(latestRev.data as Review[]);

      const topRev = await supabase.from("reviews").select("*").order("likes", { ascending: false }).limit(4);
      if (!topRev.error) setTopReviews(topRev.data as Review[]);

      const latestCom = await supabase.from("community").select("*").order("created_at", { ascending: false }).limit(8);
      if (!latestCom.error) setLatestCommunity(latestCom.data as Community[]);

      const topCom = await supabase.from("community").select("*").order("likes", { ascending: false }).limit(5);
      if (!topCom.error) setTopCommunity(topCom.data as Community[]);

      const n = await supabase.from("news_posts").select("*").order("created_at", { ascending: false });
      if (!n.error) setNews(n.data as NewsPost[]);
    };
    load();
  }, []);

  const filteredNews = useMemo(() => {
    if (activeNewsCategory === "all") return news;
    return news.filter((n) => (n.category ?? "").toLowerCase() === activeNewsCategory.toLowerCase());
  }, [news, activeNewsCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center relative">
          
          <button 
            onClick={() => router.push("/")} 
            className="text-2xl font-extrabold font-sans text-indigo-600 hover:text-indigo-700"
          >
            GameSeed
          </button>
          
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-sm font-bold">
            <button onClick={() => router.push("/community")} className="text-slate-500 hover:text-indigo-600 transition-colors">커뮤니티</button>
            <button onClick={() => router.push("/review")} className="text-slate-500 hover:text-indigo-600 transition-colors">평론</button>
            <button onClick={() => router.push("/recommend")} className="text-slate-500 hover:text-indigo-600 transition-colors">AI 추천</button>
            <button onClick={() => router.push("/news")} className="text-slate-500 hover:text-indigo-600 transition-colors">뉴스</button>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <button onClick={() => router.push("/mypage")} className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors">마이페이지</button>
                <button onClick={async () => { await supabase.auth.signOut(); setUser(null); router.refresh(); }} className="text-xs text-slate-500 hover:text-slate-800 font-medium">로그아웃</button>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        <section className="mb-10">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl shadow-lg p-10 sm:p-14 relative overflow-hidden flex flex-col items-start justify-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full mb-4 border border-white/30">
              새로운 소식
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 relative z-10 leading-tight">
              GameSeed 뉴스 영역<br/>오픈 준비 중입니다! 🚀
            </h1>
            <p className="text-indigo-100 text-sm sm:text-base max-w-md relative z-10 opacity-90 mb-6">
              최신 게임 업계 동향과 이스포츠 소식을 가장 빠르게 전달해 드릴게요. 조금만 기다려주세요!
            </p>
            <button className="px-5 py-2.5 bg-white text-indigo-700 font-bold text-sm rounded-xl shadow-sm hover:bg-indigo-50 transition-colors relative z-10">
              자세히 알아보기
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-10">
            
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  <Icons.Star /> 이번 주 베스트 평론
                </h2>
                <button onClick={() => router.push("/review")} className="text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center">
                  더보기 <Icons.ChevronRight />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {topReviews.length > 0 ? topReviews.map((r) => (
                  <div key={r.id} onClick={() => router.push(`/review/${r.game_id}`)} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm">
                        BEST
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-500"><Icons.Heart /> {r.likes ?? 0}</span>
                    </div>
                    {/* ⭐ 제목 폰트 통일 적용: text-sm font-bold text-slate-700 */}
                    <h3 className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">{r.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{r.content}</p>
                  </div>
                )) : <div className="col-span-2 p-10 text-center text-slate-400 border border-dashed rounded-2xl">아직 인기 평론이 없습니다.</div>}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-800 mb-4">✨ 최신 유저 평론</h2>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <ul className="divide-y divide-slate-100">
                  {latestReviews.length > 0 ? latestReviews.map((r) => (
                    <li key={r.id} onClick={() => router.push(`/review/${r.game_id}`)} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group flex flex-col gap-1">
                      {/* ⭐ 제목 폰트 통일 적용: text-sm font-bold text-slate-700 */}
                      <h4 className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors truncate">{r.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{r.content}</p>
                    </li>
                  )) : <div className="p-10 text-center text-slate-400">최신 평론이 없습니다.</div>}
                </ul>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  {/* ⭐ 타이틀 변경: 실시간 커뮤니티 -> 실시간 인기 커뮤니티 */}
                  <Icons.Fire /> 실시간 인기 커뮤니티
                </h3>
                <button onClick={() => router.push("/community")} className="text-[10px] font-bold text-slate-400 hover:text-indigo-600">더보기</button>
              </div>
              <ul className="space-y-4">
                {topCommunity.length > 0 ? topCommunity.map((p, idx) => (
                  <li key={p.id} onClick={() => router.push(`/community/${p.id}`)} className="flex gap-3 cursor-pointer group items-center">
                    <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold ${idx < 3 ? "bg-rose-50 text-rose-500" : "bg-slate-100 text-slate-500"}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* ⭐ 기준 폰트: text-sm font-bold text-slate-700 */}
                      <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 truncate transition-colors">
                        {p.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-0.5"><Icons.Heart /> {p.likes ?? 0}</span>
                      </div>
                    </div>
                  </li>
                )) : <li className="text-xs text-slate-400 py-4 text-center">게시글이 없습니다.</li>}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
                <h3 className="font-bold text-slate-800 text-sm">
                  💬 최신 커뮤니티 글
                </h3>
              </div>
              <ul className="space-y-3">
                {latestCommunity.length > 0 ? latestCommunity.map((p) => (
                  <li key={p.id} onClick={() => router.push(`/community/${p.id}`)} className="cursor-pointer group">
                    {/* ⭐ 제목 폰트 통일 적용: text-sm font-bold text-slate-700 */}
                    <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors truncate mb-1">
                      {p.title}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}
                    </div>
                  </li>
                )) : <li className="text-xs text-slate-400 py-4 text-center">게시글이 없습니다.</li>}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-50">
                <Icons.News />
                <h3 className="font-bold text-slate-800 text-sm">최신 게임 뉴스</h3>
              </div>
              
              <div className="flex flex-wrap gap-1.5 mb-4">
                {NEWS_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveNewsCategory(c)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-colors ${
                      activeNewsCategory === c ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {c === "all" ? "전체" : c.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredNews.length > 0 ? filteredNews.slice(0, 5).map((n) => (
                  <div key={n.id} onClick={() => router.push(`/news/${n.id}`)} className="group cursor-pointer">
                    {/* ⭐ 제목 폰트 통일 적용: text-sm font-bold text-slate-700 */}
                    <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {n.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
                    </div>
                  </div>
                )) : <div className="text-xs text-slate-400 text-center py-4">뉴스가 없습니다.</div>}
              </div>
            </div>

          </aside>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 mt-10">
        <div className="max-w-7xl mx-auto px-6 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 GameSeed Inc.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-600 cursor-pointer transition-colors">이용약관</span>
            <span className="hover:text-slate-600 cursor-pointer transition-colors">개인정보처리방침</span>
          </div>
        </div>
      </footer>
    </div>
  );
}