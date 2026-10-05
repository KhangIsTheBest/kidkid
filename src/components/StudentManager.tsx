import React, { useState } from 'react';
import { Student } from '../types/assessment';
import { calculateAgeMonths } from '../utils/storage';
import { User, Calendar, Plus, Edit3, HeartHandshake } from 'lucide-react';

interface StudentManagerProps {
  students: Student[];
  currentStudent: Student | null;
  onSelectStudent: (s: Student) => void;
  onOpenNewModal: () => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  currentStudent,
  onSelectStudent,
  onOpenNewModal
}) => {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-28 md:pb-12">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Danh Sách Hồ Sơ Học Sinh Can Thiệp</h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý thông tin hành chính, ngày sinh và lịch sử đánh giá của trẻ tại trung tâm
          </p>
        </div>

        <button
          onClick={onOpenNewModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm Học Sinh Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map(s => {
          const isSelected = currentStudent?.id === s.id;
          const ageInfo = calculateAgeMonths(s.dob);

          return (
            <div
              key={s.id}
              onClick={() => onSelectStudent(s)}
              className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                isSelected
                  ? 'border-sky-500 ring-2 ring-sky-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    s.gender === 'male' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'
                  }`}>
                    {s.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{s.fullName}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{s.dob} ({ageInfo.years} tuổi {ageInfo.months} tháng)</span>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                    Đang chọn
                  </span>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                {s.diagnosis && (
                  <div>
                    <span className="text-slate-400 font-medium">Chẩn đoán: </span>
                    <span className="font-bold text-slate-700">{s.diagnosis}</span>
                  </div>
                )}
                {s.classOrCenter && (
                  <div>
                    <span className="text-slate-400 font-medium">Cơ sở: </span>
                    <span className="text-slate-700">{s.classOrCenter}</span>
                  </div>
                )}
                {s.notes && (
                  <p className="text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-2">
                    "{s.notes}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
