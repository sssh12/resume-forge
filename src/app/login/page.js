"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowRight,
  Sparkles,
  ShieldAlert,
  CheckCircle,
  Home,
  ArrowLeft,
} from "lucide-react";

// Zod 유효성 검증 스키마 정의
const authSchema = z.object({
  email: z
    .string()
    .min(1, "이메일을 입력해 주세요.")
    .email("올바른 이메일 주소 형식이 아닙니다."),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
});

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // react-hook-form 초기화
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 폼 제출 핸들러
  const onSubmit = async (data) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      if (isSignUp) {
        await signUp(data.email, data.password);
        setSubmitSuccess(
          "회원가입이 완료되었습니다! 확인 메일을 전송했습니다. (인증이 활성화된 경우)",
        );
        reset();
      } else {
        await signIn(data.email, data.password);
        setSubmitSuccess("로그인 성공! 대시보드로 이동합니다.");
        router.replace("/dashboard");
      }
    } catch (error) {
      setSubmitError(
        error.message ||
          "인증 처리 중 오류가 발생했습니다. 다시 시도해 주세요.",
      );
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* 백그라운드 오로라 효과 */}
      <div className="absolute top-[-20%] left-[-20%] h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* 홈으로 돌아가기 버튼 (상단 탑 네비게이션 가드) */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 border-white/10 hover:bg-white/5 bg-zinc-950/40 text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            메인으로 돌아가기
          </Button>
        </Link>
      </div>

      <Card className="glass w-full max-w-md border-white/10 shadow-2xl relative z-10">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight bg-linear-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            {isSignUp ? "계정 생성하기" : "ResumeForge 로그인"}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            {isSignUp
              ? "경험을 성과로 바꾸는 완벽한 이력서 빌더를 경험해 보세요."
              : "등록된 계정으로 로그인하여 이력서 작성을 이어가세요."}
          </CardDescription>
        </CardHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* 결과 피드백 알림 UI */}
            {submitError && (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive-foreground">
                <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-sm text-emerald-400">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {/* 이메일 입력 영역 */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-zinc-300"
              >
                이메일 주소
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                disabled={isSubmitting}
                className={`bg-zinc-900/50 border-white/10 text-white placeholder-zinc-500 ${
                  errors.email
                    ? "border-red-500/50 focus-visible:ring-red-500"
                    : ""
                }`}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-400 font-medium pt-0.5">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* 비밀번호 입력 영역 */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-zinc-300"
              >
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                disabled={isSubmitting}
                className={`bg-zinc-900/50 border-white/10 text-white placeholder-zinc-500 ${
                  errors.password
                    ? "border-red-500/50 focus-visible:ring-red-500"
                    : ""
                }`}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-400 font-medium pt-0.5">
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : isSignUp ? (
                <>
                  시작하기
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  로그인
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {isSignUp ? "이미 계정이 있으신가요? " : "처음 방문하셨나요? "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setSubmitError(null);
                  setSubmitSuccess(null);
                }}
                className="text-primary hover:underline font-medium transition-colors"
                disabled={isSubmitting}
              >
                {isSignUp ? "로그인" : "회원가입"}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
