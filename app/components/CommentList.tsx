"use client";

import { useState } from "react";
import supabase from "@/lib/supabaseClient";
import CommentForm from "./CommentForm"; // ⭐ 대댓글 창을 띄우기 위해 불러옵니다.

interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  nickname?: string;
  content: string;
  created_at: string;
  parent_id?: number | null; // ⭐ 부모 ID
}

interface CommentListProps {
  comments: Comment[];
  currentUserId: string | null;
  onCommentUpdated: () => void;
  postId: number; // ⭐ 대댓글 달 때 사용할 게시물 ID
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

export default function CommentList({
  comments,
  currentUserId,
  onCommentUpdated,
  postId,
}: CommentListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingId, setReplyingId] = useState<number | null>(null); // ⭐ 답글 달기 상태 관리

  // 🔹 일반 댓글(부모)과 대댓글(자식)을 분리합니다.
  const parentComments = comments.filter((c) => !c.parent_id);
  const childComments = comments.filter((c) => c.parent_id);

  const startEdit = (c: Comment) => {
    setEditingId(c.id);
    setEditContent(c.content);
    setReplyingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const submitEdit = async (id: number) => {
    if (!editContent.trim()) return alert("내용을 입력해주세요.");
    const { error } = await supabase.from("comments").update({ content: editContent }).eq("id", id);
    if (!error) onCommentUpdated();
    cancelEdit();
  };

  const deleteComment = async (id: number) => {
    if (!confirm("정말 이 댓글을 삭제하시겠습니까? (대댓글도 함께 삭제됩니다)")) return;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (!error) onCommentUpdated();
  };

  if (comments.length === 0)
    return <div className="py-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">첫 번째 댓글을 남겨보세요!</div>;

  // 🔹 댓글 항목을 그려주는 공통 컴포넌트 함수
  const renderCommentItem = (c: Comment, isReply: boolean = false) => (
    <div className={`flex items-start gap-3 ${isReply ? "py-3" : "py-5"} group`}>
      {/* 아바타 */}
      <div className={`flex-shrink-0 rounded-full flex items-center justify-center font-bold border border-slate-200 ${isReply ? "w-8 h-8 bg-indigo-50 text-indigo-500 text-xs" : "w-10 h-10 bg-slate-100 text-slate-500 text-sm"}`}>
        {(c.nickname || "U").charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-slate-800 text-sm">{c.nickname || "익명 사용자"}</span>
          <span className="text-xs text-slate-400">{timeAgo(c.created_at)}</span>
        </div>

        {/* 수정 모드 */}
        {editingId === c.id ? (
          <div className="mt-2 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <textarea className="w-full bg-transparent text-sm text-slate-800 resize-none outline-none min-h-[60px]" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
            <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-200">
              <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg">취소</button>
              <button onClick={() => submitEdit(c.id)} className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg">저장</button>
            </div>
          </div>
        ) : (
          /* 일반 보기 모드 */
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mt-0.5">{c.content}</div>
        )}

        {/* 액션 버튼들 (답글, 수정, 삭제) */}
        {!editingId && (
          <div className="flex items-center gap-3 mt-2">
            {!isReply && currentUserId && (
              <button onClick={() => setReplyingId(replyingId === c.id ? null : c.id)} className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 transition-colors">
                {replyingId === c.id ? "답글 취소" : "답글 달기"}
              </button>
            )}
            {currentUserId === c.user_id && (
              <>
                <button onClick={() => startEdit(c)} className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100">수정</button>
                <button onClick={() => deleteComment(c.id)} className="text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">삭제</button>
              </>
            )}
          </div>
        )}

        {/* 대댓글 입력 폼 렌더링 */}
        {replyingId === c.id && (
          <div className="mt-2">
            <CommentForm
              postId={postId}
              userId={currentUserId}
              parentId={c.id}
              autoFocus={true}
              onCommentAdded={() => {
                setReplyingId(null);
                onCommentUpdated();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ul className="divide-y divide-slate-100">
      {parentComments.map((parent) => {
        // 이 부모 댓글에 달린 자식 댓글들만 찾아서, 옛날 것이 위로 오게 정렬
        const replies = childComments
          .filter((child) => child.parent_id === parent.id)
          .sort((a, b) => a.id - b.id);

        return (
          <li key={parent.id} className="relative">
            {/* 부모 댓글 렌더링 */}
            {renderCommentItem(parent, false)}

            {/* 자식(대댓글) 렌더링 - 들여쓰기 효과 */}
            {replies.length > 0 && (
              <ul className="ml-8 pl-4 border-l-2 border-indigo-50 mt-1 mb-4 space-y-1">
                {replies.map((reply) => (
                  <li key={reply.id}>{renderCommentItem(reply, true)}</li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}