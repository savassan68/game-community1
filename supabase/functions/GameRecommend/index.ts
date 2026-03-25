import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.28.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { mode, selectedGames, userInput } = await req.json()
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    const rawgKey = Deno.env.get('RAWG_API_KEY')

    if (!openAiKey || !rawgKey) throw new Error("API keys are not configured.")

    const openai = new OpenAI({ apiKey: openAiKey })

    // 1. 추천 게임 후보 선정 (영어 제목 추출)
    const searchPrompt = mode === 'logic' 
      ? `사용자가 좋아하는 게임들(${selectedGames?.join(', ')})의 특징을 분석하여, 이와 유사한 장르나 메카니즘을 가진 실존하는 명작 게임 5개를 정확한 영어 제목으로만 추천해줘.`
      : `사용자 요구사항("${userInput}")에 완벽히 부합하는 실존하는 게임 5개를 정확한 영어 제목으로만 추천해줘.`

    const searchCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "당신은 게임 데이터베이스 전문가입니다. 결과는 반드시 JSON 형식 { \"games\": [\"Title1\", \"Title2\"] }로만 답변하세요." },
        { role: "user", content: searchPrompt }
      ],
      response_format: { type: "json_object" }
    })

    const recommendedNames = JSON.parse(searchCompletion.choices[0].message.content!).games as string[]

    // 2. RAWG API 데이터 매칭
    const gameDetails = await Promise.all(
      recommendedNames.slice(0, 5).map(async (name) => {
        try {
          const res = await fetch(`https://api.rawg.io/api/games?key=${rawgKey}&search=${encodeURIComponent(name)}&page_size=1`)
          const data = await res.json()
          return (data.results && data.results.length > 0) ? data.results[0] : null
        } catch { return null }
      })
    )

    const validGames = gameDetails.filter(g => g !== null)

    // 3. 객관적인 게임 소개 및 추천 사유 생성
    const finalRecommendations = await Promise.all(validGames.map(async (game) => {
      const reviewCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `당신은 해박한 지식을 가진 게임 큐레이터입니다. 
            추천하는 게임이 '어떤 게임인지'와 '왜 이 게임이 뛰어난지'를 설명하세요.
            1. 사용자의 과거 취향을 언급하거나 '좋아하실 겁니다' 같은 추측성 문구는 절대 쓰지 마세요.
            2. 게임의 핵심 시스템, 세계관, 예술적 특징 등 객관적인 매력을 중심으로 서술하세요.
            3. 'AI Pick'이나 '추천 사유' 같은 머리말 없이 바로 본론으로 시작하여 3~4문장의 한국어로 작성하세요.` 
          },
          { 
            role: "user", 
            content: `대상 게임: ${game.name}, 장르: ${game.genres?.map((g: any) => g.name).join(', ')}` 
          }
        ]
      })

      return {
        id: game.id,
        title: game.name,
        image_url: game.background_image,
        metacritic: game.metacritic,
        reason: reviewCompletion.choices[0].message.content,
        genres: game.genres?.map((g: any) => g.name) || []
      }
    }))

    return new Response(JSON.stringify({ recommendations: finalRecommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})