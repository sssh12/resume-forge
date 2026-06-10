"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ShieldAlert } from "lucide-react";

// Zod 유효성 검사 스키마 정의
const experienceSchema = z.object({
  company_name: z.string().min(1, "회사명을 입력해 주세요."),
  role: z.string().min(1, "역할 및 직무를 입력해 주세요."),
  start_date: z.string().min(1, "시작 연월을 입력해 주세요."),
  end_date: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  raw_memo: z.string().optional().or(z.literal("")),
});

export default function ExperienceModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}) {
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(experienceSchema),
    mode: "onChange",
    defaultValues: {
      company_name: "",
      role: "",
      start_date: "",
      end_date: "",
      description: "",
      raw_memo: "",
    },
  });

  // 모달 활성화 및 초기 데이터 주입
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setSubmitError(null);
      }, 0);
      reset({
        company_name: initialData?.company_name || "",
        role: initialData?.role || "",
        start_date: initialData?.start_date || "",
        end_date: initialData?.end_date || "",
        description: initialData?.description || "",
        raw_memo: initialData?.raw_memo || "",
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
      await onSave(initialData ? initialData.id : "new", data);
    } catch (err) {
      setSubmitError(err.message || "경력 정보를 저장하지 못했습니다.");
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
        className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden animate-zoom-in"
      >
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h4 className="text-sm font-bold text-slate-900">
            경력 정보 {initialData ? "수정" : "추가"}
          </h4>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                회사명 <span className="text-red-500 font-extrabold">*</span>
              </label>
              <Input
                placeholder="예: Toss"
                {...register("company_name")}
                className={`bg-white h-9 border-slate-200 text-xs focus:ring-primary/20 ${
                  errors.company_name ? "border-red-500 focus:ring-red-200" : ""
                }`}
              />
              {errors.company_name && (
                <p className="text-[10px] text-red-500 font-bold mt-1">
                  {errors.company_name.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                역할 및 직무 <span className="text-red-500 font-extrabold">*</span>
              </label>
              <Input
                placeholder="예: 프론트엔드 엔지니어"
                {...register("role")}
                className={`bg-white h-9 border-slate-200 text-xs focus:ring-primary/20 ${
                  errors.role ? "border-red-500 focus:ring-red-200" : ""
                }`}
              />
              {errors.role && (
                <p className="text-[10px] text-red-500 font-bold mt-1">
                  {errors.role.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                시작 연월 <span className="text-red-500 font-extrabold">*</span>
              </label>
              <Input
                type="date"
                {...register("start_date")}
                className={`bg-white h-9 border-slate-200 text-xs focus:ring-primary/20 ${
                  errors.start_date ? "border-red-500 focus:ring-red-200" : ""
                }`}
              />
              {errors.start_date && (
                <p className="text-[10px] text-red-500 font-bold mt-1">
                  {errors.start_date.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                종료 연월
              </label>
              <Input
                type="date"
                {...register("end_date")}
                className="bg-white h-9 border-slate-200 text-xs focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
              이력서 노출 설명 (STAR 완성본)
            </label>
            <textarea
              placeholder="AI 챗봇을 사용하지 않고 직접 작성하거나 수정할 문구를 기재할 수 있습니다."
              {...register("description")}
              rows={4}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400 font-sans leading-normal resize-none"
            />
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-9 text-xs text-slate-500 font-bold cursor-pointer"
          >
            취소
          </Button>
          <Button
            type="submit"
            size="sm"
            className="h-9 text-xs bg-primary hover:bg-primary/95 text-white font-bold cursor-pointer"
          >
            저장하기
          </Button>
        </div>
      </form>
    </div>
  );
}
