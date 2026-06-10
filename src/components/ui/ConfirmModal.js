"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";
import { X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  onCancel,
  isDestructive = false,
}) {
  const [mounted, setMounted] = useState(false);

  // 컴포넌트 클라이언트 마운트 감지 (SSR 대응)
  useEffect(() => {
    let isCurrent = true;
    const timer = setTimeout(() => {
      if (isCurrent) {
        setMounted(true);
      }
    }, 0);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, []);

  // 모달이 열려 있을 때 body 스크롤 차단
  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, mounted]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* 백드롭 레이어: 슬레이트 오버레이와 블러 */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onCancel}
      />

      {/* 모달 윈도우 */}
      <div className="relative w-full max-w-[360px] bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 z-10 animate-scale-up">
        {/* 우측 상단 닫기 버튼 */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 텍스트 내용 */}
        <div className="space-y-2.5 mt-1 mb-6">
          <h3 className="text-base font-extrabold text-slate-900 leading-snug">
            {title}
          </h3>
          {description && (
            <p className="text-xs font-normal text-slate-500 leading-relaxed whitespace-pre-line">
              {description}
            </p>
          )}
        </div>

        {/* 하단 액션 버튼 영역 */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100/80 font-bold text-xs h-10 border border-slate-100/50"
          >
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
            }}
            className={`flex-1 rounded-xl font-bold text-xs h-10 text-white ${
              isDestructive
                ? "bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/10"
                : "bg-primary hover:bg-primary/95 shadow-md shadow-primary/10"
            }`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
