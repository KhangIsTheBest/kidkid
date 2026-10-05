import React from 'react';
import { Student, AssessmentSession } from '../types/assessment';
import { calculateAgeMonths, ROUND_COLORS } from '../utils/storage';
import { UserCheck, Sparkles, BookOpen, BarChart3, FileText, Users, PlusCircle, LayoutGrid } from 'lucide-react';

interface HeaderProps {
  students: Student[];
  currentStudent: Student | null;
  onSelectStudent: (student: Student) => void;
  currentSession: AssessmentSession | null;
  onSelectRound: (round: number) => void;
  activeTab: 'scoring' | 'grid' | 'analytics' | 'iep' | 'students';
  onChangeTab: (tab: 'scoring' | 'grid' | 'analytics' | 'iep' | 'students') => void;
  onOpenNewStudentModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  students,
  currentStudent,
  onSelectStudent,
  currentSession,
  onSelectRound,
  activeTab,
  onChangeTab,
  onOpenNewStudentModal
}) => {
  const ageInfo = currentStudent
    ? calculateAgeMonths(currentStudent.dob, currentSession?.assessmentDate)
    : null;

  return (
    <>
      {/* Top Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="font-black text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                KidKid
              </span>
            </div>

            {/* Student Selector & Assessment Round */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Student Dropdown */}
              <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 px-2 py-1 sm:p-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm">
                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600" />
                <select
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[110px] sm:max-w-[180px] truncate"
                  value={currentStudent?.id || ''}
                  onChange={(e) => {
                    const found = students.find(s => s.id === e.target.value);
                    if (found) onSelectStudent(found);
                  }}
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Age pill */}
              {ageInfo && (
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-700">
                    {ageInfo.years}t {ageInfo.months}th ({ageInfo.totalMonths} tháng)
                  </span>
                  <span className="text-[10px] text-slate-400">Sinh: {currentStudent?.dob}</span>
                </div>
              )}

              {/* Assessment round selector với màu chuẩn ABLLS-R */}
              <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 p-0.5 sm:p-1 rounded-lg text-xs font-bold">
                {[1, 2, 3, 4].map(round => {
                  const isActive = currentSession?.roundNumber === round;
                  return (
                    <button
                      key={round}
                      onClick={() => onSelectRound(round)}
                      style={isActive ? {
                        backgroundColor: ROUND_COLORS[round].bg,
                        color: '#000000',
                        borderColor: ROUND_COLORS[round].border
                      } : {}}
                      className={`px-1.5 sm:px-2.5 py-1 rounded-md transition-all text-[11px] sm:text-xs font-black border ${
                        isActive
                          ? 'shadow-xs'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                      title={ROUND_COLORS[round].name}
                    >
                      <span className="hidden sm:inline">Đợt {round}</span>
                      <span className="sm:hidden">Đ{round}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add Student button */}
              <button
                onClick={onOpenNewStudentModal}
                className="p-1.5 sm:p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                title="Thêm học sinh mới"
              >
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Hidden on mobile) */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4 py-2 border-t border-slate-100">
            <button
              onClick={() => onChangeTab('scoring')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs lg:text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'scoring'
                  ? 'bg-sky-50 text-sky-700 shadow-xs border border-sky-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-sky-600" />
              Chấm Điểm Trên Lớp
            </button>

            <button
              onClick={() => onChangeTab('grid')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs lg:text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'grid'
                  ? 'bg-sky-50 text-sky-700 shadow-xs border border-sky-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-sky-600" />
              Biểu Đồ Cột Tổng Quan
            </button>

            <button
              onClick={() => onChangeTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs lg:text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'analytics'
                  ? 'bg-sky-50 text-sky-700 shadow-xs border border-sky-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Phân Tích & Đối Chiếu Chuẩn
            </button>

            <button
              onClick={() => onChangeTab('iep')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs lg:text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'iep'
                  ? 'bg-sky-50 text-sky-700 shadow-xs border border-sky-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              Mục Tiêu IEP & Xuất Báo Cáo Word
            </button>

            <button
              onClick={() => onChangeTab('students')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs lg:text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'students'
                  ? 'bg-sky-50 text-sky-700 shadow-xs border border-sky-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 text-amber-600" />
              Hồ Sơ Học Sinh
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Fixed at bottom on mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5 safe-area-pb">
        <div className="grid grid-cols-5 gap-1">
          <button
            onClick={() => onChangeTab('scoring')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'scoring'
                ? 'text-sky-600 bg-sky-50/80 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">Chấm điểm</span>
          </button>

          <button
            onClick={() => onChangeTab('grid')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'grid'
                ? 'text-sky-600 bg-sky-50/80 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">Biểu đồ cột</span>
          </button>

          <button
            onClick={() => onChangeTab('analytics')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'analytics'
                ? 'text-indigo-600 bg-indigo-50/80 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">Phân tích</span>
          </button>

          <button
            onClick={() => onChangeTab('iep')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'iep'
                ? 'text-emerald-600 bg-emerald-50/80 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">IEP & Báo cáo</span>
          </button>

          <button
            onClick={() => onChangeTab('students')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'students'
                ? 'text-amber-600 bg-amber-50/80 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">Học sinh</span>
          </button>
        </div>
      </nav>
    </>
  );
};
