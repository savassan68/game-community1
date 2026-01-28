"use client";

import React, { useState } from "react";
import supabase from "@/lib/supabaseClient";
import Link from "next/link";

export default function SignupPage() {
  // 입력 필드 상태 관리
  const [username, setUsername] = useState(""); // 아이디
  const [email, setEmail] = useState(""); // 이메일
  const [password, setPassword] = useState(""); // 비밀번호
  const [confirmPassword, setConfirmPassword] = useState(""); // 비밀번호 확인
  const [nickname, setNickname] = useState(""); // 닉네임
  
  // 이미지 관련 상태
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 이미지 선택 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      // 미리보기 URL 생성
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. 유효성 검사
      if (password !== confirmPassword) {
        throw new Error("비밀번호가 일치하지 않습니다.");
      }
      if (password.length < 6) {
        throw new Error("비밀번호는 6자 이상이어야 합니다.");
      }

      let avatarUrl = "";

      // 2. 프로필 이미지 업로드 (이미지가 있다면)
      if (profileImage) {
        const fileExt = profileImage.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 'avatars' 버킷에 업로드
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, profileImage);

        if (uploadError) throw uploadError;

        // 업로드된 이미지의 공개 URL 가져오기
        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        avatarUrl = data.publicUrl;
      }

      // 3. 회원가입 요청
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // 추가 정보는 data 객체에 담습니다.
          data: {
            username,   // 아이디
            nickname,   // 닉네임
            avatar_url: avatarUrl, // 프로필 사진 주소
          },
        },
      });

      if (error) throw error;
      setSuccessMsg("가입 인증 메일을 보냈습니다! 이메일을 확인해주세요.");

    } catch (error: any) {
      setErrorMsg(error.message || "회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 px-4 py-10">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">회원가입 🚀</h1>
          <p className="text-gray-500 text-sm">GameSeed의 회원이 되어주세요.</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">이메일을 확인해주세요!</h3>
            <p className="text-gray-600 text-sm mb-6">{successMsg}</p>
            <Link href="/auth/login" className="text-indigo-600 hover:underline font-bold text-sm">
              로그인 페이지로 돌아가기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            
            {/* 📸 프로필 사진 업로드 */}
            <div className="flex flex-col items-center mb-6">
              <label className="relative cursor-pointer group">
                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-indigo-500 transition-colors">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-gray-400">📷</span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full shadow-md">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
              <span className="text-xs text-gray-500 mt-2">프로필 사진 선택</span>
            </div>

            {/* 🆔 아이디 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="사용할 아이디 입력"
              />
            </div>

            {/* 📛 닉네임 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="커뮤니티에서 보일 이름"
              />
            </div>

            {/* 📧 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일 주소</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="name@example.com"
              />
            </div>

            {/* 🔒 비밀번호 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="6자 이상"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none ${
                    confirmPassword && password !== confirmPassword 
                      ? "border-red-300 focus:ring-red-200" 
                      : "border-gray-300 focus:ring-indigo-500"
                  }`}
                  placeholder="비밀번호 재입력"
                />
              </div>
            </div>
            {confirmPassword && password !== confirmPassword && (
               <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-bold text-sm shadow-md transition-all mt-4 ${
                loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? "가입 처리 중..." : "회원가입하기"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm border-t pt-4">
          <span className="text-gray-500">이미 계정이 있으신가요? </span>
          <Link href="/auth/login" className="text-indigo-600 hover:underline font-bold">
            로그인하기
          </Link>
        </div>
      </div>
    </div>
  );
}