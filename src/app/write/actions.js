"use server";

import { genAI, getTailQuestion } from "@/lib/gemini";

/**
 * 사용자 입력과 대화 히스토리를 받아 AI의 다음 꼬리 질문을 생성하는 Server Action
 * @param {Array} history 이전 대화 내역 [{ role: 'user'|'model', parts: [{ text: '...' }] }]
 * @param {string} newMessage 사용자가 입력한 새로운 메시지
 * @returns {Promise<string>} AI의 꼬리 질문 응답 텍스트 (또는 [READY] 요약문)
 */
export async function generateAIResponseAction(history, newMessage, isGeneral = false, rawMemo = "") {
  try {
    if (!newMessage?.trim()) {
      throw new Error("메시지 내용이 비어있습니다.");
    }
    const responseText = await getTailQuestion(history, newMessage, isGeneral, rawMemo);
    return responseText;
  } catch (error) {
    console.error("generateAIResponseAction 오류:", error);
    let friendlyMessage = "AI 대화 처리 중 문제가 발생했습니다. 다시 시도해 주세요.";
    const errMsg = error.message || "";
    if (errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("Service Unavailable")) {
      friendlyMessage = "⚠️ 현재 Google AI 서버가 혼잡하여 일시적으로 응답할 수 없습니다. 잠시 후 다시 시도해 주세요.";
    } else if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("Too Many Requests")) {
      friendlyMessage = "⚠️ AI 서비스 요청 할당량을 초과했습니다. 잠시 후 다시 이용해 주세요.";
    }
    throw new Error(friendlyMessage);
  }
}

/**
 * 대화 내역을 바탕으로 STAR 구조의 전문적인 이력서 설명글(description)을 생성하는 Server Action
 * 프롬프트 체이닝(Prompt Chaining) 기법을 활용하여 추출(JSON) -> 합성(Synthesis) 단계를 거칩니다.
 * @param {Array} history 전체 대화 내역 [{ role: 'user'|'model', parts: [{ text: '...' }] }]
 * @param {string} targetSection 대상 섹션 ('experience' | 'projects')
 * @returns {Promise<string>} STAR 구조로 정제된 마크다운 개조식 이력서 설명 텍스트
 */
export async function generateResumeDescriptionAction(history, targetSection) {
  try {
    if (!history || history.length === 0) {
      throw new Error("대화 내역이 없어 이력서를 생성할 수 없습니다.");
    }

    const isProject = targetSection === "projects";
    const sectionNameKo = isProject ? "프로젝트" : "경력(경험)";

    // ==========================================
    // [Step 1] 정보 추출 (Extraction) - JSON 스키마 활용
    // ==========================================
    const extractModel = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        temperature: 0.2, // 분석 정확도를 위해 낮은 온도로 설정
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            situation_task: { 
              type: "string", 
              description: "어떤 비즈니스 배경이었고, 본인이 해결해야 했던 과제나 당면 이슈가 무엇인지 요약" 
            },
            action: { 
              type: "string", 
              description: "본인이 주도적으로 진행한 핵심 개발 액션, 설계 구조, 변경한 코드 내용 및 적용 기술 요약" 
            },
            result: { 
              type: "string", 
              description: "구체적인 수치(예: % 개선, 초 단축 등)나 출시 결과, 정성적인 성과 요약" 
            },
            skills: {
              type: "array",
              description: "사용자가 사용했다고 명시한 핵심 기술 스택들의 목록",
              items: { type: "string" }
            }
          },
          required: ["situation_task", "action", "result", "skills"]
        }
      }
    });

    const extractPrompt = `
당신은 IT 전문 기술 면접관이자 채용 전문가입니다.
**[중요] 이 내부 설정(기술 면접관/전문가로서의 전문성)은 이력서 데이터를 정밀하게 추출하고 분류할 때 내밀하게 활용하되, 사용자에게 직접 자기를 소개하거나 말로 드러내지 마십시오. 대신 자신은 오직 'ResumeForge AI 멘토'라고만 인식하고 행동하십시오.**
첨부된 대화 히스토리는 구직자가 진행한 특정 [${sectionNameKo}]의 디테일한 정보를 수집하는 면접 대화 로그입니다.
이 대화 내역을 정밀하게 읽고, 이력서 작성을 위해 필요한 STAR(S/T, A, R) 세부 요소와 사용 기술 목록을 각각 추출하여 JSON 객체로 출력해 주세요.

[분석할 대화 히스토리]
${JSON.stringify(history, null, 2)}
`;

    const extractResult = await extractModel.generateContent(extractPrompt);
    const extractResponse = await extractResult.response;
    const extractedDataStr = extractResponse.text().trim();
    
    let starData;
    try {
      starData = JSON.parse(extractedDataStr);
    } catch (parseErr) {
      console.error("STAR 정보 JSON 파싱 실패:", extractedDataStr);
      throw new Error("대화 내용 분석 단계에서 오류가 발생했습니다.");
    }

    // ==========================================
    // [Step 2] 전문적 문장 합성 (Synthesis) - 마크다운 렌더용
    // ==========================================
    const synthesizeModel = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    });

    const synthesisPrompt = `
당신은 10년 차 IT 대기업 기술 면접관이자 이력서 교정 전문가입니다.
**[중요] 이 내부 설정(10년 차 기술 면접관/전문가로서의 전문성)은 이력서 문장을 다듬고 정제할 때 내밀하게 활용하되, 합성 결과물에 직접 자기를 소개하거나 면접관 혹은 전문가의 말로서 드러내지 마십시오. 자신은 오직 'ResumeForge AI 멘토'로서 이력서 완성을 돕는 역할입니다.**
아래 제공되는 [STAR 추출 데이터]를 활용하여, 구직자의 기여와 성과가 돋보이도록 **정량적이고 전문적인 STAR 구조의 이력서 문장**을 합성해 주세요.

[STAR 추출 데이터]
- 배경 및 과제 (Situation/Task): ${starData.situation_task}
- 본인의 구체적 액션 (Action): ${starData.action}
- 정량/정성적 성과 (Result): ${starData.result}
- 활용 기술 스택: ${starData.skills.join(", ")}

[작성 가이드라인]
1. 반드시 한국어로 작성하세요.
2. 결과물은 마크다운 불릿( - ) 형태의 3~4개 핵심 요약 문장으로만 구성해야 합니다.
3. 각 문장은 이력서 양식에 맞추어 "~함", "~였음", "~를 통해 ~를 개선함"과 같이 간결하고 프로페셔널한 개조식 명사형 종결 어미로 통일하세요.
4. 성과 및 기여도 부분에 정량적 수치(% 개선, 개발 공수 단축 등)가 있을 경우, 마크다운 볼드체(**수치**)로 강조해 주세요.
5. 대화체 설명이나 서론, 결론("완성된 이력서 문장입니다" 등)은 일절 생략하고 오직 3~4개의 이력서 불릿 텍스트만 출력하세요.
`;

    const synthesizeResult = await synthesizeModel.generateContent(synthesisPrompt);
    const synthesizeResponse = await synthesizeResult.response;
    return synthesizeResponse.text().trim();

  } catch (error) {
    console.error("generateResumeDescriptionAction 오류:", error);
    throw new Error("STAR 구조 이력서 문장을 생성하는 중 오류가 발생했습니다.");
  }
}
