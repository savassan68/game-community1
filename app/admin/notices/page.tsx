"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

interface Notice {
  id: number;
  created_at: string;
  title: string;
  content: string;
  author: string;
  is_important: boolean;
}

const Icons = {
  Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Megaphone: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
};

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ⭐ 모달용 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);

  // 데이터 불러오기
  const fetchNotices = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .order("is_important", { ascending: false }) // 중요한 공지를 위로
      .order("created_at", { ascending: false }); // 그 다음 최신순
    
    if (!error && data) setNotices(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // 공지사항 작성 (DB 전송)
  const submitNotice = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      return alert("제목과 내용을 모두 입력해주세요.");
    }

    // 현재 로그인한 관리자 정보 가져오기 (이름 넣기 용도)
    const { data: { session } } = await supabase.auth.getSession();
    let authorName = "관리자";
    if (session?.user?.id) {
      const { data: profile } = await supabase.from("user_profiles").select("nickname").eq("id", session.user.id).single();
      if (profile) authorName = profile.nickname;
    }

    const { error } = await supabase.from("notices").insert({
      title: newTitle,
      content: newContent,
      author: authorName,
      is_important: isImportant
    });

    if (error) {
      alert("공지사항 등록 실패!");
      console.error(error);
      return;
    }

    alert("공지사항이 등록되었습니다.");
    setIsModalOpen(false);
    setNewTitle("");
    setNewContent("");
    setIsImportant(false);
    fetchNotices(); // 목록 새로고침
  };

  // 공지사항 삭제
  const deleteNotice = async (id: number) => {
    if (!confirm("정말 이 공지사항을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (!error) {
      alert("삭제되었습니다.");
      fetchNotices();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  if (isLoading) return <div className="p-10 text-center font-bold text-gray-500">불러오는 중...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 헤더 및 작성 버튼 */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 tracking-tight">📢 공지사항 관리</h2>
          <p className="text-sm text-muted-foreground mt-1">유저들에게 보여질 전체 공지사항을 작성하고 관리합니다.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors"
        >
          <Icons.Plus /> 새 공지 작성
        </button>
      </div>

      {/* 공지사항 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 font-bold w-16">분류</th>
              <th className="px-6 py-4 font-bold">제목</th>
              <th className="px-6 py-4 font-bold w-24">작성자</th>
              <th className="px-6 py-4 font-bold w-32">등록일</th>
              <th className="px-6 py-4 font-bold w-20 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {notices.map((notice) => (
              <tr key={notice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4">
                  {notice.is_important ? (
                    <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-[10px] font-black tracking-wider">필독</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">일반</span>
                  )}
                </td>
                <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{notice.title}</td>
                <td className="px-6 py-4 font-medium text-gray-500">{notice.author}</td>
                <td className="px-6 py-4 text-gray-400 text-xs">{formatDate(notice.created_at)}</td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => deleteNotice(notice.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Icons.Trash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {notices.length === 0 && <div className="p-10 text-center text-gray-400 font-bold">등록된 공지사항이 없습니다.</div>}
      </div>

      {/* ⭐ 공지사항 작성 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-border bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                <span className="text-indigo-600"><Icons.Megaphone /></span> 새 공지사항 작성
              </h3>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">제목</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="공지사항 제목을 입력하세요"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">내용</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="공지 내용을 자세히 적어주세요. (줄바꿈이 그대로 적용됩니다)"
                  className="w-full h-64 px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-2 w-fit">
                <input 
                  type="checkbox" 
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                />
                <span className="text-sm font-bold text-red-500">중요 공지로 등록 (목록 최상단 고정)</span>
              </label>
            </div>

            <div className="p-4 bg-muted/30 flex justify-end gap-3 border-t border-border mt-auto">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                onClick={submitNotice}
                className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
              >
                등록하기
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}