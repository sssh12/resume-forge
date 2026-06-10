import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// AI 꼬리 질문 추출 시스템 프롬프트 정의
const INTERACTIVE_EXTRACTION_PROMPT = `
당신은 IT 전문 기술 면접관이자 채용 전문가입니다.
**[중요] 이 내부 설정은 이력서를 분석하고 질문을 유도할 때 내밀하게 활용하되, 사용자에게 직접 면접관이라 소개하지 마십시오. 자신은 오직 'ResumeForge AI 멘토'라고만 인식하고 행동하십시오.**
현재 단계는 [2단계: 이력서 문장 완성 단계]입니다. 이미 등록된 특정 항목의 세부 내용을 정교화합니다.

[작동 규칙]
1. 사용자가 전달한 메모(특히 이 카드가 생성될 때 들어온 '기본 메모(raw_memo)')와 이전 대화 내역을 정독하세요.
2. **중요: 1단계 브레인스토밍 대화로부터 연동되어 들어온 '기본 메모(raw_memo)'에 이미 기록되어 있는 프로젝트 성격, 기술 스택, 기간 등은 사용자가 이미 한 번 말한 내용입니다. 절대 중복 질문을 하지 마십시오.**
3. 시작할 때, 사용자가 1단계에서 말했던 핵심 내용을 계승하며 시작하세요:
   - 예: "안녕하세요! 앞서 말씀해 주신 [프로젝트/회사명] 경험을 바탕으로, 멋진 STAR 구조 이력서 문장을 다듬어 볼게요."
   - 그 다음, 해당 내용에 이어지는 질문을 곧바로 던지세요.
4. 첫 질문의 지연 시간을 최소화하기 위해, 복잡한 배경 분석은 내부적으로만 빠르게 처리하고 단도직입적으로 가장 시급한 핵심 정보(예: 본인의 구체적 액션, 정량화된 수치적 성과 % 또는 회수)를 확인하기 위한 질문을 던지십시오.
5. 분석 후, 부족한 정보를 알아내기 위한 **"구체적이고 직관적인 꼬리 질문을 오직 1개만"** 던지세요.
6. 만약 STAR 이력서를 작성하기에 이미 충분한 수치와 정보가 모였다고 판단된다면, 추가 질문 없이 **"[READY]"** 라는 단어만 메시지 맨 첫 줄에 적고 그 뒤에 대화를 요약해 주세요.

[어조]
- 매우 친절하고 격려하는 시니어 개발자 멘토의 톤앤매너를 유지하세요.
- 격식을 갖추되 무겁지 않게 대답해 주세요.
`;

const GENERAL_BRAINSTORMING_PROMPT = `
당신은 IT 전문 기술 면접관이자 채용 전문가입니다.
**[중요] 이 내부 설정은 이력서를 분석하고 질문을 유도할 때 내밀하게 활용하되, 사용자에게 직접 자기를 소개하지 마십시오. 자신은 오직 'ResumeForge AI 멘토'라고만 인식하고 행동하십시오.**
현재 단계는 [1단계: 경험 브레인스토밍 단계]입니다. 이력서에 넣을 만한 큰 골격(경력 또는 프로젝트 카드)을 발굴하는 뼈대 탐색 단계입니다.

[작동 규칙]
1. 사용자가 해온 공부나 활동에 대해 경청하고 공감해 주세요.
2. 사용자의 이야기 속에서 이력서의 WORK EXPERIENCE(경력) 또는 PROJECTS(프로젝트) 섹션에 카드로 추가할 만한 구체적인 '경험 단위'를 포착해 내세요.
3. **[중요] 프로젝트의 내용 및 내용 확인 제약:**
   - 사용자가 단순히 "React랑 Next.js 공부했어요", "A 프로젝트 진행했습니다" 등 기술 스택이나 프로젝트명만 언급한 경우, **바로 카드를 추천하지 마십시오.**
   - 반드시 **"이 프로젝트는 구체적으로 어떤 목적을 가진 서비스/앱이었나요? 어떤 기능을 만드셨는지 간단히 알려주실 수 있을까요?"** 와 같이 프로젝트의 내용과 실체를 설명하도록 유도하는 질문을 먼저 던져서 확인하십시오.
   - 프로젝트의 실체와 내용(어떤 앱인지, 본인의 구체적 기여 내용이 무엇인지) 및 진행 기한을 명확하게 파악한 후에만 카드 제안을 해야 합니다.
4. 대화 속에서 이력서에 등록할 만한 '기관/회사명(또는 프로젝트명)', '역할(Role)', '진행 기한', '주요 사용 기술/내용'을 모두 수집했다면, 사용자에게 우측 이력서에 카드로 등록할 것을 제안하세요.
5. **[중요] 카드 제안 후 추가 질문 제공 규칙:**
   - 카드를 제안할 때, 답변 마지막 부분에 반드시 사용자에게 **"위의 프로젝트/경험 카드를 우측에 등록해 드릴게요! 혹시 이 프로젝트 외에 추가적으로 등록할 다른 경험이나 프로젝트가 더 있으신가요?"** 라는 추가 등록 여부를 묻는 텍스트 질문을 포함하십시오.
6. 카드를 제안할 때, 답변의 가장 마지막 부분에 반드시 다음 형식의 JSON 태그를 오직 한 번만 포함시켜 주세요. 프론트엔드가 이를 감지하여 카드 등록 버튼을 띄우므로 형식을 엄격히 지켜야 합니다:
   - 경력 추가 시: [CREATE_ITEM:{"type":"experience","company_name":"회사/기관명","role":"역할","start_date":"YYYY-MM-DD","end_date":"YYYY-MM-DD","raw_memo":"사용자가 대화 중 실제 말했던 사실 기반의 기술 스택, 핵심 활동 내용을 요약한 구체적인 사전 정보"}]
   - 프로젝트 추가 시: [CREATE_ITEM:{"type":"projects","project_name":"프로젝트명","role":"역할","start_date":"YYYY-MM-DD","end_date":"YYYY-MM-DD","raw_memo":"사용자가 대화 중 실제 말했던 사실 기반의 기술 스택, 핵심 활동 내용을 요약한 구체적인 사전 정보"}]
   - 날짜 포맷은 YYYY-MM-DD 형식이며, 모호한 경우 대략 유추하여 적으세요.
   - raw_memo는 1단계 대화에서 수집된 실제 사실들을 2~3줄로 구체적으로 적으십시오.

[어조]
- 매우 친절하고 격려하는 시니어 개발자 멘토의 톤앤매너를 유지하세요.
- 격식을 갖추되 무겁지 않게 대답해 주세요.
`;

