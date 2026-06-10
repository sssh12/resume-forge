"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Calendar,
  Briefcase,
  Edit2,
  Sparkles
} from "lucide-react";
import ExperienceModal from "./ExperienceModal";
import MarkdownRenderer from "./MarkdownRenderer";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function ExperienceSection({
  experiences,
  onSaveExp,
  onDeleteExp,
  onStartChat,
  activeSession,
  isReadOnly = false
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const startAddExp = () => {
    setEditTarget(null);
    setIsModalOpen(true);
  };

  const startEditExp = (exp) => {
    setEditTarget(exp);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 pdf-block">
        <h3 className="text-sm font-extrabold text-slate-900 tracking-wider flex items-center gap-1.5">
          <Briefcase className="h-4.5 w-4.5 text-slate-600" />
          WORK EXPERIENCE (경력)
        </h3>
      </div>

      {/* 경력 리스트 */}
      <div className="space-y-6">
        {experiences.length === 0 ? (
          isReadOnly ? (
            <div className="bg-slate-50/30 border border-slate-100/50 rounded-2xl py-6 px-4 text-center text-xs text-slate-400 font-semibold min-h-[60px] flex items-center justify-center pdf-block">
              등록된 경력 정보가 없습니다.
            </div>
          ) : (
            <div
              onClick={startAddExp}
              className="group cursor-pointer bg-[#f8f9fa] hover:bg-[#f2f4f6] border border-slate-100 rounded-2xl py-8 px-4 text-center flex flex-col items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] min-h-[100px] pdf-block"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-50 group-hover:text-primary flex items-center justify-center text-slate-400 transition-colors">
                <Plus className="h-5 w-5" />
              </div>
              <p className="text-xs text-slate-500 font-bold group-hover:text-slate-900 transition-colors">
                경력 정보(회사명, 역할 등)를 입력해 보세요
              </p>
            </div>
          )
        ) : (
          experiences.map((exp) => {
            const isTargetingThis = activeSession?.target_id === exp.id;
            return (
              <div
                key={exp.id}
                className={`group relative p-4 rounded-xl border border-transparent hover:border-slate-200/80 transition-all pdf-block ${
                  !isReadOnly && isTargetingThis ? "bg-blue-50/40 border-blue-200/70" : "hover:bg-slate-50/50"
                }`}
              >
                <div className="flex justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-base text-slate-900">{exp.company_name}</span>
                      {exp.role && (
                        <span className="text-xs font-bold text-primary bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                          {exp.role}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {exp.start_date
                        ? new Date(exp.start_date).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "short"
                          })
                        : "미상"}
                      <span>~</span>
                      {exp.end_date
                        ? new Date(exp.end_date).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "short"
                          })
                        : "재직 중"}
                    </div>

                    {/* 완성된 STAR 이력서 텍스트 */}
                    {exp.description ? (
                      <div className="pt-2 pl-3 border-l-2 border-slate-900">
                        <MarkdownRenderer content={exp.description} />
                      </div>
                    ) : (
                      !isReadOnly && (
                        <div className="bg-blue-50/35 border border-blue-100/40 rounded-xl p-3.5 mt-2 flex items-center gap-2.5">
                          <Sparkles className="h-4 w-4 text-primary shrink-0 animate-pulse" />
                          <p className="text-xs text-slate-500 font-semibold">
                            아직 작성된 설명이 없습니다. AI 챗봇을 시작하여 문장을 완성해 보세요.
                          </p>
                        </div>
                      )
                    )}
                  </div>

                  {/* 컨트롤 영역 (isReadOnly가 아닐 때만 노출) */}
                  {!isReadOnly && (
                    <div className="flex flex-col items-end gap-2.5 shrink-0">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditExp(exp)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                          title="수정"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(exp.id);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <Button
                        size="sm"
                        variant={exp.description ? "outline" : "primary"}
                        onClick={() => onStartChat("experience", exp)}
                        className={`text-[10px] font-bold px-2 py-1 h-7 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer ${
                          exp.description
                            ? "border-slate-200 hover:bg-slate-50 text-slate-600 bg-white"
                            : "bg-primary hover:bg-primary/95 text-white"
                        }`}
                      >
                        <Sparkles className="h-3 w-3" />
                        {exp.description ? "AI 챗봇 다시 열기" : "AI 챗봇 작성"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 경력 입력 모달 */}
      {!isReadOnly && (
        <ExperienceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={async (id, form) => {
            const success = await onSaveExp(id, form);
            if (success) {
              setIsModalOpen(false);
            }
          }}
          initialData={editTarget}
        />
      )}

      {/* 경력 삭제 컨펌 모달 */}
      {!isReadOnly && (
        <ConfirmModal
          isOpen={isDeleteConfirmOpen}
          title="경력 정보 삭제"
          description="정말 이 경력 정보를 삭제하시겠습니까? 관련된 AI 대화도 삭제됩니다."
          confirmText="삭제"
          cancelText="취소"
          onConfirm={async () => {
            setIsDeleteConfirmOpen(false);
            if (deleteTargetId) {
              await onDeleteExp(deleteTargetId);
              setDeleteTargetId(null);
            }
          }}
          onCancel={() => {
            setIsDeleteConfirmOpen(false);
            setDeleteTargetId(null);
          }}
          isDestructive={true}
        />
      )}
    </div>
  );
}
