"use client";

import { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

// 아이콘
const Icons = {
  Fire: () => <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.45-.412-1.725a1 1 0 00-1.734-.636 4.965 4.965 0 00-.73 2.193 4.996 4.996 0 005.152 5.567 5.002 5.002 0 004.97-5.32 8.783 8.783 0 00-.916-4.522 9.426 9.426 0 00-1.127-1.928c-.167-.23-.335-.43-.497-.587zM8 12a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>,
  Message: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  Heart: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Crown: () => <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  ChevronLeft: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Image: () => <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
};

interface Post {
  id: number;
  title: string;
  content?: string;
  author: string;
  created_at: string;
  views: number;
  likes: number;
  comment_count: number;
  category: string;
  image_url?: string;
}

function timeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diffInSeconds < 60) return "방금 전";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return past.toLocaleDateString();
}

// ✅ [수정됨] 카테고리 순서를 전체 -> 자유 -> 공략 -> 질문 -> 유머로 변경
const CATEGORIES = [
  { id: "all", label: "전체" },
  { id: "free", label: "자유" },
  { id: "strategy", label: "공략" },
  { id: "question", label: "질문" },
  { id: "humor", label: "유머" },
];

const getCategoryBadgeStyle = (category: string) => {
  switch (category) {
    case "strategy": case "공략": return "bg-blue-50 text-blue-600 border-blue-100";
    case "humor": case "유머": return "bg-amber-50 text-amber-600 border-amber-100";
    case "question": case "질문": return "bg-green-50 text-green-600 border-green-100";
    default: return "bg-slate-100 text-slate-500 border-slate-200";
  }
};

