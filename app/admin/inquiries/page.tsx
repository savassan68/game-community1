"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

const Icons = {
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  XMark: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Mail: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
};

interface Inquiry {
  id: number;
  user_id: string | null;
  email: string;
  category: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
}

const getCategoryLabel = (cat: string) => {
  const map: Record<string, string> = {
    bug: "버그/오류", suggestion: "건의사항", account: "계정", etc: "기타"
  };
  return map[cat] || "기타";
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // 모달(상세보기) 상태
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const fetchInquiries = async () => {
    setLoading(true);
    let query = supabase.from("inquiries").select("*").order("created_at", { ascending: false });
    
    if (filter !== "all") {
      query = query.eq("status", filter);
    }
    
    const { data, error } = await query;
    if (!error && data) {
      setInquiries(data as Inquiry[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInquiries();
  }, [filter]);

  // 상태 변경 (pending <-> resolved)
  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "pending" ? "resolved" : "pending";
    const { error } = await supabase.from("inquiries").update({ status: newStatus }).eq("id", id);
    
    if (!error) {
      setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry({ ...selectedInquiry, status: newStatus });
      }
    } else {
      alert("상태 변경에 실패했습니다.");
    }
  };

  // 문의 삭제
  const deleteInquiry = async (id: number) => {
    if (!confirm("정말 이 문의를 삭제하시겠습니까? 복구할 수 없습니다.")) return;
    
    const { error } = await supabase.from("inquiries").delete().eq("id", id);
    if (!error) {
      setInquiries(prev => prev.filter(inq => inq.id !== id));
      setSelectedInquiry(null); // 모달 닫기
    } else {
      alert("삭제에 실패했습니다.");
    }
  };

  // 검색 필터링 적용 (제목 또는 이메일)
  const filteredInquiries = inquiries.filter(inq => 
    inq.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inq.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Icons.Mail /> 문의사항 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-1">유저들이 남긴 문의와 건의사항을 확인하고 처리합니다.</p>
        </div>
        
        <div className="flex gap-2 bg-card p-1 rounded-xl border border-border shadow-sm w-fit">
          <button onClick={() => setFilter("all")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === "all" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-accent"}`}>전체</button>
          <button onClick={() => setFilter("pending")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === "pending" ? "bg-amber-500 text-white shadow-sm" : "text-muted-foreground hover:bg-accent"}`}>답변 대기</button>
          <button onClick={() => setFilter("resolved")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === "resolved" ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:bg-accent"}`}>처리 완료</button>
        </div>
      </div>

      {/* 검색 바 */}
      <div className="mb-6 relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Icons.Search /></div>
        <input 
          type="text" 
          placeholder="제목이나 이메일로 검색하세요..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
        />
      </div>

      {/* 문의 목록 테이블 */}
      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-sm font-bold text-muted-foreground animate-pulse">데이터를 불러오는 중...</div>
        ) : filteredInquiries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">상태</th>
                  <th className="px-6 py-4">유형</th>
                  <th className="px-6 py-4 w-full">제목</th>
                  <th className="px-6 py-4">이메일</th>
                  <th className="px-6 py-4">접수일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInquiries.map((inq) => (
                  <tr 
                    key={inq.id} 
                    onClick={() => setSelectedInquiry(inq)}
                    className="hover:bg-accent/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${inq.status === 'pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                        {inq.status === 'pending' ? '대기 중' : '처리됨'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground">{getCategoryLabel(inq.category)}</td>
                    <td className="px-6 py-4 font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[200px] sm:max-w-[400px]">{inq.title}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{inq.email}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{formatDate(inq.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-muted-foreground font-bold text-sm">해당 조건의 문의사항이 없습니다.</p>
          </div>
        )}
      </div>

      {/* ⭐ 상세보기 모달 (Modal) */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedInquiry(null)}>
          <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            
            {/* 모달 헤더 */}
            <div className="p-6 border-b border-border flex justify-between items-start bg-muted/20">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${selectedInquiry.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {selectedInquiry.status === 'pending' ? '대기 중' : '처리됨'}
                  </span>
                  <span className="px-2 py-0.5 border border-border rounded text-[10px] font-bold text-muted-foreground bg-background">
                    {getCategoryLabel(selectedInquiry.category)}
                  </span>
                </div>
                <h2 className="text-xl font-black text-foreground">{selectedInquiry.title}</h2>
                <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span><strong className="text-foreground">보낸 사람:</strong> {selectedInquiry.email}</span>
                  <span><strong className="text-foreground">접수일:</strong> {formatDate(selectedInquiry.created_at)}</span>
                </div>
              </div>
              <button onClick={() => setSelectedInquiry(null)} className="p-2 text-muted-foreground hover:bg-accent rounded-full transition-colors">
                <Icons.XMark />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 overflow-y-auto flex-1 bg-background custom-scrollbar">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {selectedInquiry.content}
              </p>
            </div>

            {/* 모달 액션 버튼 하단 바 */}
            <div className="p-4 border-t border-border bg-muted/20 flex flex-wrap justify-between items-center gap-3">
              <button 
                onClick={() => deleteInquiry(selectedInquiry.id)}
                className="px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Icons.Trash /> 삭제
              </button>
              
              <div className="flex gap-2">
                {selectedInquiry.status === 'pending' ? (
                  <button 
                    onClick={() => toggleStatus(selectedInquiry.id, selectedInquiry.status)}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                  >
                    <Icons.Check /> 처리 완료로 변경
                  </button>
                ) : (
                  <button 
                    onClick={() => toggleStatus(selectedInquiry.id, selectedInquiry.status)}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm transition-transform active:scale-95"
                  >
                    대기 중으로 되돌리기
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}