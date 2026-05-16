require('dotenv').config();
const fetch = require('node-fetch');
const supabase = require('./supabase');

// 1. RAWG API 키 가져오기
const RAWG_API_KEY = process.env.RAWG_API_KEY;

if (!RAWG_API_KEY) {
  console.error("🚨 에러: .env 파일에 RAWG_API_KEY를 설정해주세요!");
  process.exit(1);
}

// 2. 한글 -> 영문 변환기 (스팀 무료 API)
async function getSteamEnglishName(appId) {
  try {
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

// 3. RAWG에서 메타크리틱 점수 가져오기
async function fetchRawgMetacritic(title) {
  try {
    // RAWG API는 검색어와 키만 주면 다이렉트로 줍니다!
    const searchUrl = `https://api.rawg.io/api/games?search=${encodeURIComponent(title)}&key=${RAWG_API_KEY}`;
    const res = await fetch(searchUrl);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.results && data.results.length > 0) {
      // 검색된 첫 번째 게임의 메타크리틱 점수를 반환
      return data.results[0].metacritic || null;
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log("🚀 [RAWG API 모드] 메타크리틱 점수 초고속 수집 시작...\n");

  const { data: games, error } = await supabase.from('games').select('*');
  if (error) return console.error("DB 에러:", error.message);

  let successCount = 0;

  for (const game of games) {
    // ⭐ 최적화: 이미 점수가 채워진 게임은 스킵 (불필요한 호출 방지)
    if (game.metacritic_score) {
      console.log(`🔍 [${game.title}] ⏩ 이미 점수가 있어 건너뜀`);
      continue;
    }

    process.stdout.write(`🔍 [${game.title}] `);
    let targetTitle = game.title;

    // 한글이 섞여있으면 영문으로 포장 (검색 정확도 상승)
    const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(game.title);
    if (isKorean && game.image_url) {
      const appIdMatch = game.image_url.match(/\/(?:app|apps)\/(\d+)/);
      if (appIdMatch) {
        const steamAppId = appIdMatch[1];
        const englishName = await getSteamEnglishName(steamAppId);
        if (englishName) {
          targetTitle = englishName;
          process.stdout.write(`➔ 🔄 영문 변환(${targetTitle}) `);
        }
      }
    }

    // RAWG 검색!
    const score = await fetchRawgMetacritic(targetTitle);

    if (score !== null) {
      // 🎯 기존 게임 DB의 'metacritic_score' 칸을 채워 넣습니다!
      const { error: updateError } = await supabase
        .from('games')
        .update({ metacritic_score: score })
        .eq('id', game.id);

      if (updateError) {
        console.log(`❌ DB 저장 실패: ${updateError.message}`);
      } else {
        console.log(`✅ 메타크리틱: [${score}점] 저장 완료! 🏆`);
        successCount++;
      }
    } else {
      console.log(`⚠️ 점수 없음 (출시 전이거나 메타크리틱 미등록)`);
    }

    // 봇 방어가 없어서 아주 짧게 0.5초만 쉬어도 충분합니다!
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n🎉 작업 끝! 총 ${successCount}개 게임의 메타크리틱 점수를 업데이트했습니다.`);
}

main();