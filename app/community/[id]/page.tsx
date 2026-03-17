"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "../../../lib/supabaseClient"; 
import CommentForm from "../../components/CommentForm";
import CommentList from "../../components/CommentList";

const Icons = {
  Heart: ({ filled }: { filled?: boolean }) => (
    <svg className={`w-5 h-5 transition-colors ${filled ? "text-rose-500 fill-rose-500" : "text-muted-foreground"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Eye: () => <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Message: () => <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  Share: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
  ArrowLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Bookmark: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>,
  Alert: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
};

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  user_id?: string;
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

  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  const viewUpdated = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setCurrentUserId(data.session?.user?.id || null);
    };
    checkAuth();
  }, []);

  const fetchPost = async () => {
    const { data, error } = await supabase.from("community").select("*").eq("id", id).single();
    if (!error && data) {
      setPost({ ...data, category: data.category || "free" } as Post);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase.from("comments").select("*").eq("post_id", id).order("id", { ascending: true });
    if (!error && data) setComments(data as Comment[]);
  };

  const increaseView = async () => {
    if (!id) return;
    await supabase.rpc("increase_views", { post_id: Number(id) });
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  };

  // ⭐ 이모지 제거됨
  const handleLike = async () => {
    if (!currentUserId) return triggerToast("로그인이 필요합니다.");
    const { data, error } = await supabase.rpc("toggle_like", { p_post_id: Number(id), p_user_id: currentUserId });
    if (error) return triggerToast("오류가 발생했습니다.");
    triggerToast(data === false ? "추천을 취소했습니다." : "추천했습니다.");
    fetchPost(); 
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title || 'GameSeed 게시글',
          text: '이 게시글을 확인해보세요!',
          url: currentUrl,
        });
      } catch (error) {
        console.log("공유 취소", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(currentUrl);
        triggerToast("게시글 주소가 복사되었습니다.");
      } catch (error) {
        triggerToast("주소 복사에 실패했습니다.");
      }
    }
  };

  const handleScrap = async () => {
    if (!currentUserId) return triggerToast("로그인이 필요합니다.");
    triggerToast("게시글이 스크랩 되었습니다.");
  };

  const handleReport = async () => {
    if (!currentUserId) return triggerToast("로그인이 필요합니다.");
    const confirmed = confirm("이 게시글을 신고하시겠습니까? 허위 신고 시 제재를 받을 수 있습니다.");
    if (confirmed) {
      triggerToast("신고가 정상적으로 접수되었습니다.");
    }
  };

  const deletePost = async () => {
    if (!confirm("정말 이 글을 삭제하시겠습니까?")) return;
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-32 bg-muted rounded mb-4"></div>
          <div className="h-4 w-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!post) return <div className="p-20 text-center text-muted-foreground">글을 찾을 수 없습니다.</div>;

  const isAuthor = currentUserId && (post.user_id === currentUserId || post.author === user?.email);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-hidden">
      
      <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 pointer-events-none ${
        showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}>
        <div className="bg-slate-800 text-white px-5 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2 whitespace-nowrap">
          {toastMsg}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => router.push("/community")} 
            className="flex items-center gap-1 text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
          >
            <Icons.ArrowLeft /> 목록으로
          </button>

          {isAuthor && (
            <div className="flex gap-2">
              <button onClick={() => router.push(`/community/${id}/edit`)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-foreground bg-card border border-border rounded-md hover:bg-accent transition-colors">
                <Icons.Edit /> 수정
              </button>
              <button onClick={deletePost} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-destructive bg-card border border-destructive/20 rounded-md hover:bg-destructive/10 transition-colors">
                <Icons.Trash /> 삭제
              </button>
            </div>
          )}
        </div>

        <article className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden transition-colors">
          <div className="p-8 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
               <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                 {getCategoryLabel(post.category)}
               </span>
               <span className="text-muted-foreground text-xs">·</span>
               <span className="text-muted-foreground text-xs">{timeAgo(post.created_at)}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight mb-6">
              {post.title}
            </h1>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm">
                  {post.author?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{post.author || "알 수 없음"}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center gap-1"><Icons.Eye /> {post.views}</span>
                    <span className="flex items-center gap-1"><Icons.Message /> {comments.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 min-h-[300px]">
            <div 
              className="prose dark:prose-invert prose-slate prose-lg max-w-none prose-img:rounded-xl prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />
          </div>

          <div className="py-10 flex flex-col items-center justify-center border-t border-border bg-muted/20">
             
             <button 
               onClick={handleLike}
               className="group flex flex-col items-center gap-2 px-8 py-3 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-rose-500/50 transition-all active:scale-95"
             >
               <div className="p-2 rounded-full bg-muted group-hover:bg-rose-500/10 transition-colors">
                  <Icons.Heart filled={post.likes > 0} />
               </div>
               <span className="text-sm font-bold text-muted-foreground group-hover:text-rose-500">
                 추천 {post.likes}
               </span>
             </button>

             <div className="flex items-center gap-4 sm:gap-6 mt-6">
               
               <button 
                 onClick={handleShare}
                 className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
               >
                 <Icons.Share /> 공유
               </button>
               
               {currentUserId && (
                 <>
                   <div className="w-px h-3 bg-border"></div>
                   <button 
                     onClick={handleScrap}
                     className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                   >
                     <Icons.Bookmark /> 스크랩
                   </button>
                   
                   <div className="w-px h-3 bg-border"></div>
                   <button 
                     onClick={handleReport}
                     className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-destructive transition-colors"
                   >
                     <Icons.Alert /> 신고하기
                   </button>
                 </>
               )}
             </div>
          </div>
        </article>

        <div className="mt-8">
           <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8 transition-colors">
             <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
               댓글 <span className="text-primary">{comments.length}</span>
             </h3>
             
             <div className="mb-8">
               <CommentForm postId={Number(id)} userId={currentUserId} onCommentAdded={fetchComments} />
             </div>

             <div className="divide-y divide-border">
               <CommentList comments={comments} currentUserId={currentUserId} onCommentUpdated={fetchComments} postId={Number(id)} />
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}