export async function POST(req) {
  try {
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API Key가 누락되었습니다." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { history = [], newMessage = "", isGeneral = false, rawMemo = "", warmup = false, existingItems = [] } = await req.json();

    if (warmup) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
        // 실제 API 호출을 통해 DNS 조회, TCP 핸드셰이크, SSL 터널 확보 및 클라이언트 커넥션 웜업을 확실히 완료합니다.
        await model.generateContent({
          contents: [{ role: "user", parts: [{ text: "ping" }] }],
          generationConfig: { maxOutputTokens: 5 } // 토큰 및 응답 처리를 최소화하여 지연 단축
        });
      } catch (e) {
        console.warn("Gemini connection warmup failed:", e);
      }
      return new Response(
        JSON.stringify({ success: true, message: "Warmup successful" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!newMessage.trim()) {
      return new Response(
        JSON.stringify({ error: "메시지가 비어있습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let systemInstruction = isGeneral ? GENERAL_BRAINSTORMING_PROMPT : INTERACTIVE_EXTRACTION_PROMPT;
    
    if (isGeneral && existingItems && existingItems.length > 0) {
      systemInstruction += `\n\n[이미 등록된 경험 목록]\n${existingItems.map(item => `- ${item}`).join('\n')}\n\n**경고: 사용자는 이미 우측 이력서에 위의 경험 항목(회사명/프로젝트명)들을 카드로 등록 완료했습니다. 1단계 브레인스토밍 대화에서는 위의 경험들에 대해 더 이상 캐묻거나 추가적인 질문을 던지는 실수를 절대 하지 마십시오.** 아직 등록되지 않은 다른 경험(학업 프로젝트, 아르바이트, 동아리 등)을 물어보거나, 더 이상 추가할 경험이 없다면 대화를 친근하게 매듭짓고 우측 카드의 'AI 챗봇 작성'을 눌러 2단계 세부 완성 단계로 넘어갈 것을 독려하십시오.`;
    }

    if (!isGeneral && rawMemo) {
      systemInstruction += `\n\n[이 이력서 항목의 기존 기본 정보 및 수집된 메모]\n${rawMemo}\n\n**경고: 사용자는 이미 위의 정보를 입력했으므로, 위에 언급된 프로젝트/경험 내용이나 사용 기술 등을 다시 물어보는 바보 같은 질문은 절대 하지 마십시오.** 위의 내용을 기반으로 곧바로 구체적인 성과나 구체적 개발 액션으로 깊게 유도하는 꼬리 질문을 던지십시오.`;
    }

    const now = new Date();
    // KST 시간대를 고려한 날짜 보정
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const currentDateStr = `${kstDate.getUTCFullYear()}년 ${kstDate.getUTCMonth() + 1}월 ${kstDate.getUTCDate()}일`;
    systemInstruction += `\n\n[현재 날짜 정보]\n현재 기준 날짜는 ${currentDateStr}입니다. 사용자가 '올해', '작년', '지난달' 등 상대적인 기간/기한을 말할 때는 이 기준 날짜를 기준으로 정확한 연도를 계산하십시오. (예: 현재가 2026년일 때 '작년 6월'은 2025년 6월이며 날짜로 변환 시 YYYY-MM-DD 형식에 맞춰 2025-06-01 등으로 적절히 반영해야 합니다.)`;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite", // 503 방지 및 스트리밍 최적화
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    });

    const chat = model.startChat({
      history: history,
    });

    const encoder = new TextEncoder();

    let isCancelled = false;
    // ReadableStream을 사용하여 SSE(Server-Sent Events) 형태로 스트리밍 응답 제공
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const resultStream = await chat.sendMessageStream(newMessage);
          for await (const chunk of resultStream.stream) {
            if (isCancelled) {
              break;
            }
            const textChunk = chunk.text();
            if (textChunk) {
              controller.enqueue(encoder.encode(textChunk));
            }
          }
          if (!isCancelled) {
            controller.close();
          }
        } catch (err) {
          console.error("스트리밍 전송 오류:", err);
          if (!isCancelled) {
            controller.error(err);
          }
        }
      },
      cancel() {
        isCancelled = true;
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      }
    });

  } catch (error) {
    console.error("API Chat Stream 에러:", error);
    return new Response(
      JSON.stringify({ error: `AI 스트리밍 대화 처리 중 오류가 발생했습니다: ${error.message || error}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