const getCategoryLabel = (category: string) => {
  const found = CATEGORIES.find(c => c.id === category);
  return found ? found.label : category;
};

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [sort, setSort] = useState<"latest" | "likes" | "views">("latest");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchType, setSearchType] = useState("title_content");
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 20;

  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === "SIGNED_OUT") router.refresh();
    });
    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("community")
        .select("*, comments(count)")
        .order("id", { ascending: false });

      if (!error && data) {
        const formatted = data.map((item: any) => ({
          ...item,
          comment_count: item.comments?.[0]?.count || 0,
          category: item.category || "free"
        }));
        setPosts(formatted);
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const popularPosts = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 5);

  const filteredPosts = [...posts]
    .filter((post) => {
      if (activeCategory !== "all" && post.category !== activeCategory) return false;
      if (!appliedKeyword.trim()) return true;
      const term = appliedKeyword.toLowerCase();
      if (searchType === "title_content") return post.title.toLowerCase().includes(term) || (post.content?.toLowerCase().includes(term));
      if (searchType === "title") return post.title.toLowerCase().includes(term);
      if (searchType === "content") return post.content?.toLowerCase().includes(term);
      if (searchType === "nickname") return post.author.toLowerCase().includes(term);
      return true;
    })
    .sort((a, b) => {
      if (sort === "latest") return b.id - a.id;
      if (sort === "likes") return b.likes - a.likes;
      if (sort === "views") return b.views - a.views;
      return 0;
    });

  const indexOfLastPost = currentPage * POSTS_PER_PAGE;
  const indexOfFirstPost = indexOfLastPost - POSTS_PER_PAGE;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

  const handleSearch = () => {
    setCurrentPage(1);
    setAppliedKeyword(keyword);
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
<header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        {/* 🔹 relative 속성을 추가해 중앙 네비게이션이 정확히 가운데 위치하게 합니다 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center relative">
          
          {/* LEFT → LOGO */}
          <button
            onClick={() => router.push("/")}
            className="text-2xl font-extrabold text-indigo-600 hover:text-indigo-700"
          >
            GameSeed
          </button>

          {/* CENTER: 상단 네비게이션 (모바일에서는 숨김 처리: hidden md:flex) */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-sm font-bold">
            <button onClick={() => router.push("/community")} className="text-indigo-600"> {/* 현재 페이지 강조 */}
              커뮤니티
            </button>
            <button onClick={() => router.push("/review")} className="text-slate-500 hover:text-indigo-600 transition-colors">
              평론
            </button>
            <button onClick={() => router.push("/recommend")} className="text-slate-500 hover:text-indigo-600 transition-colors">
              AI 추천
            </button>
            <button onClick={() => router.push("/news")} className="text-slate-500 hover:text-indigo-600 transition-colors">
              뉴스
            </button>
          </nav>

          {/* RIGHT: 로그인/로그아웃 버튼 */}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "bg-white text-slate-500 hover:bg-slate-50 hover:text-indigo-600 border border-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4 px-1">
              <div className="text-sm text-slate-500 font-medium">
                총 <span className="font-bold text-slate-900">{filteredPosts.length}</span>개의 글
              </div>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                {[{k:"latest",l:"최신"}, {k:"likes",l:"인기"}, {k:"views",l:"조회"}].map(o => (
                  <button 
                    key={o.k} 
                    onClick={() => { setSort(o.k as any); setCurrentPage(1); }}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${sort === o.k ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

{/* 🔹 게시글 리스트 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6 min-h-[500px]">
              {loading ? (
                <div className="p-20 text-center animate-pulse text-slate-400">로딩 중...</div>
              ) : currentPosts.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {currentPosts.map((post) => (
                    <li 
                      key={post.id} 
                      onClick={() => router.push(`/community/${post.id}`)}
                      className="group p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-4"
                    >
                      {/* 🖼️ 썸네일 박스 (왼쪽) */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                        {post.image_url ? (
                          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icons.Image />
                          </div>
                        )}
                      </div>

                      {/* 📝 텍스트 콘텐츠 (가운데) */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded border ${getCategoryBadgeStyle(post.category)}`}>
                            {getCategoryLabel(post.category)}
                          </span>
                          <span className="text-xs text-slate-400">· {post.author} · {timeAgo(post.created_at)}</span>
                        </div>
                        
                        {/* 💬 제목 & 댓글 수 나란히 배치 */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                            {post.title}
                          </h3>
                          {/* 댓글이 1개 이상일 때만 강렬한 색상으로 표시 */}
                          {post.comment_count > 0 && (
                            <span className="text-[13px] font-extrabold text-rose-500 flex-shrink-0">
                              [{post.comment_count}]
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ❤️ 조회수/좋아요 (오른쪽) */}
                      <div className="flex-shrink-0 flex items-center gap-3 text-xs font-medium text-slate-400 ml-2">
                        <div className="flex flex-col items-center gap-0.5 min-w-[30px]">
                           <Icons.Heart /> 
                           <span>{post.likes}</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 min-w-[30px]">
                           <Icons.Eye />
                           <span>{post.views}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-20 text-center text-slate-400">
                  <div className="text-2xl mb-2">📂</div>
                  게시글이 없습니다.
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 0 && (
              <div className="flex justify-center items-center gap-2 mb-8">
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed bg-white"
                >
                  <Icons.ChevronLeft />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(number => Math.abs(currentPage - number) < 5 || number === 1 || number === totalPages)
                    .map((number, idx, arr) => {
                       const prev = arr[idx - 1];
                       const showEllipsis = prev && number - prev > 1;
                       return (
                         <div key={number} className="flex items-center">
                           {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                           <button
                             onClick={() => paginate(number)}
                             className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                               currentPage === number
                                 ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-110"
                                 : "bg-white text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200"
                             }`}
                           >
                             {number}
                           </button>
                         </div>
                       );
                    })}
                </div>
                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed bg-white text-sm font-medium"
                >
                  다음 <Icons.ChevronRight />
                </button>
              </div>
            )}

            {/* 하단 검색바 */}
            <div className="flex justify-center items-center gap-2 mt-4">
              <div className="flex bg-white border border-slate-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all overflow-hidden">
                <select 
                  value={searchType} 
                  onChange={(e) => setSearchType(e.target.value)}
                  className="bg-slate-50 border-r border-slate-100 text-xs font-bold px-3 py-2 outline-none"
                >
                  <option value="title_content">제목+내용</option>
                  <option value="title">제목</option>
                  <option value="content">내용</option>
                  <option value="nickname">닉네임</option>
                </select>
                <input 
                  type="text" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="검색어 입력"
                  className="px-4 py-2 text-sm outline-none w-48 sm:w-64"
                />
                <button onClick={handleSearch} className="px-4 bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
                  <Icons.Search />
                </button>
              </div>
              {appliedKeyword && (
                <button 
                  onClick={() => {setKeyword(""); setAppliedKeyword(""); setCurrentPage(1);}}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 underline"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-50">
                <Icons.Crown />
                <h3 className="font-bold text-slate-800 text-sm">실시간 인기글</h3>
              </div>
<ul className="space-y-4">
                {popularPosts.length > 0 ? popularPosts.map((post, idx) => (
                  <li 
                    key={post.id} 
                    onClick={() => router.push(`/community/${post.id}`)}
                    className="flex gap-3 cursor-pointer group"
                  >
                    {/* 순위 숫자 */}
                    <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold ${
                      idx < 3 ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                    }`}>
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* 💬 제목 & 댓글 수 */}
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 truncate transition-colors">
                          {post.title}
                        </p>
                        {post.comment_count > 0 && (
                          <span className="text-[11px] font-extrabold text-rose-500 flex-shrink-0">
                            [{post.comment_count}]
                          </span>
                        )}
                      </div>
                      
                      {/* 글 정보 (추천수, 작성자, 카테고리) */}
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-0.5"><Icons.Heart /> {post.likes}</span>
                        <span>·</span>
                        <span className="truncate max-w-[80px]">{post.author}</span>
                        <span>·</span>
                        <span className="text-indigo-500 font-medium">{getCategoryLabel(post.category)}</span>
                      </div>
                    </div>
                  </li>
                )) : (
                  <li className="text-xs text-slate-400 py-4 text-center">아직 인기글이 없습니다.</li>
                )}
              </ul>
            </div>

            <div className="sticky top-24 space-y-4">
               <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 overflow-hidden relative group">
                 <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                 <h3 className="font-bold text-lg mb-1 relative z-10">게임 이야기 쓰기</h3>
                 <p className="text-indigo-100 text-xs mb-5 relative z-10 opacity-90">
                   나만의 공략이나 재미있는 경험을<br/> 유저들과 공유해보세요!
                 </p>
                 <button 
                   onClick={() => router.push("/community/write")}
                   className="w-full py-3 bg-white text-indigo-700 rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 relative z-10"
                 >
                   <Icons.Edit /> 글 작성하러 가기
                 </button>
               </div>
               <footer className="text-xs text-slate-400 px-2 text-center">
                 <p>© 2025 GameSeed Inc.</p>
                 <div className="flex justify-center gap-2 mt-1 opacity-70">
                   <span>이용약관</span> · <span>문의하기</span>
                 </div>
               </footer>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}