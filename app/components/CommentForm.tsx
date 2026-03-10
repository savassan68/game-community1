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

    const { data: { user } } = await supabase.auth.getUser();
    const userNickname = user?.email ? user.email.split('@')[0] : "알 수 없는 유저";

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: userId,
      nickname: userNickname,
      content,
      parent_id: parentId,
      created_at: new Date().toISOString(),
    });

    setLoading(true); // 로딩 해제는 아래에서 처리

    if (!error) {
      setContent("");
      onCommentAdded();
    } else {
      console.error("댓글 등록 오류:", error);
      alert("댓글 등록에 실패했습니다.");
    }
    setLoading(false);
  };

  return (
    <div className={parentId ? "mt-3" : "mt-6"}>
      {/* ⭐ bg-slate-50 -> bg-muted/50, focus:bg-white -> focus:bg-background 로 변경 */}
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