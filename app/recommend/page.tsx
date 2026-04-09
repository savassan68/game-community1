"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

const Icons = {
  Refresh: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  External: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
};

const QUESTIONS = [
  { id: "playTime", label: " 플레이 타임 (분량)", options: ["단판/단기 (3시간 미만)", "표준 볼륨 (15시간 내외)", "장기 몰입 (40시간 이상)"] },
  { id: "energy", label: " 체감 난이도", options: ["쉬움 (부담없이 즐기기)", "보통 (적당한 도전)", "어려움 (하드코어)", "하드코어 (극한의 고난도)"] },
  { id: "emotion", label: " 선호하는 경험", options: ["힐링", "아드레날린과 쾌감", "긴장감, 공포", "지적인 능력"] },
  { id: "social", label: " 사회적 상호작용", options: ["철저하게 혼자", "느슨한 연대/협동", "친구와 왁자지껄"] },
  { id: "aesthetic", label: " 아트 스타일", options: ["사실적인 그래픽", "독창적인 카툰/동화", "레트로한 도트/픽셀"] }
];

export default function RecommendPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"logic" | "sentence">("logic");
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [userInput, setUserInput] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleGetRecommendation = async (retry = false) => {
    if (retry) setIsRefreshing(true);
    else { setIsLoading(true); setRecommendations([]); }
    
    try {
      const { data, error } = await supabase.functions.invoke("GameRecommend", {
        body: { mode, selections, userInput, isRetry: retry },
      });
      if (error) throw error;
      setRecommendations(data.recommendations);
    } catch (err) {
      alert("추천 정보를 가져오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const isAllSelected = QUESTIONS.every(q => selections[q.id]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <main className="max-w-5xl mx-auto px-4 py-16">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500 uppercase">Discovery Engine</h1>
        </div>

        <div className="bg-card border border-border rounded-[3rem] p-8 sm:p-12 shadow-xl mb-16">
          <div className="flex p-1 bg-muted rounded-2xl mb-12 max-w-xs mx-auto border border-border">
            {(["logic", "sentence"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 text-[11px] font-black rounded-xl transition-all uppercase tracking-widest ${mode === m ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}>
                {m === "logic" ? "맞춤 설정" : "자율 묘사"}
              </button>
            ))}
          </div>

          {mode === "logic" ? (
            <div className="space-y-12">
              {QUESTIONS.map((q) => (
                <div key={q.id} className="space-y-5">
                  <h3 className="font-black text-xs text-muted-foreground uppercase tracking-widest px-2">{q.label}</h3>
                  <div className="flex flex-wrap gap-3">
                    {q.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setSelections(prev => ({ ...prev, [q.id]: opt }))}
                        className={`px-6 py-3.5 rounded-2xl text-xs font-bold transition-all border-2 ${selections[q.id] === opt ? "bg-primary border-primary text-primary-foreground shadow-lg scale-105" : "bg-muted/20 border-transparent hover:border-border text-muted-foreground"}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="원하는 게임의 분위기나 특징을 자유롭게 묘사해주세요." className="w-full h-48 p-8 bg-muted/50 border-none rounded-[2.5rem] focus:ring-2 ring-primary transition-all text-base resize-none" />
          )}

          <button onClick={() => handleGetRecommendation(false)} disabled={isLoading || (mode === "logic" && !isAllSelected)} className="w-full mt-16 py-6 bg-primary text-primary-foreground font-black rounded-[2rem] hover:scale-[1.01] transition-all shadow-xl shadow-primary/30 disabled:opacity-50 uppercase tracking-widest">
            {isLoading ? "분석중" : "추천 받기"}
          </button>
        </div>

        {recommendations.length > 0 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-2xl font-black tracking-tight">AI 큐레이션 리포트</h2>
              <button onClick={() => handleGetRecommendation(true)} disabled={isRefreshing} className="flex items-center gap-2 text-[11px] font-black text-primary bg-primary/5 px-6 py-3 rounded-full border border-primary/20 hover:bg-primary/10 transition-all active:scale-95">
                <div className={isRefreshing ? "animate-spin" : ""}><Icons.Refresh /></div>
                {isRefreshing ? "다른 게임 찾는 중..." : "다른 리스트 추천받기"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-12">
              {recommendations.map((game) => (
                <div key={game.id} className="group bg-card border border-border rounded-[3.5rem] overflow-hidden flex flex-col lg:flex-row hover:border-primary/40 transition-all duration-700 shadow-sm hover:shadow-2xl">
                  <div className="w-full lg:w-[42%] h-80 lg:h-auto overflow-hidden">
                    <img src={game.image_url} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  </div>
                  <div className="p-10 lg:p-16 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-8">
                      <h3 className="text-3xl lg:text-4xl font-black tracking-tighter leading-tight">{game.title}</h3>
                      {game.metacritic && <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-2xl text-2xl font-black border border-emerald-500/20">{game.metacritic}</div>}
                    </div>
                    <p className="text-lg text-muted-foreground leading-relaxed border-l-4 border-primary/30 pl-8 py-2 mb-10 italic font-medium">{game.reason}</p>
                    <div className="flex flex-wrap gap-4">
                      <button onClick={() => router.push(`/review/${game.id}`)} className="px-8 py-4 bg-muted hover:bg-muted/80 text-[11px] font-black rounded-2xl transition-all border border-border tracking-widest uppercase">커뮤니티 리뷰</button>
                      <a href={game.purchase_url} target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-primary text-primary-foreground text-[11px] font-black rounded-2xl transition-all flex items-center gap-3 shadow-lg shadow-primary/20 hover:scale-105 tracking-widest uppercase">
                        <Icons.External /> 플레이하러 가기
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}