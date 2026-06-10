"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Calendar, ShieldAlert } from "lucide-react";

// Zod 유효성 검사 스키마 정의
const profileSchema = z.object({
  name: z.string().min(1, "이름을 입력해 주세요."),
  birth_date: z.string().min(1, "생년월일을 선택해 주세요."),
  email: z
    .string()
    .min(1, "이메일을 입력해 주세요.")
    .email("올바른 이메일 주소 형식이 아닙니다."),
  phone: z
    .string()
    .min(1, "전화번호를 입력해 주세요.")
    .regex(/^010\d{8}$/, "올바른 전화번호 형식(예: 01012345678)이 아닙니다."),
  github_url: z.string().optional().or(z.literal("")),
  blog_url: z.string().optional().or(z.literal("")),
  portfolio_url: z.string().optional().or(z.literal("")),
});

export default function ProfileModal({ isOpen, onClose, onSave, initialData }) {
  const [submitError, setSubmitError] = useState(null);
  const dateInputRef = React.useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      birth_date: "",
      github_url: "",
      blog_url: "",
      portfolio_url: "",
    },
  });

  // 모달 활성화 및 초기 데이터 주입
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setSubmitError(null);
      }, 0);
      reset({
        name: initialData?.name || "",
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        birth_date: initialData?.birth_date || "",
        github_url: initialData?.github_url || "",
        blog_url: initialData?.blog_url || "",
        portfolio_url: initialData?.portfolio_url || "",
      });
    }
  }, [initialData, isOpen, reset]);

  if (!isOpen) return null;

  const handleCalendarClick = () => {
    try {
      if (dateInputRef.current) {
        dateInputRef.current.showPicker();
      }
    } catch (e) {
      dateInputRef.current?.focus();
    }
  };

  const handleClose = () => {
    setSubmitError(null);
    onClose();
  };

  const onSubmit = async (data) => {
    setSubmitError(null);
    try {
      await onSave(data);
    } catch (err) {
      setSubmitError(err.message || "인적사항 정보를 저장하지 못했습니다.");
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
            인적사항 및 링크 수정
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

          {/* 기본 인적사항 (2열 그리드 구조) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                이름 <span className="text-red-500 font-extrabold">*</span>
              </label>
              <Input
                placeholder="홍길동"
                {...register("name")}
                className={`bg-white h-9 border-slate-200 text-xs focus:ring-primary/20 ${
                  errors.name ? "border-red-500 focus:ring-red-200" : ""
                }`}
              />
              {errors.name && (
                <p className="text-[10px] text-red-500 font-bold mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                생년월일 <span className="text-red-500 font-extrabold">*</span>
              </label>
              <div className="relative flex flex-col justify-center">
                <div className="relative flex items-center">
                  <Input
                    ref={(e) => {
                      register("birth_date").ref(e);
                      dateInputRef.current = e;
                    }}
                    type="date"
                    name="birth_date"
                    onChange={register("birth_date").onChange}
                    onBlur={register("birth_date").onBlur}
                    className={`bg-white h-9 border-slate-200 text-xs focus:ring-primary/20 pr-9 w-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                      errors.birth_date ? "border-red-500 focus:ring-red-200" : ""
                    }`}
                  />
                  <Calendar
                    onClick={handleCalendarClick}
                    className="absolute right-2.5 h-4.5 w-4.5 text-slate-400 hover:text-primary cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150"
                  />
                </div>
                {errors.birth_date && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    {errors.birth_date.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                이메일 <span className="text-red-500 font-extrabold">*</span>
              </label>
              <Input
                type="email"
                placeholder="example@email.com"
                {...register("email")}
                className={`bg-white h-9 border-slate-200 text-xs focus:ring-primary/20 ${
                  errors.email ? "border-red-500 focus:ring-red-200" : ""
                }`}
              />
              {errors.email && (
                <p className="text-[10px] text-red-500 font-bold mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                전화번호 <span className="text-red-500 font-extrabold">*</span>
              </label>
              <Input
                placeholder="01012345678"
                {...register("phone")}
                className={`bg-white h-9 border-slate-200 text-xs focus:ring-primary/20 ${
                  errors.phone ? "border-red-500 focus:ring-red-200" : ""
                }`}
              />
              {errors.phone && (
                <p className="text-[10px] text-red-500 font-bold mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          {/* 링크 정보 */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                GitHub 주소
              </label>
              <Input
                placeholder="https://github.com/username"
                {...register("github_url")}
                className="bg-white h-9 border-slate-200 text-xs focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                기술 블로그 주소
              </label>
              <Input
                placeholder="https://velog.io/@username 또는 개인 블로그"
                {...register("blog_url")}
                className="bg-white h-9 border-slate-200 text-xs focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                기타 포트폴리오 주소
              </label>
              <Input
                placeholder="https://my-portfolio-site.com"
                {...register("portfolio_url")}
                className="bg-white h-9 border-slate-200 text-xs focus:ring-primary/20"
              />
            </div>
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
