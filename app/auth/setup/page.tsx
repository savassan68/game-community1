"use client";

import React, { useState, useEffect } from "react";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SetupProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (!username.trim() || !nickname.trim()) {
        throw new Error("아이디와 닉네임을 모두 입력해주세요.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("로그인 정보가 없습니다.");

      // 1. 아이디 중복 검사
      const { data: existingUser } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("username", username.trim())
        .maybeSingle();

      if (existingUser && existingUser.id !== session.user.id) {
        throw new Error("이미 사용 중인 아이디입니다.");
      }

      // 2. 닉네임 중복 검사
      const { data: existingNickname } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("nickname", nickname.trim())
        .maybeSingle();

      if (existingNickname && existingNickname.id !== session.user.id) {
        throw new Error("이미 사용 중인 닉네임입니다.");
      }

      // 3. 프로필 정보 업데이트 (또는 삽입)
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          id: session.user.id,
          username: username.trim(),
          nickname: nickname.trim(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      alert("프로필 설정이 완료되었습니다! 환영합니다 🎉");
      router.push("/"); // 메인 페이지로 이동
      router.refresh(); // 헤더 등 상태 업데이트

    } catch (error: any) {
      setErrorMsg(error.message || "프로필 설정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4 py-10">
      <div className="max-w-md w-full bg-card rounded-3xl shadow-lg border border-border p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold mb-2">마지막 단계입니다! ✨</h1>
          <p className="text-muted-foreground text-sm">커뮤니티에서 사용할 아이디와 닉네임을 설정해주세요.</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive font-bold text-sm rounded-xl">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-1.5">아이디</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-foreground"
              placeholder="사용할 영문 아이디"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-1.5">닉네임</label>
            <input
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-foreground"
              placeholder="커뮤니티에서 보일 이름"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-6 rounded-xl font-bold text-sm shadow-md bg-primary text-primary-foreground hover:opacity-90 transition-all"
          >
            {loading ? "저장 중..." : "GameSeed 시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}