"use client";

import React, { useEffect, useState, useTransition, useCallback, startTransition } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit3, Calendar, FileText, LogOut, ArrowRight, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState([]);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [isPending, startTransitionHook] = useTransition(); // 훅 이름 변경하여 전역 startTransition과 구분

  // 이력서 목록 가져오기 (useCallback으로 감싸서 무한 루프 방지 및 useEffect 참조 제공)
  const fetchResumes = useCallback(async () => {
    try {
      startTransition(() => {
        setResumesLoading(true);
      });
      
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
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
  }, []);

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
  const handleDeleteResume = async (id, e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    if (!confirm("정말 이 이력서를 삭제하시겠습니까? 관련 작성 내역과 AI 대화가 모두 영구 삭제됩니다.")) return;

    try {
      const { error } = await supabase.from("resumes").delete().eq("id", id);
      if (error) throw error;
      setResumes((prev) => prev.filter((resume) => resume.id !== id));
    } catch (error) {
      console.error("이력서 삭제 오류:", error);
      alert("이력서 삭제에 실패했습니다.");
    }
  };

  if (authLoading || (!user && authLoading)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">인증 정보 로드 중...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* 대시보드 헤더 */}
      <header className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.replace("/")}>
            <div className="h-8 w-8 rounded-lg bg-linear-to-tr from-primary to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <span className="text-lg font-bold tracking-tight text-white">ResumeForge</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-400 hidden sm:inline">{user.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                router.replace("/");
              }}
              className="flex items-center gap-1.5 h-8 text-xs border-white/10 hover:bg-white/5"
            >
              <LogOut className="h-3.5 w-3.5" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-10">
        {/* 대시보드 인트로 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">내 이력서 대시보드</h1>
            <p className="text-muted-foreground text-sm">
              보유한 경험을 AI 챗봇과의 대화로 다듬어 완성형 이력서로 제작해 보세요.
            </p>
          </div>
        </div>

        {/* 새 이력서 만들기 카드 & 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass md:col-span-2 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-white">새 이력서 프로젝트 생성</CardTitle>
              <CardDescription>지원하는 직무 또는 제출용 기업에 어울리는 이력서 프로젝트를 생성하세요.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateResume}>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="예: 2026 하반기 토스 프론트엔드 지원용 이력서"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    disabled={isPending}
                    className="bg-zinc-900/50 border-white/10 text-white flex-1"
                  />
                  <Button type="submit" disabled={isPending} className="flex items-center gap-1.5 whitespace-nowrap">
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

          <Card className="glass border-white/10 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">전체 이력서 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{resumes.length} 개</div>
              <p className="text-xs text-muted-foreground mt-1">
                작성 중: {resumes.filter((r) => r.status === "writing").length} | 완료: {resumes.filter((r) => r.status === "completed").length}
              </p>
            </CardContent>
            <CardFooter className="pt-0 border-t border-white/5 py-4">
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${resumes.length > 0 ? (resumes.filter(r => r.status === 'completed').length / resumes.length) * 100 : 0}%` }}
                />
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* 이력서 목록 그리드 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">최근 작업 이력서</h2>
          {resumesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 rounded-xl bg-white/5 animate-pulse border border-white/5" />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <Card className="glass border-dashed border-white/10 py-16 text-center flex flex-col items-center justify-center">
              <FileText className="h-12 w-12 text-zinc-600 mb-4" />
              <CardTitle className="text-lg text-zinc-300 mb-1">생성된 이력서가 없습니다</CardTitle>
              <CardDescription className="max-w-xs text-xs mb-6">
                위의 입력창에 이력서 제목을 작성하고 첫 번째 이력서 제작을 시작해 보세요.
              </CardDescription>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {resumes.map((resume) => (
                <Card 
                  key={resume.id} 
                  onClick={() => router.push(`/write/${resume.id}`)}
                  className="glass-hover glass border-white/10 cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-md font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">
                        {resume.title}
                      </CardTitle>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        resume.status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}>
                        {resume.status === 'completed' ? '완료' : '작성 중'}
                      </span>
                    </div>
                    <CardDescription className="flex items-center gap-1 text-[11px] pt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(resume.updated_at).toLocaleDateString("ko-KR", {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="border-t border-white/5 bg-zinc-950/20 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-primary font-medium">
                      편집하기
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                    <button
                      onClick={(e) => handleDeleteResume(resume.id, e)}
                      className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
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
    </div>
  );
}
