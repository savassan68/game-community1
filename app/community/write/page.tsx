"use client";

import { useEffect, useRef, useState } from "react";
import supabase from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { id: "free", label: "자유" },
  { id: "strategy", label: "공략" },
  { id: "question", label: "질문" },
  { id: "humor", label: "유머" },
];

export default function WritePage() {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement | null>(null);

  const [title, setTitle] = useState("");
  // 🔹 기본 카테고리 설정
  const [category, setCategory] = useState("free");
  const [tags, setTags] = useState<string>("");
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0, visible: false });

  /* 로그인 체크 */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        alert("로그인이 필요합니다.");
        router.push("/auth/login"); // 경로 수정
      } else {
        setUser(data.session.user);
      }
    })();
  }, []);

  /* 에디터 내 이미지 클릭 시 삭제 팝업 */
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const clickHandler = (e: any) => {
      if (e.target.tagName === "IMG") {
        const img = e.target as HTMLImageElement;
        setSelectedImage(img);
        const rect = img.getBoundingClientRect();
        setPopupPos({
          x: rect.right - 40,
          y: rect.bottom + window.scrollY,
          visible: true,
        });
      } else {
        setSelectedImage(null);
        setPopupPos((prev) => ({ ...prev, visible: false }));
      }
    };

    editor.addEventListener("click", clickHandler);
    return () => editor.removeEventListener("click", clickHandler);
  }, []);

  /* 파일 업로드 로직 */
  const uploadFileToStorage = async (file: File): Promise<string | null> => {
    try {
      const datePrefix = new Date().getTime();
      const safeName = `${datePrefix}_${file.name.replace(/\s+/g, "_")}`;
      const filePath = `uploads/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("community-images")
        .upload(filePath, file);

      if (uploadError) {
        alert("이미지 업로드 실패: " + uploadError.message);
        return null;
      }

      const { data } = supabase.storage
        .from("community-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error(err);
      alert("이미지 업로드 중 오류가 발생했습니다.");
      return null;
    }
  };

/* 에디터 명령어 실행 */
  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus(); // ⭐ 핵심: 명령 실행 '전'에 에디터를 콕 찍어줘야 두 번 안 들어갑니다.
    document.execCommand(cmd, false, value);
  };

  /* 선택된 이미지 삭제 */
  const deleteSelectedImage = () => {
    if (!selectedImage) return;
    selectedImage.remove();
    setSelectedImage(null);
    setPopupPos({ ...popupPos, visible: false });
  };

  /* 글 저장 */
  const handleSubmit = async () => {
    const contentHTML = editorRef.current?.innerHTML || "";

    if (!title.trim() || !contentHTML.trim()) {
      alert("제목과 내용을 입력하세요.");
      return;
    }

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setLoading(true);

    const insertPayload = {
      title,
      content: contentHTML,
      category, // 선택된 카테고리 ID
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      author: anonymous ? "익명" : user.email,
      user_id: user.id,
      // 썸네일 추출 (본문에 이미지가 있으면 첫 번째 이미지를 썸네일로 사용)
      image_url: extractFirstImage(contentHTML)
    };

    const { error } = await supabase.from("community").insert(insertPayload);

    setLoading(false);

    if (error) {
      console.error("작성 에러:", error);
      alert(`작성 실패! \n원인: ${error.message}`);
    } else {
      router.push("/community");
    }
  };

  // 본문에서 첫 번째 이미지 URL 추출하는 헬퍼 함수
  const extractFirstImage = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const img = doc.querySelector("img");
    return img ? img.src : null;
  };

  return (
    <div className="min-h-screen bg-[#F4F8FF]">
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-8">
        
        {/* ------------------------------
             🔹 [NEW] 카테고리 선택 (알약 버튼)
        ------------------------------ */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">카테고리 선택</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  category === cat.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 입력 */}
        <input
          className="w-full p-4 rounded-xl border border-slate-200 text-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* 태그 및 옵션 */}
        <div className="mt-4 flex gap-3 items-center">
          <input
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-300"
            placeholder="#태그 (쉼표로 구분)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          <label className="text-sm flex gap-2 items-center px-3 py-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="accent-indigo-600"
            />
            <span className="text-slate-600 font-medium">익명</span>
          </label>
        </div>

        {/* 툴바 (이미지 기능 전달) */}
        <Toolbar
          exec={exec}
          uploadFileToStorage={uploadFileToStorage}
          previewOpen={previewOpen}
          setPreviewOpen={setPreviewOpen}
          deleteSelectedImage={deleteSelectedImage}
        />

        {/* 에디터 영역 */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm mt-2 relative overflow-hidden min-h-[400px]">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-[400px] p-6 prose prose-slate max-w-none focus:outline-none prose-img:rounded-xl prose-img:shadow-sm"
            // 👇 [수정됨] placeholder -> data-placeholder
            data-placeholder="내용을 입력하세요..."
          />
        </div>

        {/* 미리보기 영역 */}
        {previewOpen && (
          <div className="mt-6 bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 mb-4 border-b pb-2">미리보기</h3>
            <div
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{
                __html: editorRef.current?.innerHTML || "",
              }}
            />
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="mt-6 flex justify-end gap-3">
           <button
             onClick={() => router.back()}
             className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
           >
             취소
           </button>
          <button
            className={`px-8 py-3 rounded-xl text-white font-bold shadow-md transition-all ${
              loading 
               ? "bg-slate-400 cursor-not-allowed" 
               : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-200 active:scale-95"
            }`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>

      {/* 이미지 삭제 팝업 */}
      {popupPos.visible && (
        <div
          className="fixed bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl z-50 cursor-pointer hover:bg-slate-700 transition-colors"
          style={{ top: popupPos.y + "px", left: popupPos.x + "px" }}
          onClick={deleteSelectedImage}
        >
          🗑 이미지 삭제
        </div>
      )}

      {/* 스타일 */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          display: block;
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------
   HEADER COMPONENT
------------------------------------------------ */
function Header() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push("/")} className="text-2xl font-extrabold text-indigo-600 hover:text-indigo-700">
            GameSeed<span className="text-indigo-400">.</span>
          </button>
          <div className="text-sm font-bold text-slate-500 border-l border-slate-300 pl-6">글쓰기</div>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------
   TOOLBAR COMPONENT (이미지 URL 기능 추가됨)
------------------------------------------------ */
function Toolbar({ exec, uploadFileToStorage, previewOpen, setPreviewOpen, deleteSelectedImage }: any) {
  // 🔹 이미지 팝업 상태 관리
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

// 1. 파일 업로드 핸들러
  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    let isFired = false; // ⭐ 핵심: 이벤트가 두 번 실행되는 걸 막는 자물쇠 역할

    input.onchange = async (e: any) => {
      if (isFired) return;
      isFired = true; // 한 번 실행되면 자물쇠를 잠금

      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true); // 로딩 시작
      const url = await uploadFileToStorage(file);
      setIsUploading(false); // 로딩 끝

      if (!url) return;
      exec("insertHTML", `<img src="${url}" class="editor-image w-full rounded-xl my-4" />`);
      setShowImagePopup(false); // 팝업 닫기
    };
    input.click();
  };

  // 2. URL 입력 핸들러
  const handleUrlInsert = () => {
    if (!imageUrlInput.trim()) {
      alert("이미지 주소를 입력해주세요.");
      return;
    }
    exec("insertHTML", `<img src="${imageUrlInput}" class="editor-image w-full rounded-xl my-4" />`);
    setImageUrlInput("");
    setShowImagePopup(false);
  };

  return (
    <div className="bg-white border border-slate-200 p-2 rounded-xl mt-4 mb-3 shadow-sm sticky top-16 z-30">
      <div className="flex flex-wrap gap-1 items-center relative">
        
        {/* 기본 서식 버튼들 */}
        <ToolButton icon="B" label="굵게" onClick={() => exec("bold")} bold />
        <ToolButton icon="I" label="기울임" onClick={() => exec("italic")} italic />
        <ToolButton icon="U" label="밑줄" onClick={() => exec("underline")} underline />
        <ToolButton icon="S" label="취소선" onClick={() => exec("strikeThrough")} strike />
        
        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* 정렬 */}
        <ToolButton icon="Left" label="왼쪽 정렬" onClick={() => exec("justifyLeft")} />
        <ToolButton icon="Center" label="가운데 정렬" onClick={() => exec("justifyCenter")} />
        
        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* 리스트 */}
        <ToolButton icon="• List" label="글머리" onClick={() => exec("insertUnorderedList")} />
        <ToolButton icon="1. List" label="번호" onClick={() => exec("insertOrderedList")} />

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* ------------------------------------------------
             🔹 [NEW] 이미지 버튼 (팝업 토글)
        ------------------------------------------------ */}
        <div className="relative">
          <button
            className={`p-2 rounded hover:bg-slate-100 transition-colors text-slate-600 ${showImagePopup ? "bg-slate-100 text-indigo-600" : ""}`}
            title="이미지 추가"
            onClick={() => setShowImagePopup(!showImagePopup)}
          >
            🖼 사진
          </button>

          {/* 이미지 선택 팝업 */}
          {showImagePopup && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50">
              <h4 className="text-xs font-bold text-slate-500 mb-3">이미지 추가 방식</h4>
              
              {/* 방식 1: 내 PC에서 업로드 */}
              <button
                onClick={handleFileUpload}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-bold mb-3"
              >
                {isUploading ? "업로드 중..." : "📂 내 PC에서 업로드"}
              </button>

              <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-2 text-xs text-slate-400">OR</span>
                  <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* 방식 2: URL 입력 */}
              <div className="mt-1">
                <input 
                  type="text" 
                  placeholder="https://..." 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs mb-2 focus:outline-none focus:border-indigo-500"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlInsert()}
                />
                <button 
                  onClick={handleUrlInsert}
                  className="w-full py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700"
                >
                  주소로 넣기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------ */}

        <ToolButton icon="🗑" label="선택 삭제" onClick={deleteSelectedImage} />

        <button
          className="ml-auto px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          onClick={() => setPreviewOpen((v: any) => !v)}
        >
          {previewOpen ? "닫기" : "미리보기"}
        </button>
      </div>
    </div>
  );
}

// 툴바 버튼 컴포넌트 (코드 중복 제거)
function ToolButton({ icon, label, onClick, bold, italic, underline, strike }: any) {
  return (
    <button
      className={`
        p-2 min-w-[32px] rounded hover:bg-slate-100 transition-colors text-slate-600 flex items-center justify-center
        ${bold ? "font-bold" : ""}
        ${italic ? "italic" : ""}
        ${underline ? "underline" : ""}
        ${strike ? "line-through" : ""}
      `}
      title={label}
      onClick={onClick}
    >
      {icon === "Left" && <AlignIcon type="left" />}
      {icon === "Center" && <AlignIcon type="center" />}
      {icon !== "Left" && icon !== "Center" ? icon : null}
    </button>
  );
}

// 정렬 아이콘 SVG
function AlignIcon({ type }: { type: "left" | "center" }) {
  return (
    <div className={`flex flex-col gap-[2px] ${type === "center" ? "items-center" : "items-start"}`}>
      <span className="block w-3 h-[2px] bg-current opacity-70"></span>
      <span className="block w-2 h-[2px] bg-current opacity-70"></span>
      <span className="block w-3 h-[2px] bg-current opacity-70"></span>
    </div>
  );
}