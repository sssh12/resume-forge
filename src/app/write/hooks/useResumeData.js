"use client";

import React, { useState, useEffect, useCallback, startTransition } from "react";
import { supabase } from "@/lib/supabase";

export default function useResumeData(resumeId) {
  const [resume, setResume] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(true);
  const [editTitleValue, setEditTitleValue] = useState("");

  const [educations, setEducations] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [projects, setProjects] = useState([]);

  // 데이터 로드
  const fetchResumeDetails = useCallback(async () => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!resumeId || !uuidRegex.test(resumeId)) {
      return;
    }
    try {
      startTransition(() => {
        setResumeLoading(true);
      });

      const { data: resumeData, error: resumeErr } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", resumeId)
        .single();

      if (resumeErr) throw resumeErr;
      
      startTransition(() => {
        setResume(resumeData);
        setEditTitleValue(resumeData.title);
      });

      const { data: eduData } = await supabase
        .from("education")
        .select("*")
        .eq("resume_id", resumeId)
        .order("start_date", { ascending: false });
      
      startTransition(() => {
        setEducations(eduData || []);
      });

      const { data: expData } = await supabase
        .from("experience")
        .select("*")
        .eq("resume_id", resumeId)
        .order("start_date", { ascending: false });
      
      startTransition(() => {
        setExperiences(expData || []);
      });

      const { data: projData } = await supabase
        .from("projects")
        .select("*")
        .eq("resume_id", resumeId)
        .order("start_date", { ascending: false });
      
      startTransition(() => {
        setProjects(projData || []);
      });

    } catch (error) {
      console.error("이력서 세부 정보 로드 실패:", error);
    } finally {
      startTransition(() => {
        setResumeLoading(false);
      });
    }
  }, [resumeId]);

  useEffect(() => {
    if (resumeId) {
      fetchResumeDetails();
    }
  }, [resumeId, fetchResumeDetails]);

  // 제목 수정
  const handleUpdateTitle = async () => {
    if (!editTitleValue.trim()) return;
    try {
      const { error } = await supabase
        .from("resumes")
        .update({ title: editTitleValue, updated_at: new Date().toISOString() })
        .eq("id", resumeId);

      if (error) throw error;
      setResume((prev) => ({ ...prev, title: editTitleValue }));
    } catch (error) {
      console.error("제목 수정 실패:", error);
      throw new Error(error.message || "제목 업데이트에 실패했습니다.");
    }
  };

  // 인적사항(프로필) 수정 저장
  const handleSaveProfile = async (form) => {
    try {
      const payload = {
        user_id: resume?.user_id,
        name: form.name || null,
        email: form.email || null,
        phone: form.phone || null,
        github_url: form.github_url || null,
        blog_url: form.blog_url || null,
        portfolio_url: form.portfolio_url || null,
        birth_date: form.birth_date || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("resumes")
        .update(payload)
        .eq("id", resumeId);

      if (error) throw error;
      setResume((prev) => ({ ...prev, ...payload }));
      return true;
    } catch (error) {
      console.error("프로필 저장 실패 상세 에러:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        errorObject: error
      });
      throw new Error(error.message || "인적사항을 저장하지 못했습니다.");
    }
  };

  // 자기소개 및 기술 스택 수정 저장
  const handleSaveIntro = async (form) => {
    try {
      const payload = {
        user_id: resume?.user_id,
        bio: form.bio || null,
        skills: form.skills || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("resumes")
        .update(payload)
        .eq("id", resumeId);

      if (error) throw error;
      setResume((prev) => ({ ...prev, ...payload }));
      return true;
    } catch (error) {
      console.error("자기소개/기술스택 저장 실패 상세 에러:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        errorObject: error
      });
      throw new Error(error.message || "자기소개 및 기술 스택 정보를 저장하지 못했습니다.");
    }
  };

  // 상태 완료/작성중 토글
  const handleToggleStatus = async () => {
    if (!resume) return;
    const newStatus = resume.status === "completed" ? "writing" : "completed";
    try {
      const { error } = await supabase
        .from("resumes")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", resumeId);

      if (error) throw error;
      setResume((prev) => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error("상태 토글 실패:", error);
    }
  };

  // 학력 저장
  const handleSaveEdu = async (eduId, form) => {
    try {
      const isNew = eduId === "new";
      const payload = {
        resume_id: resumeId,
        school_name: form.school_name,
        major: form.major || null,
        gpa: form.gpa || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        description: form.description || null
      };

      if (isNew) {
        const { data, error } = await supabase
          .from("education")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        setEducations((prev) => [data, ...prev]);
      } else {
        const { data, error } = await supabase
          .from("education")
          .update(payload)
          .eq("id", eduId)
          .select()
          .single();
        if (error) throw error;
        setEducations((prev) => prev.map((item) => (item.id === eduId ? data : item)));
      }
      return true;
    } catch (error) {
      console.error("학력 저장 실패:", error);
      throw new Error(error.message || "학력 정보를 저장하지 못했습니다.");
    }
  };

  // 학력 삭제
  const handleDeleteEdu = async (eduId) => {
    try {
      const { error } = await supabase.from("education").delete().eq("id", eduId);
      if (error) throw error;
      setEducations((prev) => prev.filter((item) => item.id !== eduId));
      return true;
    } catch (error) {
      console.error("학력 삭제 실패:", error);
      return false;
    }
  };

  // 경력 저장
  const handleSaveExp = async (expId, form, onSessionTitleUpdate) => {
    try {
      const isNew = expId === "new";
      const payload = {
        resume_id: resumeId,
        company_name: form.company_name,
        role: form.role || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        description: form.description || null,
        raw_memo: form.raw_memo || null
      };

      let resultData;
      if (isNew) {
        const { data, error } = await supabase
          .from("experience")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        setExperiences((prev) => [data, ...prev]);
        resultData = data;
      } else {
        const { data, error } = await supabase
          .from("experience")
          .update(payload)
          .eq("id", expId)
          .select()
          .single();
        if (error) throw error;
        setExperiences((prev) => prev.map((item) => (item.id === expId ? data : item)));
        resultData = data;
        
        // 채팅 세션 제목 동기화를 위해 콜백 실행
        if (onSessionTitleUpdate) {
          onSessionTitleUpdate(expId, `${form.company_name} (${form.role || "역할 미지정"})`);
        }
      }
      return resultData;
    } catch (error) {
      console.error("경력 저장 실패:", error);
      throw new Error(error.message || "경력 정보를 저장하지 못했습니다.");
    }
  };

  // 경력 삭제
  const handleDeleteExp = async (expId, onChatClose) => {
    try {
      const { data: sessions } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("target_id", expId);
      
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        await supabase.from("chat_messages").delete().in("session_id", sessionIds);
        await supabase.from("chat_sessions").delete().in("id", sessionIds);
      }

      const { error } = await supabase.from("experience").delete().eq("id", expId);
      if (error) throw error;
      setExperiences((prev) => prev.filter((item) => item.id !== expId));

      if (onChatClose) {
        onChatClose(expId);
      }
      return true;
    } catch (error) {
      console.error("경력 삭제 실패:", error);
      return false;
    }
  };

  // 프로젝트 저장
  const handleSaveProj = async (projId, form, onSessionTitleUpdate) => {
    try {
      const isNew = projId === "new";
      const payload = {
        resume_id: resumeId,
        project_name: form.project_name,
        role: form.role || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        description: form.description || null,
        raw_memo: form.raw_memo || null
      };

      let resultData;
      if (isNew) {
        const { data, error } = await supabase
          .from("projects")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        setProjects((prev) => [data, ...prev]);
        resultData = data;
      } else {
        const { data, error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", projId)
          .select()
          .single();
        if (error) throw error;
        setProjects((prev) => prev.map((item) => (item.id === projId ? data : item)));
        resultData = data;

        // 채팅 세션 제목 동기화를 위해 콜백 실행
        if (onSessionTitleUpdate) {
          onSessionTitleUpdate(projId, `${form.project_name} (${form.role || "역할 미지정"})`);
        }
      }
      return resultData;
    } catch (error) {
      console.error("프로젝트 저장 실패:", error);
      throw new Error(error.message || "프로젝트 정보를 저장하지 못했습니다.");
    }
  };

  // 프로젝트 삭제
  const handleDeleteProj = async (projId, onChatClose) => {
    try {
      const { data: sessions } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("target_id", projId);
      
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        await supabase.from("chat_messages").delete().in("session_id", sessionIds);
        await supabase.from("chat_sessions").delete().in("id", sessionIds);
      }

      const { error } = await supabase.from("projects").delete().eq("id", projId);
      if (error) throw error;
      setProjects((prev) => prev.filter((item) => item.id !== projId));

      if (onChatClose) {
        onChatClose(projId);
      }
      return true;
    } catch (error) {
      console.error("프로젝트 삭제 실패:", error);
      return false;
    }
  };

  // 이력서 전체 삭제
  const handleDeleteResume = async () => {
    try {
      // 1. chat_sessions 조회
      const { data: sessions } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("resume_id", resumeId);
      
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        // 2. chat_messages 삭제
        await supabase.from("chat_messages").delete().in("session_id", sessionIds);
        // 3. chat_sessions 삭제
        await supabase.from("chat_sessions").delete().in("id", sessionIds);
      }
      
      // 4. education, experience, projects 삭제
      await supabase.from("education").delete().eq("resume_id", resumeId);
      await supabase.from("experience").delete().eq("resume_id", resumeId);
      await supabase.from("projects").delete().eq("resume_id", resumeId);
      
      // 5. 이력서 최종 삭제
      const { error } = await supabase.from("resumes").delete().eq("id", resumeId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("이력서 삭제 실패:", error);
      throw new Error(error.message || "이력서를 삭제하지 못했습니다.");
    }
  };

  return {
    resume,
    resumeLoading,
    editTitleValue,
    setEditTitleValue,
    educations,
    experiences,
    projects,
    handleUpdateTitle,
    handleToggleStatus,
    handleSaveEdu,
    handleDeleteEdu,
    handleSaveExp,
    handleDeleteExp,
    handleSaveProj,
    handleDeleteProj,
    handleSaveProfile,
    handleSaveIntro,
    handleDeleteResume,
    refetchDetails: fetchResumeDetails
  };
}
