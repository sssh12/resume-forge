"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ShieldAlert, Calendar } from "lucide-react";

// Zod 유효성 검사 스키마 정의
const educationSchema = z.object({
  school_name: z.string().min(1, "학교명을 입력해 주세요."),
  major: z.string().min(1, "전공을 입력해 주세요."),
  gpa: z.string().optional().or(z.literal("")),
  start_date: z.string().min(1, "입학 연월을 입력해 주세요."),
  end_date: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});

export default function EducationModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}) {
  const [submitError, setSubmitError] = useState(null);
  const startDateInputRef = React.useRef(null);
  const endDateInputRef = React.useRef(null);

  const handleCalendarClick = (ref) => {
    try {
      if (ref.current) {
        ref.current.showPicker();
      }
    } catch (e) {
      ref.current?.focus();
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(educationSchema),
    mode: "onChange",
    defaultValues: {
      school_name: "",
      major: "",
      gpa: "",
      start_date: "",
      end_date: "",
      description: "",
    },
  });

  // 모달 활성화 및 초기 데이터 주입
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setSubmitError(null);
      }, 0);
      reset({
        school_name: initialData?.school_name || "",
        major: initialData?.major || "",
        gpa: initialData?.gpa || "",
        start_date: initialData?.start_date || "",
        end_date: initialData?.end_date || "",
        description: initialData?.description || "",
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
      setSubmitError(err.message || "학력 정보를 저장하지 못했습니다.");
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
          <h4 className="text-sm font-bold text-slate-900">
            학력 정보 {initialData ? "수정" : "추가"}
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
                학교명 <span className="text-red-500 font-extrabold">*</span>
              </label>
              <Input
                placeholder="예: 서울대학교"
                {...register("school_name")}
                className={`bg-white h-9 border-slate-200 text-xs focus:ring-primary/20 ${
                  errors.school_name ? "border-red-500 focus:ring-red-200" : ""
                }`}
              />
              {errors.school_name && (
                <p className="text-[10px] text-red-500 font-bold mt-1">
                  {errors.school_name.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                전공 <span className="text-red-500 font-extrabold">*</span>
              </label>
              <Input
                placeholder="예: 컴퓨터공학과"
                {...register("major")}
                className={`bg-white h-9 border-slate-200 text-xs focus:ring-primary/20 ${
                  errors.major ? "border-red-500 focus:ring-red-200" : ""
                }`}
              />
              {errors.major && (
                <p className="text-[10px] text-red-500 font-bold mt-1">
                  {errors.major.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                입학 연월 <span className="text-red-500 font-extrabold">*</span>
              </label>
              <div className="relative flex flex-col justify-center">
                <div className="relative flex items-center">
                  <Input
                    ref={(e) => {
                      register("start_date").ref(e);
                      startDateInputRef.current = e;
                    }}
                    type="date"
                    name="start_date"
                    onChange={register("start_date").onChange}
                    onBlur={register("start_date").onBlur}
                    className={`bg-white h-9 border-slate-200 text-xs focus:ring-primary/20 pr-9 w-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                      errors.start_date ? "border-red-500 focus:ring-red-200" : ""
                    }`}
                  />
                  <Calendar
                    onClick={() => handleCalendarClick(startDateInputRef)}
                    className="absolute right-2.5 h-4.5 w-4.5 text-slate-400 hover:text-primary cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150"
                  />
                </div>
                {errors.start_date && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    {errors.start_date.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                졸업 연월
              </label>
              <div className="relative flex flex-col justify-center">
                <div className="relative flex items-center">
                  <Input
                    ref={(e) => {
                      register("end_date").ref(e);
                      endDateInputRef.current = e;
                    }}
                    type="date"
                    name="end_date"
                    onChange={register("end_date").onChange}
                    onBlur={register("end_date").onBlur}
                    className="bg-white h-9 border-slate-200 text-xs focus:ring-primary/20 pr-9 w-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                  <Calendar
                    onClick={() => handleCalendarClick(endDateInputRef)}
                    className="absolute right-2.5 h-4.5 w-4.5 text-slate-400 hover:text-primary cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                학점 (선택)
              </label>
              <Input
                placeholder="예: 3.8 / 4.5"
                {...register("gpa")}
                className="bg-white h-9 border-slate-200 text-xs focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
              설명 및 비고
            </label>
            <textarea
              placeholder="기타 특이사항이나 복수전공/부전공 정보 등을 적어 보세요."
              {...register("description")}
              rows={3}
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
