"use client";

import React, {
  useEffect,
  useState,
  useTransition,
  useCallback,
  startTransition,
} from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Calendar,
  FileText,
  LogOut,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState([]);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [isPending, startTransitionHook] = useTransition();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // 이력서 목록 가져오기 (useCallback으로 감싸서 무한 루프 방지 및 useEffect 참조 제공)
  const fetchResumes = useCallback(async () => {
    if (!user) return;
    try {
      startTransition(() => {
        setResumesLoading(true);
      });

      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      startTransition(() => {
        setResumes(data || []);
      });
    } catch (error) {
      console.error("이력서 목록 로드 오류:", error);
    } finally {
      startTransition(() => {
        setResumesLoading(false);
      });
    }
  }, [user]);

  // 1. 비로그인 유저 리다이렉션 및 초기 데이터 로드
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    } else if (user) {
      fetchResumes();
    }
  }, [user, authLoading, router, fetchResumes]);

  // 2. 새 이력서 만들기 (React 19 useTransition 적용)
  const handleCreateResume = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    startTransitionHook(async () => {
      try {
        const { data, error } = await supabase
          .from("resumes")
          .insert([
            {
              title: newTitle,
              user_id: user.id,
              status: "writing",
            },
          ])
          .select()
          .single();

        if (error) throw error;

        setNewTitle("");
        // 생성 완료 후 해당 이력서 수정 화면(/write/[id])으로 이동
        router.push(`/write/${data.id}`);
      } catch (error) {
        console.error("이력서 생성 실패:", error);
        alert("이력서 생성 중 오류가 발생했습니다.");
      }
    });
  };

  // 3. 이력서 삭제하기
  const handleDeleteResumeClick = (id, e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    setDeleteTargetId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteResumeConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      // 1. chat_sessions 조회
      const { data: sessions, error: sessionsErr } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("resume_id", deleteTargetId);
      
      if (sessionsErr) throw sessionsErr;

      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map((s) => s.id);
        // 2. chat_messages 삭제
        const { error: msgErr } = await supabase
          .from("chat_messages")
          .delete()
          .in("session_id", sessionIds);
        if (msgErr) throw msgErr;

        // 3. chat_sessions 삭제
        const { error: sessErr } = await supabase
          .from("chat_sessions")
          .delete()
          .in("id", sessionIds);
        if (sessErr) throw sessErr;
      }
      
      // 4. education, experience, projects 삭제
      const { error: eduErr } = await supabase
        .from("education")
        .delete()
        .eq("resume_id", deleteTargetId);
      if (eduErr) throw eduErr;
      
      const { error: expErr } = await supabase
        .from("experience")
        .delete()
        .eq("resume_id", deleteTargetId);
      if (expErr) throw expErr;

      const { error: projErr } = await supabase
        .from("projects")
        .delete()
        .eq("resume_id", deleteTargetId);
      if (projErr) throw projErr;

      // 5. 이력서 최종 삭제
      const { error } = await supabase.from("resumes").delete().eq("id", deleteTargetId);
      if (error) throw error;

      setResumes((prev) => prev.filter((resume) => resume.id !== deleteTargetId));
    } catch (error) {
      console.error("이력서 삭제 오류:", error);
      alert("이력서 삭제에 실패했습니다.");
    } finally {
      setIsDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    }
  };

  if (authLoading || (!user && authLoading)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500 font-medium">
            인증 정보 로드 중...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-slate-50/40 text-foreground flex flex-col relative">
      {/* 백그라운드 오라 글로우 및 도트 패턴 데코레이션 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/8 blur-[120px]" />
        <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-400/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-indigo-400/8 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* 대시보드 헤더 (공통 컴포넌트 적용) */}
      <Header
        rightContent={
          <>
            <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
              {user.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await signOut();
                } catch (err) {
                  console.error("로그아웃 오류:", err);
                } finally {
                  // 리액트 상태 초기화 및 홈 리다이렉트 핑퐁 방지를 위해 강제 홈 페이지 이동
                  window.location.href = "/";
                }
              }}
              className="flex items-center gap-1.5 h-8 text-xs border-slate-200 hover:bg-slate-50 text-slate-700 bg-white shadow-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              로그아웃
            </Button>
          </>
        }
      />

      {/* 메인 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-8">
        {/* 대시보드 인트로 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 bg-linear-to-r from-slate-950 via-slate-800 to-slate-950 bg-clip-text text-transparent">
              내 이력서 대시보드
            </h1>
            <p className="text-slate-500 text-sm font-normal">
              보유한 경험을 AI 챗봇과의 대화로 다듬어 완성형 이력서로 제작해
              보세요.
            </p>
          </div>
        </div>

        {/* 새 이력서 만들기 카드 & 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass md:col-span-2 border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900">
                새 이력서 프로젝트 생성
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                지원하는 직무 또는 제출용 기업에 어울리는 이력서 프로젝트를
                생성하세요.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateResume}>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  <Input
                    placeholder="예: 2026 하반기 토스 프론트엔드 지원용 이력서"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    disabled={isPending}
                    className="bg-white/80 border-slate-200/60 focus:bg-white text-slate-900 placeholder-slate-400 flex-1 h-10 transition-all rounded-lg"
                  />
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center justify-center gap-1.5 whitespace-nowrap bg-primary hover:bg-primary/95 text-white font-semibold h-10 px-4 rounded-lg transition-transform active:scale-[0.98]"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        프로젝트 생성
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>

          <Card className="glass border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-500">
                전체 이력서 상태
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-950">
                {resumes.length} 개
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                작성 중: {resumes.filter((r) => r.status === "writing").length}{" "}
                | 완료: {resumes.filter((r) => r.status === "completed").length}
              </p>
            </CardContent>
            <CardFooter className="pt-0 border-t border-slate-100/50 py-4">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${resumes.length > 0 ? (resumes.filter((r) => r.status === "completed").length / resumes.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* 이력서 목록 그리드 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">최근 작업 이력서</h2>
          {resumesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-44 rounded-xl bg-slate-200/40 animate-pulse border border-slate-200/30"
                />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <Card className="glass border-dashed border-slate-200 bg-white/50 py-16 text-center flex flex-col items-center justify-center rounded-2xl">
              <FileText className="h-12 w-12 text-slate-300 mb-4" />
              <CardTitle className="text-lg text-slate-700 font-bold mb-1">
                생성된 이력서가 없습니다
              </CardTitle>
              <CardDescription className="max-w-xs text-xs text-slate-500 font-normal mb-6">
                위의 입력창에 이력서 제목을 작성하고 첫 번째 이력서 제작을
                시작해 보세요.
              </CardDescription>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {resumes.map((resume) => (
                <Card
                  key={resume.id}
                  onClick={() => router.push(`/write/${resume.id}`)}
                  className="glass-hover glass border-white/60 cursor-pointer flex flex-col justify-between overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-2xl"
                >
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-base font-extrabold text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                        {resume.title}
                      </CardTitle>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          resume.status === "completed"
                             ? "bg-emerald-50/80 text-emerald-700 border border-emerald-100/60"
                             : "bg-blue-50/80 text-primary border border-blue-100/60"
                        }`}
                      >
                        {resume.status === "completed" ? "완료" : "작성 중"}
                      </span>
                    </div>
                    <CardDescription className="flex items-center gap-1 text-[11px] pt-1 text-slate-500 font-normal">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(resume.updated_at).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="border-t border-slate-100/50 bg-slate-50/20 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-primary font-bold">
                      편집하기
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <button
                      onClick={(e) => handleDeleteResumeClick(resume.id, e)}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 이력서 삭제 컨펌 모달 */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="이력서 프로젝트 삭제"
        description="정말 이 이력서 프로젝트를 삭제하시겠습니까? 관련 작성 내역과 AI 대화 기록이 모두 영구 삭제되며 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDeleteResumeConfirm}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setDeleteTargetId(null);
        }}
        isDestructive={true}
      />
    </div>
  );
}
