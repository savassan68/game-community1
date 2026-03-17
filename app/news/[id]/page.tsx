import Link from "next/link";
import { fetchGameMecaArticle } from "@/lib/gamemeca";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ url?: string }>;
};

const Icons = {
  ArrowLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  ExternalLink: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
};

export default async function NewsDetailPage({ searchParams }: Props) {
  const { url } = await searchParams;

  if (!url) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center transition-colors">
        <div className="text-6xl mb-4 opacity-50">📰</div>
        <p className="text-xl font-bold text-foreground mb-6">기사 주소가 없습니다.</p>
        <Link href="/news" className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-90 transition-all flex items-center gap-2">
          <Icons.ArrowLeft /> 뉴스 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  let article;

  try {
    article = await fetchGameMecaArticle(url);
  } catch (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center transition-colors">
        <div className="text-6xl mb-4 opacity-50">⚠️</div>
        <p className="text-xl font-bold text-foreground mb-6">기사를 불러오지 못했습니다.</p>
        <Link href="/news" className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-90 transition-all flex items-center gap-2">
          <Icons.ArrowLeft /> 뉴스 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 transition-colors duration-300 pb-32">
      <main className="max-w-4xl mx-auto">
        
        <div className="mb-8">
          <Link href="/news" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
            <Icons.ArrowLeft /> 뉴스 목록으로
          </Link>
        </div>

        <article className="bg-card rounded-3xl p-6 sm:p-12 shadow-sm border border-border transition-colors">
          
          <header className="mb-10 border-b border-border pb-8">
            <h1 className="text-3xl sm:text-4xl font-black leading-tight text-foreground break-keep mb-6">
              {article.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold mb-5">
              <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg">GameMeca</span>
              <span className="text-muted-foreground">{article.createdAt || "날짜 정보 없음"}</span>
            </div>

            {/* ⭐ 저작권/출처 명시를 위한 실제 URL 노출 박스 */}
            <div className="w-full bg-muted/50 border border-border rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 overflow-hidden">
              <span className="text-xs font-extrabold text-muted-foreground whitespace-nowrap flex items-center gap-1.5 flex-shrink-0">
                <Icons.ExternalLink /> 기사 원문 출처
              </span>
              <div className="h-px w-full sm:w-px sm:h-4 bg-border"></div>
              <a
                href={article.articleUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary hover:text-primary/80 hover:underline truncate"
                title={article.articleUrl}
              >
                {article.articleUrl}
              </a>
            </div>
          </header>

          {article.imageUrl && (
            <div className="mb-10 overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.imageUrl}
                alt={article.title}
                className="h-auto w-full object-cover"
              />
            </div>
          )}

          {article.summary && (
            <div className="mb-10 bg-muted/50 border border-border p-6 sm:p-8 rounded-2xl relative">
              <div className="absolute top-0 left-8 -translate-y-1/2 bg-card text-muted-foreground text-xl px-2">❝</div>
              <p className="text-lg leading-relaxed text-foreground font-bold">
                {article.summary}
              </p>
            </div>
          )}

          <div
            className="prose prose-lg dark:prose-invert prose-slate max-w-none prose-img:rounded-2xl prose-img:shadow-md prose-headings:font-black prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
          />

        </article>
      </main>
    </div>
  );
}