"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

const Icons = {
  ArrowLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Mail: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Send: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  CheckCircle: () => <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
};

export default function InquiryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // 폼 상태 관리
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("bug"); // 기본값: 버그 제보
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 로그인 상태 확인 (로그인된 유저라면 이메일을 자동으로 채워줌)
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        if (session.user.email) setEmail(session.user.email);
      }
    };
    checkUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !title || !content) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("inquiries").insert({
        user_id: user?.id || null,
        email,
        category,
        title,
        content,
      });

      if (error) throw error;
      
      // 제출 성공!
      setIsSuccess(true);
    } catch (error) {
      console.error("문의 접수 에러:", error);
      alert("문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 성공 화면
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-card p-10 rounded-3xl shadow-lg border border-border flex flex-col items-center max-w-md w-full text-center animate-in zoom-in-95 duration-500">
          <Icons.CheckCircle />
          <h2 className="text-2xl font-black mt-6 mb-2 text-foreground">소중한 의견 감사합니다!</h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            보내주신 문의사항이 정상적으로 접수되었습니다.<br/>
            남겨주신 이메일로 빠르게 답변 드리겠습니다.
          </p>
          <button 
            onClick={() => router.push("/")}
            className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 기본 폼 화면
  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-accent"
          >
            <Icons.ArrowLeft />
          </button>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2">
            <Icons.Mail /> 1:1 문의사항
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-3xl shadow-sm border border-border p-6 sm:p-10">
          <p className="text-sm text-muted-foreground mb-8">
            서비스 이용 중 불편한 점이나 건의사항이 있으신가요? <br className="hidden sm:block"/>
            어떤 의견이든 편하게 남겨주시면 더 나은 GameSeed를 만드는 데 큰 도움이 됩니다!
          </p>

          <div className="space-y-6">
            {/* 이메일 입력 */}
            <div>
              <label className="block text-sm font-bold mb-2 text-foreground">답변 받을 이메일 <span className="text-rose-500">*</span></label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                required
              />
            </div>

            {/* 문의 유형 선택 */}
            <div>
              <label className="block text-sm font-bold mb-2 text-foreground">문의 유형 <span className="text-rose-500">*</span></label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
              >
                <option value="bug">🐛 버그 및 오류 제보</option>
                <option value="suggestion">💡 서비스 건의사항</option>
                <option value="account">👤 계정 관련 문의</option>
                <option value="etc">💬 기타 문의</option>
              </select>
            </div>

            {/* 제목 입력 */}
            <div>
              <label className="block text-sm font-bold mb-2 text-foreground">제목 <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="문의하실 내용의 제목을 적어주세요"
                className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                required
              />
            </div>

            {/* 내용 입력 */}
            <div>
              <label className="block text-sm font-bold mb-2 text-foreground">문의 내용 <span className="text-rose-500">*</span></label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="발생한 문제나 건의사항을 최대한 자세히 적어주시면 더 빠르고 정확한 처리가 가능합니다."
                className="w-full h-48 px-4 py-4 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                required
              />
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-border flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-8 py-3.5 font-bold rounded-xl text-white shadow-md transition-all ${isSubmitting ? "bg-primary/50 cursor-not-allowed" : "bg-primary hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0"}`}
            >
              {isSubmitting ? "전송 중..." : "문의 접수하기"} <Icons.Send />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}