"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { X, ShieldAlert } from "lucide-react";

// Zod 유효성 검사 스키마 정의
const introSchema = z.object({
  bio: z.string().max(500, "자기소개는 최대 500자까지 입력 가능합니다.").optional().or(z.literal("")),
});

export default function IntroModal({ isOpen, onClose, onSave, initialData }) {
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(introSchema),
    mode: "onChange",
    defaultValues: {
      bio: "",
    },
  });

  // 모달 활성화 및 초기 데이터 주입
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setSubmitError(null);
      }, 0);
      reset({
        bio: initialData?.bio || "",
      });
    }
  }, [initialData, isOpen, reset]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSubmitError(null);
    onClose();
  };

  const onSubmit = async (data) => {
    setSubmitError(null);
    try {
      await onSave(data);
    } catch (err) {
      setSubmitError(err.message || "자기소개 정보를 저장하지 못했습니다.");
    }
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden animate-zoom-in"
      >
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h4 className="text-sm font-bold text-slate-900 font-sans">자기소개 수정</h4>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 모달 바디 */}
        <div className="p-6 space-y-4">
          {submitError && (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 animate-shake">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-600" />
              <span>{submitError}</span>
            </div>
          )}

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
              한 줄 소개 (자기소개)
            </label>
            <textarea
              placeholder="본인의 강점이나 개발자로서 지향하는 가치 등을 3~5줄 내외로 간결하게 표현해 보세요."
              {...register("bio")}
              rows={5}
              className={`w-full bg-white border rounded-lg p-2.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400 font-sans leading-normal resize-none ${
                errors.bio ? "border-red-500 focus:ring-red-200" : "border-slate-200"
              }`}
              autoFocus
            />
            {errors.bio && (
              <p className="text-[10px] text-red-500 font-bold mt-1">
                {errors.bio.message}
              </p>
            )}
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-9 text-xs text-slate-500 font-bold"
          >
            취소
          </Button>
          <Button
            type="submit"
            size="sm"
            className="h-9 text-xs bg-primary hover:bg-primary/95 text-white font-bold"
          >
            저장하기
          </Button>
        </div>
      </form>
    </div>
  );
}
