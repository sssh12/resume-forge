"use client";

import React, { use } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  Globe,
  Mail,
  Phone,
  Link2,
  Cake,
  Printer,
} from "lucide-react";

// 분리된 하위 컴포넌트 임포트 (isReadOnly={true} 지원)
import EducationSection from "@/app/write/components/EducationSection";
import ExperienceSection from "@/app/write/components/ExperienceSection";
import ProjectSection from "@/app/write/components/ProjectSection";

// 커스텀 데이터 훅 임포트
import useResumeData from "@/app/write/hooks/useResumeData";

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

export default function SharePage({ params }) {
  // Next.js 15/16 비동기 params 대응
  const { id: resumeId } = use(params);

  // 이력서 데이터 로드
  const { resume, resumeLoading, educations, experiences, projects } =
    useResumeData(resumeId);

  // PDF 다운로드 트리거
  const handleSavePdf = () => {
    const executeDownload = async () => {
      const element = document.getElementById("resume-pdf-content");
      if (!element) return;
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

        // PDF 저장
        pdf.save(`${resume.title || "이력서"}.pdf`);
      } catch (err) {
        console.error("PDF 생성 중 오류:", err);
        alert("PDF 생성에 실패했습니다.");
      } finally {
        // 임시 노드 제거
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

  // 로딩 UI
  if (resumeLoading && !resume) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f2f4f6]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500 font-medium">
            이력서 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f2f4f6] px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          이력서를 찾을 수 없습니다
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          공유 링크가 잘못되었거나 삭제된 이력서일 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50/40 text-foreground flex flex-col relative print:bg-white print:p-0">
      {/* 백그라운드 오라 글로우 및 도트 패턴 데코레이션 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none print:hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/6 blur-[120px]" />
        <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-400/6 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-indigo-400/6 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* 공유 페이지 탑 바 (인쇄 시 숨김 처리) */}
      <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-md border-b border-slate-200/40 px-6 py-3.5 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.01)] print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-linear-to-tr from-primary to-blue-500 flex items-center justify-center shadow-md">
            <span className="text-white font-black text-sm tracking-tighter">
              R
            </span>
          </div>
          <span className="text-sm font-bold text-slate-800">
            ResumeForge 공유 뷰어
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1.5 rounded-full">
            📋 읽기 전용 모드
          </span>
          <Button
            onClick={handleSavePdf}
            className="bg-primary hover:bg-primary/95 text-white font-bold h-9 text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            PDF 저장
          </Button>
        </div>
      </header>

      {/* 이력서 메인 뷰어 영역 (인쇄 시 용지 패딩 제거) */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8 print:p-0 print:max-w-full print:my-0">
        <Card
          id="resume-pdf-content"
          className="glass border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-2xl overflow-hidden p-8 space-y-10 print:bg-white print:border-none print:shadow-none print:p-0 print:rounded-none"
        >
          {/* 인적사항 섹션 */}
          <div className="border-b-2 border-slate-900 pb-6 space-y-6">
            <div className="relative rounded-xl pdf-block">
              <div className="space-y-2.5 min-w-0">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">
                  {resume.name || "이름 미지정"}
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
                      className="flex items-center gap-1.5 text-primary hover:underline hover:text-primary/95 print:text-slate-600"
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
                      className="flex items-center gap-1.5 text-primary hover:underline hover:text-primary/95 print:text-slate-600"
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
                      className="flex items-center gap-1.5 text-primary hover:underline hover:text-primary/95 print:text-slate-600"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>Portfolio</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* 자기소개 섹션 */}
            {resume.bio && (
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block print:text-slate-500">
                  ABOUT ME (자기소개)
                </h3>
                <div className="rounded-xl py-1 pdf-block">
                  <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                    {resume.bio}
                  </p>
                </div>
              </div>
            )}

            {/* 기술 스택 섹션 */}
            {resume.skills && (
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block print:text-slate-500">
                  TECH STACKS (핵심 기술)
                </h3>
                <div className="flex flex-wrap gap-1.5 py-1 pdf-block">
                  {resume.skills
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0)
                    .map((skill, index) => (
                      <span
                        key={index}
                        className="text-[10px] bg-blue-50 text-primary border border-blue-100/85 font-extrabold px-2.5 py-0.5 rounded-md print:bg-slate-50 print:text-slate-800 print:border-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* 학력 섹션 (isReadOnly) */}
          <EducationSection educations={educations} isReadOnly={true} />

          {/* 경력 섹션 (isReadOnly) */}
          <ExperienceSection experiences={experiences} isReadOnly={true} />

          {/* 프로젝트 섹션 (isReadOnly) */}
          <ProjectSection projects={projects} isReadOnly={true} />
        </Card>
      </main>
    </div>
  );
}
