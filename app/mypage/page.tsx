"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

// 탭 메뉴 타입 정의
type TabType = "info" | "posts" | "comments" | "messages";

export default function MyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("info");

  // 유저 정보
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");

  // 데이터 상태
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myComments, setMyComments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // 수정용 상태
  const [newNickname, setNewNickname] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // 초기 데이터 로딩
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

      // 1. 프로필 가져오기
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        setNewNickname(profileData.nickname || "");
      }

      // 2. 내 작성글 가져오기 (community 테이블)
      const { data: postsData } = await supabase
        .from("community")
        .select("*")
        .eq("author_id", session.user.id) // author_id 컬럼 필요
        .order("created_at", { ascending: false });
      
      if (postsData) setMyPosts(postsData);

      // 3. (나중에 구현) 댓글, 쪽지 등은 테이블이 있다면 여기서 fetch 합니다.
      // 현재는 빈 배열로 둡니다.

    } catch (error: any) {
      console.error("데이터 로딩 실패:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 닉네임 변경 핸들러
  const handleUpdateNickname = async () => {
    if (!newNickname.trim()) return alert("닉네임을 입력해주세요.");
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ nickname: newNickname })
        .eq("id", userId);

      if (error) throw error;
      setProfile({ ...profile, nickname: newNickname });
      alert("닉네임이 변경되었습니다 ✨");
    } catch (e: any) {
      alert("변경 실패: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  // 탭 변경 버튼 컴포넌트
  const TabButton = ({ id, label, icon }: { id: TabType; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
        activeTab === id
          ? "bg-indigo-600 text-white shadow-md"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중... ⏳</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* 👈 왼쪽 사이드바 (프로필 요약 & 메뉴) */}
        <aside className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-3xl mb-3 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                "👤"
              )}
            </div>
            <h2 className="font-bold text-lg text-gray-900">{profile?.nickname || "닉네임 없음"}</h2>
            <p className="text-xs text-gray-500 mt-1">{profile?.email}</p>
            <p className="text-xs text-indigo-500 mt-2 font-medium">@{profile?.username}</p>
          </div>

          <nav className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-2">
            <TabButton 
              id="info" 
              label="회원 정보 수정" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>} 
            />
            <TabButton 
              id="posts" 
              label="내가 쓴 글" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>} 
            />
            <TabButton 
              id="comments" 
              label="작성 댓글" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>} 
            />
            <TabButton 
              id="messages" 
              label="쪽지함" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>} 
            />
          </nav>

          <button
            onClick={() => router.push("/")}
            className="w-full py-3 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← 메인으로 돌아가기
          </button>
        </aside>


        {/* 👉 오른쪽 콘텐츠 영역 */}
        <main className="md:col-span-3">
          
          {/* 1. 회원 정보 수정 탭 */}
          {activeTab === "info" && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up">
              <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">회원 정보 수정</h3>
              
              <div className="space-y-6 max-w-lg">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">아이디 (변경 불가)</label>
                  <input type="text" value={profile?.username} disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">이메일</label>
                  <input type="text" value={profile?.email} disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">닉네임</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newNickname} 
                      onChange={(e) => setNewNickname(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                    <button 
                      onClick={handleUpdateNickname}
                      disabled={updating}
                      className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:bg-indigo-300"
                    >
                      변경
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. 내가 쓴 글 탭 */}
          {activeTab === "posts" && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up">
              <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">내가 쓴 글 ({myPosts.length})</h3>
              
              {myPosts.length > 0 ? (
                <div className="space-y-3">
                  {myPosts.map((post) => (
                    <div 
                      key={post.id} 
                      onClick={() => router.push(`/community/${post.id}`)}
                      className="flex justify-between items-center p-4 rounded-xl border border-gray-100 hover:bg-indigo-50 hover:border-indigo-100 cursor-pointer transition"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-800">{post.title}</h4>
                        <p className="text-xs text-gray-400 mt-1">{new Date(post.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-sm text-indigo-600 font-medium">♥ {post.likes || 0}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  작성한 게시글이 없습니다. 📝
                </div>
              )}
            </div>
          )}

          {/* 3. 작성 댓글 탭 (준비중) */}
          {activeTab === "comments" && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up">
              <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">작성 댓글</h3>
              {/* 댓글 테이블이 있다면 여기서 맵핑하면 됩니다 */}
              <div className="py-20 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                작성한 댓글이 없습니다. (기능 준비 중 🚧)
              </div>
            </div>
          )}

          {/* 4. 쪽지함 탭 (준비중) */}
          {activeTab === "messages" && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold text-gray-800">쪽지함</h3>
                <button className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200">
                  + 쪽지 보내기
                </button>
              </div>
              
              {/* 쪽지 테이블이 있다면 여기서 맵핑하면 됩니다 */}
              <div className="py-20 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                받은 쪽지가 없습니다. 📭
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}