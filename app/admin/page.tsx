// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalReviews: 0,
    pendingReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // 1. 총 유저 수 가계산 (profiles 테이블 기준)
      const { count: usersCount } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
      
      // 2. 총 커뮤니티 게시글 수
      const { count: postsCount } = await supabase.from('community').select('*', { count: 'exact', head: true });
      
      // 3. 총 게임 리뷰 수
      const { count: reviewsCount } = await supabase.from('reviews').select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: usersCount || 0,
        totalPosts: postsCount || 0,
        totalReviews: reviewsCount || 0,
        pendingReports: 0, // 신고하기 DB는 아직 안 만들었으므로 일단 0
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) return <div className="p-10 font-bold text-muted-foreground">데이터를 불러오는 중...</div>;

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-black text-foreground mb-6">대시보드 요약</h2>
      
      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="총 가입 유저" value={`${stats.totalUsers}명`} color="bg-blue-500" />
        <StatCard title="작성된 게시글" value={`${stats.totalPosts}개`} color="bg-emerald-500" />
        <StatCard title="등록된 게임 리뷰" value={`${stats.totalReviews}개`} color="bg-purple-500" />
        <StatCard title="처리 대기중인 신고" value={`${stats.pendingReports}건`} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <h3 className="font-extrabold text-foreground mb-4">최근 가입한 유저 (준비 중)</h3>
          <div className="h-48 bg-muted/30 rounded-2xl border border-dashed border-border flex items-center justify-center text-muted-foreground font-bold text-sm">
            리스트가 여기에 표시됩니다
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <h3 className="font-extrabold text-rose-500 mb-4">최근 접수된 신고 (준비 중)</h3>
          <div className="h-48 bg-muted/30 rounded-2xl border border-dashed border-border flex items-center justify-center text-muted-foreground font-bold text-sm">
            리스트가 여기에 표시됩니다
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string, value: string, color: string }) {
  return (
    <div className="bg-card border border-border p-6 rounded-3xl shadow-sm relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${color}`}></div>
      <p className="text-sm font-bold text-muted-foreground mb-1 ml-2">{title}</p>
      <p className="text-3xl font-black text-foreground ml-2">{value}</p>
    </div>
  );
}