import * as cheerio from "cheerio";

export type NewsCategory =
  | "main"
  | "industry"
  | "esports"
  | "pc"
  | "mobile"
  | "console";

export type GameMecaListItem = {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  articleUrl: string;
  createdAt: string;
  category: NewsCategory;
  rawDate?: number; // 정렬을 위해 숨겨둔 숫자형 날짜 데이터
};

const CATEGORY_KEYWORDS: Record<NewsCategory, string> = {
  main: "게임 뉴스", // 이제 'main' 키워드는 직접 쓰지 않지만 타입 에러 방지용으로 둡니다.
  industry: "게임업계 게임산업",
  esports: "e스포츠",
  pc: "PC게임 스팀",
  mobile: "모바일게임",
  console: "콘솔게임 닌텐도 플레이스테이션 엑스박스",
};

const EXCLUDE_KEYWORDS = [
  "치킨게임", "오징어게임", "카지노", "바카라", 
  "도박", "경마", "크루즈", "올림픽", "아시안게임", "프로야구"
];

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80",
  "https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=800&q=80",
  "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
  "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80"
];

function cleanHtml(text: string) {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

// ⭐ [내부용 함수] 단일 카테고리 기사를 가져오는 도우미 함수
async function fetchSingleCategory(
  category: NewsCategory, 
  displayCount: number = 30
): Promise<GameMecaListItem[]> {
  const keyword = CATEGORY_KEYWORDS[category];
  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(keyword)}&display=${displayCount}&sort=sim`;

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) throw new Error("네이버 API 키가 설정되지 않았습니다.");

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    next: { revalidate: 1800 }, 
  });

  if (!res.ok) throw new Error(`네이버 API 요청 실패: ${res.status}`);
  const data = await res.json();

  const filteredItems = data.items.filter((item: any) => {
    const fullText = cleanHtml(item.title) + " " + cleanHtml(item.description);
    return !EXCLUDE_KEYWORDS.some((badWord) => fullText.includes(badWord));
  });

  return filteredItems.map((item: any, index: number) => ({
    id: encodeURIComponent(item.link),
    title: cleanHtml(item.title),
    summary: cleanHtml(item.description),
    imageUrl: PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length],
    articleUrl: item.link,
    createdAt: new Date(item.pubDate).toLocaleDateString("ko-KR"),
    category,
    rawDate: new Date(item.pubDate).getTime(), // 정렬용 타임스탬프
  }));
}

// ⭐ 1. 뉴스 리스트 가져오기 (메인 외부 노출 함수)
export async function fetchNaverNewsList(
  category: NewsCategory
): Promise<GameMecaListItem[]> {
  
  if (category === "main") {
    // 🔥 마법의 구간: '전체' 탭일 경우 5개 카테고리를 '동시에(병렬로)' 찔러서 가져옵니다!
    const subCategories: NewsCategory[] = ["industry", "esports", "pc", "mobile", "console"];
    
    // 각각 10개씩 넉넉히 가져와서 합칩니다 (총 50개)
    const promises = subCategories.map(cat => fetchSingleCategory(cat, 10));
    const results = await Promise.all(promises);
    
    // 5개의 배열을 하나의 거대한 배열로 평탄화(Flatten)
    const allItems = results.flat();
    
    // 중복 기사 제거 (PC랑 콘솔에 동시에 속한 기사 방지)
    const uniqueMap = new Map<string, GameMecaListItem>();
    allItems.forEach(item => {
      if (!uniqueMap.has(item.articleUrl)) uniqueMap.set(item.articleUrl, item);
    });
    const uniqueItems = Array.from(uniqueMap.values());
    
    // 가장 최근 기사가 위로 오도록 날짜순 내림차순 정렬
    uniqueItems.sort((a, b) => (b.rawDate || 0) - (a.rawDate || 0));
    
    // 예쁘게 정렬된 통합 데이터 중 20개만 리턴
    return uniqueItems.slice(0, 20);

  } else {
    // '전체'가 아니라 개별 탭(PC, 모바일 등)을 눌렀을 때는 원래대로 동작
    const items = await fetchSingleCategory(category, 30);
    return items.slice(0, 20);
  }
}

// ⭐ 2. 기사 본문 가져오기 (상세 페이지용)
export async function fetchGameMecaArticle(
  articleUrl: string
) {
  const res = await fetch(articleUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error("기사 원문을 가져올 수 없습니다.");

  const html = await res.text();
  const $ = cheerio.load(html);

  const title = $("meta[property='og:title']").attr("content") || $("title").text();
  const summary = $("meta[property='og:description']").attr("content") || "";
  const imageUrl = $("meta[property='og:image']").attr("content") || "";
  
  const bodyHtml = $("p").slice(0, 15).toArray().map(p => $.html(p)).join("");

  return {
    id: encodeURIComponent(articleUrl),
    title: cleanHtml(title),
    summary: cleanHtml(summary),
    imageUrl,
    articleUrl,
    createdAt: new Date().toLocaleDateString("ko-KR"),
    bodyHtml,
  };
}