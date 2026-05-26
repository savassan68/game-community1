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
};

export type GameMecaArticle = {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  articleUrl: string;
  createdAt: string;
  bodyHtml: string;
};

const BASE_URL = "https://www.gamemeca.com";

const CATEGORY_URL_MAP: Record<NewsCategory, string> = {
  main: `${BASE_URL}/news.php`,
  industry: `${BASE_URL}/news.php?ca=I`,
  esports: `${BASE_URL}/news.php?ca=T&se=146`,
  pc: `${BASE_URL}/news.php?ca=P`,
  mobile: `${BASE_URL}/news.php?ca=M`,
  console: `${BASE_URL}/news.php?ca=V`,
};

// ⭐ 1. 완벽한 위장 신분증 (진짜 크롬 브라우저처럼 보이기)
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  "Referer": "https://www.google.com/", // 구글에서 검색해서 들어온 척
  "Connection": "keep-alive"
};

function normalizeUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
}

function slugFromArticleUrl(articleUrl: string) {
  try {
    const u = new URL(articleUrl);
    if (u.searchParams.get("gid")) return u.searchParams.get("gid") as string;
    return encodeURIComponent(articleUrl);
  } catch {
    return encodeURIComponent(articleUrl);
  }
}

function cleanText(value?: string) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function extractImageFromElement(root: any) {
  const img = root.find("img").first();
  if (!img.length) return "";

  const raw =
    img.attr("src") ||
    img.attr("data-src") ||
    img.attr("data-original") ||
    img.attr("data-lazy-src") ||
    img.attr("data-lazy") ||
    "";

  return normalizeUrl(raw);
}

// 썸네일 보정용 fetch
async function fetchArticleOgImage(articleUrl: string) {
  try {
    const res = await fetch(articleUrl, {
      headers: BROWSER_HEADERS, // ⭐ 위장 헤더 적용
      cache: "no-store",
    });

    if (!res.ok) return "";

    const html = await res.text();
    const $ = cheerio.load(html);

    return (
      normalizeUrl($("meta[property='og:image']").attr("content")) ||
      normalizeUrl($("meta[name='twitter:image']").attr("content")) ||
      normalizeUrl($(".article img").first().attr("src")) ||
      normalizeUrl($(".view_cont img").first().attr("src")) ||
      ""
    );
  } catch {
    return "";
  }
}

export async function fetchGameMecaList(
  category: NewsCategory
): Promise<GameMecaListItem[]> {
  const targetUrl = CATEGORY_URL_MAP[category];

  const res = await fetch(targetUrl, {
    headers: BROWSER_HEADERS, // ⭐ 위장 헤더 적용
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`게임메카 목록 요청 실패: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const items: GameMecaListItem[] = [];

  $("a[href*='view.php?gid=']").each((_, el) => {
    const link = $(el);
    const href = link.attr("href");
    if (!href) return;

    const articleUrl = normalizeUrl(href);

    const wrapper = link.closest("li, article, tr, dl, .list_li, .news_li, .cont_li");
    const wrapperText = cleanText(wrapper.text());

    const title =
      cleanText(link.find("strong").first().text()) ||
      cleanText(link.attr("title")) ||
      cleanText(wrapper.find("strong").first().text()) ||
      cleanText(wrapper.find(".tit").first().text()) ||
      cleanText(wrapper.find(".title").first().text()) ||
      cleanText(link.text());

    if (!title || title.length < 5) return;

    const summary =
      cleanText(wrapper.find("p").first().text()) ||
      cleanText(wrapper.find(".txt").first().text()) ||
      cleanText(wrapper.find(".desc").first().text()) ||
      cleanText(wrapper.find(".summary").first().text()) ||
      cleanText(wrapperText.replace(title, ""));

    let imageUrl =
      extractImageFromElement(link) ||
      extractImageFromElement(wrapper.find("a").first()) ||
      extractImageFromElement(wrapper);

    const createdAtMatch = wrapperText.match(/\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}/);
    const createdAt = createdAtMatch ? createdAtMatch[0] : "";

    items.push({
      id: slugFromArticleUrl(articleUrl),
      title,
      summary,
      imageUrl,
      articleUrl,
      createdAt,
      category,
    });
  });

  const unique = Array.from(
    new Map(items.map((item) => [item.articleUrl, item])).values()
  );

  const filtered = unique.filter((item) => item.title.length > 3).slice(0, 20);

  const imageCount = new Map<string, number>();
  for (const item of filtered) {
    if (!item.imageUrl) continue;
    imageCount.set(item.imageUrl, (imageCount.get(item.imageUrl) || 0) + 1);
  }

  // ⭐ 2. Vercel 10초 타임아웃 방어 로직
  // 20개를 전부 추가 fetch 하면 무조건 버셀 서버가 뻗습니다.
  // 추가 썸네일 조사는 맨 위 기사 3개까지만 시도하도록 제한합니다.
  let fixAttemptCount = 0; 
  const MAX_FIX_ATTEMPTS = 3;

  const fixed = await Promise.all(
    filtered.map(async (item) => {
      const duplicated = item.imageUrl && (imageCount.get(item.imageUrl) || 0) >= 2;

      // 이미지가 없거나 중복이면서, 시도 횟수가 3번 미만일 때만 보정 시도
      if ((!item.imageUrl || duplicated) && fixAttemptCount < MAX_FIX_ATTEMPTS) {
        fixAttemptCount++;
        try {
          const ogImage = await fetchArticleOgImage(item.articleUrl);
          if (ogImage) {
            return { ...item, imageUrl: ogImage };
          }
        } catch (e) {
          // 개별 에러 무시 (전체 리스트가 뻗는 걸 방지)
        }
      }

      return item;
    })
  );

  return fixed;
}

export async function fetchGameMecaArticle(
  articleUrl: string
): Promise<GameMecaArticle> {
  const res = await fetch(articleUrl, {
    headers: BROWSER_HEADERS, // ⭐ 위장 헤더 적용
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`게임메카 기사 요청 실패: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const title =
    $("meta[property='og:title']").attr("content")?.trim() ||
    $("title").text().trim();

  const summary =
    $("meta[property='og:description']").attr("content")?.trim() ||
    $("meta[name='description']").attr("content")?.trim() ||
    "";

  const imageUrl =
    normalizeUrl($("meta[property='og:image']").attr("content")) ||
    normalizeUrl($("meta[name='twitter:image']").attr("content")) ||
    normalizeUrl($(".article img").first().attr("src")) ||
    normalizeUrl($(".view_cont img").first().attr("src")) ||
    normalizeUrl($("img").first().attr("src")) ||
    "";

  const bodyCandidates = [
    ".article",
    ".article-text",
    ".news-text",
    ".view_cont",
    "#content",
    ".content",
  ];

  let bodyHtml = "";

  for (const selector of bodyCandidates) {
    const found = $(selector).first();
    if (found.length) {
      bodyHtml = found.html() || "";
      if (bodyHtml.trim()) break;
    }
  }

  if (!bodyHtml) {
    bodyHtml = $("body")
      .find("p")
      .slice(0, 20)
      .toArray()
      .map((p) => $.html(p))
      .join("");
  }

  const pageText = $("body").text().replace(/\s+/g, " ");
  const createdAtMatch = pageText.match(/\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}/);
  const createdAt = createdAtMatch ? createdAtMatch[0] : "";

  return {
    id: slugFromArticleUrl(articleUrl),
    title,
    summary,
    imageUrl,
    articleUrl,
    createdAt,
    bodyHtml,
  };
}