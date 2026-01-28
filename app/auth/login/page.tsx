"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [rememberMe, setRememberMe] = useState(true);

  // 🔹 구글 로그인
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      alert("구글 로그인 오류: " + error.message);
    }
  };

  // ✅ [수정됨] 네이버 로그인 핸들러 (타입 에러 수정 & 아이콘 적용)
  const handleNaverLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "naver" as any, // 'naver' 타입 에러 방지용 as any
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      alert("네이버 로그인 오류: " + error.message);
    }
  };

  // 🔹 일반 로그인 (아이디 or 이메일 처리)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      let finalEmail = loginId.trim();

      // 1. 입력값이 이메일 형식(@)이 아니면 -> 아이디로 간주하고 이메일 찾기
      if (!loginId.includes("@")) {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("email")
          .eq("username", loginId)
          .single();

        if (error || !data) {
          throw new Error("존재하지 않는 아이디입니다.");
        }
        finalEmail = data.email;
      }

      // 2. 로그인 시도
      const { error } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password,
      });

      if (error) throw error;

      router.push("/");
      router.refresh();
    } catch (error: any) {
      if (error.message.includes("Invalid login")) {
        setErrorMsg("아이디(이메일) 또는 비밀번호가 잘못되었습니다.");
      } else {
        setErrorMsg(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">로그인 👋</h1>
          <p className="text-gray-500 text-sm">아이디 또는 이메일로 로그인하세요.</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              아이디 또는 이메일
            </label>
            <input
              type="text"
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="user_id 또는 name@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer select-none">
                로그인 유지
              </label>
            </div>
            
            <div className="text-sm">
              <Link 
                href="/auth/reset-password" 
                className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
              >
                아이디/비밀번호 찾기
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-bold text-sm shadow-md transition-all ${
              loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "로그인 중..." : "로그인하기"}
          </button>
        </form>

        {/* 소셜 로그인 영역 */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* 구글 버튼 */}
          <button
            onClick={handleGoogleLogin}
            className="mt-6 w-full py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold text-sm shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google로 계속하기
          </button>

          <button
  onClick={handleNaverLogin}
  className="mt-3 w-full py-3 rounded-lg bg-[#03C75A] text-white font-bold text-sm shadow-sm hover:bg-[#02b351] transition-all flex items-center justify-center gap-2"
>
  {/* 👇 수정된 네이버 아이콘 (더 선명한 버전) */}
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.156L16.624 24H24V0h-7.727v12.845z" />
  </svg>
  Naver로 계속하기
</button>
        </div>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">계정이 없으신가요? </span>
          <Link href="/auth/signup" className="text-indigo-600 hover:underline font-bold">
            회원가입하기
          </Link>
        </div>
      </div>
    </div>
  );
}