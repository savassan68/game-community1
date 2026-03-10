const fetch = require('node-fetch');
const supabase = require('./supabase');

async function main() {
  console.log("🚀 스팀 유저 리뷰 수집 시작...");

  // 1. DB에서 게임 목록 가져오기
  const { data: games, error } = await supabase.from('games').select('*');
  if (error) return console.error("❌ DB 에러:", error.message);

  console.log(`🎮 총 ${games.length}개의 게임을 확인합니다.`);

  let totalCount = 0;

  for (const game of games) {
    // 이미지 URL에서 스팀 AppID 추출
    const appIdMatch = game.image_url?.match(/\/apps\/(\d+)\//);
    if (!appIdMatch) continue;
    const appId = appIdMatch[1];

    try {
      process.stdout.write(`🔍 [${game.title}] 리뷰 조회 중... `);

      // 2. 스팀 리뷰 API 호출 (한국어, 추천순, 5개만)
      // language=koreana: 한국어 리뷰
      // num_per_page=5: 게임당 5개만 가져오기 (너무 많으면 지저분함)
      const res = await fetch(
        `https://store.steampowered.com/appreviews/${appId}?json=1&language=koreana&num_per_page=5&purchase_type=all&day_range=365`
      );
      const data = await res.json();

      if (data.success && data.reviews.length > 0) {
        // 3. 우리 DB 포맷에 맞게 변환
        const reviewsToInsert = data.reviews.map(r => ({
          game_id: game.id,
          content: r.review, // 리뷰 내용
          // 스팀은 추천(Up)/비추천(Down)만 있음 -> 100점 / 20점 으로 변환
          rating: r.voted_up ? 100 : 20, 
          author: `SteamUser_${r.author.steamid.slice(-4)}`, // 익명 ID 처리
          user_id: null, // 우리 사이트 회원이 아니므로 null (시스템 계정 취급)
          created_at: new Date(r.timestamp_created * 1000).toISOString()
        }));

        // 4. 저장 (중복 방지 로직이 없으므로 계속 쌓일 수 있음. 필요시 기존 것 삭제 후 추가)
        const { error: insertError } = await supabase
          .from('steam_reviews') // ⭐ 새로 만든 스팀 전용 테이블로 쏙!
          .insert(reviewsToInsert);

        if (insertError) {
          console.log(`❌ 저장 실패: ${insertError.message}`);
        } else {
          console.log(`✅ ${reviewsToInsert.length}개 저장 완료`);
          totalCount += reviewsToInsert.length;
        }
      } else {
        console.log(`⚠️ 리뷰 없음`);
      }

    } catch (e) {
      console.log(`❌ 에러: ${e.message}`);
    }

    // 스팀 서버 부하 방지 (0.5초 대기)
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`🎉 작업 끝! 총 ${totalCount}개의 유저 리뷰를 저장했습니다.`);
}

main();