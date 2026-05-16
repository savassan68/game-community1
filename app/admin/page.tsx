"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // ⭐ 페이지 이동을 위한 라우터 추가
import supabase from "@/lib/supabaseClient";

interface UserStat { nickname: string; created_at: string; }
interface ReportStat { id: number; reason: string; status: string; created_at: string; }
interface NoticeStat { id: number; title: string; target_page: string; is_important: boolean; created_at: string; }
interface InquiryStat { id: number; title: string; category: string; status: string; created_at: string; }

const getPageLabel = (id: string) => {
  const map: Record<string, string> = { all: "전체", home: "홈", community: "커뮤니티", review: "평론", ai: "AI 추천", news: "뉴스" };
  return map[id] || "전체";
};

const getInquiryCategoryLabel = (cat: string) => {
  const map: Record<string, string> = { bug: "버그/오류", suggestion: "건의사항", account: "계정", etc: "기타" };
  return map[cat] || "기타";
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalReviews: 0,
    pendingReports: 0,
    pendingInquiries: 0,
  });
  const [recentUsers, setRecentUsers] = useState<UserStat[]>([]);
  const [recentReports, setRecentReports] = useState<ReportStat[]>([]);
  const [recentNotices, setRecentNotices] = useState<NoticeStat[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<InquiryStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const [
        { count: usersCount }, 
        { count: postsCount }, 
        { count: reviewsCount }, 
        { count: reportsCount },
        { count: inquiriesCount }
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('community').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalPosts: postsCount || 0,
        totalReviews: reviewsCount || 0,
        pendingReports: reportsCount || 0,
        pendingInquiries: inquiriesCount || 0,
      });

      const { data: userData } = await supabase.from('user_profiles').select('nickname, created_at').order('created_at', { ascending: false }).limit(5);
      if (userData) setRecentUsers(userData);

      const { data: reportData } = await supabase.from('reports').select('id, reason, status, created_at').order('created_at', { ascending: false }).limit(5);
      if (reportData) setRecentReports(reportData);

      const { data: noticeData } = await supabase.from('notices').select('id, title, target_page, is_important, created_at').order('created_at', { ascending: false }).limit(5);
      if (noticeData) setRecentNotices(noticeData);

      const { data: inquiryData } = await supabase.from('inquiries').select('id, title, category, status, created_at').order('created_at', { ascending: false }).limit(5);
      if (inquiryData) setRecentInquiries(inquiryData);

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const formatSimpleDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="p-10 font-bold text-muted-foreground">데이터 분석 중...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-black text-foreground mb-6 text-indigo-600">대시보드 요약</h2>
      
      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <StatCard title="총 가입 유저" value={`${stats.totalUsers}명`} color="bg-blue-500" />
        <StatCard title="작성된 게시글" value={`${stats.totalPosts}개`} color="bg-emerald-500" />
        <StatCard title="등록된 게임 리뷰" value={`${stats.totalReviews}개`} color="bg-purple-500" />
        <StatCard title="처리 대기 신고" value={`${stats.pendingReports}건`} color="bg-rose-500" />
        {/* ⭐ 클릭 시 문의 관리 페이지로 이동 */}
        <StatCard 
          title="답변 대기 문의" 
          value={`${stats.pendingInquiries}건`} 
          color="bg-amber-500" 
          onClick={() => router.push('/admin/inquiries')} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* 최근 가입 유저 */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <h3 className="font-extrabold text-foreground mb-5">🆕 최근 가입 유저</h3>
          <div className="space-y-3">
            {recentUsers.map((u, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-2xl border border-border/50 text-sm font-bold">
                <span>{u.nickname || "익명"}</span>
                <span className="text-[10px] text-muted-foreground font-medium">{formatSimpleDate(u.created_at)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 신고 내역 */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <h3 className="font-extrabold text-rose-500 mb-5">🚨 최근 신고 내역</h3>
          <div className="space-y-3">
            {recentReports.map((r, i) => (
              <div key={i} className="p-3 bg-rose-50/30 dark:bg-rose-900/5 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                <p className="text-sm font-bold truncate">{r.reason}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatSimpleDate(r.created_at)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 등록 공지 */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <h3 className="font-extrabold text-indigo-500 mb-5">📢 최근 등록 공지</h3>
          <div className="space-y-3">
            {recentNotices.map((n, i) => (
              <div key={i} className="p-3 bg-indigo-50/30 dark:bg-indigo-900/5 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                <div className="flex items-center gap-2 mb-1">
                   <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold">{getPageLabel(n.target_page)}</span>
                   <p className="text-[10px] text-muted-foreground">{formatSimpleDate(n.created_at)}</p>
                </div>
                <p className="text-sm font-bold truncate">{n.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 접수 문의 */}
        {/* ⭐ 헤더 클릭 시 문의 관리 페이지로 이동하는 기능 추가 */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-extrabold text-amber-500">✉️ 최근 접수 문의</h3>
            <button 
              onClick={() => router.push('/admin/inquiries')}
              className="text-[10px] font-bold text-muted-foreground hover:text-amber-500 transition-colors"
            >
              전체보기 &gt;
            </button>
          </div>
          <div className="space-y-3">
            {recentInquiries.length > 0 ? recentInquiries.map((inq, i) => (
              <div 
                key={i} 
                onClick={() => router.push('/admin/inquiries')}
                className="p-3 bg-amber-50/30 dark:bg-amber-900/5 rounded-2xl border border-amber-100 dark:border-amber-900/20 cursor-pointer hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                    {getInquiryCategoryLabel(inq.category)}
                  </span>
                  <p className="text-[10px] text-muted-foreground">{formatSimpleDate(inq.created_at)}</p>
                </div>
                <p className="text-sm font-bold truncate">{inq.title}</p>
              </div>
            )) : <p className="text-center py-10 text-xs text-muted-foreground">접수된 문의가 없습니다.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, onClick }: { title: string, value: string, color: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-card border border-border p-6 rounded-3xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full ${color}`}></div>
      <p className="text-sm font-bold text-muted-foreground mb-1 ml-2">{title}</p>
      <p className="text-3xl font-black text-foreground ml-2">{value}</p>
    </div>
  );
}