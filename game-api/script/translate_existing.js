require('dotenv').config();
const supabase = require('./supabase');
const translate = require('translate-google'); // 가입/카드 필요 없는 무료 번역기

async function main() {
  console.log("🚀 [DB 업데이트 모드] 기존 영어 리뷰 한국어 번역 시작...\n");

  // 1. 번역이 안 된(content_ko가 비어있는) 리뷰들만 DB에서 쏙 골라옵니다.
  const { data: reviewsToTranslate, error } = await supabase
    .from('critic_reviews')
    .select('*')
    .is('content_ko', null) // ⭐ 핵심: 아직 번역 안 된 것만 찾음
    .not('content', 'is', null); // 원문은 존재하는 것

  if (error) {
    return console.error("🚨 DB 불러오기 에러:", error.message);
  }

  if (!reviewsToTranslate || reviewsToTranslate.length === 0) {
    return console.log("✅ 이미 모든 리뷰가 완벽하게 번역되어 있습니다! 작업 종료.");
  }

  console.log(`총 ${reviewsToTranslate.length}개의 번역할 리뷰를 찾았습니다. 순차적으로 번역 후 덮어씌웁니다!\n`);

  let successCount = 0;

  for (const review of reviewsToTranslate) {
    // 테이블에 고유 ID(Primary Key)가 있어야 특정 줄(Row)만 업데이트할 수 있습니다.
    if (!review.id) {
        console.log(`⚠️ 리뷰 고유 ID가 없어 건너뜁니다. (게임 ID: ${review.game_id})`);
        continue;
    }

    process.stdout.write(`🔄 [리뷰 ID: ${review.id}] 번역 중... `);

    try {
      // 🇺🇸 영어 원문을 🇰🇷 한국어로 번역
      const translated = await translate(review.content, { to: 'ko' });

      if (translated) {
        // 2. 번역된 텍스트를 해당 리뷰의 'content_ko' 컬럼에 업데이트(Update) 합니다.
        const { error: updateError } = await supabase
          .from('critic_reviews')
          .update({ content_ko: translated })
          .eq('id', review.id); // 딱 이 리뷰만 찝어서 수정!

        if (updateError) {
          console.log(`❌ DB 업데이트 실패: ${updateError.message}`);
        } else {
          console.log(`✅ 완료! 🇰🇷`);
          successCount++;
        }
      } else {
        console.log(`⚠️ 번역 결과가 비어있음`);
      }
    } catch (e) {
      console.log(`❌ 번역 API 에러 (구글 차단일 수 있으니 잠시 후 다시 시도하세요)`);
    }

    // ⭐ 구글 봇 차단 방지를 위해 2초 대기 (무료 번역기의 필수 매너입니다)
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n🎉 작업 끝! 총 ${successCount}개의 기존 영어 리뷰에 한국어 자막을 달았습니다.`);
}

main();