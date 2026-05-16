const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const supabase = require('./supabase');

puppeteer.use(StealthPlugin());

const isKorean = (text) => /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);

async function getSteamEnglishName(appId) {
  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json[appId] && json[appId].success) {
      return json[appId].data.name;
    }
  } catch (e) {
    return null;
  }
  return null;
}

// ⭐ 최강 핵심: 페이지 이동 없이, 열려있는 정문 화면 '안에서' 몰래 통신하기!
async function fetchViaInternal(page, url) {
  return await page.evaluate(async (targetUrl) => {
    try {
      // 메인 페이지 내부에서 브라우저 고유의 fetch를 사용 (Cloudflare가 완벽히 속음)
      const res = await fetch(targetUrl);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }, url);
}

async function main() {
  console.log("🚀 [보이는 크롤링 모드] 정문 침투 후 내부 통신 시작...\n");

  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  
  console.log("🛡️ 오픈크리틱 정문으로 입장합니다...");
  // 화면 뼈대만 뜨면 바로 통과
  await page.goto('https://opencritic.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  console.log("⏳ [보안 대기] 8초 동안 기다립니다. 체크박스 뜨면 눌러주세요!");
  await new Promise(r => setTimeout(r, 8000));
  console.log("✅ 보안 통과! 정문 안에서 조용히 데이터를 빼옵니다.\n");

  const { data: existingReviews, error: reviewCheckError } = await supabase.from('critic_reviews').select('game_id');
  if (reviewCheckError) return console.error("리뷰 확인 에러:", reviewCheckError.message);

  const savedGameIds = new Set(existingReviews.map(r => r.game_id));
  console.log(`✅ 현재 DB에 이미 리뷰가 존재하는 게임 수: ${savedGameIds.size}개 (스킵됨)\n`);

  const { data: games, error } = await supabase.from('games').select('*');
  if (error) return console.error("DB 에러:", error.message);

  let totalSaved = 0;

  for (const game of games) {
    if (savedGameIds.has(game.id)) {
      console.log(`🔍 [${game.title}] ⏩ 이미 리뷰가 있어 건너뜀`);
      continue; 
    }

    process.stdout.write(`🔍 [${game.title}] `);
    let targetTitle = game.title;

    if (isKorean(game.title) && game.image_url) {
      const appIdMatch = game.image_url.match(/\/(?:app|apps)\/(\d+)/);
      if (appIdMatch) {
        const steamAppId = appIdMatch[1];
        const englishName = await getSteamEnglishName(steamAppId);
        if (englishName) {
          targetTitle = englishName;
          process.stdout.write(`➔ 🔄 영문 자동변환(${targetTitle}) `);
        }
      }
    }

    // ⭐ 주소창을 바꾸지 않고, fetchViaInternal 로 내부에서 몰래 검색!
    const searchUrl = `https://api.opencritic.com/api/game/search?criteria=${encodeURIComponent(targetTitle)}`;
    const searchResults = await fetchViaInternal(page, searchUrl);

    if (!Array.isArray(searchResults) || searchResults.length === 0 || !searchResults[0].id) {
      console.log(`⏩ 검색 결과 없음`);
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }

    const openCriticId = searchResults[0].id;

    // ⭐ 리뷰도 내부에서 몰래 가져옵니다!
    const reviewUrl = `https://api.opencritic.com/api/review/game/${openCriticId}`;
    const reviews = await fetchViaInternal(page, reviewUrl);

    if (!Array.isArray(reviews)) {
      console.log(`⚠️ 리뷰 데이터를 파싱할 수 없습니다.`);
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }

    const topReviews = reviews.slice(0, 3).map(r => ({
      game_id: game.id,
      outlet: r.Outlet ? r.Outlet.name : "Unknown",
      author: r.Authors && r.Authors.length > 0 ? r.Authors[0].name : "Unknown",
      rating: r.score || 0,
      content: r.snippet, 
      url: r.externalUrl
    })).filter(r => r.content);

    if (topReviews.length > 0) {
      const { error: insertError } = await supabase.from('critic_reviews').insert(topReviews);
      if (insertError) {
          console.log(`❌ DB 저장 실패: ${insertError.message}`);
      } else {
        console.log(`✅ ${topReviews.length}개 리뷰 저장 완료!`);
        totalSaved += topReviews.length;
      }
    } else {
      console.log("⚠️ 매칭은 성공했으나 리뷰 글이 없습니다.");
    }

    // 화면 이동이 없으니 1초만 쉬어도 충분합니다
    await new Promise(r => setTimeout(r, 1000));
  }

  await browser.close();
  console.log(`\n🎉 작업 끝! 오늘 새롭게 ${totalSaved}개의 전문가 평론을 저장했습니다.`);
}

main();