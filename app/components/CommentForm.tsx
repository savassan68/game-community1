"use client";

import { useState } from "react";
import supabase from "@/lib/supabaseClient";

interface CommentFormProps {
  postId: number;
  userId: string | null;
  onCommentAdded: () => void;
  parentId?: number | null;
  autoFocus?: boolean;
}

export default function CommentForm({
  postId,
  userId,
  onCommentAdded,
  parentId = null,
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const submitComment = async () => {
    if (!userId) return alert("댓글을 작성하려면 로그인해야 합니다.");
    if (!content.trim()) return alert("댓글 내용을 입력해주세요.");

    setLoading(true);

    try {
      // 1. 내 정보(닉네임) 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      const fallbackNickname = user?.email ? user.email.split('@')[0] : "알 수 없는 유저";
      
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("nickname")
        .eq("id", userId)
        .single();
        
      const myNickname = profile?.nickname || fallbackNickname;

      // 2. 댓글 DB에 등록하기
      const { error: insertError } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: userId,
        nickname: myNickname, // 정확한 닉네임으로 저장
        content,
        parent_id: parentId,
        created_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      // ==========================================
      // ⭐ 3. 알림(Notification) 발송 로직 ⭐
      // ==========================================
      let targetUserId = null;
      let notiType = "comment";
      let notiMessage = "회원님의 게시글에 새로운 댓글을 남겼습니다.";

      if (parentId) {
        // [경우 A] 대댓글(답글)인 경우 -> 부모 댓글 작성자를 찾아서 알림
        const { data: parentComment } = await supabase
          .from("comments")
          .select("user_id")
          .eq("id", parentId)
          .single();
          
        if (parentComment) {
          targetUserId = parentComment.user_id;
          notiType = "reply";
          notiMessage = "회원님의 댓글에 답글을 남겼습니다.";
        }
      } else {
        // [경우 B] 일반 댓글인 경우 -> 게시글 작성자를 찾아서 알림
        const { data: postData } = await supabase
          .from("community")
          .select("user_id")
          .eq("id", postId)
          .single();
          
        if (postData) {
          targetUserId = postData.user_id;
        }
      }

      // 타겟이 존재하고, 내 글/내 댓글에 내가 쓴 게 아닐 때만 알림 전송!
      if (targetUserId && targetUserId !== userId) {
        await supabase.from("notifications").insert({
          user_id: targetUserId,
          type: notiType,
          actor_nickname: myNickname,
          message: notiMessage,
          link: `/community/${postId}`,
        });
      }
      // ==========================================

      // 성공 처리
      setContent("");
      onCommentAdded();
      
    } catch (error) {
      console.error("댓글 등록/알림 오류:", error);
      alert("댓글 등록 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={parentId ? "mt-3" : "mt-6"}>
      <textarea
        autoFocus={autoFocus}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={userId ? (parentId ? "답글을 입력하세요." : "매너있는 댓글을 남겨주세요.") : "로그인 후 이용 가능합니다."}
        disabled={!userId || loading}
        className={`
          w-full p-4 
          bg-muted border border-border 
          rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 
          focus:bg-card transition-all text-sm resize-none 
          disabled:opacity-50 text-foreground placeholder-muted-foreground
          ${parentId ? "min-h-[80px]" : "min-h-[100px]"}
        `}
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={submitComment}
          disabled={!userId || loading}
          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${
            !userId || loading 
              ? "bg-muted text-muted-foreground cursor-not-allowed" 
              : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
          }`}
        >
          {loading ? "등록 중..." : "등록"}
        </button>
      </div>
    </div>
  );
}