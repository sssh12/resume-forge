"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  Edit2,
  Globe,
  Mail,
  Phone,
  Link2,
  Cake,
  Plus,
  Trash2,
  ChevronDown,
  Printer,
  Share2,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

// 분리된 하위 컴포넌트 임포트
import ChatWidget from "@/app/write/components/ChatWidget";
import EducationSection from "@/app/write/components/EducationSection";
import Header from "@/components/Header";
import ExperienceSection from "@/app/write/components/ExperienceSection";
import ProjectSection from "@/app/write/components/ProjectSection";
import ProfileModal from "@/app/write/components/ProfileModal";
import IntroModal from "@/app/write/components/IntroModal";
import SkillsModal from "@/app/write/components/SkillsModal";

// 커스텀 훅 임포트
import useResumeData from "@/app/write/hooks/useResumeData";
import useResumeChat from "@/app/write/hooks/useResumeChat";

// 만 나이 계산 유틸리티 함수
const getKoreanAge = (birthDateStr) => {
  if (!birthDateStr) return "";
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return `만 ${age}세`;
};

export default function WritePage({ params }) {
  // Next.js 15/16 비동기 params 처리 대응
  const { id: resumeId } = use(params);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleEditRef = React.useRef(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyShareLink = () => {
    if (typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}/share/${resumeId}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => {
        console.error("공유 링크 복사 실패:", err);
      });
  };

  const handleSavePdf = () => {
    const element = document.getElementById("resume-pdf-content");
    if (!element) return;

    const executeDownload = async () => {
      const parent = element.parentNode;

      // 임시 fixed 래퍼 컨테이너 생성
      const wrapper = document.createElement("div");
      wrapper.id = "resume-pdf-wrapper";
      wrapper.className = parent.className; // 부모 스타일 상속
      if (parent.style.cssText) {
        wrapper.style.cssText = parent.style.cssText;
      }

      // 래퍼 스타일 및 위치 설정
      wrapper.style.position = "fixed";
      wrapper.style.left = "0";
      wrapper.style.top = "0";
      wrapper.style.width = "794px";
      wrapper.style.height = "auto";
      wrapper.style.zIndex = "-99999";
      wrapper.style.pointerEvents = "none";
      wrapper.style.opacity = "0";
      wrapper.style.backgroundColor = "#ffffff";
      wrapper.style.overflow = "visible";

      // 클론 생성
      const clone = element.cloneNode(true);
      clone.id = "resume-pdf-clone";

      // 클론 스타일 설정
      clone.style.position = "relative";
      clone.style.left = "0";
      clone.style.top = "0";
      clone.style.width = "794px";
      clone.style.height = "auto";
      clone.style.overflow = "visible";
      clone.style.backgroundColor = "#ffffff";
      clone.style.padding = "40px"; // 패딩 설정
      clone.style.boxSizing = "border-box"; // border-box 설정
      clone.style.border = "1px solid #ffffff"; // 마진 병합 방지용 테두리
      clone.style.borderRadius = "0px";
      clone.style.boxShadow = "none";
      clone.style.fontFamily =
        "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif";

      // Flex 레이아웃 차단
      clone.style.setProperty("display", "block", "important");
      clone.style.setProperty("flex", "none", "important");

      // 불필요한 UI 제거
      const controls = clone.querySelectorAll(
        "button, .print\\:hidden, .opacity-0, a[onClick]",
      );
      controls.forEach((el) => el.remove());

      // 호버 요소 제거
      const hoverGuides = clone.querySelectorAll(".group-hover\\:opacity-100");
      hoverGuides.forEach((el) => el.remove());

      // SVG 아이콘 제거
      const svgs = clone.querySelectorAll("svg");
      svgs.forEach((svg) => svg.remove());

      // 폰트 스타일 초기화
      const allElements = clone.querySelectorAll("*");
      allElements.forEach((el) => {
        // Tailwind 자간 제거
        const classesToRemove = Array.from(el.classList).filter((cls) =>
          cls.startsWith("tracking-"),
        );
        classesToRemove.forEach((cls) => el.classList.remove(cls));

        // 기본 자간 및 합자 방지
        el.style.setProperty("letter-spacing", "normal", "important");
        el.style.setProperty("font-variant-ligatures", "none", "important");
        el.style.setProperty("font-feature-settings", '"liga" 0', "important");

        // H2 상단 여백 확보
        if (el.tagName === "H2") {
          el.style.setProperty("line-height", "1.4", "important");
          el.style.setProperty("padding-top", "8px", "important");
          el.style.setProperty("margin-top", "0px", "important");
        }

        // html2canvas 줄바꿈 텍스트 겹침 버그 방지용 line-height 및 텍스트 룰 강제화
        if (["SPAN", "P", "LI", "STRONG", "A", "H2", "H3", "DIV"].includes(el.tagName)) {
          el.style.setProperty("line-height", "1.6", "important");
          el.style.setProperty("word-break", "break-all", "important");
          el.style.setProperty("word-wrap", "break-word", "important");
          el.style.setProperty("white-space", "normal", "important");
        }

        // flex 레이아웃을 html2canvas가 오동작하여 겹치는 버그 수정 (블록 및 float 레이아웃으로 플래티닝)
        const display = window.getComputedStyle(el).display;
        if (display.includes("flex")) {
          if (el.children.length <= 1) {
            el.style.setProperty("display", "block", "important");
          } else if (el.tagName === "LI" || el.classList.contains("flex") || el.tagName === "DIV") {
            el.style.setProperty("display", "block", "important");
            el.style.setProperty("width", "100%", "important");
            el.style.setProperty("clear", "both", "important");
            
            Array.from(el.children).forEach((child, idx) => {
              if (idx === 0 && (child.classList.contains("shrink-0") || child.offsetWidth < 30 || child.className.includes("w-1.5"))) {
                child.style.setProperty("display", "block", "important");
                child.style.setProperty("float", "left", "important");
                child.style.setProperty("width", "12px", "important");
                child.style.setProperty("margin-top", "6px", "important");
              } else {
                child.style.setProperty("display", "block", "important");
                child.style.setProperty("margin-left", "18px", "important");
                child.style.setProperty("width", "calc(100% - 18px)", "important");
              }
            });
          }
        }
      });

      // DOM 주입
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      // 페이지 분할 처리
      const applyPageBreaks = () => {
        const a4PageHeight = 1123; // A4 기준 높이

        // Y좌표 계산 헬퍼
        const getElementRelativeTop = (el, container) => {
          let top = 0;
          let current = el;
          while (
            current &&
            current !== container &&
            current !== document.body
          ) {
            top += current.offsetTop || 0;
            current = current.offsetParent;
          }
          // body 탈출 시 보정
          if (current === document.body) {
            let containerTop = 0;
            let c = container;
            while (c && c !== document.body) {
              containerTop += c.offsetTop || 0;
              c = c.offsetParent;
            }
            return top - containerTop;
          }
          return top;
        };

        // 대상 블록 쿼리
        let blocks = Array.from(clone.querySelectorAll(".pdf-block"));

        // 중첩 제외 필터링
        blocks = blocks.filter(
          (b) => !blocks.some((o) => o !== b && o.contains(b)),
        );

        // 좌표 정렬
        blocks.sort(
          (a, b) =>
            getElementRelativeTop(a, clone) - getElementRelativeTop(b, clone),
        );

        let accumulatedSpacerHeight = 0;

        blocks.forEach((block) => {
          const elementHeight = block.offsetHeight;
          const originalRelativeTop = getElementRelativeTop(block, clone);
          const relativeTop = originalRelativeTop + accumulatedSpacerHeight;
          const relativeBottom = relativeTop + elementHeight;

          // 페이지 번호 계산
          const pageIndex = Math.floor(relativeTop / a4PageHeight);
          const nextPageBoundary = (pageIndex + 1) * a4PageHeight;

          // 경계선 걸침 확인
          if (
            relativeTop < nextPageBoundary &&
            relativeBottom > nextPageBoundary
          ) {
            const neededSpacing = nextPageBoundary - relativeTop;

            const spacer = document.createElement("div");
            spacer.style.height = `${neededSpacing}px`;
            spacer.style.width = "100%";
            spacer.style.clear = "both";
            spacer.style.backgroundColor = "#ffffff";
            spacer.style.setProperty("display", "block", "important");
            spacer.style.setProperty("flex", "none", "important");
            spacer.className = "pdf-page-spacer";

            block.parentNode.insertBefore(spacer, block);
            accumulatedSpacerHeight += neededSpacing;
          }
        });
      };

      try {
        // 웹 폰트 대기
        if (document.fonts) {
          await document.fonts.ready;
        }
        // 렌더링 대기
        await new Promise((resolve) => setTimeout(resolve, 300));

        // 페이지 분할 실행
        applyPageBreaks();

        // 리플로우 대기
        await new Promise((resolve) => setTimeout(resolve, 200));

        // html2canvas 캡처 실행
        const html2canvasFn = window.html2canvasPro || window.html2canvas;
        const canvas = await html2canvasFn(clone, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          width: 794,
          windowWidth: 794, // 가상 뷰포트 너비 고정
          windowHeight: Math.max(1123, clone.offsetHeight + 150), // 가상 뷰포트 높이 고정 (최소 A4 1페이지 크기 확보)
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0,
          letterRendering: false, // 개별 글자 렌더링 방지
          onclone: (clonedDoc) => {
            if (document.fonts && clonedDoc.fonts) {
              document.fonts.forEach((font) => {
                try {
                  clonedDoc.fonts.add(font);
                } catch (e) {
                  console.error("Font sync dynamic error:", e);
                }
              });
            }
          },
        });

        // jsPDF 초기화
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "mm", "a4");

        const pdfWidth = 210;
        const pdfHeight = 297;

        // A4 높이 계산
        const pageHeightPx = Math.floor(canvas.width * (297 / 210));
        const totalPages = Math.ceil(canvas.height / pageHeightPx);

        // 페이지 슬라이스 추가
        for (let i = 0; i < totalPages; i++) {
          if (i > 0) {
            pdf.addPage();
          }

          const srcY = i * pageHeightPx;
          const srcHeight = Math.min(pageHeightPx, canvas.height - srcY);

          // 1페이지 크기의 임시 캔버스 생성
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = pageHeightPx;

          const pageCtx = pageCanvas.getContext("2d");
          // 흰색 배경 채우기
          pageCtx.fillStyle = "#ffffff";
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

          // 원본 캔버스에서 해당 섹션을 잘라내어 붙여넣기
          pageCtx.drawImage(
            canvas,
            0,
            srcY,
            canvas.width,
            srcHeight,
            0,
            0,
            canvas.width,
            srcHeight,
          );

          const pageImgData = pageCanvas.toDataURL("image/png");
          pdf.addImage(pageImgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        }

        // 6. PDF 저장
        pdf.save(`${resume.title || "이력서"}.pdf`);
      } catch (err) {
        console.error("PDF 생성 중 오류:", err);
        alert("PDF 생성에 실패했습니다.");
      } finally {
        // 7. 오프스크린 클론 및 fixed 래퍼 제거
        if (document.getElementById("resume-pdf-wrapper")) {
          document.body.removeChild(wrapper);
        }
      }
    };

    // 스크립트 순차 로드용 프로미스 헬퍼
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`스크립트 로드 실패: ${src}`));
        document.head.appendChild(script);
      });
    };

    const run = async () => {
      try {
        await loadScript(
          "https://cdn.jsdelivr.net/npm/html2canvas-pro@latest/dist/html2canvas-pro.min.js",
        );
        await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
        );
        await executeDownload();
      } catch (err) {
        console.error("PDF 엔진 로드 실패:", err);
        alert("PDF 생성 라이브러리를 로드하지 못했습니다.");
      }
    };

    run();
  };

  // 1. 이력서 데이터 CRUD 상태 관리 훅 호출
  const {
    resume,
    resumeLoading,
    editTitleValue,
    setEditTitleValue,
    educations,
    experiences,
    projects,
    handleUpdateTitle,
    handleToggleStatus,
    handleSaveEdu,
    handleDeleteEdu,
    handleSaveExp,
    handleDeleteExp,
    handleSaveProj,
    handleDeleteProj,
    handleSaveProfile,
    handleSaveIntro,
    handleDeleteResume,
    refetchDetails,
  } = useResumeData(resumeId);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isResumeDeleteConfirmOpen, setIsResumeDeleteConfirmOpen] =
    useState(false);

  // 이력서 제목 외부 영역 클릭 감지하여 자동 취소 (선언 후 참조를 위해 훅 호출 아래에 선언)
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (
        titleEditRef.current &&
        !titleEditRef.current.contains(event.target)
      ) {
        setEditTitleValue(resume?.title || "");
        setIsEditingTitle(false);
      }
    }
    if (isEditingTitle) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditingTitle, resume, setEditTitleValue]);

  // 2. AI 대화 상태 관리 훅 호출 (상세 데이터 최신화 콜백 refetchDetails 주입)
  const {
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
  } = useResumeChat(resumeId, refetchDetails);

  // 로그인 체크 로딩 UI
  if (authLoading || (resumeLoading && !resume)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500 font-medium">
            이력서 빌더 로드 중...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !resume) return null;

  // 권한 검사: 로그인한 유저와 이력서의 소유자가 다를 경우 대시보드로 리다이렉트
  if (resume.user_id !== user.id) {
    router.replace("/dashboard");
    return null;
  }

  return (
    <div className="min-h-dvh bg-slate-50/40 text-foreground flex flex-col relative">
      {/* 백그라운드 오라 글로우 및 도트 패턴 데코레이션 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none print:hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/6 blur-[120px]" />
        <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-400/6 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-indigo-400/6 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>
      {/* 1. 상단 탑 바 (공통 컴포넌트 적용) */}
      <Header
        leftContent={
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
              className="h-9 w-9 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isEditingTitle ? (
                <div
                  ref={titleEditRef}
                  className="flex flex-row items-stretch gap-1.5 w-full max-w-lg shrink-0"
                >
                  <Input
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUpdateTitle();
                        setIsEditingTitle(false);
                      }
                    }}
                    className="bg-white border-slate-300 text-slate-900 font-bold h-10 flex-1"
                    autoFocus
                  />
                  <Button
                    onClick={() => {
                      handleUpdateTitle();
                      setIsEditingTitle(false);
                    }}
                    className="bg-primary text-white h-10 px-4 whitespace-nowrap shrink-0 flex items-center justify-center rounded-lg"
                  >
                    저장
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditTitleValue(resume.title);
                      setIsEditingTitle(false);
                    }}
                    className="text-slate-500 h-10 px-4 border border-slate-200 hover:bg-slate-100 bg-white whitespace-nowrap shrink-0 flex items-center justify-center rounded-lg"
                  >
                    취소
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <h1
                    onClick={() => setIsEditingTitle(true)}
                    className="text-lg font-bold text-slate-900 truncate hover:text-primary cursor-pointer flex items-center gap-1.5"
                    title="클릭하여 제목 수정"
                  >
                    {resume.title}
                    <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                  </h1>
                </div>
              )}
            </div>
          </div>
        }
        rightContent={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyShareLink}
              className="h-9 text-xs border-slate-200 text-slate-700 font-bold px-3 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Share2 className="h-4 w-4 text-slate-500" />
              {copySuccess ? "복사 완료!" : "공유 링크"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSavePdf}
              className="h-9 text-xs border-slate-200 text-slate-700 font-bold px-3 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              PDF 저장
            </Button>
            <button
              onClick={handleToggleStatus}
              className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all border flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                resume.status === "completed"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80"
                  : "bg-blue-50 text-primary border-blue-200 hover:bg-blue-100/80"
              }`}
            >
              {resume.status === "completed" ? "✓ 완료 상태" : "✏️ 작성 중"}
              <ChevronDown className="h-3 w-3 opacity-80" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsResumeDeleteConfirmOpen(true)}
              className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="이력서 전체 삭제"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </Button>
          </div>
        }
      />

      {/* 2. 메인 워크스페이스 분할 레이아웃 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-73px)]">
        {/* LEFT: AI 꼬리 질문 챗봇 위젯 */}
        <section className="lg:col-span-5 flex flex-col h-[calc(100vh-125px)] sticky top-[90px]">
          <ChatWidget
            activeSession={activeSession}
            messages={messages}
            messagesLoading={messagesLoading}
            isChatPending={isChatPending}
            isStarPending={isStarPending}
            onSendMessage={handleSendMessage}
            onBuildStarResume={handleBuildStarResume}
            onClose={handleCloseChat}
            onSaveExp={(id, form) => handleSaveExp(id, form, syncSessionTitle)}
            onSaveProj={(id, form) =>
              handleSaveProj(id, form, syncSessionTitle)
            }
            onStartChat={handleStartChatSession}
            onResetGeneral={handleResetGeneralSession}
            onReopenSession={handleReopenSession}
          />
        </section>

        {/* RIGHT: 이력서 작성 및 실시간 미리보기 */}
        <section className="lg:col-span-7 flex flex-col h-[calc(100vh-125px)] sticky top-[90px]">
          <Card className="glass border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-2xl overflow-hidden h-full flex flex-col print:bg-white print:border-none print:shadow-none print:rounded-none">
            <div
              id="resume-pdf-content"
              className="flex-1 overflow-y-auto p-8 space-y-10"
            >
              {/* 이력서 프로필 및 인적사항 섹션 */}
              <div className="border-b-2 border-slate-900 pb-6 space-y-6">
                {/* 1. 기본 인적사항 영역 (영역 클릭 시 수정 모달 오픈) */}
                <div
                  onClick={() => setIsProfileModalOpen(true)}
                  className="group relative cursor-pointer hover:bg-slate-50/70 transition-all rounded-xl p-3 -mx-3 border border-transparent hover:border-slate-100 pdf-block"
                >
                  <div className="space-y-2.5 min-w-0 pr-8">
                    <h2
                      className={`text-3xl font-black tracking-tight truncate ${resume.name ? "text-slate-900" : "text-slate-300"}`}
                    >
                      {resume.name || "이름을 등록해 주세요"}
                    </h2>

                    {/* 연락처 및 링크 정보 */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium">
                      {resume.birth_date && (
                        <div className="flex items-center gap-1.5">
                          <Cake className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {resume.birth_date.replace(/-/g, ".")} (
                            {getKoreanAge(resume.birth_date)})
                          </span>
                        </div>
                      )}
                      {resume.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{resume.email}</span>
                        </div>
                      )}
                      {resume.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{resume.phone}</span>
                        </div>
                      )}
                      {resume.github_url && (
                        <a
                          href={resume.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()} // 링크 클릭 시 모달 팝업 방지
                          className="flex items-center gap-1.5 text-primary hover:underline hover:text-primary/95"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          <span>GitHub</span>
                        </a>
                      )}
                      {resume.blog_url && (
                        <a
                          href={resume.blog_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()} // 링크 클릭 시 모달 팝업 방지
                          className="flex items-center gap-1.5 text-primary hover:underline hover:text-primary/95"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          <span>Blog</span>
                        </a>
                      )}
                      {resume.portfolio_url && (
                        <a
                          href={resume.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()} // 링크 클릭 시 모달 팝업 방지
                          className="flex items-center gap-1.5 text-primary hover:underline hover:text-primary/95"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          <span>Portfolio</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 호버 시 콤팩트하게 노출되는 편집 가이드 (가독성/미관 최적화) */}
                  <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200/50 rounded-md px-1.5 py-0.5 text-[9px] font-bold">
                    <Edit2 className="h-2.5 w-2.5" />
                    편집
                  </div>
                </div>

                {/* 2. 자기소개 섹션 */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                    ABOUT ME (자기소개)
                  </h3>

                  {resume.bio ? (
                    <div
                      onClick={() => setIsIntroModalOpen(true)}
                      className="group relative cursor-pointer hover:bg-slate-50/70 transition-all rounded-xl p-3 -mx-3 border border-transparent hover:border-slate-100 pdf-block"
                    >
                      <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed pr-8">
                        {resume.bio}
                      </p>
                      {/* 호버 편집 가이드 */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200/50 rounded-md px-1.5 py-0.5 text-[9px] font-bold">
                        <Edit2 className="h-2.5 w-2.5" />
                        편집
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsIntroModalOpen(true)}
                      className="group cursor-pointer bg-[#f8f9fa] hover:bg-[#f2f4f6] border border-slate-100 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] min-h-[90px]"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-50 group-hover:text-primary flex items-center justify-center text-slate-400 transition-colors">
                        <Plus className="h-4 w-4" />
                      </div>
                      <p className="text-xs text-slate-500 font-bold group-hover:text-slate-900 transition-colors">
                        나를 대표하는 소개를 입력해 보세요
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. 핵심 기술 스택 섹션 */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                    TECH STACKS (핵심 기술)
                  </h3>

                  {resume.skills ? (
                    <div
                      onClick={() => setIsSkillsModalOpen(true)}
                      className="group relative cursor-pointer hover:bg-slate-50/70 transition-all rounded-xl p-3 -mx-3 border border-transparent hover:border-slate-100 pdf-block"
                    >
                      <div className="flex flex-wrap gap-1.5 pr-8">
                        {resume.skills
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s.length > 0)
                          .map((skill, index) => (
                            <span
                              key={index}
                              className="text-[10px] bg-blue-50 text-primary border border-blue-100/85 font-extrabold px-2.5 py-0.5 rounded-md"
                            >
                              {skill}
                            </span>
                          ))}
                      </div>
                      {/* 호버 편집 가이드 */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200/50 rounded-md px-1.5 py-0.5 text-[9px] font-bold">
                        <Edit2 className="h-2.5 w-2.5" />
                        편집
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsSkillsModalOpen(true)}
                      className="group cursor-pointer bg-[#f8f9fa] hover:bg-[#f2f4f6] border border-slate-100 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] min-h-[90px]"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-50 group-hover:text-primary flex items-center justify-center text-slate-400 transition-colors">
                        <Plus className="h-4 w-4" />
                      </div>
                      <p className="text-xs text-slate-500 font-bold group-hover:text-slate-900 transition-colors">
                        핵심 기술 스택(React, Next.js 등)을 추가해 보세요
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 1. 학력 섹션 */}
              <EducationSection
                educations={educations}
                onSaveEdu={handleSaveEdu}
                onDeleteEdu={handleDeleteEdu}
              />

              {/* 2. 경력 섹션 */}
              <ExperienceSection
                experiences={experiences}
                onSaveExp={(id, form) =>
                  handleSaveExp(id, form, syncSessionTitle)
                }
                onDeleteExp={(id, e) =>
                  handleDeleteExp(id, e, handleItemDeleted)
                }
                onStartChat={handleStartChatSession}
                activeSession={activeSession}
              />

              {/* 3. 프로젝트 섹션 */}
              <ProjectSection
                projects={projects}
                onSaveProj={(id, form) =>
                  handleSaveProj(id, form, syncSessionTitle)
                }
                onDeleteProj={(id, e) =>
                  handleDeleteProj(id, e, handleItemDeleted)
                }
                onStartChat={handleStartChatSession}
                activeSession={activeSession}
              />
            </div>
          </Card>
        </section>
      </main>

      {/* 4. 프로필 정보 수정 모달 */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={async (form) => {
          const success = await handleSaveProfile(form);
          if (success) {
            setIsProfileModalOpen(false);
          }
        }}
        initialData={resume}
      />

      {/* 5. 자기소개 수정 모달 */}
      <IntroModal
        isOpen={isIntroModalOpen}
        onClose={() => setIsIntroModalOpen(false)}
        onSave={async (form) => {
          const success = await handleSaveIntro({
            bio: form.bio,
            skills: resume.skills,
          });
          if (success) {
            setIsIntroModalOpen(false);
          }
        }}
        initialData={resume}
      />

      {/* 6. 핵심 기술 스택 수정 모달 */}
      <SkillsModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        onSave={async (form) => {
          const success = await handleSaveIntro({
            bio: resume.bio,
            skills: form.skills,
          });
          if (success) {
            setIsSkillsModalOpen(false);
          }
        }}
        initialData={resume}
      />

      {/* 7. 이력서 전체 삭제 컨펌 모달 */}
      <ConfirmModal
        isOpen={isResumeDeleteConfirmOpen}
        title="이력서 삭제"
        description="정말 이 이력서를 삭제하시겠습니까? 관련 데이터를 포함하여 저장된 이력서 내역 및 AI 멘토와의 대화 기록이 모두 영구히 삭제되며 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        onConfirm={async () => {
          setIsResumeDeleteConfirmOpen(false);
          const success = await handleDeleteResume();
          if (success) {
            router.push("/dashboard");
          }
        }}
        onCancel={() => setIsResumeDeleteConfirmOpen(false)}
        isDestructive={true}
      />
    </div>
  );
}
