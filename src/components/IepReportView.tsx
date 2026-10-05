import React, { useState } from 'react';
import { Student, AssessmentSession, IepGoal } from '../types/assessment';
import { abllsData } from '../utils/storage';
import { exportWordReport } from '../utils/reportExporter';
import { Download, Sparkles, Plus, Trash2, CheckCircle2, FileText } from 'lucide-react';

interface IepReportViewProps {
  student: Student;
  session: AssessmentSession;
  onUpdateSession: (updatedSession: AssessmentSession) => void;
}

export const IepReportView: React.FC<IepReportViewProps> = ({
  student,
  session,
  onUpdateSession
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Auto-generate suggested IEP goals from unscored or low-scored skills in core domains
  const handleAutoSuggestGoals = () => {
    // Focus domains: A, C, D, E, F, G, K, L
    const coreDomains = ['A', 'C', 'D', 'E', 'F', 'G', 'K', 'L'];
    const candidates = abllsData.skills.filter(s => {
      if (!coreDomains.includes(s.repertoire_code)) return false;
      const score = session.scores[s.code];
      return score !== undefined && score < s.max_score;
    });

    // Pick up to 5 top candidates
    const suggested: IepGoal[] = candidates.slice(0, 5).map(c => {
      const score = session.scores[c.code] || 0;
      return {
        skillCode: c.code,
        skillTitle: c.title,
        repertoireCode: c.repertoire_code,
        targetScore: c.max_score,
        priority: score === 0 ? 'Cao' : 'Trung bình',
        timeframe: '3 tháng',
        interventionStrategy: `Dạy trẻ hoàn thành bài ${c.code} (${c.title}) bằng phương pháp chia nhỏ nhiệm vụ và khen thưởng tích cực.`
      };
    });

    onUpdateSession({
      ...session,
      iepGoals: [...session.iepGoals, ...suggested]
    });
  };

  const handleAddGoal = () => {
    const newGoal: IepGoal = {
      skillCode: 'A1',
      skillTitle: 'Cầm vật yêu thích khi được cho',
      repertoireCode: 'A',
      targetScore: 2,
      priority: 'Cao',
      timeframe: '3 tháng',
      interventionStrategy: 'Luyện tập tương tác và trao nhận đồ vật yêu thích trong 8/10 cơ hội.'
    };
    onUpdateSession({
      ...session,
      iepGoals: [newGoal, ...session.iepGoals]
    });
  };

  const handleRemoveGoal = (index: number) => {
    const goals = [...session.iepGoals];
    goals.splice(index, 1);
    onUpdateSession({ ...session, iepGoals: goals });
  };

  const handleUpdateGoal = (index: number, field: keyof IepGoal, value: string | number) => {
    const goals = [...session.iepGoals];
    goals[index] = { ...goals[index], [field]: value };
    onUpdateSession({ ...session, iepGoals: goals });
  };

  const handleExportWord = async () => {
    try {
      setIsExporting(true);
      await exportWordReport(student, session);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Lỗi khi xuất file Word:', err);
      alert('Có lỗi xảy ra khi tạo file Word. Vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-28 md:pb-12">
      {/* Header and Export Action */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
            Kế Hoạch Can Thiệp Cá Nhân & Báo Cáo
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">
            Mục Tiêu Ưu Tiên Can Thiệp (IEP) & Báo Cáo Đánh Giá
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Học sinh: <strong>{student.fullName}</strong> | Đợt đánh giá: <strong>Đợt {session.roundNumber}</strong> ({session.assessmentDate})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportWord}
            disabled={isExporting}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-white shadow-md transition-all ${
              exportSuccess
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-sky-500/20'
            }`}
          >
            {exportSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Đã tải file Word thành công!
              </>
            ) : isExporting ? (
              <>
                <FileText className="w-5 h-5 animate-pulse" />
                Đang tạo file Word (.docx)...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Xuất Báo Cáo Word (.docx) Chuẩn
              </>
            )}
          </button>
        </div>
      </div>

      {/* Qualitative Notes: General, Strengths, Challenges */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Nhận Định Tổng Quan Năng Lực Hiện Tại (Sẽ đưa vào Báo cáo Word)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              1. Nhận định chung (General Summary):
            </label>
            <textarea
              rows={4}
              value={session.generalSummary || ''}
              onChange={(e) => onUpdateSession({ ...session, generalSummary: e.target.value })}
              placeholder="Nhận xét khái quát về mức độ tương tác, khả năng thích nghi..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-800 mb-1">
              2. Điểm mạnh nổi bật (Strengths):
            </label>
            <textarea
              rows={4}
              value={session.strengths || ''}
              onChange={(e) => onUpdateSession({ ...session, strengths: e.target.value })}
              placeholder="Các lĩnh vực trẻ có thế mạnh (vận động, bắt chước, phản hồi khen thưởng)..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-rose-800 mb-1">
              3. Điểm cần hỗ trợ ưu tiên (Challenges):
            </label>
            <textarea
              rows={4}
              value={session.challenges || ''}
              onChange={(e) => onUpdateSession({ ...session, challenges: e.target.value })}
              placeholder="Những rào cản cần can thiệp sớm (yêu cầu bằng lời, chú ý nhóm, nề nếp)..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>
        </div>
      </div>

      {/* IEP Goals List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Danh Sách Mục Tiêu Ưu Tiên Can Thiệp (IEP Goals)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Các kỹ năng được chọn làm trọng tâm can thiệp cho giai đoạn tiếp theo (3 – 6 – 12 tháng).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoSuggestGoals}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Tự Động Gợi Ý Mục Tiêu Từ Điểm Yếu
            </button>
            <button
              onClick={handleAddGoal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm Thủ Công
            </button>
          </div>
        </div>

        {session.iepGoals.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
            <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <p className="font-semibold text-sm">Chưa có mục tiêu can thiệp nào được chọn</p>
            <p className="text-xs text-slate-400 mt-1">
              Bấm nút "Tự Động Gợi Ý Mục Tiêu" để hệ thống tự lọc các kỹ năng chưa đạt ở các lĩnh vực nền tảng.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {session.iepGoals.map((goal, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-wrap items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-[300px]">
                  <span className="w-10 h-10 rounded-lg bg-sky-900 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    {goal.skillCode}
                  </span>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={goal.skillTitle}
                        onChange={(e) => handleUpdateGoal(idx, 'skillTitle', e.target.value)}
                        className="font-bold text-sm text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={goal.interventionStrategy}
                      onChange={(e) => handleUpdateGoal(idx, 'interventionStrategy', e.target.value)}
                      placeholder="Chiến lược và biện pháp can thiệp cụ thể..."
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Priority, Timeframe, Delete */}
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mức ưu tiên</label>
                    <select
                      value={goal.priority}
                      onChange={(e) => handleUpdateGoal(idx, 'priority', e.target.value as any)}
                      className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Cao">Ưu tiên Cao</option>
                      <option value="Trung bình">Trung bình</option>
                      <option value="Thấp">Thấp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Thời gian</label>
                    <select
                      value={goal.timeframe}
                      onChange={(e) => handleUpdateGoal(idx, 'timeframe', e.target.value as any)}
                      className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="3 tháng">3 tháng tới</option>
                      <option value="6 tháng">6 tháng tới</option>
                      <option value="12 tháng">12 tháng tới</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleRemoveGoal(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mt-4"
                    title="Xóa mục tiêu này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
