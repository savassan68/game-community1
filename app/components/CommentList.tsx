"use client";

import { useState } from "react";
import supabase from "@/lib/supabaseClient";
import CommentForm from "./CommentForm"; 

// ⭐ 대댓글용 꺾인 화살표 아이콘 추가
const Icons = {
  CornerDownRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4v11a2 2 0 002 2h10" /></svg>
};

interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  nickname?: string;
  content: string;
  created_at: string;
  parent_id?: number | null;
}

interface CommentListProps {
  comments: Comment[];
  currentUserId: string | null;
  onCommentUpdated: () => void;
  postId: number;
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
  const [replyingId, setReplyingId] = useState<number | null>(null);

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
    return (
      <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border transition-colors font-bold text-sm">
        <div className="text-3xl mb-2 opacity-50">💬</div>
        첫 번째 댓글을 남겨보세요!
      </div>
    );

  const renderCommentItem = (c: Comment, isReply: boolean = false) => (
    <div className={`flex items-start gap-3 ${isReply ? "py-3" : "py-5"} group transition-colors`}>
      
      {/* 아바타 영역 */}
      <div className={`flex-shrink-0 rounded-full flex items-center justify-center font-bold border border-border shadow-sm transition-colors ${
        isReply 
        ? "w-8 h-8 bg-primary/10 text-primary text-xs" 
        : "w-10 h-10 bg-muted text-muted-foreground text-sm"
      }`}>
        {(c.nickname || "U").charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-extrabold text-foreground text-sm">{c.nickname || "익명 사용자"}</span>
          <span className="text-xs font-bold text-muted-foreground">{timeAgo(c.created_at)}</span>
        </div>

        {editingId === c.id ? (
          <div className="mt-2 bg-background border border-primary/30 shadow-sm p-3 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <textarea className="w-full bg-transparent text-sm text-foreground resize-none outline-none min-h-[60px]" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
            <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-border">
              <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">취소</button>
              <button onClick={() => submitEdit(c.id)} className="px-3 py-1.5 text-xs font-bold text-primary-foreground bg-primary shadow-sm hover:opacity-90 rounded-lg transition-colors">저장</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap mt-0.5">{c.content}</div>
        )}

        {/* 버튼 영역 */}
        {!editingId && (
          <div className="flex items-center gap-3 mt-2.5">
            {!isReply && currentUserId && (
              <button onClick={() => setReplyingId(replyingId === c.id ? null : c.id)} className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors">
                {replyingId === c.id ? "답글 취소" : "답글 달기"}
              </button>
            )}
            {currentUserId === c.user_id && (
              <>
                <button onClick={() => startEdit(c)} className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100">수정</button>
                <button onClick={() => deleteComment(c.id)} className="text-[11px] font-bold text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">삭제</button>
              </>
            )}
          </div>
        )}

        {/* 답글 입력 폼 */}
        {replyingId === c.id && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
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
    <ul className="divide-y divide-border transition-colors">
      {parentComments.map((parent) => {
        const replies = childComments
          .filter((child) => child.parent_id === parent.id)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        return (
          <li key={parent.id} className="relative">
            {renderCommentItem(parent, false)}

            {/* 대댓글 렌더링 영역 */}
            {replies.length > 0 && (
              <ul className="ml-5 sm:ml-12 mt-1 mb-4 space-y-1">
                {replies.map((reply) => (
                  <li key={reply.id} className="flex gap-2 sm:gap-3 items-start">
                    {/* ⭐ 꺾인 화살표 아이콘 적용 */}
                    <div className="mt-4 text-border flex-shrink-0">
                      <Icons.CornerDownRight />
                    </div>
                    <div className="flex-1 min-w-0 bg-muted/30 rounded-2xl px-3 sm:px-4">
                      {renderCommentItem(reply, true)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}