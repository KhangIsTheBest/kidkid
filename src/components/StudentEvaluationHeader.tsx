import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Student } from '../types/assessment';
import { ROUND_COLORS } from '../utils/storage';
import {
  ArrowLeft,
  Sparkles,
  LayoutGrid,
  BarChart3,
  FileText,
  User,
  Users,
  CheckCircle,
  Clock
} from 'lucide-react';

interface StudentEvaluationHeaderProps {
  student: Student;
  currentRound: number;
  onSelectRound: (round: number) => void;
  saving?: boolean;
}

export const StudentEvaluationHeader: React.FC<StudentEvaluationHeaderProps> = ({
  student,
  currentRound,
  onSelectRound,
  saving = false
}) => {
  const navigate = useNavigate();

  const roundList = [
    { round: 1, label: 'Đợt 1 (Mốc ban đầu)', color: ROUND_COLORS[1] },
    { round: 2, label: 'Đợt 2 (3 tháng)', color: ROUND_COLORS[2] },
    { round: 3, label: 'Đợt 3 (6 tháng)', color: ROUND_COLORS[3] },
    { round: 4, label: 'Đợt 4 (12 tháng)', color: ROUND_COLORS[4] },
  ];

  return (
    <div className="bg-white border-b border-slate-200 sticky top-14 sm:top-16 z-20 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top Info & Round Bar */}
        <div className="py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/students')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              title="Quay lại danh sách học sinh"
            >
              <Users className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Danh Sách Học Sinh</span>
            </button>

            <button
              onClick={() => navigate(`/students/${student.id}`)}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Quay lại hồ sơ học sinh này"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-slate-900">
                  {student.fullName || student.full_name}
                </span>
                {(student.nickname) && (
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-2xs font-bold rounded-md">
                    {student.nickname}
                  </span>
                )}
              </div>
              <span className="text-2xs text-slate-400">
                {student.gender === 'female' ? 'Nữ' : 'Nam'} • {student.dob}
              </span>
            </div>
          </div>

          {/* Right: Round Picker & Saving Status */}
          <div className="flex items-center gap-3">
            {saving ? (
              <span className="flex items-center gap-1 text-2xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                <Clock className="w-3 h-3 animate-spin" /> Đang lưu...
              </span>
            ) : (
              <span className="hidden sm:flex items-center gap-1 text-2xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <CheckCircle className="w-3 h-3" /> Đã đồng bộ
              </span>
            )}

            {/* Round Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              {roundList.map((r) => {
                const isSelected = currentRound === r.round;
                return (
                  <button
                    key={r.round}
                    onClick={() => onSelectRound(r.round)}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: r.color.hex }}
                    />
                    <span>Đợt {r.round}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none text-xs font-bold">
          <NavLink
            to={`/students/${student.id}/scoring`}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Sparkles className="w-4 h-4" />
            Chấm Điểm ABLLS
          </NavLink>

          <NavLink
            to={`/students/${student.id}/grid`}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <LayoutGrid className="w-4 h-4" />
            Lưới Biểu Đồ
          </NavLink>

          <NavLink
            to={`/students/${student.id}/analytics`}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <BarChart3 className="w-4 h-4" />
            Thống Kê Mốc Tuổi
          </NavLink>

          <NavLink
            to={`/students/${student.id}/iep`}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <FileText className="w-4 h-4" />
            Kế Hoạch IEP
          </NavLink>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => navigate(`/students/${student.id}`)}
              className="text-2xs font-bold text-slate-500 hover:text-sky-600 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5" />
              Hồ sơ chi tiết
            </button>
            <button
              onClick={() => navigate('/students')}
              className="text-2xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-sky-200 whitespace-nowrap transition-colors"
              title="Quay lại danh sách để chọn học sinh khác"
            >
              <Users className="w-3.5 h-3.5 text-sky-600" />
              Đổi học sinh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
