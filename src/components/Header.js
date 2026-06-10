"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * 서비스 공통 내비게이션 헤더 컴포넌트
 * @param {React.ReactNode} leftContent - 좌측 커스텀 영역 (미설정 시 기본 로고 렌더링)
 * @param {React.ReactNode} centerContent - 중앙 커스텀 영역 (작성 페이지 제목 에디터 등)
 * @param {React.ReactNode} rightContent - 우측 커스텀 영역 (로그아웃 버튼, 로그인 상태 등)
 * @param {Function} onLogoClick - 로고 클릭 시 커스텀 핸들러 (미설정 시 대시보드 또는 메인 자동 이동)
 */
export default function Header({
  leftContent,
  centerContent,
  rightContent,
  onLogoClick,
}) {
  const router = useRouter();
  const { user } = useAuth();

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      router.push(user ? "/dashboard" : "/");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-slate-200/40 pt-[env(safe-area-inset-top,0px)] shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* 좌측 콘텐츠 영역 (기본: 로고) */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {leftContent ? (
            leftContent
          ) : (
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
              onClick={handleLogoClick}
              title={user ? "대시보드로 이동" : "메인으로 이동"}
            >
              <div className="h-8.5 w-8.5 rounded-lg bg-linear-to-tr from-primary to-blue-400 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
                R
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                ResumeForge
              </span>
            </div>
          )}

          {/* 중앙 콘텐츠 영역 (필요 시 주입) */}
          {centerContent && (
            <div className="flex-1 min-w-0">
              {centerContent}
            </div>
          )}
        </div>

        {/* 우측 콘텐츠 영역 (버튼, 배지 등) */}
        {rightContent && (
          <div className="flex items-center gap-3 shrink-0">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  );
}
