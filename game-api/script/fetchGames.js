const fetch = require('node-fetch');
const cheerio = require('cheerio');
const supabase = require('./supabase');

const TARGET_COUNT = 200; // 크롤링할 차트 목표 수
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function parseKoreanDate(dateStr) {
  if (!dateStr) return null;
  try {
    const parts = dateStr.replace(/년|월|일/g, '').trim().split(/\s+/);
    if (parts.length < 3) return null;
    const y = parts[0];
    const m = parts[1].padStart(2, '0'); 
    const d = parts[2].padStart(2, '0'); 
    return `${y}-${m}-${d}`;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('🚀 스팀 게임 데이터 누적 수집 시작...\n');

  try {
    // ⭐ 0단계: DB에 이미 있는 게임 파악하기 (중복 덮어쓰기 방지)
    const { data: existingGames, error: dbError } = await supabase.from('games').select('image_url, title');
    if (dbError) throw dbError;

    // 이미지 URL에서 스팀 App ID만 추출해서 Set에 담아둡니다.
    const savedAppIds = new Set();
    const savedTitles = new Set();
    
    existingGames.forEach(g => {
      if (g.title) savedTitles.add(g.title);
      if (g.image_url) {
        const match = g.image_url.match(/\/(?:app|apps)\/(\d+)/);
        if (match) savedAppIds.add(parseInt(match[1]));
      }
    });
    
    console.log(`✅ 현재 DB에 보존 중인 게임 수: ${savedAppIds.size}개 (이 게임들은 API 요청을 건너뜁니다)\n`);

    // ---------------------------------------------------------
    // 1단계: 인기 게임 리스트 크롤링
    // ---------------------------------------------------------
    let appIds = [];
    let page = 1;

    while (appIds.length < TARGET_COUNT) {
      console.log(`🔍 인기 차트 ${page}페이지 크롤링 중...`);
      const url = `https://store.steampowered.com/search/?filter=topsellers&category1=998&l=koreana&page=${page}`;
      const res = await fetch(url);
      const html = await res.text();
      const $ = cheerio.load(html);

      let foundOnPage = 0;
      $('#search_resultsRows > a').each((i, el) => {
        if (appIds.length >= TARGET_COUNT) return false;
        
        const rawAppId = $(el).attr('data-ds-appid');
        // 번들(여러 개 묶음) 제외
        if (rawAppId && !rawAppId.includes(',')) {
          appIds.push(parseInt(rawAppId));
          foundOnPage++;
        }
      });

      if (foundOnPage === 0) break; // 더 이상 게임이 없으면 탈출
      page++;
      await sleep(1000); 
    }

    appIds = [...new Set(appIds)]; 
    console.log(`\n✅ 차트에서 총 ${appIds.length}개의 게임 ID 확보 완료!`);

    // ⭐ 핵심 필터링: 확보한 ID 중 이미 DB에 있는 건 빼버립니다.
    const newAppIds = appIds.filter(id => !savedAppIds.has(id));
    console.log(`⏩ 기존 게임 스킵 완료. 새롭게 추가할 신규 게임은 총 ${newAppIds.length}개 입니다.\n`);

    if (newAppIds.length === 0) {
      console.log("🎉 이미 인기 차트 게임들이 모두 DB에 있습니다! 스크립트를 종료합니다.");
      return;
    }

    // ---------------------------------------------------------
    // 2단계: 신규 게임 상세 정보 조회 및 '안전하게' 저장 (Insert)
    // ---------------------------------------------------------
    let processedCount = 0;

    for (const appId of newAppIds) {
      try {
        const detailRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=koreana`);
        const detailData = await detailRes.json();

        if (detailData[appId] && detailData[appId].success) {
          const game = detailData[appId].data;

          if (game.type !== 'game') continue;

          // 혹시나 ID가 달라도 이름이 똑같은 게임이 DB에 있다면 덮어쓰지 않고 스킵!
          if (savedTitles.has(game.name)) {
            console.log(`⚠️ [${game.name}] 동일한 이름의 게임이 이미 DB에 존재하여 스킵합니다.`);
            continue;
          }

          const rawDate = game.release_date ? game.release_date.date : null;
          const formattedDate = parseKoreanDate(rawDate);

          const gamePayload = {
            title: game.name,
            description: game.short_description,
            image_url: game.header_image,
            categories: game.genres ? game.genres.map(g => g.description) : [],
            release_date: formattedDate,
          };

          // ⭐ 덮어쓰기(upsert)가 아닌 순수 추가(insert) 사용! 
          const { error } = await supabase.from('games').insert(gamePayload);

          if (error) {
            console.error(`❌ [${game.name}] DB 추가 실패:`, error.message);
          } else {
            console.log(`💾 [${++processedCount}/${newAppIds.length}] 신규 게임 추가 완료: ${game.name}`);
          }
        }
      } catch (err) {
        console.error(`⚠️ AppID ${appId} 처리 중 에러:`, err.message);
      }

      await sleep(1500); // API 차단 방지를 위한 휴식
    }

    console.log(`\n🎉 모든 작업이 완료되었습니다! (새로 추가된 게임: ${processedCount}개)`);

  } catch (error) {
    console.error('❌ 치명적 오류 발생:', error);
  }
}

main();