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

const CATEGORY_URL_MAP: Record<Exclude<NewsCategory, "esports">, string> = {
  main: `${BASE_URL}/news.php`,
  industry: `${BASE_URL}/news.php?ca=I`,
  pc: `${BASE_URL}/news.php?ca=P`,
  mobile: `${BASE_URL}/news.php?ca=M`,
  console: `${BASE_URL}/news.php?ca=V`,
};

const ESPORTS_KEYWORDS = [
  "e스포츠",
  "이스포츠",
  "LCK",
  "LoL",
  "리그 오브 레전드",
  "발로란트",
  "오버워치",
  "FC 온라인",
  "플레이오프",
  "결승전",
  "챔피언스",
  "T1",
  "젠지",
  "디플러스 기아",
  "한화생명e스포츠",
];

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

function isEsportsArticle(title: string, summary: string) {
  const text = `${title} ${summary}`.toLowerCase();
  return ESPORTS_KEYWORDS.some((keyword) =>
    text.includes(keyword.toLowerCase())
  );
}

function extractImageFromElement(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<any>
) {
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

export async function fetchGameMecaList(
  category: NewsCategory
): Promise<GameMecaListItem[]> {
  const targetUrl =
    category === "esports"
      ? CATEGORY_URL_MAP.main
      : CATEGORY_URL_MAP[category as Exclude<NewsCategory, "esports">];

  const res = await fetch(targetUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`게임메카 목록 요청 실패: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const items: GameMecaListItem[] = [];

  $("a[href*='view.php?gid=']").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const articleUrl = normalizeUrl(href);

    const title =
      $(el).find("strong").first().text().trim() ||
      $(el).attr("title")?.trim() ||
      $(el).text().replace(/\s+/g, " ").trim();

    if (!title || title.length < 5) return;

    const wrapper = $(el).closest("li, article, div, tr, dl");
    const wrapperText = wrapper.text().replace(/\s+/g, " ").trim();

    let summary = "";
    const summaryCandidates = [
      wrapper.find("p").first().text().trim(),
      wrapper.find(".txt").first().text().trim(),
      wrapper.find(".desc").first().text().trim(),
      wrapper.find(".summary").first().text().trim(),
    ].filter(Boolean);

    if (summaryCandidates.length > 0) {
      summary = summaryCandidates[0];
    } else {
      summary = wrapperText.replace(title, "").trim();
    }

    // ⭐ 핵심 수정 포인트: 남의 사진을 훔쳐오던 prevAll() 로직을 삭제하고,
    // 현재 기사의 가장 큰 테두리(li 컨테이너) 안에서만 찾도록 수정했습니다!
    const liContainer = $(el).closest("li, article, tr"); 
    const imageUrl = 
      extractImageFromElement($, liContainer) || 
      extractImageFromElement($, wrapper) || 
      "";

    const createdAtMatch = wrapperText.match(
      /\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}/
    );
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

  let filtered = unique.filter((item) => item.title.length > 3);

  if (category === "esports") {
    filtered = filtered.filter((item) =>
      isEsportsArticle(item.title, item.summary)
    );
  }

  return filtered.slice(0, 20);
}

export async function fetchGameMecaArticle(
  articleUrl: string
): Promise<GameMecaArticle> {
  const res = await fetch(articleUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
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