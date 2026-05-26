import { NextRequest, NextResponse } from "next/server";
// 이름은 GameMecaArticle 이지만, 실제로는 우리가 만든 naverNews 파일에서 불러옵니다.
import { fetchGameMecaArticle } from "@/lib/services/naverNews";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");
    
    if (!url) {
      return NextResponse.json({ error: "URL 파라미터가 없습니다." }, { status: 400 });
    }

    const article = await fetchGameMecaArticle(url);
    return NextResponse.json(article, { status: 200 });
    
  } catch (error) {
    console.error("news article api error:", error);
    return NextResponse.json(
      {
        error: "기사 상세 정보를 가져오지 못했습니다.",
        detail: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}