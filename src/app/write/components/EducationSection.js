"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Calendar,
  GraduationCap,
  Edit2
} from "lucide-react";
import EducationModal from "./EducationModal";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function EducationSection({
  educations,
  onSaveEdu,
  onDeleteEdu,
  isReadOnly = false
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const startAddEdu = () => {
    setEditTarget(null);
    setIsModalOpen(true);
  };

  const startEditEdu = (edu) => {
    setEditTarget(edu);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 pdf-block">
        <h3 className="text-sm font-extrabold text-slate-900 tracking-wider flex items-center gap-1.5">
          <GraduationCap className="h-4.5 w-4.5 text-slate-600" />
          EDUCATION (학력)
        </h3>
      </div>

      {/* 학력 리스트 */}
      <div className="space-y-4">
        {educations.length === 0 ? (
          isReadOnly ? (
            <div className="bg-slate-50/30 border border-slate-100/50 rounded-2xl py-6 px-4 text-center text-xs text-slate-400 font-semibold min-h-[60px] flex items-center justify-center pdf-block">
              등록된 학력 정보가 없습니다.
            </div>
          ) : (
            <div
              onClick={startAddEdu}
              className="group cursor-pointer bg-[#f8f9fa] hover:bg-[#f2f4f6] border border-slate-100 rounded-2xl py-8 px-4 text-center flex flex-col items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] min-h-[100px] pdf-block"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-50 group-hover:text-primary flex items-center justify-center text-slate-400 transition-colors">
                <Plus className="h-4 w-4" />
              </div>
              <p className="text-xs text-slate-500 font-bold group-hover:text-slate-900 transition-colors">
                학력 정보(학교명, 전공 등)를 입력해 보세요
              </p>
            </div>
          )
        ) : (
          educations.map((edu) => (
            <div
              key={edu.id}
              className="group relative flex justify-between gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors pdf-block"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-slate-900">{edu.school_name}</span>
                  {edu.major && (
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {edu.major}
                    </span>
                  )}
                  {edu.gpa && (
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      학점: {edu.gpa}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  {edu.start_date
                    ? new Date(edu.start_date).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short"
                      })
                    : "미상"}
                  <span>~</span>
                  {edu.end_date
                    ? new Date(edu.end_date).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short"
                      })
                    : "재학 중"}
                </div>
                {edu.description && (
                  <p className="text-xs text-slate-500 font-normal pl-5 list-item marker:text-slate-300">
                    {edu.description}
                  </p>
                )}
              </div>

              {/* 수정 / 삭제 컨트롤 (isReadOnly가 아닐 때만 노출) */}
              {!isReadOnly && (
                <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEditEdu(edu)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                    title="수정"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTargetId(edu.id);
                      setIsDeleteConfirmOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                    title="삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 학력 입력 모달 */}
      {!isReadOnly && (
        <EducationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={async (id, form) => {
            const success = await onSaveEdu(id, form);
            if (success) {
              setIsModalOpen(false);
            }
          }}
          initialData={editTarget}
        />
      )}

      {/* 학력 삭제 컨펌 모달 */}
      {!isReadOnly && (
        <ConfirmModal
          isOpen={isDeleteConfirmOpen}
          title="학력 정보 삭제"
          description="정말 이 학력 정보를 삭제하시겠습니까?"
          confirmText="삭제"
          cancelText="취소"
          onConfirm={async () => {
            setIsDeleteConfirmOpen(false);
            if (deleteTargetId) {
              await onDeleteEdu(deleteTargetId);
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
