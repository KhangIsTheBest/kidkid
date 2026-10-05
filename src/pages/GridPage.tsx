import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentSession } from '../hooks/useStudentSession';
import { StudentEvaluationHeader } from '../components/StudentEvaluationHeader';
import { AbllsGridTab } from '../components/AbllsGridTab';
import { AlertCircle } from 'lucide-react';

export const GridPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    student,
    currentRound,
    setCurrentRound,
    currentSession,
    loading,
    saving,
    error
  } = useStudentSession(id);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-slate-500 font-medium text-xs sm:text-sm">Đang tải ma trận biểu đồ ABLLS...</p>
      </div>
    );
  }

  if (error || !student || !currentSession) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy dữ liệu học sinh</h3>
        <p className="text-xs text-slate-500">{error || 'Vui lòng kiểm tra lại đường dẫn.'}</p>
      </div>
    );
  }

  const handleNavigateToSkill = (skillCode: string, repCode: string) => {
    navigate(`/students/${id}/scoring?rep=${repCode}&skill=${skillCode}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <StudentEvaluationHeader
        student={student}
        currentRound={currentRound}
        onSelectRound={setCurrentRound}
        saving={saving}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <AbllsGridTab
          student={student}
          session={currentSession}
          onNavigateToSkill={handleNavigateToSkill}
        />
      </div>
    </div>
  );
};
