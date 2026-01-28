"use client";

import React, { useState } from "react";
import supabase from "@/lib/supabaseClient";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      // Supabase 비밀번호 재설정 이메일 발송
      // 사용자가 이메일의 링크를 클릭하면 /auth/update-password 페이지로 이동하게 설정
      // (주의: 실제 배포 시에는 사이트 도메인으로 바꿔야 합니다)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      setMessage("비밀번호 재설정 링크를 이메일로 보냈습니다. 메일함을 확인해주세요!");
    } catch (error: any) {
      setErrorMsg(error.message || "오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">비밀번호 찾기 🔐</h1>
          <p className="text-gray-500 text-sm">
            가입한 이메일을 입력하시면<br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        {/* 성공 메시지 */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 text-sm rounded-lg text-center">
            <div className="text-2xl mb-2">✅</div>
            {message}
          </div>
        )}

        {/* 에러 메시지 */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
            ⚠️ {errorMsg}
          </div>
        )}

        {!message && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="name@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-bold text-sm shadow-md transition-all ${
                loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? "전송 중..." : "재설정 링크 보내기"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link href="/auth/login" className="text-gray-500 hover:text-indigo-600 font-medium flex items-center justify-center gap-1">
            <span>←</span> 로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}