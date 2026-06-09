"use client";

import React, { useState } from "react";
import supabase from "@/lib/supabaseClient";
import Link from "next/link";

type TabType = "id" | "password";

export default function AccountRecoveryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("password");
  
  // 비밀번호 찾기 상태
  const [email, setEmail] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  // 아이디(이메일) 찾기 상태
  const [nickname, setNickname] = useState("");
  const [idLoading, setIdLoading] = useState(false);
  const [foundId, setFoundId] = useState<string | null>(null);
  const [idError, setIdError] = useState<string | null>(null);

  // ⭐ 비밀번호 재설정 로직
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setPwMessage(null);
    setPwError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;
      setPwMessage("비밀번호 재설정 링크를 이메일로 보냈습니다. 메일함을 확인해주세요!");
    } catch (error: any) {
      setPwError(error.message || "오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPwLoading(false);
    }
  };

  // ⭐ 아이디 찾기 로직 (예시: 닉네임으로 검색)
  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdLoading(true);
    setFoundId(null);
    setIdError(null);

    try {
      // 주의: Supabase 보안상 이메일은 user_profiles 테이블에 따로 저장해두어야 검색이 가능합니다.
      const { data, error } = await supabase
        .from("user_profiles")
        .select("email")
        .eq("nickname", nickname)
        .maybeSingle();

      if (error || !data?.email) throw new Error("입력하신 닉네임과 일치하는 계정을 찾을 수 없습니다.");

      // 이메일 마스킹 처리 (예: ga*******@gmail.com)
      const emailParts = data.email.split("@");
      const maskedEmail = emailParts[0].substring(0, 2) + "*".repeat(Math.max(emailParts[0].length - 2, 3)) + "@" + emailParts[1];
      
      setFoundId(`회원님의 가입 이메일은 [ ${maskedEmail} ] 입니다.`);
    } catch (error: any) {
      setIdError(error.message);
    } finally {
      setIdLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-card rounded-3xl shadow-lg overflow-hidden border border-border p-8 transition-colors">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-foreground mb-2 transition-colors">계정 찾기 🔍</h1>
          <p className="text-muted-foreground text-sm transition-colors">
            잃어버린 계정 정보를 찾아드립니다.
          </p>
        </div>

        {/* ⭐ 탭 UI */}
        <div className="flex mb-6 bg-muted/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("id")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === "id" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            아이디 찾기
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === "password" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            비밀번호 찾기
          </button>
        </div>

        {/* ⭐ 아이디 찾기 탭 */}
        {activeTab === "id" && (
          <div className="animate-fade-in">
            {foundId ? (
              <div className="mb-6 p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/30 text-indigo-800 dark:text-indigo-300 text-sm font-bold rounded-2xl text-center flex flex-col gap-3 transition-colors">
                <span className="text-3xl">🎉</span>
                {foundId}
                <button onClick={() => setActiveTab("password")} className="mt-2 text-xs underline hover:text-indigo-600 dark:hover:text-indigo-400">
                  비밀번호도 찾으시겠습니까?
                </button>
              </div>
            ) : (
              <form onSubmit={handleFindId} className="space-y-4">
                {idError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive font-bold text-sm rounded-xl flex items-center gap-2 transition-colors">
                    ⚠️ {idError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1.5 transition-colors">가입 시 등록한 닉네임</label>
                  <input
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-colors font-medium text-foreground placeholder:text-muted-foreground"
                    placeholder="닉네임을 입력해주세요"
                  />
                </div>
                <button
                  type="submit"
                  disabled={idLoading}
                  className={`w-full py-3.5 mt-2 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] ${
                    idLoading ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  {idLoading ? "검색 중..." : "아이디 찾기"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ⭐ 비밀번호 찾기 탭 (기존 코드 연동) */}
        {activeTab === "password" && (
          <div className="animate-fade-in">
            {pwMessage ? (
              <div className="mb-6 p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold rounded-2xl text-center flex flex-col gap-3 transition-colors">
                <span className="text-3xl">✅</span>
                {pwMessage}
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {pwError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive font-bold text-sm rounded-xl flex items-center gap-2 transition-colors">
                    ⚠️ {pwError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1.5 transition-colors">이메일 (아이디)</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-colors font-medium text-foreground placeholder:text-muted-foreground"
                    placeholder="name@example.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className={`w-full py-3.5 mt-2 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] ${
                    pwLoading ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  {pwLoading ? "전송 중..." : "재설정 링크 보내기"}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="mt-8 text-center text-sm border-t border-border pt-6 transition-colors">
          <Link href="/auth/login" className="text-muted-foreground hover:text-primary font-bold flex items-center justify-center gap-1 transition-colors">
            <span>←</span> 로그인 페이지로 돌아가기
          </Link>
        </div>

      </div>
    </div>
  );
}