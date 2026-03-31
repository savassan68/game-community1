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
  ChevronLeft: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Image: () => <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
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

const CATEGORIES = [
  { id: "all", label: "전체" },
  { id: "free", label: "자유" },
  { id: "strategy", label: "공략" },
  { id: "question", label: "질문" },
  { id: "humor", label: "유머" },
];

const getCategoryBadgeStyle = (category: string) => {
  switch (category) {
    case "strategy": case "공략": return "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800";
    case "humor": case "유머": return "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800";
    case "question": case "질문": return "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800";
    default: return "bg-secondary text-secondary-foreground border-border";
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
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // ⭐ 수정됨: comments(count)를 제거하고 순수하게 글 목록만 가져옵니다.
        const { data, error } = await supabase
          .from("community")
          .select("*") 
          .order("id", { ascending: false });

        if (error) {
          console.error("게시글 로딩 에러:", error.message);
          setLoading(false);
          return;
        }

        if (data) {
          const formatted = data.map((item: any) => ({
            ...item,
            // ⭐ 당분간 댓글 개수는 0으로 표시하거나, 
            // 나중에 필요하면 별도로 count 쿼리를 날려야 합니다.
            comment_count: item.comment_count || 0, 
            category: item.category || "free"
          }));
          setPosts(formatted);
        }
      } catch (err) {
        console.error("Unexpected Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);

  const popularPosts = [...posts]
    .filter((post) => new Date(post.created_at) >= oneDayAgo)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 5); // 인기글 상위 5개

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
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      {/* ⭐ 컨테이너 넓이를 줄여서 양옆에 광고가 들어갈 '여백'을 확보했습니다. (max-w-4xl) */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        
        {/* 상단 통합 컨트롤 영역 (카테고리 + 글쓰기 버튼) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* 카테고리 탭 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* ⭐ 우측 글쓰기 버튼 (이제 모바일, PC 모두 게시판 상단 우측에 위치) */}
          <button
            onClick={() => router.push("/community/write")}
            className="flex-shrink-0 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-sm hover:shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Icons.Edit /> 새 글 쓰기
          </button>
        </div>

        {/* ⭐ 상단 실시간 인기글 박스 (가로형 리스트) */}
        {popularPosts.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm mb-6 transition-colors">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <Icons.Fire />
              <h3 className="font-bold text-foreground text-sm">실시간 인기글</h3>
            </div>
            {/* 그리드로 배치하여 공간 활용도를 높였습니다. */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {popularPosts.map((post, idx) => (
                <li 
                  key={post.id} 
                  onClick={() => router.push(`/community/${post.id}`)}
                  className="flex gap-3 items-center cursor-pointer group p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-xs font-black ${
                    idx < 3 ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground"
                  }`}>
                    {idx + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <span className="text-primary text-[10px] font-bold whitespace-nowrap">
                      [{getCategoryLabel(post.category)}]
                    </span>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary truncate transition-colors">
                      {post.title}
                    </p>
                    {post.comment_count > 0 && (
                      <span className="text-[10px] font-extrabold text-rose-500 flex-shrink-0">
                        [{post.comment_count}]
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 게시글 목록 상단 필터바 */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="text-sm text-muted-foreground font-medium">
            총 <span className="font-bold text-foreground">{filteredPosts.length}</span>개의 글
          </div>
          <div className="flex gap-1 bg-secondary p-1 rounded-lg">
            {[{k:"latest",l:"최신"}, {k:"likes",l:"인기"}, {k:"views",l:"조회"}].map(o => (
              <button 
                key={o.k} 
                onClick={() => { setSort(o.k as any); setCurrentPage(1); }}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${sort === o.k ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        {/* 메인 게시글 리스트 영역 */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-8 min-h-[500px] transition-colors">
          {loading ? (
            <div className="p-20 text-center animate-pulse text-muted-foreground font-bold">로딩 중...</div>
          ) : currentPosts.length > 0 ? (
            <ul className="divide-y divide-border">
              {currentPosts.map((post) => (
                <li 
                  key={post.id} 
                  onClick={() => router.push(`/community/${post.id}`)}
                  className="group p-4 hover:bg-accent/50 transition-colors cursor-pointer flex items-center gap-4"
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted border border-border transition-colors">
                    {post.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icons.Image />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded border ${getCategoryBadgeStyle(post.category)}`}>
                        {getCategoryLabel(post.category)}
                      </span>
                      <span className="text-xs text-muted-foreground">· {post.author} · {timeAgo(post.created_at)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {post.title}
                      </h3>
                      {post.comment_count > 0 && (
                        <span className="text-[13px] font-extrabold text-rose-500 flex-shrink-0">
                          [{post.comment_count}]
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-3 text-xs font-medium text-muted-foreground ml-2 hidden sm:flex">
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
            <div className="p-20 text-center text-muted-foreground font-bold">
              <div className="text-3xl mb-3 opacity-50">📂</div>
              조건에 맞는 게시글이 없습니다.
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 0 && (
          <div className="flex justify-center items-center gap-2 mb-8">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed bg-card"
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
                        {showEllipsis && <span className="px-1 text-muted-foreground text-xs">...</span>}
                        <button
                          onClick={() => paginate(number)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                            currentPage === number
                              ? "bg-primary text-primary-foreground shadow-md scale-110"
                              : "bg-card text-foreground hover:bg-accent border border-transparent hover:border-border"
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
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed bg-card text-sm font-medium"
            >
              다음 <Icons.ChevronRight />
            </button>
          </div>
        )}

        {/* 하단 검색창 */}
        <div className="flex justify-center items-center gap-2 mb-8">
          <div className="flex bg-card border border-border rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all overflow-hidden">
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)}
              className="bg-muted border-r border-border text-xs font-bold px-3 py-2 outline-none text-foreground"
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
              className="px-4 py-2 text-sm outline-none w-48 sm:w-64 bg-transparent text-foreground"
            />
            <button onClick={handleSearch} className="px-4 bg-muted hover:bg-accent text-muted-foreground transition-colors">
              <Icons.Search />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}