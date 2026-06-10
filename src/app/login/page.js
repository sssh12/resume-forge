"use client";

import React, { useState, useEffect } from "react";
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
  ArrowLeft,
} from "lucide-react";

// 1. 로그인용 Zod 스키마
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "이메일을 입력해 주세요.")
    .email("올바른 이메일 주소 형식이 아닙니다."),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
});

// 2. 회원가입용 Zod 스키마 (비밀번호 확인 일치 체크 포함)
const signUpSchema = z
  .object({
    email: z
      .string()
      .min(1, "이메일을 입력해 주세요.")
      .email("올바른 이메일 주소 형식이 아닙니다."),
    password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력해 주세요."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"], // 에러가 confirmPassword 필드에 매핑되도록 설정
  });

// Supabase 영어 에러 메시지를 친근한 한국어로 맵핑
const getKoreanErrorMessage = (errorMsg) => {
  if (!errorMsg) return "오류가 발생했습니다. 다시 시도해 주세요.";
  const msg = errorMsg.toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 잘못되었습니다.";
  }
  if (msg.includes("user already registered")) {
    return "이미 가입된 이메일 주소입니다.";
  }
  if (msg.includes("email not confirmed")) {
    return "이메일 인증이 필요합니다. 메일함을 확인해 주세요.";
  }
  if (msg.includes("password should be at least 6 characters")) {
    return "비밀번호는 최소 6자 이상이어야 합니다.";
  }
  if (msg.includes("rate limit")) {
    return "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (msg.includes("network")) {
    return "네트워크 연결이 원활하지 않습니다. 인터넷 연결을 확인해 주세요.";
  }
  return errorMsg;
};

export default function LoginPage() {
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // react-hook-form 초기화 (isSignUp 상태에 따라 동적 스키마 적용)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    clearErrors,
  } = useForm({
    resolver: zodResolver(isSignUp ? signUpSchema : loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // 이메일 폼 제출 핸들러
  const onSubmit = async (data) => {
    setSubmitError(null);

    try {
      if (isSignUp) {
        const result = await signUp(data.email, data.password);

        // Supabase에서 이메일 인증이 비활성화된 경우, 즉시 세션이 맺어지며 session 객체가 제공됩니다.
        if (result?.session) {
          router.replace("/dashboard");
        } else {
          // 이메일 인증이 활성화되어 있을 경우에 대한 대안 안내
          setSubmitError(
            "이메일 인증이 필요합니다. 메일함을 확인하여 가입을 마쳐주세요.",
          );
          reset();
        }
      } else {
        await signIn(data.email, data.password);
        router.replace("/dashboard");
      }
    } catch (error) {
      setSubmitError(getKoreanErrorMessage(error.message));
    }
  };

  // 소셜 로그인 핸들러
  const handleSocialLogin = async (provider) => {
    setSubmitError(null);
    try {
      await signInWithOAuth(provider);
    } catch (error) {
      setSubmitError(
        `${provider} 로그인 중 오류가 발생했습니다: ${error.message}`,
      );
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-12 bg-background">
      {/* 백그라운드 오로라 효과  */}
      <div className="absolute top-[-20%] left-[-20%] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* 홈으로 돌아가기 버튼 */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 border-slate-200 hover:bg-slate-100 bg-white text-slate-700 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            메인으로 돌아가기
          </Button>
        </Link>
      </div>

      <Card className="glass w-full max-w-md border-slate-200/80 shadow-2xl relative z-10 bg-white">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto flex h-12 w-12 my-3 items-center justify-center rounded-2xl bg-blue-50 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-950">
            {isSignUp ? "회원가입" : "로그인"}
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm font-normal">
            {isSignUp
              ? "경험을 성과로 바꾸는 완벽한 이력서 빌더를 경험해 보세요."
              : "등록된 계정으로 로그인하여 이력서 작성을 이어가세요."}
          </CardDescription>
        </CardHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* 결과 피드백 알림 UI */}
            {submitError && (
              <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
                <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" />
                <span>{submitError}</span>
              </div>
            )}

            {/* 이메일 입력 영역 */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-slate-700"
              >
                이메일
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                disabled={isSubmitting}
                className={`bg-white border-slate-200 text-slate-900 placeholder-slate-400 mt-1${
                  errors.email
                    ? "border-red-400 focus-visible:ring-red-400"
                    : ""
                }`}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500 font-semibold pt-0.5">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* 비밀번호 입력 영역 */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-slate-700"
              >
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                disabled={isSubmitting}
                className={`bg-white border-slate-200 text-slate-900 placeholder-slate-400 mt-1 ${
                  errors.password
                    ? "border-red-400 focus-visible:ring-red-400"
                    : ""
                }`}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-500 font-semibold pt-0.5">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* 회원가입 모드일 때만 렌더링되는 비밀번호 확인 입력 영역 */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-semibold text-slate-700"
                >
                  비밀번호 확인
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className={`bg-white border-slate-200 text-slate-900 placeholder-slate-400 mt-1 ${
                    errors.confirmPassword
                      ? "border-red-400 focus-visible:ring-red-400"
                      : ""
                  }`}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 font-semibold pt-0.5">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 font-semibold bg-primary text-white hover:bg-primary/95"
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

            {/* 소셜 로그인 구분선 */}
            <div className="relative w-full flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative px-3 bg-white text-xs text-slate-400 font-normal">
                또는 간편 로그인
              </span>
            </div>

            {/* 소셜 로그인 버튼 그리드 */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => handleSocialLogin("google")}
                className="flex items-center justify-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-700 bg-white shadow-xs text-xs font-semibold"
              >
                {/* Google 로고 커스텀 SVG */}
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => handleSocialLogin("github")}
                className="flex items-center justify-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-700 bg-white shadow-xs text-xs font-semibold"
              >
                {/*깃허브 아이콘 svg */}
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                  />
                </svg>
                GitHub
              </Button>
            </div>

            {/* 탭 전환 버튼 */}
            <div className="text-center text-sm pt-2 w-full">
              <span className="text-slate-500 font-normal">
                {isSignUp
                  ? "이미 계정이 있으신가요? "
                  : "아직 계정이 없으신가요? "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  reset({
                    email: "",
                    password: "",
                    confirmPassword: "",
                  });
                  clearErrors();
                  setSubmitError(null);
                }}
                className="text-primary hover:underline font-semibold transition-colors"
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
