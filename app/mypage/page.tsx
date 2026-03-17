"use client";

import { useEffect, useState, useRef, Suspense } from "react";
// ⭐ useSearchParams 추가 (헤더에서 ?tab= 으로 넘어오는 걸 감지하기 위해)
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";

// ⭐ TabType에 scraps 추가
type TabType = "info" | "security" | "scraps" | "posts" | "comments" | "messages";

const Icons = {
  User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  ShieldCheck: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  FileText: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>,
  MessageCircle: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  Mail: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  ArrowLeft: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Heart: () => <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>,
  Camera: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Send: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  Gamepad: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>,
  Bookmark: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg> // ⭐ 북마크 아이콘 추가
};

// next/navigation의 useSearchParams를 쓰려면 Suspense로 감싸는 것이 좋습니다.
export default function MyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
      </div>
    }>
      <MyPageContent />
    </Suspense>
  );
}

function MyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ⭐ URL 파라미터 가져오기
  const tabQuery = searchParams.get("tab") as TabType | null;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("info");

  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myComments, setMyComments] = useState<any[]>([]);
  const [myMessages, setMyMessages] = useState<any[]>([]);
  const [steamGames, setSteamGames] = useState<any[]>([]);
  const [myScraps, setMyScraps] = useState<any[]>([]); // ⭐ 스크랩 상태 추가

  const [newNickname, setNewNickname] = useState("");
  const [updating, setUpdating] = useState(false);
  
  const [steamIdInput, setSteamIdInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [targetAction, setTargetAction] = useState<"username" | "email" | null>(null);
  const [authPassword, setAuthPassword] = useState("");
  const [editSecurityForm, setEditSecurityForm] = useState({ username: "", email: "" });

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageReceiver, setMessageReceiver] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [expandedMsgId, setExpandedMsgId] = useState<number | null>(null);

  // ⭐ URL에 tab 파라미터가 있으면 해당 탭으로 설정
  useEffect(() => {
    if (tabQuery && ["info", "security", "scraps", "posts", "comments", "messages"].includes(tabQuery)) {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);

  useEffect(() => {
    fetchData();
  }, []);

  // 실시간 통신 안테나 세우기
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          console.log("실시간 새 쪽지 도착!", payload.new);
          setMyMessages((prevMessages) => [payload.new, ...prevMessages]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert("로그인이 필요합니다.");
        router.push("/auth/login");
        return;
      }

      setUserId(session.user.id);
      setUserEmail(session.user.email || "");

      const { data: profileData } = await supabase.from("user_profiles").select("*").eq("id", session.user.id).single();
      if (profileData) {
        setProfile(profileData);
        setNewNickname(profileData.nickname || "");
        setEditSecurityForm({ username: profileData.username || "", email: session.user.email || "" });
        if (profileData.steam_id) setSteamIdInput(profileData.steam_id);
      }

      const { data: gamesData } = await supabase
        .from("user_owned_games")
        .select("*")
        .eq("user_id", session.user.id)
        .order("playtime_forever", { ascending: false })
        .limit(20);
      
      if (gamesData) setSteamGames(gamesData);

      const { data: postsData } = await supabase.from("community").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
      if (postsData) setMyPosts(postsData);

      const { data: commentsData } = await supabase.from("comments").select("*, community(title)").eq("user_id", session.user.id).order("created_at", { ascending: false });
      if (commentsData) setMyComments(commentsData);

      const { data: msgsData } = await supabase.from("messages").select("*").eq("receiver_id", session.user.id).order("created_at", { ascending: false });
      if (msgsData) setMyMessages(msgsData);

      // ⭐ 스크랩 내역 가져오기 (community 테이블 정보 포함)
      const { data: scrapsData } = await supabase
        .from("scraps")
        .select("*, community(id, title, likes, created_at)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (scrapsData) setMyScraps(scrapsData);

    } catch (error: any) {
      console.error("데이터 로딩 실패:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSteamSync = async () => {
    if (!steamIdInput.trim()) return alert("스팀 64비트 ID를 입력해주세요.");
    
    setIsSyncing(true);
    try {
      const res = await fetch("/api/steam/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steamId: steamIdInput.trim(), userId }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "동기화에 실패했습니다.");

      alert(`스팀 연동 완료! 총 ${data.gameCount}개의 게임 정보를 불러왔습니다. 🎮`);
      fetchData(); 
    } catch (error: any) {
      alert("오류: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateNickname = async () => {
    if (!newNickname.trim()) return alert("닉네임을 입력해주세요.");
    setUpdating(true);
    try {
      const { error } = await supabase.from("user_profiles").update({ nickname: newNickname }).eq("id", userId);
      if (error) throw error;
      setProfile({ ...profile, nickname: newNickname });
      alert("닉네임이 변경되었습니다! ✨");
    } catch (e: any) {
      alert("변경 실패: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('user_profiles').update({ avatar_url: publicUrl }).eq('id', userId);
      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      alert("프로필 사진이 변경되었습니다! 📸");
    } catch (error: any) {
      alert("업로드 실패: " + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const openAuthModal = (action: "username" | "email") => {
    setTargetAction(action);
    setAuthPassword("");
    setShowAuthModal(true);
  };

  const handleSecurityUpdate = async () => {
    if (!authPassword) return alert("비밀번호를 입력해주세요.");
    setUpdating(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: userEmail, password: authPassword });
      if (authError) throw new Error("비밀번호가 일치하지 않습니다.");

      if (targetAction === "username") {
        const { error } = await supabase.from("user_profiles").update({ username: editSecurityForm.username }).eq("id", userId);
        if (error) throw new Error("이미 사용 중인 아이디거나 오류가 발생했습니다.");
        setProfile({ ...profile, username: editSecurityForm.username });
        alert("아이디가 변경되었습니다!");
      } 
      else if (targetAction === "email") {
        const { error } = await supabase.auth.updateUser({ email: editSecurityForm.email });
        if (error) throw error;
        alert("새 이메일로 확인 메일이 발송되었습니다.");
      }
      setShowAuthModal(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageReceiver.trim() || !messageContent.trim()) {
      return alert("받는 사람의 닉네임과 내용을 모두 입력해주세요!");
    }
    if (messageReceiver === profile?.nickname) {
      return alert("자신에게는 쪽지를 보낼 수 없습니다.");
    }

    setSendingMessage(true);
    try {
      const { data: receiverData, error: receiverError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("nickname", messageReceiver)
        .single();

      if (receiverError || !receiverData) {
        throw new Error("해당 닉네임을 가진 유저를 찾을 수 없습니다. 닉네임을 확인해주세요.");
      }

      const { error: insertError } = await supabase
        .from("messages")
        .insert({
          sender_id: userId,
          receiver_id: receiverData.id,
          sender_nickname: profile?.nickname || "익명",
          content: messageContent,
        });

      if (insertError) throw insertError;

      alert("쪽지를 성공적으로 보냈습니다! ✈️");
      setShowMessageModal(false);
      setMessageReceiver("");
      setMessageContent("");
    } catch (error: any) {
      alert("전송 실패: " + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleGameClick = async (gameTitle: string) => {
    try {
      const { data: game, error } = await supabase
        .from("games")
        .select("id")
        .ilike("title", `%${gameTitle}%`)
        .maybeSingle();

      if (error) throw error;

      if (game) {
        router.push(`/review/${game.id}`);
      } else {
        alert(`아직 GameSeed에 등록되지 않은 게임입니다. (${gameTitle})`);
      }
    } catch (err) {
      console.error("게임 검색 중 오류:", err);
      alert("페이지 이동 중 오류가 발생했습니다.");
    }
  };

  const TabButton = ({ id, label, icon }: { id: TabType; label: string; icon: any }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        router.push(`/mypage?tab=${id}`, { scroll: false }); // URL 업데이트
      }}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-xl transition-all ${
        activeTab === id
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-muted-foreground hover:bg-accent hover:text-primary"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center transition-colors">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground font-bold text-sm">유저 정보를 불러오는 중...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 relative transition-colors duration-300">
      
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl shadow-xl max-w-sm w-full p-8 animate-fade-in-up border border-border transition-colors">
            <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
              <Icons.ShieldCheck />
            </div>
            <h3 className="text-xl font-extrabold text-foreground mb-2">보안을 위해 비밀번호를 입력해주세요</h3>
            <p className="text-sm text-muted-foreground mb-6">민감한 정보를 변경하기 전, 본인 확인 절차가 필요합니다.</p>
            <input 
              type="password" 
              placeholder="현재 비밀번호 입력" 
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-4 focus:ring-destructive/10 focus:border-destructive outline-none transition-all mb-6 font-medium text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowAuthModal(false)} className="flex-1 py-3 bg-muted text-muted-foreground font-bold rounded-xl hover:bg-accent transition-colors">취소</button>
              <button onClick={handleSecurityUpdate} disabled={updating} className="flex-1 py-3 bg-destructive text-white font-bold rounded-xl shadow-md hover:bg-destructive/90 active:scale-95 transition-all disabled:opacity-50">
                {updating ? "확인 중..." : "인증하고 변경"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl shadow-xl max-w-md w-full p-8 animate-fade-in-up border border-border transition-colors">
            <h3 className="text-xl font-extrabold text-foreground mb-6 flex items-center gap-2">
              <Icons.Mail /> 새 쪽지 보내기
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">받는 사람 (닉네임)</label>
                <input 
                  type="text" 
                  placeholder="정확한 닉네임을 입력하세요" 
                  value={messageReceiver}
                  onChange={(e) => setMessageReceiver(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-foreground placeholder:text-muted-foreground"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">내용</label>
                <textarea 
                  placeholder="보낼 메시지를 작성해주세요" 
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full h-32 px-4 py-3 bg-muted border border-border rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-foreground resize-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowMessageModal(false)} 
                className="flex-1 py-3 bg-muted text-muted-foreground font-bold rounded-xl hover:bg-accent transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleSendMessage} 
                disabled={sendingMessage} 
                className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sendingMessage ? "전송 중..." : <><Icons.Send /> 전송하기</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
          <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden text-center relative transition-colors">
            <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 dark:brightness-90 transition-all"></div>
            <div className="px-6 pb-6 relative">
              <div className="relative w-24 h-24 mx-auto -mt-12 mb-3 z-10">
                <div className="w-full h-full rounded-full bg-card p-1.5 shadow-md cursor-pointer group transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-4xl overflow-hidden relative transition-colors">
                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : "👾"}
                  </div>
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-8 h-8 bg-primary border-2 border-card rounded-full shadow-sm flex items-center justify-center text-primary-foreground hover:opacity-90 active:scale-95 transition-all z-20">
                  <Icons.Camera />
                </button>
              </div>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarUpload} />
              <h2 className="font-extrabold text-xl text-foreground">{profile?.nickname || "닉네임 없음"}</h2>
              <p className="text-xs text-primary font-bold mt-1 tracking-wide">@{profile?.username}</p>
              
              {profile?.steam_id && (
                <div className="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-[#171a21] dark:bg-[#1b2838] text-white text-[10px] font-bold rounded-full shadow-sm">
                   Steam 연동 완료
                </div>
              )}
            </div>
          </div>

          <nav className="bg-card p-3 rounded-3xl shadow-sm border border-border space-y-1 transition-colors">
            <TabButton id="info" label="기본 정보 설정" icon={<Icons.User />} />
            <TabButton id="security" label="계정 및 보안" icon={<Icons.ShieldCheck />} />
            <div className="h-px bg-border my-2 mx-2 transition-colors"></div>
            {/* ⭐ 스크랩 탭 추가 */}
            <TabButton id="scraps" label="나의 스크랩" icon={<Icons.Bookmark />} />
            <TabButton id="posts" label="작성글" icon={<Icons.FileText />} />
            <TabButton id="comments" label="작성댓글" icon={<Icons.MessageCircle />} />
            <TabButton id="messages" label="쪽지함" icon={<Icons.Mail />} />
          </nav>

        </aside>

        <main className="lg:col-span-8 xl:col-span-9">
          
          {activeTab === "info" && (
            <div className="bg-card p-6 sm:p-10 rounded-3xl shadow-sm border border-border transition-all">
              <h3 className="text-xl font-extrabold mb-8 text-foreground border-b border-border pb-4 transition-colors">⚙️ 기본 정보 설정</h3>
              
              <div className="max-w-xl space-y-10">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">커뮤니티 닉네임</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input type="text" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} placeholder="새로운 닉네임을 입력하세요" className="flex-1 px-5 py-3.5 bg-muted border border-border rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-foreground placeholder:text-muted-foreground" />
                    <button onClick={handleUpdateNickname} disabled={updating || newNickname === profile?.nickname} className="px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed whitespace-nowrap">
                      {updating ? "저장 중..." : "변경 저장"}
                    </button>
                  </div>
                </div>

                <div className="pt-8 border-t border-border">
                  <label className="block text-sm font-bold text-muted-foreground mb-2">스팀 계정 연동 (Steam 64 ID)</label>
                  <p className="text-xs text-muted-foreground mb-4">스팀 64비트 ID를 연동하면 리뷰 작성 시 플레이 시간이 인증 배지로 표시됩니다.</p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      value={steamIdInput} 
                      onChange={(e) => setSteamIdInput(e.target.value)} 
                      placeholder="예: 76561198000000000" 
                      className="flex-1 px-5 py-3.5 bg-muted border border-border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-foreground placeholder:text-muted-foreground" 
                    />
                    <button 
                      onClick={handleSteamSync}
                      disabled={isSyncing || !steamIdInput.trim()}
                      className="px-8 py-3.5 bg-[#171a21] hover:bg-[#2a475e] dark:bg-[#1b2838] dark:hover:bg-[#2a475e] text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2"
                    >
                      {isSyncing ? "동기화 중..." : "스팀 데이터 동기화"}
                    </button>
                  </div>
                  
                  {profile?.last_steam_sync && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">
                      ✅ 최근 동기화 완료: {new Date(profile.last_steam_sync).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {steamGames.length > 0 && (
                <div className="mt-12 pt-10 border-t border-border">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-extrabold flex items-center gap-2">
                      <Icons.Gamepad /> 가장 많이 플레이한 게임
                    </h4>
                    <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      TOP 20
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {steamGames.map((game) => (
                      <div 
                        key={game.appid}
                        onClick={() => handleGameClick(game.game_title)}
                        className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center text-center hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer"
                      >
                        {game.img_icon_url ? (
                          <img 
                            src={game.img_icon_url} 
                            alt={game.game_title} 
                            className="w-14 h-14 rounded-xl mb-3 shadow-sm group-hover:scale-105 transition-transform" 
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl mb-3 bg-muted flex items-center justify-center text-xl font-black text-muted-foreground shadow-sm group-hover:scale-105 transition-transform">
                            {game.game_title[0]}
                          </div>
                        )}
                        <div className="text-sm font-extrabold text-foreground line-clamp-1 w-full px-1" title={game.game_title}>
                          {game.game_title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1.5 font-bold bg-muted/50 px-2.5 py-1 rounded-md">
                          {(game.playtime_forever / 60).toFixed(1)}시간
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-card p-6 sm:p-10 rounded-3xl shadow-sm border border-border transition-all">
              <div className="flex items-center gap-3 mb-8 border-b border-border pb-4 transition-colors">
                <div className="w-10 h-10 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center transition-colors"><Icons.ShieldCheck /></div>
                <div>
                  <h3 className="text-xl font-extrabold text-foreground transition-colors">계정 및 보안 설정</h3>
                  <p className="text-xs text-muted-foreground mt-1 font-medium transition-colors">소중한 개인정보를 안전하게 관리하세요.</p>
                </div>
              </div>
              <div className="space-y-8 max-w-xl">
                <div className="bg-muted/30 p-6 rounded-2xl border border-border transition-colors">
                  <label className="block text-sm font-bold text-muted-foreground mb-2 transition-colors">고유 아이디</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input type="text" value={editSecurityForm.username} onChange={(e) => setEditSecurityForm({...editSecurityForm, username: e.target.value})} className="flex-1 px-5 py-3 bg-muted border border-border rounded-xl focus:border-destructive outline-none font-medium text-foreground transition-colors" />
                    <button onClick={() => openAuthModal("username")} disabled={editSecurityForm.username === profile?.username} className="px-6 py-3 bg-card border border-border text-muted-foreground font-bold rounded-xl hover:bg-accent hover:text-foreground transition-all disabled:opacity-50">아이디 변경</button>
                  </div>
                </div>
                <div className="bg-muted/30 p-6 rounded-2xl border border-border transition-colors">
                  <label className="block text-sm font-bold text-muted-foreground mb-2 transition-colors">연결된 이메일</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input type="email" value={editSecurityForm.email} onChange={(e) => setEditSecurityForm({...editSecurityForm, email: e.target.value})} className="flex-1 px-5 py-3 bg-muted border border-border rounded-xl focus:border-destructive outline-none font-medium text-foreground transition-colors" />
                    <button onClick={() => openAuthModal("email")} disabled={editSecurityForm.email === userEmail} className="px-6 py-3 bg-card border border-border text-muted-foreground font-bold rounded-xl hover:bg-accent hover:text-foreground transition-all disabled:opacity-50">이메일 변경</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ⭐ 새로 추가된 스크랩 탭 UI */}
          {activeTab === "scraps" && (
            <div className="bg-card p-6 sm:p-10 rounded-3xl shadow-sm border border-border transition-all">
              <div className="flex items-center justify-between mb-8 border-b border-border pb-4 transition-colors">
                <h3 className="text-xl font-extrabold text-foreground transition-colors flex items-center gap-2">
                  <Icons.Bookmark /> 나의 스크랩
                </h3>
                <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full transition-colors">총 {myScraps.length}개</span>
              </div>
              {myScraps.length > 0 ? (
                <ul className="divide-y divide-border transition-colors">
                  {myScraps.map((scrap) => (
                    <li key={scrap.id} onClick={() => router.push(`/community/${scrap.community?.id}`)} className="py-4 flex justify-between items-center group cursor-pointer px-2 rounded-2xl hover:bg-accent transition-colors">
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {scrap.community?.title || "삭제된 게시글입니다."}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1.5 font-medium transition-colors">
                          스크랩한 날짜: {new Date(scrap.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-colors">
                        <Icons.Heart /> {scrap.community?.likes || 0}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-24 text-center bg-muted/20 rounded-2xl border border-dashed border-border transition-colors">
                  <div className="text-4xl mb-3 opacity-50">🔖</div>
                  <p className="text-muted-foreground font-bold text-sm">아직 스크랩한 게시글이 없습니다.</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">마음에 드는 글을 발견하면 스크랩해 보세요!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "posts" && (
            <div className="bg-card p-6 sm:p-10 rounded-3xl shadow-sm border border-border transition-all">
              <div className="flex items-center justify-between mb-8 border-b border-border pb-4 transition-colors">
                <h3 className="text-xl font-extrabold text-foreground transition-colors">📝 작성글</h3>
                <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full transition-colors">총 {myPosts.length}개</span>
              </div>
              {myPosts.length > 0 ? (
                <ul className="divide-y divide-border transition-colors">
                  {myPosts.map((post) => (
                    <li key={post.id} onClick={() => router.push(`/community/${post.id}`)} className="py-4 flex justify-between items-center group cursor-pointer px-2 rounded-2xl hover:bg-accent transition-colors">
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">{post.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1.5 font-medium transition-colors">{new Date(post.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-colors">
                        <Icons.Heart /> {post.likes || 0}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-24 text-center bg-muted/20 rounded-2xl border border-dashed border-border transition-colors">
                  <div className="text-4xl mb-3 opacity-50">✍️</div>
                  <p className="text-muted-foreground font-bold text-sm">아직 작성한 게시글이 없습니다.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <div className="bg-card p-6 sm:p-10 rounded-3xl shadow-sm border border-border transition-all">
              <div className="flex items-center justify-between mb-8 border-b border-border pb-4 transition-colors">
                <h3 className="text-xl font-extrabold text-foreground transition-colors">💬 작성댓글</h3>
                <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full transition-colors">총 {myComments.length}개</span>
              </div>
              {myComments.length > 0 ? (
                <ul className="divide-y divide-border transition-colors">
                  {myComments.map((comment) => (
                    <li key={comment.id} onClick={() => router.push(`/community/${comment.post_id}`)} className="py-4 cursor-pointer group hover:bg-accent px-3 rounded-2xl transition-colors">
                      <div className="text-[11px] font-bold text-primary mb-1.5 transition-colors">원문: {comment.community?.title || "삭제되었거나 알 수 없는 게시글"}</div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-relaxed">{comment.content}</p>
                      <div className="text-[10px] text-muted-foreground mt-2 transition-colors">{new Date(comment.created_at).toLocaleDateString()}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-24 text-center bg-muted/20 rounded-2xl border border-dashed border-border transition-colors">
                  <div className="text-4xl mb-3 opacity-50">💭</div>
                  <p className="text-muted-foreground font-bold text-sm">아직 작성한 댓글이 없습니다.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div className="bg-card p-6 sm:p-10 rounded-3xl shadow-sm border border-border transition-all">
              <div className="flex items-center justify-between mb-8 border-b border-border pb-4 transition-colors">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-extrabold text-foreground transition-colors">📭 쪽지함</h3>
                  {myMessages.length > 0 && <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full transition-colors">새로운 쪽지 {myMessages.length}개</span>}
                </div>
                
                <button 
                  onClick={() => setShowMessageModal(true)}
                  className="text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <Icons.Send /> 새 쪽지 보내기
                </button>
              </div>

              {myMessages.length > 0 ? (
                <ul className="divide-y divide-border transition-colors">
                  {myMessages.map((msg) => (
                    <li 
                      key={msg.id} 
                      className="py-5 px-3 rounded-2xl hover:bg-accent transition-colors flex gap-4 items-start cursor-pointer group"
                      onClick={() => setExpandedMsgId(expandedMsgId === msg.id ? null : msg.id)}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold flex-shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                        {msg.sender_nickname ? msg.sender_nickname[0] : "익"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1 transition-colors">
                          <span className="text-sm font-extrabold text-foreground">{msg.sender_nickname || "익명"}님으로부터</span>
                          <span className="text-[11px] font-medium text-muted-foreground">{new Date(msg.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <p className={`text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap transition-all ${expandedMsgId === msg.id ? "" : "line-clamp-1"}`}>
                          {msg.content}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-24 text-center bg-muted/20 rounded-2xl border border-dashed border-border transition-colors">
                  <div className="text-4xl mb-3 opacity-50">📮</div>
                  <p className="text-muted-foreground font-bold text-sm">받은 쪽지가 없습니다.</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">우측 상단 버튼을 눌러 먼저 인사를 건네보세요!</p>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}