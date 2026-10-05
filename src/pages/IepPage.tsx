import React from 'react';
import { useParams } from 'react-router-dom';
import { useStudentSession } from '../hooks/useStudentSession';
import { StudentEvaluationHeader } from '../components/StudentEvaluationHeader';
import { IepReportView } from '../components/IepReportView';
import { AlertCircle } from 'lucide-react';

export const IepPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const {
    student,
    currentRound,
    setCurrentRound,
    currentSession,
    loading,
    saving,
    error,
    handleUpdateSession
  } = useStudentSession(id);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-slate-500 font-medium text-xs sm:text-sm">Đang tải kế hoạch giáo dục cá nhân...</p>
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <StudentEvaluationHeader
        student={student}
        currentRound={currentRound}
        onSelectRound={setCurrentRound}
        saving={saving}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <IepReportView
          student={student}
          session={currentSession}
          onUpdateSession={handleUpdateSession}
        />
      </div>
    </div>
  );
};
