"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "../../../lib/supabaseClient";
import CommentForm from "../../components/CommentForm";
import CommentList from "../../components/CommentList";

// 🔹 아이콘 컴포넌트
const Icons = {
  Heart: ({ filled }: { filled?: boolean }) => (
    <svg className={`w-5 h-5 transition-colors ${filled ? "text-rose-500 fill-rose-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Eye: () => <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Message: () => <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  Share: () => <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
  MoreVertical: () => <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  ArrowLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
};

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  user_id?: string; // 작성자 ID 확인용 (DB에 있다고 가정)
  image_url?: string;
  views: number;
  likes: number;
  created_at?: string;
  comment_count?: number;
  category?: string;
}

interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  nickname: string;
  content: string;
  created_at: string;
}

// 🔹 시간 변환 유틸
function timeAgo(dateString?: string) {
  if (!dateString) return "";
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "방금 전";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return past.toLocaleDateString();
}

// 🔹 카테고리 라벨링 (이전 코드와 통일)
const getCategoryLabel = (cat?: string) => {
  const map: Record<string, string> = { strategy: "공략", humor: "유머", question: "질문", free: "자유" };
  return map[cat || "free"] || "자유";
};

export default function DetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 조회수 중복 증가 방지
  const viewUpdated = useRef(false);

  // 🔹 인증 체크
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setCurrentUserId(data.session?.user?.id || null);
    };
    checkAuth();
  }, []);

  // 🔹 데이터 로드
  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("community")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setPost({
        ...data,
        // 카테고리가 없다면 임의로 할당 (DB 마이그레이션 전까지 호환성 유지)
        category: data.category || "free" 
      } as Post);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", id)
      .order("id", { ascending: true }); //  (시간순/오름차순 정렬)

    if (!error && data) setComments(data as Comment[]);
  };

  const increaseView = async () => {
    if (!id) return;
    const { error } = await supabase.rpc("increase_views", { post_id: Number(id) });
    if (error) console.error("조회수 증가 에러:", error);
  };

const handleLike = async () => {
    if (!currentUserId) return alert("로그인이 필요합니다.");
    if (!id) return;

    // 🚨 기존에 있던 "낙관적 업데이트 (UI 먼저 반영)" 코드 삭제 완료!

    const { data, error } = await supabase.rpc("toggle_like", {
      p_post_id: Number(id),
      p_user_id: currentUserId
    });

    if (error) {
      console.error("추천 에러:", error);
      alert("오류가 발생했습니다.");
    } else {
      if (data === false) {
        // 취소된 경우 (여기 있던 상태 강제 변경 코드도 삭제함)
        alert("추천을 취소했습니다.");
      } else {
        // 추가된 경우
        alert("추천했습니다!");
      }
      
      // 알림창 확인 후, DB에서 정확한 숫자를 다시 불러와서 화면에 반영
      fetchPost(); 
    }
  };

  const deletePost = async () => {
    if (!confirm("정말 이 글을 삭제하시겠습니까?\n삭제된 글은 복구할 수 없습니다.")) return;
    const { error } = await supabase.from("community").delete().eq("id", id);
    if (!error) {
      alert("삭제되었습니다.");
      router.push("/community");
    }
  };

  useEffect(() => {
    if (id && !viewUpdated.current) {
      viewUpdated.current = true;
      increaseView();
      fetchPost();
      fetchComments();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-32 bg-slate-200 rounded mb-4"></div>
          <div className="h-4 w-48 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!post) return <div className="p-20 text-center text-slate-500">글을 찾을 수 없습니다.</div>;

  // 🔹 작성자 본인 여부 확인 (작성자 ID가 DB에 있거나, 닉네임이 같다고 가정)
  // 실제 서비스에선 user_id로 비교하는 것이 안전합니다.
  const isAuthor = currentUserId && (post.user_id === currentUserId || post.author === user?.email);

  return (
    <div className="min-h-screen bg-[#F8FAFC]"> {/* 배경색: 아주 연한 블루그레이 */}
      
      {/* 🔹 헤더 (메인/커뮤니티와 통일) */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <button onClick={() => router.push("/")} className="text-2xl font-black tracking-tight text-indigo-600">
            GameSeed<span className="text-indigo-400">.</span>
          </button>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                 <button onClick={() => router.push("/mypage")} className="text-xs font-bold text-slate-600 hover:text-indigo-600">마이페이지</button>
                 <button onClick={async () => { await supabase.auth.signOut(); router.refresh(); }} className="text-xs text-slate-500 hover:text-slate-800">로그아웃</button>
              </div>
            ) : (
              <button onClick={() => router.push("/auth/login")} className="text-sm font-semibold text-slate-600">로그인</button>
            )}
          </div>
        </div>
      </header>

      {/* 🔹 본문 컨테이너 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        
        {/* 네비게이션 & 옵션 */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => router.push("/community")} 
            className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
          >
            <Icons.ArrowLeft /> 목록으로
          </button>

          {/* 작성자 본인만 보이는 수정/삭제 버튼 */}
          {isAuthor && (
            <div className="flex gap-2">
              <button onClick={() => router.push(`/community/${id}/edit`)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                <Icons.Edit /> 수정
              </button>
              <button onClick={deletePost} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 bg-white border border-rose-100 rounded-md hover:bg-rose-50 transition-colors">
                <Icons.Trash /> 삭제
              </button>
            </div>
          )}
        </div>

        {/* 🔹 글 상세 카드 */}
        <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* 헤더 영역 */}
          <div className="p-8 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-4">
               <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">
                 {getCategoryLabel(post.category)}
               </span>
               <span className="text-slate-400 text-xs">·</span>
               <span className="text-slate-500 text-xs">{timeAgo(post.created_at)}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-6">
              {post.title}
            </h1>

            <div className="flex items-center justify-between">
              {/* 작성자 정보 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {post.author?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{post.author || "알 수 없음"}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="flex items-center gap-1"><Icons.Eye /> {post.views}</span>
                    <span className="flex items-center gap-1"><Icons.Message /> {comments.length}</span>
                  </div>
                </div>
              </div>
              
              {/* 공유 버튼 (기능은 추후 구현) */}
              <button className="text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-slate-50">
                <Icons.Share />
              </button>
            </div>
          </div>

          {/* 본문 영역 */}
          <div className="p-8 min-h-[300px]">
            {/* Prose 클래스로 텍스트 스타일링 최적화 */}
            <div 
              className="prose prose-slate prose-lg max-w-none prose-img:rounded-xl prose-a:text-indigo-600 hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />
          </div>

          {/* 하단 액션 (좋아요) */}
          <div className="py-10 flex justify-center border-t border-slate-50 bg-slate-50/30">
             <button 
               onClick={handleLike}
               className="group flex flex-col items-center gap-2 px-8 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-rose-200 transition-all active:scale-95"
             >
               <div className="p-2 rounded-full bg-slate-50 group-hover:bg-rose-50 transition-colors">
                  <Icons.Heart filled={post.likes > 0} />
               </div>
               <span className="text-sm font-bold text-slate-600 group-hover:text-rose-500">
                 추천 {post.likes}
               </span>
             </button>
          </div>
        </article>

        {/* 🔹 댓글 영역 */}
        <div className="mt-8">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
             <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
               댓글 <span className="text-indigo-600">{comments.length}</span>
             </h3>
             
             {/* 댓글 작성 폼 */}
             <div className="mb-8">
               <CommentForm postId={Number(id)} userId={currentUserId} onCommentAdded={fetchComments} />
             </div>

             {/* 댓글 리스트 */}
             <div className="divide-y divide-slate-100">
               <CommentList comments={comments} currentUserId={currentUserId} onCommentUpdated={fetchComments} postId={Number(id)} />
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}