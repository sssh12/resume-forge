"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Send, X, Loader2, FileText, RotateCcw } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

// 마크다운 **강조** 텍스트를 HTML strong 태그로 렌더링하는 안전한 리액트 헬퍼
const renderFormattedText = (text) => {
  if (!text) return "";

  // **텍스트** 패턴을 분리하여 쪼갭니다.
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const cleanText = part.slice(2, -2);
      return (
        <strong
          key={index}
          className="font-extrabold text-slate-900 drop-shadow-2xs"
        >
          {cleanText}
        </strong>
      );
    }
    return part;
  });
};

export default function ChatWidget({
  activeSession,
  messages,
  messagesLoading,
  isChatPending,
  isStarPending,
  onSendMessage,
  onBuildStarResume,
  onClose,
  onSaveExp,
  onSaveProj,
  onStartChat,
  onResetGeneral,
  onReopenSession,
}) {
  const [chatInput, setChatInput] = useState("");
  const [isCreatingSuggestion, setIsCreatingSuggestion] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const chatEndRef = useRef(null);

  // 메시지 전송 처리
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatPending) return;
    onSendMessage(chatInput.trim());
    setChatInput("");
  };

  // 새 메시지가 들어올 때마다 최하단 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatPending]);

  // AI 추천 항목 수락 및 생성 처리
  const handleAcceptSuggestion = async (itemData) => {
    if (isCreatingSuggestion) return;
    setIsCreatingSuggestion(true);
    try {
      const { type } = itemData;
      let savedItem = null;

      if (type === "experience") {
        const form = {
          company_name: itemData.company_name || "새로운 경력",
          role: itemData.role || "",
          start_date: itemData.start_date || null,
          end_date: itemData.end_date || null,
          description: "",
          raw_memo: itemData.raw_memo || "",
        };
        savedItem = await onSaveExp("new", form);
      } else if (type === "projects") {
        const form = {
          project_name: itemData.project_name || "새로운 프로젝트",
          role: itemData.role || "",
          start_date: itemData.start_date || null,
          end_date: itemData.end_date || null,
          description: "",
          raw_memo: itemData.raw_memo || "",
        };
        savedItem = await onSaveProj("new", form);
      }

      if (savedItem && onStartChat) {
        // 성공 시 자동으로 해당 신규 세션으로 전환
        onStartChat(type, savedItem);
      }
    } catch (err) {
      console.error("추천 항목 생성 오류:", err);
      alert("경험 항목을 추가하는 과정에서 오류가 발생했습니다.");
    } finally {
      setIsCreatingSuggestion(false);
    }
  };

  if (!activeSession) {
    return (
      <Card className="flex flex-col items-center justify-center text-center p-8 glass border-dashed border-slate-200/60 h-full rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-5 text-slate-400">
          <FileText className="h-8 w-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1.5">
          선택된 AI 대화가 없습니다
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-[280px] font-normal">
          우측의 경력 및 프로젝트 항목에서{" "}
          <span className="text-primary font-bold">
            &quot;AI 챗봇 작성&quot;
          </span>{" "}
          버튼을 누르시면, 시니어 멘토와의 1:1 이력서 다듬기 대화가 시작됩니다.
        </p>
      </Card>
    );
  }

  // AI가 준비 완료 신호를 보냈는지 검사 (READY가 포함된 메시지가 존재하는지 확인)
  const isAIReady = messages.some(
    (m) => m.sender === "assistant" && m.content.includes("[READY]"),
  );

  // 현재 세션이 공통 대화 세션(경험 발굴 세션)인지 여부
  const isGeneralSession = !activeSession.target_section;

  return (
    <>
      <Card className="flex flex-col h-full glass border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden rounded-2xl">
        {/* 챗봇 헤더 */}
        <div className="p-4 border-b border-slate-100/50 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                isGeneralSession
                  ? "bg-purple-100 text-purple-600"
                  : "bg-emerald-100 text-emerald-600"
              }`}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-bold text-slate-800">AI 멘토</p>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold tracking-tight ${
                    isGeneralSession
                      ? "bg-purple-50 text-purple-700 border border-purple-100"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  }`}
                >
                  {isGeneralSession
                    ? "1단계: 경험 브레인스토밍"
                    : "2단계: 이력서 문장 완성"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5">
                {activeSession.title}
              </p>
            </div>
          </div>
          {isGeneralSession ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetConfirmOpen(true)}
              className="h-8 text-xs border-slate-200 text-black hover:bg-slate-200 font-bold px-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-2xs"
              title="브레인스토밍 대화 초기화"
            >
              <RotateCcw className="h-3 w-3" />
              대화 초기화
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full"
              title="공통 대화로 돌아가기"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 단계별 가이드 배너 */}
        <div
          className={`px-4 py-2.5 text-[11px] font-semibold border-b flex items-center justify-between transition-colors ${
            isGeneralSession
              ? "bg-purple-50/50 text-purple-700 border-purple-100/30"
              : "bg-emerald-50/50 text-emerald-700 border-emerald-100/30"
          }`}
        >
          <span className="flex items-center gap-1">
            {isGeneralSession
              ? "💡 이력서에 넣을 경력 및 프로젝트 카드를 발굴하는 단계입니다."
              : "🎯 선택한 카드의 세부 기술과 정량 성과를 정리해 이력서 문장을 완성합니다."}
          </span>
          {isGeneralSession && (
            <span className="text-[9px] text-purple-500 font-bold bg-purple-100/50 px-1.5 py-0.5 rounded">
              기한·기술 필수
            </span>
          )}
        </div>

        {/* 챗 메시지창 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent">
          {messagesLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <p className="text-xs text-slate-400">대화 내역 불러오는 중...</p>
            </div>
          ) : (
            messages.map((msg) => {
              // 스트리밍 준비 중이거나 첫 메시지 수신 대기 중 발생하는 빈 메시지는 비노출 처리
              if (!msg.content || !msg.content.trim()) {
                return null;
              }
              const isSelf = msg.sender === "user";

              // [READY] 단어 파싱하여 UI에서 가독성 높임
              let displayContent = msg.content;
              const isReadyMsg = msg.content.startsWith("[READY]");
              if (isReadyMsg) {
                displayContent = msg.content.replace(
                  "[READY]",
                  "🎯 [대화 완성 검증 완료]\n",
                );
              }

              // [CREATE_ITEM:...] 파싱
              let suggestionData = null;
              const createItemMatch = msg.content.match(
                /\[CREATE_ITEM:(.*?)\]/,
              );
              if (createItemMatch) {
                try {
                  suggestionData = JSON.parse(createItemMatch[1]);
                  displayContent = msg.content
                    .replace(/\[CREATE_ITEM:(.*?)\]/, "")
                    .trim();
                } catch (e) {
                  console.error("추천 데이터 파싱 오류:", e);
                }
              }

              return (
                <div key={msg.id} className="space-y-2 animate-fade-in">
                  <div
                    className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-normal shadow-xs whitespace-pre-wrap leading-relaxed ${
                        isSelf
                          ? "bg-primary text-white rounded-br-xs"
                          : isReadyMsg
                            ? "bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-bl-xs"
                            : "bg-white text-slate-800 border border-slate-200/60 rounded-bl-xs"
                      }`}
                    >
                      {renderFormattedText(displayContent)}
                    </div>
                  </div>

                  {/* AI가 제안한 이력서 추가 추천 카드 */}
                  {suggestionData && (
                    <div className="flex justify-start pl-2">
                      <div className="max-w-[85%] bg-purple-50/40 border border-purple-100 rounded-2xl p-4 space-y-3 shadow-xs">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
                          <Sparkles className="h-4 w-4" />
                          <span>AI 추천 이력서 카드 제안</span>
                        </div>
                        <div className="text-xs text-slate-700 space-y-1.5">
                          <div>
                            <span className="font-semibold text-slate-400">
                              구분:
                            </span>{" "}
                            {suggestionData.type === "experience"
                              ? "🏢 WORK EXPERIENCE (경력)"
                              : "💻 PROJECTS (프로젝트)"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400">
                              이름:
                            </span>{" "}
                            <span className="font-bold text-slate-900">
                              {suggestionData.type === "experience"
                                ? suggestionData.company_name
                                : suggestionData.project_name}
                            </span>
                          </div>
                          {suggestionData.role && (
                            <div>
                              <span className="font-semibold text-slate-400">
                                역할:
                              </span>{" "}
                              <span className="text-slate-800 font-medium">
                                {suggestionData.role}
                              </span>
                            </div>
                          )}
                          {(suggestionData.start_date ||
                            suggestionData.end_date) && (
                            <div>
                              <span className="font-semibold text-slate-400">
                                기한:
                              </span>{" "}
                              <span className="text-slate-800 font-medium">
                                {suggestionData.start_date
                                  ? suggestionData.start_date
                                      .substring(0, 7)
                                      .replace("-", ".")
                                  : "미상"}
                                {" ~ "}
                                {suggestionData.end_date
                                  ? suggestionData.end_date
                                      .substring(0, 7)
                                      .replace("-", ".")
                                  : "진행 중"}
                              </span>
                            </div>
                          )}
                          {suggestionData.raw_memo && (
                            <div className="bg-white/80 border border-slate-100 rounded-lg p-2 mt-1">
                              <span className="font-bold text-[10px] text-slate-400 block mb-0.5">
                                수집된 사전 정보 요약:
                              </span>
                              <span className="text-[11px] text-slate-600 block leading-normal">
                                {suggestionData.raw_memo}
                              </span>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          disabled={isCreatingSuggestion}
                          onClick={() => handleAcceptSuggestion(suggestionData)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-1.5 h-8 rounded-lg shadow-xs flex items-center justify-center gap-1"
                        >
                          {isCreatingSuggestion ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              이력서 카드 추가 중...
                            </>
                          ) : (
                            <>이력서 카드로 등록하고 2단계 다듬기 진행</>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* AI가 생성 처리 중일 때의 스켈레톤 말풍선 */}
          {isChatPending && (
            <div className="flex justify-start">
              <div className="bg-white text-slate-500 border border-slate-200/60 rounded-2xl rounded-bl-xs px-4 py-3 text-sm flex items-center gap-2 shadow-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                내용 분석 중...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 챗봇 하단 컨트롤러 */}
        <div className="p-4 border-t border-slate-100/50 bg-white/70">
          {isAIReady &&
            !isGeneralSession &&
            activeSession.status !== "completed" && (
              <div className="mb-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col gap-2 items-center text-center">
                <p className="text-xs font-bold text-emerald-800">
                  💡 충분한 경험 정보가 수집되었습니다!
                </p>
                <p className="text-[11px] text-emerald-700">
                  AI가 이력을 수치화하여 이력서 형태로 자동 제작할 준비가
                  끝났습니다.
                </p>
                <Button
                  onClick={onBuildStarResume}
                  disabled={isStarPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 h-9 shadow-xs flex items-center justify-center gap-1.5"
                >
                  {isStarPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      STAR 구조로 문장 정제 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      STAR 이력서 자동 완성하기
                    </>
                  )}
                </Button>
              </div>
            )}

          {!isGeneralSession && activeSession.status === "completed" ? (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center flex flex-col gap-2">
              <div>
                <p className="text-xs text-slate-500 font-semibold">
                  🔒 해당 항목에 대한 AI 작성이 완료되었습니다.
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  작성된 이력서 문장이 미리보기에 저장되었습니다.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onReopenSession}
                className="w-full border-slate-200 text-slate-700 text-xs font-bold py-1.5 h-8 rounded-lg shadow-2xs hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                멘토와 대화 다시 열기
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-stretch gap-2">
              <textarea
                placeholder={
                  isChatPending
                    ? "전송 대기 중..."
                    : isGeneralSession
                      ? "예: '네이버에서 6개월간 인턴했음', '동아리에서 쇼핑몰 프로젝트 진행' 등의 활동을 알려주세요. 기한도 함께 알려주시면 좋습니다!"
                      : "선택한 카드에 대해서 세부 스펙, 나의 구체적인 액션, 정량화된 수치적 성과를 알려주세요. (Ctrl+Enter 전송)"
                }
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                disabled={isChatPending}
                rows={2}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400 resize-none font-sans leading-normal h-16 overflow-y-auto"
              />
              <Button
                type="submit"
                disabled={!chatInput.trim() || isChatPending}
                className="w-16 h-16 rounded-xl bg-primary text-white hover:bg-primary/95 flex items-center justify-center shrink-0 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </Card>

      {/* 1단계 대화 초기화 컨펌 모달 */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="대화 내역 초기화"
        description="정말 지금까지 나눈 브레인스토밍 대화 내역을 모두 삭제하시겠습니까? 삭제된 내역은 복구할 수 없습니다."
        confirmText="초기화"
        cancelText="취소"
        onConfirm={async () => {
          setIsResetConfirmOpen(false);
          if (onResetGeneral) {
            await onResetGeneral();
          }
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
        isDestructive={true}
      />
    </>
  );
}
