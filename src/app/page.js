"use client";

import React, { useState, useEffect, useRef, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
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
  const router = useRouter();
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const featuresRef = useRef(null);

  // 로그인 상태인 경우 대시보드로 강제 리다이렉트 (Cascading Render 방지를 위해 startTransition으로 격리)
  useEffect(() => {
    if (!loading && user) {
      startTransition(() => {
        router.replace("/dashboard");
      });
    }
  }, [user, loading, router]);

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

  // 로고 클릭 핸들러 (로그인 유저는 대시보드로 이동)
  const handleLogoClick = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      scrollToTop();
    }
  };

  // 특징 소개 섹션으로 스무스 스크롤 이동
  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-slate-50/40 text-foreground">
      {/* 백그라운드 오라 글로우 및 도트 패턴 데코레이션 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/8 blur-[120px]" />
        <div className="absolute top-[35%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-400/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-indigo-400/8 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* 헤더 네비게이션 (공통 컴포넌트 적용) */}
      <Header
        onLogoClick={handleLogoClick}
        rightContent={
          loading ? (
            <div className="h-8 w-16 animate-pulse bg-slate-200 rounded-md" />
          ) : user ? (
            <Link href="/dashboard">
              <Button
                size="sm"
                variant="secondary"
                className="flex items-center gap-1.5 font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border-none"
              >
                대시보드
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button
                size="sm"
                variant="secondary"
                className="font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border-none"
              >
                로그인
              </Button>
            </Link>
          )
        }
      />

      {/* 메인 히어로 섹션 */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15] mb-6 text-slate-900">
          의식의 흐름대로 완성하는
          <br />
          <span className="bg-linear-to-r from-primary via-blue-600 to-cyan-500 bg-clip-text text-transparent">
            성과 중심 STAR 이력서
          </span>
        </h1>

        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed font-normal">
          기업이 원하는 정량적인 핵심 성과(Situation-Task-Action-Result 구조),
          <br />
          이제 혼자 고민하지 마세요. AI 멘토와의 유기적인 대화를 나누다 보면
          <br />
          프로페셔널한 이력서가 실시간으로 완성됩니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {loading ? (
            <div className="h-12 w-48 animate-pulse bg-slate-200 rounded-lg" />
          ) : user ? (
            <Link href="/dashboard">
              <Button
                size="lg"
                className="h-12 text-sm font-semibold flex items-center gap-2 px-6"
              >
                내 이력서 관리하기
                <ArrowRight className="h-4.5 w-4.5" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button
                size="lg"
                className="h-12 text-sm font-semibold flex items-center gap-2 px-6"
              >
                무료로 시작하기
                <ArrowRight className="h-4.5 w-4.5" />
              </Button>
            </Link>
          )}
          <button
            onClick={scrollToFeatures}
            className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold flex items-center gap-1 group py-2 bg-transparent border-none"
          >
            작동 방식 더 알아보기
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 대시보드 프리뷰 가상 목업  */}
        <div className="w-full mt-16 glass border-white/60 p-2.5 shadow-[0_25px_60px_rgba(0,0,0,0.05)] rounded-2xl relative">
          <div className="absolute inset-0 bg-linear-to-t from-slate-50 via-transparent to-transparent z-10 pointer-events-none" />
          <div className="border border-slate-200/20 bg-white/10 backdrop-blur-md rounded-xl overflow-hidden flex flex-col shadow-2xs">
            {/* 가짜 브라우저 헤더 */}
            <div className="bg-slate-100/50 backdrop-blur-xs px-4 py-3 border-b border-slate-200/30 flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300/80" />
              </div>
              <div className="bg-white/50 backdrop-blur-xs border border-white/30 text-[10px] text-slate-500 px-4 py-0.5 rounded-md mx-auto w-64 text-center">
                resumeforge.dev/write/demo-id
              </div>
            </div>
            {/* 가짜 브라우저 콘텐츠 */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 p-4 text-left">
              {/* 왼쪽 사이드: 챗봇 말풍선 (글래스모피즘 전면 적용) */}
              <div className="md:col-span-5 border border-white/50 bg-white/50 backdrop-blur-md rounded-xl p-3 flex flex-col justify-between shadow-xs gap-3">
                {/* 챗봇 헤더 */}
                <div className="flex items-center gap-2 border-b border-slate-150/30 pb-2">
                  <div className="h-6 w-6 rounded bg-purple-100/70 text-purple-600 flex items-center justify-center text-[10px]">✨</div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-800 leading-none">AI 멘토</p>
                    <span className="text-[7px] font-extrabold text-purple-600 bg-purple-50/80 px-1 rounded">1단계: 경험 브레인스토밍</span>
                  </div>
                </div>
                
                {/* 메시지 영역 */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[220px] text-[8px] sm:text-[9px] leading-relaxed">
                  <div className="flex justify-start">
                    <div className="max-w-[85%] bg-white/80 border border-white/50 rounded-xl px-2.5 py-1.5 text-slate-700 shadow-2xs">
                      네이버 인턴 당시 진행하셨던 프로젝트에서 핵심 성과 수치가 어떻게 되나요?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-primary/95 text-white rounded-xl px-2.5 py-1.5 shadow-2xs">
                      초기 렌더링 속도를 3초에서 1.5초로 줄여 약 50% 단축했습니다.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[85%] bg-white/80 border border-white/50 rounded-xl px-2.5 py-1.5 text-slate-700 shadow-2xs">
                      훌륭합니다! 수치를 반영하여 STAR 성과형 카드를 추천해 드릴게요.
                    </div>
                  </div>
                  
                  {/* AI 제안 카드 */}
                  <div className="bg-purple-50/60 border border-purple-100/60 rounded-lg p-2.5 space-y-2 mt-1 shadow-2xs">
                    <div className="text-[8px] font-bold text-purple-700 flex items-center gap-1">
                      <span>✨ AI 추천 이력서 카드 제안</span>
                    </div>
                    <div className="text-[7px] text-slate-600 space-y-0.5">
                      <div><span className="font-semibold text-slate-400">구분:</span> 🏢 경력</div>
                      <div><span className="font-semibold text-slate-400">회사:</span> <b>네이버</b></div>
                      <div><span className="font-semibold text-slate-400">역할:</span> 프론트엔드 인턴</div>
                      <div><span className="font-semibold text-slate-400">기한:</span> 2025.06 ~ 2025.11</div>
                    </div>
                    <button type="button" className="w-full bg-purple-600/90 text-white text-[7px] font-bold py-1 rounded-md shadow-xs hover:bg-purple-700 transition-colors">
                      이력서 카드로 등록하고 2단계 다듬기
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 오른쪽 사이드: 이력서 프리뷰 (글래스모피즘 전면 적용) */}
              <div className="md:col-span-7 border border-white/50 bg-white/55 backdrop-blur-md rounded-xl p-4 flex flex-col justify-between shadow-xs min-h-[260px] text-[8px] sm:text-[9px]">
                <div className="space-y-3.5">
                  {/* 인적사항 */}
                  <div className="border-b border-slate-900 pb-2 space-y-1">
                    <h2 className="text-sm font-black text-slate-900 leading-none">홍길동</h2>
                    <p className="text-[7px] text-slate-400">
                      🎂 2000.03.11 (만 26세) | ✉️ gd.hong@naver.com | 📞 01083437705
                    </p>
                  </div>
                  
                  {/* 자기소개 */}
                  <div className="space-y-1">
                    <h3 className="text-[7px] font-extrabold text-slate-400">ABOUT ME</h3>
                    <p className="text-slate-700 leading-normal font-medium">
                      열정적인 프론트엔드 개발자 홍길동입니다.
                    </p>
                  </div>
                  
                  {/* 기술 스택 */}
                  <div className="space-y-1">
                    <h3 className="text-[7px] font-extrabold text-slate-400">TECH STACKS</h3>
                    <div className="flex gap-1 flex-wrap">
                      <span className="bg-blue-50/80 text-primary border border-blue-100/60 text-[6px] px-1 rounded font-bold">React</span>
                      <span className="bg-blue-50/80 text-primary border border-blue-100/60 text-[6px] px-1 rounded font-bold">Next.js</span>
                      <span className="bg-blue-50/80 text-primary border border-blue-100/60 text-[6px] px-1 rounded font-bold">TypeScript</span>
                    </div>
                  </div>
                  
                  {/* 경력 사항 */}
                  <div className="space-y-1.5">
                    <h3 className="text-[7px] font-extrabold text-slate-400">WORK EXPERIENCE</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold text-slate-900 text-[8px]">
                        <span>네이버 <span className="text-[7px] text-primary bg-blue-50/60 px-1 rounded font-normal">프론트엔드 인턴</span></span>
                        <span className="text-[7px] text-slate-400">2025.06 ~ 2025.11</span>
                      </div>
                      <ul className="list-disc pl-3 text-slate-600 space-y-0.5 leading-normal text-[7.5px] font-medium">
                        <li>네이버 쇼핑 페이지 초기 렌더링 시간을 3초에서 1.5초로 약 50% 단축하여 사용자 경험 개선</li>
                        <li>React 19 및 컴파일러를 도입하여 불필요한 리렌더링 성능 최적화</li>
                      </ul>
                    </div>
                  </div>
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
        className="relative z-10 max-w-7xl mx-auto px-6 py-28 border-t border-slate-200/40"
      >
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-16 text-slate-900">
          이력서 작성이 더 이상 괴롭지 않은 이유
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="glass border-white/60 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_20px_45px_rgba(49,130,246,0.06)] transition-all duration-300 p-6 flex flex-col space-y-4 rounded-2xl">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              의식의 흐름 메모 입력
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              정제된 격식을 갖추어 글을 쓰려고 애쓸 필요 없습니다. 겪었던 성취와
              생각나는 에피소드를 메모장에 편하게 쏟아내세요.
            </p>
          </Card>

          <Card className="glass border-white/60 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_20px_45px_rgba(49,130,246,0.06)] transition-all duration-300 p-6 flex flex-col space-y-4 rounded-2xl">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              AI 인터랙티브 꼬리 질문
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              AI가 메모를 분석해 비어 있는 핵심 세부 사항(정량 수치, 세부 성과
              등)을 캐물어 자연스럽게 내용을 보완합니다.
            </p>
          </Card>

          <Card className="glass border-white/60 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_20px_45px_rgba(49,130,246,0.06)] transition-all duration-300 p-6 flex flex-col space-y-4 rounded-2xl">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              STAR 성과형 구조화
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              대화 내용을 바탕으로 개발자 면접관이 선호하는 STAR(Situation,
              Task, Action, Result) 구조의 깔끔한 한 문장 문단들로 자동
              정제됩니다.
            </p>
          </Card>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <div>© 2026 ResumeForge. All rights reserved.</div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-900 transition-colors">
            이용약관
          </a>
          <a href="#" className="hover:text-slate-900 transition-colors">
            개인정보처리방침
          </a>
        </div>
      </footer>

      {/* Top 플로팅 버튼 */}
      {showScrollBtn && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/95 transition-all duration-300 transform translate-y-0 scale-100 hover:scale-110 active:scale-95 border-none"
          aria-label="맨 위로 이동"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
