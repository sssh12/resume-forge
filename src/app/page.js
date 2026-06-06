"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  MessageSquareText,
  FileCheck,
  ArrowUpRight,
  ArrowUp,
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const featuresRef = useRef(null);

  // 스크롤 감지 이벤트 등록
  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollBtn(true);
      } else {
        setShowScrollBtn(false);
      }
    };

    window.addEventListener("scroll", checkScroll);
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  // 최상단 스무스 스크롤 이동
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // 특징 소개 섹션으로 스무스 스크롤 이동
  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-background text-foreground">
      {/* 배경 장식 광원 효과 */}
      <div className="absolute top-[-30%] left-[20%] h-[700px] w-[700px] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* 헤더 네비게이션 (Sticky 적용) */}
      <header className="sticky top-0 z-50 w-full bg-zinc-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 pt-[calc(env(safe-area-inset-top,0)+1.25rem)] pb-5 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={scrollToTop}
            title="맨 위로 이동"
          >
            <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-primary to-indigo-500 flex items-center justify-center text-white font-bold">
              R
            </div>
            <span className="text-xl font-bold tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              ResumeForge
            </span>
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-8 w-16 animate-pulse bg-white/10 rounded-md" />
            ) : user ? (
              <Link href="/dashboard">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex items-center gap-1.5"
                >
                  대시보드
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="secondary">
                  로그인
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 메인 히어로 섹션 */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-primary font-medium mb-8">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          Next.js 16 & Gemini API 기반 초고속 이력서 빌더
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15] mb-6 text-white">
          의식의 흐름대로 던지는 메모가
          <br />
          <span className="bg-linear-to-r from-primary via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            성과 중심 STAR 이력서로
          </span>
        </h1>

        <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mb-12 leading-relaxed">
          기업이 원하는 정량적인 핵심 성과(STAR 구조), 더 이상 머리 싸매며
          고민하지 마세요. AI와의 매끄러운 꼬리 질문 대화를 통해 이력서의 뼈대를
          조각해 나갑니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {loading ? (
            <div className="h-12 w-48 animate-pulse bg-white/10 rounded-lg" />
          ) : user ? (
            <Link href="/dashboard">
              <Button
                size="lg"
                className="h-12 text-md flex items-center gap-2"
              >
                내 이력서 관리하기
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button
                size="lg"
                className="h-12 text-md flex items-center gap-2"
              >
                무료로 시작하기
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <button
            onClick={scrollToFeatures}
            className="text-zinc-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1 group py-2 cursor-pointer bg-transparent border-none"
          >
            작동 방식 더 알아보기
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 대시보드 프리뷰 가상 목업 */}
        <div className="w-full mt-20 border border-white/10 bg-zinc-900/40 rounded-2xl p-2 shadow-2xl relative">
          <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="border border-white/5 bg-zinc-950 rounded-xl overflow-hidden aspect-video flex flex-col">
            {/* 가짜 브라우저 헤더 */}
            <div className="bg-zinc-900/80 px-4 py-3 border-b border-white/5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500/70" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <span className="h-3 w-3 rounded-full bg-green-500/70" />
              </div>
              <div className="bg-zinc-950 border border-white/5 text-[11px] text-zinc-500 px-4 py-0.5 rounded-md mx-auto w-64 text-center">
                resumeforge.dev/dashboard
              </div>
            </div>
            {/* 가짜 브라우저 콘텐츠 */}
            <div className="flex-1 flex gap-4 p-4 text-left">
              <div className="w-1/3 border border-white/5 bg-zinc-900/30 rounded-lg p-3 space-y-3">
                <div className="h-4 w-20 bg-primary/20 rounded" />
                <div className="space-y-1.5">
                  <div className="h-2 w-full bg-zinc-800 rounded" />
                  <div className="h-2 w-[90%] bg-zinc-800 rounded" />
                  <div className="h-2 w-[80%] bg-zinc-800 rounded" />
                </div>
                <div className="border border-primary/20 bg-primary/5 rounded-lg p-2.5 space-y-2">
                  <div className="h-2.5 w-32 bg-primary/30 rounded" />
                  <div className="h-1.5 w-full bg-zinc-800 rounded" />
                  <div className="h-1.5 w-[70%] bg-zinc-800 rounded" />
                </div>
              </div>
              <div className="flex-1 border border-white/5 bg-zinc-900/20 rounded-lg p-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-40 bg-zinc-700 rounded" />
                    <div className="h-5 w-16 bg-zinc-800 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-[40%] bg-zinc-800 rounded" />
                    <div className="h-3 w-[95%] bg-zinc-800 rounded" />
                    <div className="h-3 w-[90%] bg-zinc-800 rounded" />
                    <div className="h-3 w-[85%] bg-zinc-800 rounded" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <div className="h-8 w-20 bg-zinc-800 rounded" />
                  <div className="h-8 w-24 bg-primary/40 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 특징 소개 섹션 */}
      <section
        id="features"
        ref={featuresRef}
        className="relative z-10 max-w-7xl mx-auto px-6 py-28 border-t border-white/5"
      >
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-16 text-white">
          이력서 작성이 더 이상 괴롭지 않은 이유
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="glass border-white/5 hover:border-primary/20 transition-all duration-300 p-6 flex flex-col space-y-4">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              1. 의식의 흐름 메모 입력
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              정제된 격식을 갖추어 글을 쓰려고 애쓸 필요 없습니다. 겪었던 성취와
              생각나는 에피소드를 메모장에 편하게 쏟아내세요.
            </p>
          </Card>

          <Card className="glass border-white/5 hover:border-primary/20 transition-all duration-300 p-6 flex flex-col space-y-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              2. AI 인터랙티브 꼬리 질문
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Gemini Flash AI가 메모를 분석해 비어 있는 핵심 세부 사항(정량
              수치, 세부 성과 등)을 캐물어 자연스럽게 내용을 보완합니다.
            </p>
          </Card>

          <Card className="glass border-white/5 hover:border-primary/20 transition-all duration-300 p-6 flex flex-col space-y-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              3. STAR 성과형 구조화
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              대화 내용을 바탕으로 개발자 면접관이 선호하는 STAR(Situation,
              Task, Action, Result) 구조의 깔끔한 한 문장 문단들로 자동
              정제됩니다.
            </p>
          </Card>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
        <div>© 2026 ResumeForge. All rights reserved.</div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-zinc-300 transition-colors">
            이용약관
          </a>
          <a href="#" className="hover:text-zinc-300 transition-colors">
            개인정보처리방침
          </a>
        </div>
      </footer>

      {/* Top 플로팅 버튼 */}
      {showScrollBtn && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-300 transform translate-y-0 scale-100 hover:scale-110 active:scale-95 cursor-pointer"
          aria-label="맨 위로 이동"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
