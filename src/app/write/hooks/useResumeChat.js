"use client";

import React, { useState, useTransition } from "react";
import { supabase } from "@/lib/supabase";
import {
  generateAIResponseAction,
  generateResumeDescriptionAction,
} from "../actions";

export default function useResumeChat(resumeId, refetchDetails, experiences = [], projects = []) {
  const [activeSession, setActiveSession] = useState(null); // { id, target_section, target_id, title, status }
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [reopenedWithoutActivity, setReopenedWithoutActivity] = useState(false);

  const [isChatPending, setIsChatPending] = useState(false);
  const [isStarPending, startStarTransition] = useTransition();

  // 공통 세션 불러오기 또는 생성
  const loadOrCreateGeneralSession = React.useCallback(async () => {
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!resumeId || !uuidRegex.test(resumeId)) {
      return;
    }

    try {
      React.startTransition(() => {
        setMessagesLoading(true);
      });

      // 기존 공통 세션 조회 (중복 데이터가 존재하더라도 에러가 발생하지 않도록 select 배열로 조회)
      let { data: sessions, error: sessionErr } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("resume_id", resumeId)
        .is("target_section", null)
        .is("target_id", null)
        .order("created_at", { ascending: false });

      if (sessionErr) throw sessionErr;

      let session = sessions && sessions.length > 0 ? sessions[0] : null;

      // 없으면 신규 공통 세션 생성
      if (!session) {
        try {
          const { data: newSession, error: createErr } = await supabase
            .from("chat_sessions")
            .insert([
              {
                resume_id: resumeId,
                target_section: null,
                target_id: null,
                status: "active",
              },
            ])
            .select()
            .single();

          if (createErr) throw createErr;
          session = newSession;

          const welcomeText = `안녕하세요! ResumeForge AI 멘토입니다. 
아직 작성된 경력이나 프로젝트가 없으시거나, 무엇을 적을지 고민되시나요?
부담 갖지 마시고 대외활동, 동아리, 학업 프로젝트, 혹은 일상적인 코딩 공부나 아르바이트 등 지금까지 해오신 다양한 이야기들을 편하게 들려주세요. 
대화를 나누다 보면 이력서에 넣기 좋은 핵심 경험들을 제가 쏙쏙 골라내어 정리해 드릴게요! 😉`;

          await supabase.from("chat_messages").insert([
            {
              session_id: session.id,
              sender: "assistant",
              content: welcomeText,
            },
          ]);
        } catch (insertErr) {
          // 동시 요청으로 유니크 제약조건 충돌이 났을 경우 기존 세션 재조회
          if (
            insertErr.code === "23505" ||
            insertErr.message?.includes("23505") ||
            insertErr.message?.includes("duplicate key")
          ) {
            const { data: retrySession } = await supabase
              .from("chat_sessions")
              .select("*")
              .eq("resume_id", resumeId)
              .is("target_section", null)
              .is("target_id", null)
              .maybeSingle();
            session = retrySession;
          } else {
            throw insertErr;
          }
        }
      }

      React.startTransition(() => {
        setActiveSession({
          id: session.id,
          target_section: null,
          target_id: null,
          title: "AI 이력서 메이트 (경험 브레인스토밍)",
          status: session.status,
        });
      });

      // 메시지 불러오기
      const { data: messagesData, error: msgErr } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", session.id)
        .order("created_at", { ascending: true });

      if (msgErr) throw msgErr;
      React.startTransition(() => {
        setMessages(messagesData || []);
      });
    } catch (err) {
      console.error("공통 채팅 세션 로드 실패:", err.message || err);
    } finally {
      React.startTransition(() => {
        setMessagesLoading(false);
      });
    }
  }, [resumeId]);

  // 재개된 세션 자동 닫기 비동기 처리
  const autoCloseReopenedSession = React.useCallback(
    async (sessionIdToClose) => {
      if (!sessionIdToClose || !reopenedWithoutActivity) return;

      try {
        // 1. 해당 세션 상태를 다시 completed로 변경
        await supabase
          .from("chat_sessions")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", sessionIdToClose);

        // 2. 재시작 시 넣었던 안내용 시스템 메시지 삭제
        const reopenGuideText = `🔄 대화가 다시 열렸습니다. 추가적으로 수정하고 싶거나 AI의 조언이 필요한 부분을 자유롭게 말씀해 주세요!`;
        await supabase
          .from("chat_messages")
          .delete()
          .eq("session_id", sessionIdToClose)
          .eq("content", reopenGuideText);

        // 3. 부모 컴포넌트 상태를 리프레시하기 위해 refetchDetails 호출
        if (refetchDetails) {
          await refetchDetails();
        }
      } catch (err) {
        console.error("재개 세션 자동 잠금 오류:", err);
      } finally {
        React.startTransition(() => {
          setReopenedWithoutActivity(false);
        });
      }
    },
    [reopenedWithoutActivity, refetchDetails],
  );

  // 언마운트 / 이탈 시점에 자동 잠금 처리하기 위한 Refs 바인딩
  const activeSessionRef = React.useRef(activeSession);
  const reopenedRef = React.useRef(reopenedWithoutActivity);

  React.useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  React.useEffect(() => {
    reopenedRef.current = reopenedWithoutActivity;
  }, [reopenedWithoutActivity]);

  React.useEffect(() => {
    return () => {
      const session = activeSessionRef.current;
      const reopened = reopenedRef.current;
      if (session && reopened) {
        // 비동기 언마운트 시 즉시 실행을 위해 파이어앤포겟 방식으로 쿼리 전송
        supabase
          .from("chat_sessions")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", session.id)
          .then(() => {
            const reopenGuideText = `🔄 대화가 다시 열렸습니다. 추가적으로 수정하고 싶거나 AI의 조언이 필요한 부분을 자유롭게 말씀해 주세요!`;
            supabase
              .from("chat_messages")
              .delete()
              .eq("session_id", session.id)
              .eq("content", reopenGuideText);
          });
      }
    };
  }, []);

  // 마운트 시 공통 세션 자동 시작
  React.useEffect(() => {
    if (resumeId) {
      loadOrCreateGeneralSession();
    }
  }, [resumeId, loadOrCreateGeneralSession]);

  // 최초 꼬리 질문 동적 스트리밍 생성 (2단계 신규 세션 전용)
  const triggerFirstQuestionStream = async (sessionId, rawMemo) => {
    if (isChatPending) return;
    setIsChatPending(true);

    const tempAssistantId = `temp-first-question-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempAssistantId,
        session_id: sessionId,
        sender: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          history: [],
          newMessage: "수집된 메모를 기반으로 첫 번째 꼬리 질문을 던져줘.",
          isGeneral: false,
          rawMemo,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "AI 첫 대화 스트림 수신 실패");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponseText = "";
      let done = false;
      let hasReceivedFirstChunk = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkText = decoder.decode(value, { stream: !done });
          aiResponseText += chunkText;

          if (!hasReceivedFirstChunk) {
            hasReceivedFirstChunk = true;
            setIsChatPending(false); // 스피너 제거
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantId ? { ...m, content: aiResponseText } : m,
            ),
          );
        }
      }

      setIsChatPending(false);

      const { data: assistantMsgDb, error: assistantMsgErr } = await supabase
        .from("chat_messages")
        .insert([
          {
            session_id: sessionId,
            sender: "assistant",
            content: aiResponseText,
          },
        ])
        .select()
        .single();

      if (assistantMsgErr) throw assistantMsgErr;

      setMessages((prev) =>
        prev.map((m) => (m.id === tempAssistantId ? assistantMsgDb : m)),
      );
    } catch (error) {
      console.error("첫 꼬리 질문 스트리밍 실패:", error);
      setIsChatPending(false);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAssistantId
            ? {
                ...m,
                content:
                  "⚠️ 첫 번째 꼬리 질문을 생성하지 못했습니다. 아래 채팅창에 무엇이든 입력하여 대화를 시작해 보세요!",
              }
            : m,
        ),
      );
    }
  };

  // 1. 채팅창 시작 및 활성화 (특정 경력/프로젝트 대상)
  const handleStartChatSession = async (section, item) => {
    // 전환하기 전, 이전 세션이 수정 없이 재개된 상태였다면 자동 닫기 처리
    if (activeSession && reopenedWithoutActivity) {
      await autoCloseReopenedSession(activeSession.id);
    }

    try {
      React.startTransition(() => {
        setMessagesLoading(true);
      });
      const title =
        section === "experience"
          ? `${item.company_name} (${item.role || "역할 미지정"})`
          : `${item.project_name} (${item.role || "역할 미지정"})`;

      // 기존 세션 조회
      let { data: session, error: sessionErr } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("resume_id", resumeId)
        .eq("target_section", section)
        .eq("target_id", item.id)
        .single();

      let isNewSessionCreated = false;

      // 없으면 신규 세션 생성
      if (sessionErr || !session) {
        isNewSessionCreated = true;
        const { data: newSession, error: createErr } = await supabase
          .from("chat_sessions")
          .insert([
            {
              resume_id: resumeId,
              target_section: section,
              target_id: item.id,
              status: "active",
            },
          ])
          .select()
          .single();

        if (createErr) throw createErr;
        session = newSession;

        // 즉각적인 화면 전환을 위해 기본 웰컴 메시지만 먼저 빠르게 작성
        let welcomeText = "";
        if (item.raw_memo) {
          welcomeText = `📋 **등록된 메모**:\n"${item.raw_memo}"\n\n위 메모를 바탕으로 AI 멘토가 분석을 시작합니다. 잠시만 기다려 주세요...`;
        } else {
          welcomeText = `작성하신 내용이나 머릿속에 맴도는 생각들을 아래 채팅창에 자유롭게 적어주시겠어요? 본인의 기여도나 기술 스펙, 성과 등을 의식의 흐름대로 적어주시면 제가 꼬리 질문을 던지며 다듬어 드릴게요!`;
        }

        await supabase.from("chat_messages").insert([
          {
            session_id: session.id,
            sender: "assistant",
            content: welcomeText,
          },
        ]);
      }

      React.startTransition(() => {
        setActiveSession({
          id: session.id,
          target_section: section,
          target_id: item.id,
          title: title,
          status: session.status,
          raw_memo: item.raw_memo || "",
        });
      });

      // 해당 세션의 전체 메시지 조회
      const { data: messagesData, error: msgErr } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", session.id)
        .order("created_at", { ascending: true });

      if (msgErr) throw msgErr;
      React.startTransition(() => {
        setMessages(messagesData || []);
      });

      // 신규 세션이고 수집된 메모가 있다면 비동기로 최초 꼬리 질문 스트리밍 생성 수행
      if (isNewSessionCreated && item.raw_memo) {
        triggerFirstQuestionStream(session.id, item.raw_memo);
      }
    } catch (err) {
      console.error("채팅 세션 로드 실패:", err);
      alert("AI 챗봇을 실행하지 못했습니다.");
    } finally {
      React.startTransition(() => {
        setMessagesLoading(false);
      });
    }
  };

  // 2. 메시지 전송
  const handleSendMessage = async (newMessageText) => {
    if (!activeSession || isChatPending) return;

    if (reopenedWithoutActivity) {
      setReopenedWithoutActivity(false);
    }

    setIsChatPending(true);

    // 유저 상태 즉시 선반영 (낙관적 UI)
    const tempUserMsg = {
      id: "temp-user-id",
      session_id: activeSession.id,
      sender: "user",
      content: newMessageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // DB 저장을 백그라운드 비동기로 병렬 처리 (블로킹 제거)
    const userMsgPromise = supabase
      .from("chat_messages")
      .insert([
        {
          session_id: activeSession.id,
          sender: "user",
          content: newMessageText,
        },
      ])
      .select()
      .single();

    // 나중에 저장 완료 시 ID를 갈아끼우도록 핸들러 부착
    userMsgPromise.then(({ data: userMsgDb, error }) => {
      if (!error && userMsgDb) {
        setMessages((prev) =>
          prev.map((m) => (m.id === "temp-user-id" ? userMsgDb : m)),
        );
      }
    });

    try {
      // Gemini API용 히스토리 구성 (웰컴 메시지와 현재 전송할 새 메시지는 제외)
      const mockUserMsg = {
        ...tempUserMsg,
        id: "temp-user-id-placeholder",
      };
      let apiMsgs = [
        ...messages.filter((m) => m.id !== "temp-user-id"),
        mockUserMsg,
      ];

      // 1. Gemini API 제약 상 history의 첫 시작은 반드시 'user'여야 합니다.
      // 따라서 첫 번째 'user' 메시지가 나오는 위치를 찾아 그 이전의 모든 assistant/welcome 메시지는 제외합니다.
      const firstUserIndex = apiMsgs.findIndex((m) => m.sender === "user");
      if (firstUserIndex !== -1) {
        apiMsgs = apiMsgs.slice(firstUserIndex);
      } else {
        // user 메시지가 아예 없다면 (최초 질문에 대한 첫 답변 전송 시) 히스토리는 빈 배열이 되어야 함
        apiMsgs = [];
      }

      // 2. 현재 전송 중인 메시지(mockUserMsg)는 sendMessage API 호출 시 주입되므로 히스토리 배열 마지막에서 제외
      if (
        apiMsgs.length > 0 &&
        apiMsgs[apiMsgs.length - 1].id === mockUserMsg.id
      ) {
        apiMsgs = apiMsgs.slice(0, -1);
      }

      const formattedHistory = apiMsgs.map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

      // Supabase 조회 없이 activeSession에 저장된 raw_memo를 직접 활용하여 0ms 딜레이 실현
      const isGeneral = !activeSession.target_section;
      const rawMemo = activeSession.raw_memo || "";

      // 1. 임시 AI 응답 말풍선 추가 (낙관적 타이핑 렌더용)
      const tempAssistantId = "temp-assistant-id";
      setMessages((prev) => [
        ...prev,
        {
          id: tempAssistantId,
          session_id: activeSession.id,
          sender: "assistant",
          content: "",
          created_at: new Date().toISOString(),
        },
      ]);

      // 2. 이미 등록된 경험 목록 수집 (1단계 중복 질문 방지용)
      const existingItems = [
        ...experiences.map((e) => e.company_name),
        ...projects.map((p) => p.project_name),
      ].filter(Boolean);

      // 3. 스트리밍 API 호출
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          history: formattedHistory,
          newMessage: newMessageText,
          isGeneral,
          rawMemo,
          existingItems,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "AI 대화 스트림 수신 실패");
      }

      // 3. Reader 스트림 조각 순차적 수신
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponseText = "";
      let done = false;
      let hasReceivedFirstChunk = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkText = decoder.decode(value, { stream: !done });
          aiResponseText += chunkText;

          if (!hasReceivedFirstChunk) {
            hasReceivedFirstChunk = true;
            setIsChatPending(false); // 첫 조각이 수신되었으므로 스피너 비활성화
          }

          // 실시간 글자 누적 렌더링
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantId ? { ...m, content: aiResponseText } : m,
            ),
          );
        }
      }

      setIsChatPending(false);

      // 4. 최종 완성된 AI 답변 DB 영구 저장
      const { data: assistantMsgDb, error: assistantMsgErr } = await supabase
        .from("chat_messages")
        .insert([
          {
            session_id: activeSession.id,
            sender: "assistant",
            content: aiResponseText,
          },
        ])
        .select()
        .single();

      if (assistantMsgErr) throw assistantMsgErr;

      // 5. 임시 말풍선 ID를 실제 저장된 DB 메시지 객체로 치환
      setMessages((prev) =>
        prev.map((m) => (m.id === tempAssistantId ? assistantMsgDb : m)),
      );

      // [READY] 사인이 포함되어 있다면 세션 상태 완료 대기 상태로 변경
      if (aiResponseText.startsWith("[READY]")) {
        await supabase
          .from("chat_sessions")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("id", activeSession.id);
      }
    } catch (err) {
      console.error("메시지 전송 오류:", err);
      setIsChatPending(false);
      const errorMsg = {
        id: `error-${Date.now()}`,
        session_id: activeSession.id,
        sender: "assistant",
        content:
          "⚠️ 멘토 AI와의 연결이 매끄럽지 않습니다. 잠시 후 다시 메시지를 보내 주세요.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [
        ...prev.filter(
          (m) => m.id !== "temp-assistant-id" && m.id !== "temp-user-id",
        ),
        errorMsg,
      ]);
    }
  };

  // 3. STAR 이력서 자동 생성 후 최종 반영
  const handleBuildStarResume = () => {
    if (!activeSession || isStarPending) return;

    startStarTransition(async () => {
      try {
        const formattedHistory = messages.map((m) => ({
          role: m.sender === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }));

        const starDescription = await generateResumeDescriptionAction(
          formattedHistory,
          activeSession.target_section,
        );

        const updatePayload = {
          description: starDescription,
          raw_memo: messages
            .filter((m) => m.sender === "user")
            .map((m) => m.content)
            .join("\n\n"),
        };

        let dbErr;
        if (activeSession.target_section === "experience") {
          const { error } = await supabase
            .from("experience")
            .update(updatePayload)
            .eq("id", activeSession.target_id);
          dbErr = error;
        } else {
          const { error } = await supabase
            .from("projects")
            .update(updatePayload)
            .eq("id", activeSession.target_id);
          dbErr = error;
        }

        if (dbErr) throw dbErr;

        // 세션 완료 처리
        await supabase
          .from("chat_sessions")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", activeSession.id);

        React.startTransition(() => {
          setActiveSession((prev) => ({ ...prev, status: "completed" }));
        });

        // 완료 안내 메시지 추가
        const { data: completeMsg } = await supabase
          .from("chat_messages")
          .insert([
            {
              session_id: activeSession.id,
              sender: "assistant",
              content: `🎉 이력서 정리가 완료되었습니다! 작성된 STAR 문장이 우측 프리뷰 카드의 설명 문단에 자동으로 반영되었습니다. 마음에 들지 않으실 경우, 직접 연필 아이콘을 눌러 문구를 보완하실 수도 있습니다.`,
            },
          ])
          .select()
          .single();

        if (completeMsg) {
          React.startTransition(() => {
            setMessages((prev) => [...prev, completeMsg]);
          });
        }

        // 전체 화면 데이터 리프레시 호출
        if (refetchDetails) {
          await refetchDetails();
        }
      } catch (err) {
        console.error("STAR 빌드 오류:", err);
        alert("이력서 정제 중 오류가 발생했습니다. 다시 시도해 주세요.");
      }
    });
  };

  // 4. 채팅 닫기 -> 공통 세션 복구
  const handleCloseChat = async () => {
    if (activeSession && reopenedWithoutActivity) {
      await autoCloseReopenedSession(activeSession.id);
    }
    loadOrCreateGeneralSession();
  };

  // 5. 경력/프로젝트 수정 시 실시간 챗봇 상단 타이틀 동기화
  const syncSessionTitle = (targetId, newTitle) => {
    if (activeSession && activeSession.target_id === targetId) {
      React.startTransition(() => {
        setActiveSession((prev) => ({ ...prev, title: newTitle }));
      });
    }
  };

  // 6. 삭제된 대상이 현재 열린 세션일 경우 닫기
  const handleItemDeleted = (targetId) => {
    if (activeSession && activeSession.target_id === targetId) {
      handleCloseChat();
    }
  };

  // 7. 대화 초기화 (1단계 공통 세션용)
  const handleResetGeneralSession = async () => {
    if (!activeSession || activeSession.target_section !== null) return;

    try {
      React.startTransition(() => {
        setMessagesLoading(true);
      });

      // 해당 세션의 모든 메시지 삭제
      const { error: deleteErr } = await supabase
        .from("chat_messages")
        .delete()
        .eq("session_id", activeSession.id);

      if (deleteErr) throw deleteErr;

      // 초기 웰컴 메시지 다시 삽입
      const welcomeText = `안녕하세요! ResumeForge AI 멘토입니다. 
아직 작성된 경력이나 프로젝트가 없으시거나, 무엇을 적을지 고민되시나요?
부담 갖지 마시고 대외활동, 동아리, 학업 프로젝트, 혹은 일상적인 코딩 공부나 아르바이트 등 지금까지 해오신 다양한 이야기들을 편하게 들려주세요. 
대화를 나누다 보면 이력서에 넣기 좋은 핵심 경험들을 제가 쏙쏙 골라내어 정리해 드릴게요! 😉`;

      const { data: newMsg, error: insertErr } = await supabase
        .from("chat_messages")
        .insert([
          {
            session_id: activeSession.id,
            sender: "assistant",
            content: welcomeText,
          },
        ])
        .select()
        .single();

      if (insertErr) throw insertErr;

      React.startTransition(() => {
        setMessages([newMsg]);
      });
    } catch (err) {
      console.error("대화 초기화 실패:", err);
      alert("대화 내역을 초기화하지 못했습니다.");
    } finally {
      React.startTransition(() => {
        setMessagesLoading(false);
      });
    }
  };

  // 8. 완료된 세션을 다시 active 상태로 변경
  const handleReopenSession = async () => {
    if (!activeSession || activeSession.status !== "completed") return;

    try {
      React.startTransition(() => {
        setMessagesLoading(true);
        setReopenedWithoutActivity(true);
      });

      // DB의 세션 상태를 active로 변경
      const { error: updateErr } = await supabase
        .from("chat_sessions")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", activeSession.id);

      if (updateErr) throw updateErr;

      // 로컬 상태 변경
      React.startTransition(() => {
        setActiveSession((prev) => ({ ...prev, status: "active" }));
      });

      // 재시작 안내 시스템 메시지 삽입
      const reopenGuideText = `🔄 대화가 다시 열렸습니다. 추가적으로 수정하고 싶거나 AI의 조언이 필요한 부분을 자유롭게 말씀해 주세요!`;

      const { data: newMsg, error: insertErr } = await supabase
        .from("chat_messages")
        .insert([
          {
            session_id: activeSession.id,
            sender: "assistant",
            content: reopenGuideText,
          },
        ])
        .select()
        .single();

      if (insertErr) throw insertErr;

      React.startTransition(() => {
        setMessages((prev) => [...prev, newMsg]);
      });
    } catch (err) {
      console.error("세션 재시작 실패:", err);
      alert("대화를 다시 열지 못했습니다.");
    } finally {
      React.startTransition(() => {
        setMessagesLoading(false);
      });
    }
  };

  return {
    activeSession,
    messages,
    messagesLoading,
    isChatPending,
    isStarPending,
    handleStartChatSession,
    handleSendMessage,
    handleBuildStarResume,
    handleCloseChat,
    syncSessionTitle,
    handleItemDeleted,
    handleResetGeneralSession,
    handleReopenSession,
  };
}
