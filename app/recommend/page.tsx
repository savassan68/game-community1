"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { debounce } from "lodash";

const Icons = {
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Sparkles: () => <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
};

type RecommendedGame = {
  id: number;
  title: string;
  image_url: string;
  metacritic: number;
  reason: string;
  genres: string[];
};

export default function RecommendPage() {
  const [mode, setMode] = useState<"logic" | "sentence">("logic");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedGames, setSelectedGames] = useState<any[]>([]);
  const [userInput, setUserInput] = useState("");
  const [recommendations, setRecommendations] = useState<RecommendedGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGames = async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return; }
    const res = await fetch(`https://api.rawg.io/api/games?key=${process.env.NEXT_PUBLIC_RAWG_API_KEY}&search=${query}&page_size=5`);
    const data = await res.json();
    setSearchResults(data.results || []);
  };

  const debouncedSearch = useCallback(debounce(fetchGames, 500), []);

  useEffect(() => { debouncedSearch(searchQuery); }, [searchQuery, debouncedSearch]);

  const toggleGameSelection = (game: any) => {
    if (selectedGames.find((g) => g.id === game.id)) {
      setSelectedGames(selectedGames.filter((g) => g.id !== game.id));
    } else if (selectedGames.length < 3) {
      setSelectedGames([...selectedGames, game]);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const handleGetRecommendation = async () => {
    setIsLoading(true);
    setRecommendations([]);
    try {
      const { data, error } = await supabase.functions.invoke("GameRecommend", {
        body: { mode, selectedGames: selectedGames.map((g) => g.name), userInput: mode === "sentence" ? userInput : "" },
      });
      if (error) throw error;
      setRecommendations(data.recommendations);
    } catch (err) {
      alert("추천 정보를 가져오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <main className="max-w-5xl mx-auto px-4 py-16">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500 uppercase">
            Discovery Engine
          </h1>
        </div>

        {/* Mode Switcher */}
        <div className="flex p-1.5 bg-muted/50 backdrop-blur-md rounded-2xl mb-12 max-w-[280px] mx-auto border border-border">
          {(["logic", "sentence"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${mode === m ? "bg-card shadow-md text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {m === "logic" ? "취향 분석" : "자유 입력"}
            </button>
          ))}
        </div>

        {/* Input Card */}
        <div className="bg-card border border-border rounded-[2.5rem] p-8 sm:p-10 shadow-xl shadow-primary/5 mb-16">
          {mode === "logic" ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">좋아했던 게임 3가지를 선택하세요</h2>
                <span className="text-xs font-black px-3 py-1 bg-primary/10 text-primary rounded-full">{selectedGames.length} / 3</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-5 flex items-center text-muted-foreground"><Icons.Search /></div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="예: The Witcher 3, Hades..."
                  className="w-full pl-14 pr-6 py-5 bg-muted/50 border-none rounded-2xl focus:ring-2 ring-primary transition-all font-medium"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-3 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden divide-y divide-border">
                    {searchResults.map((game) => (
                      <div key={game.id} onClick={() => toggleGameSelection(game)} className="flex items-center gap-4 p-4 hover:bg-muted cursor-pointer transition-colors">
                        <img src={game.background_image} alt="" className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                        <span className="font-bold text-sm">{game.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {selectedGames.map((game) => (
                  <div key={game.id} className="flex items-center gap-2 bg-card border border-primary/30 text-primary px-4 py-2 rounded-xl shadow-sm animate-in zoom-in duration-300">
                    <span className="text-sm font-bold">{game.name}</span>
                    <button onClick={() => toggleGameSelection(game)} className="hover:text-rose-500"><Icons.X /></button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-bold tracking-tight text-center">원하는 플레이 경험을 자유롭게 묘사해주세요</h2>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="예: 사이버펑크적인 분위기 속에서 깊은 서사를 즐길 수 있는 고난도 액션 게임을 찾고 있어."
                className="w-full h-40 p-6 bg-muted/50 border-none rounded-3xl focus:ring-2 ring-primary transition-all text-base leading-relaxed resize-none"
              />
            </div>
          )}
          <button
            onClick={handleGetRecommendation}
            disabled={isLoading || (mode === "logic" && selectedGames.length < 1) || (mode === "sentence" && !userInput)}
            className="w-full mt-10 py-5 bg-primary text-primary-foreground font-black rounded-3xl hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
          >
            {isLoading ? "분석 리포트 작성 중..." : "맞춤 추천 리포트 생성"}
          </button>
        </div>

        {/* Results */}
        {recommendations.length > 0 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <h2 className="text-2xl font-black px-2 tracking-tight">AI 평론가가 선정한 발견</h2>
            <div className="grid grid-cols-1 gap-10">
              {recommendations.map((game) => (
                <div key={game.id} className="group bg-card border border-border rounded-[3rem] overflow-hidden flex flex-col lg:flex-row hover:border-primary/50 transition-all duration-500 shadow-sm hover:shadow-2xl">
                  <div className="w-full lg:w-[45%] h-64 lg:h-auto overflow-hidden">
                    <img src={game.image_url} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  </div>
                  <div className="p-8 lg:p-12 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl lg:text-3xl font-black text-foreground mb-3 tracking-tighter">{game.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          {game.genres.slice(0, 3).map((genre) => (
                            <span key={genre} className="text-[10px] font-black text-primary/70 bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10 uppercase tracking-widest">{genre}</span>
                          ))}
                        </div>
                      </div>
                      {game.metacritic && (
                        <div className="flex flex-col items-center justify-center bg-card border-2 border-emerald-500/20 rounded-2xl p-3 min-w-[70px]">
                          <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-tighter mb-1">Critic</span>
                          <span className="text-2xl font-black text-emerald-500">{game.metacritic}</span>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <p className="text-base lg:text-lg text-muted-foreground leading-relaxed font-medium italic border-l-4 border-primary/40 pl-6 py-2">
                        {game.reason}
                      </p>
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