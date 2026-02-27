"use client";

import { useState } from "react";
import supabase from "@/lib/supabaseClient";

interface CommentFormProps {
  postId: number;
  userId: string | null;
  onCommentAdded: () => void;
  parentId?: number | null; // ⭐ 핵심: 부모 댓글 ID를 받을 수 있게 추가됨!
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

    // ⭐ DB에 전송할 때 parent_id를 함께 보냅니다!
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: userId,
      nickname: userNickname,
      content,
      parent_id: parentId, // <--- 이 부분이 없으면 무조건 일반 댓글이 됩니다.
      created_at: new Date().toISOString(),
    });

    setLoading(false);

    if (!error) {
      setContent("");
      onCommentAdded();
    } else {
      console.error("댓글 등록 오류:", error);
      alert("댓글 등록에 실패했습니다.");
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
        className={`w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-sm resize-none disabled:opacity-50 text-slate-800 placeholder-slate-400 ${parentId ? "min-h-[80px]" : "min-h-[100px]"}`}
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={submitComment}
          disabled={!userId || loading}
          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${
            !userId || loading ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-indigo-500 hover:bg-indigo-400 text-white active:scale-95"
          }`}
        >
          {loading ? "등록 중..." : "등록"}
        </button>
      </div>
    </div>
  );
}