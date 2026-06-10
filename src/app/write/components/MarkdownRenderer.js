"use client";

import React from "react";

/**
 * 이력서 미리보기용 마크다운 파서 및 렌더러 컴포넌트
 * @param {string} content - 마크다운 문장
 */
export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  // 1. 줄바꿈 단위로 라인 분할
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // 2. 인라인 볼드체 (**) 파싱 헬퍼 함수
  const parseInlineBold = (text) => {
    if (!text) return "";
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const cleanText = part.slice(2, -2);
        return (
          <strong
            key={index}
            className="font-extrabold text-slate-950 font-sans"
          >
            {cleanText}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <ul className="space-y-2.5 list-none pl-0">
      {lines.map((line, index) => {
        // 불릿 마크 확인 및 제거
        const isBullet = line.startsWith("-") || line.startsWith("*");
        const cleanLine = isBullet ? line.substring(1).trim() : line;

        return (
          <li
            key={index}
            className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed font-normal"
          >
            {isBullet && (
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
            )}
            <div className="flex-1">{parseInlineBold(cleanLine)}</div>
          </li>
        );
      })}
    </ul>
  );
}
