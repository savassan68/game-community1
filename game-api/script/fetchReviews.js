require('dotenv').config(); 
const fetch = require('node-fetch');
const supabase = require('./supabase');

// .env에 적어둔 키 가져오기
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

if (!RAPIDAPI_KEY) {
  console.error("🚨 에러: .env 파일에 RAPIDAPI_KEY가 설정되지 않았습니다.");
  process.exit(1);
}

// 🛡️ 공식 API 헤더 세팅
const COMMON_HEADERS = {
  'X-RapidAPI-Key': RAPIDAPI_KEY,
  'X-RapidAPI-Host': 'opencritic-api.p.rapidapi.com',
  'Accept': 'application/json'
};

// ⭐ 한글이 포함되어 있는지 확인하는 정규식 함수
const isKorean = (text) => /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);

// ==========================================
// 🚀 1. 오픈크리틱 검색 (정확도 대폭 향상 버그 픽스)
// ==========================================
async function fetchOpenCriticId(title) {
  try {
    const cleanTitle = title.replace(/[™®]/g, '').trim().toLowerCase(); // 소문자로 통일
    const searchUrl = `https://opencritic-api.p.rapidapi.com/game/search?criteria=${encodeURIComponent(cleanTitle)}`;
    
    const res = await fetch(searchUrl, { headers: COMMON_HEADERS });
    
    if (!res.ok) {
       process.stdout.write(` [API 에러: ${res.status}] `);
       return null;
    }
    
    const results = await res.json();

    // 결과가 없으면 null
    if (!results || results.length === 0) return null;

    // ⭐ 핵심 로직: 검색 결과 중 이름이 가장 '완벽하게' 일치하는 것을 찾기
    // 1. 완전히 똑같은 이름이 있는지 찾기 (예: "PUBG: BATTLEGROUNDS")
    const exactMatch = results.find(g => g.name.toLowerCase() === cleanTitle);
    if (exactMatch) return exactMatch.id;

    // 2. 만약 완전 일치가 없다면, 검색어가 '포함된' 가장 짧은 이름의 게임을 선택
    // (이유: "Battlegrounds" 검색 시 "Worms Battlegrounds"보다 "PUBG: BATTLEGROUNDS"가 우선순위를 갖게 하거나 오차를 줄이기 위함)
    const partialMatches = results.filter(g => g.name.toLowerCase().includes(cleanTitle));
    
    if (partialMatches.length > 0) {
      // 이름 길이가 가장 짧은 것을 정답으로 간주 (군더더기 부제가 없는 원본 게임일 확률이 높음)
      partialMatches.sort((a, b) => a.name.length - b.name.length);
      return partialMatches[0].id;
    }

    // 3. 그것마저 없다면 어쩔 수 없이 첫 번째 결과 반환
    return results[0].id;
    
  } catch (e) {
    return null;
  }
}

// 2. 스팀 API 영어 이름 가져오기
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

// 3. 전문가 리뷰 가져오기
async function fetchCriticReviews(openCriticGameId) {
  try {
    const url = `https://opencritic-api.p.rapidapi.com/review/game/${openCriticGameId}`;
    const res = await fetch(url, { headers: COMMON_HEADERS });
    if (!res.ok) return [];
    const reviews = await res.json();
    return Array.isArray(reviews) ? reviews : [];
  } catch (e) {
    return [];
  }
}   

async function main() {
  console.log("🚀 [공식 API 모드] 스마트 이어하기 + 횟수 최적화 수집 시작...\n");

  const { data: existingReviews, error: reviewCheckError } = await supabase
    .from('critic_reviews')
    .select('game_id');
    
  if (reviewCheckError) return console.error("리뷰 확인 중 에러:", reviewCheckError.message);

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

    let openCriticId = await fetchOpenCriticId(targetTitle);

    if (!openCriticId) {
      console.log(`⏩ 오픈크리틱 없음`);
      await new Promise(r => setTimeout(r, 1500));
      continue;
    }

    const reviews = await fetchCriticReviews(openCriticId);
    
    const topReviews = reviews.slice(0, 3).map(r => ({
      game_id: game.id,
      outlet: r.Outlet ? r.Outlet.name : "Unknown",
      author: r.Authors && r.Authors.length > 0 ? r.Authors[0].name : "Unknown",
      rating: r.score || 0,
      content: r.snippet, 
      url: r.externalUrl
    })).filter(r => r.content);

    if (topReviews.length > 0) {
      const { error: insertError } = await supabase
        .from('critic_reviews')
        .insert(topReviews);
      
      if (insertError) {
          console.log(`❌ DB 저장 실패: ${insertError.message}`);
      } else {
        console.log(`✅ ${topReviews.length}개 리뷰 저장 완료!`);
        totalSaved += topReviews.length;
      }
    } else {
      console.log("⚠️ 매칭은 성공했으나 리뷰 글이 없습니다.");
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n🎉 작업 끝! 오늘 새롭게 ${totalSaved}개의 전문가 평론을 저장했습니다.`);
}

main();