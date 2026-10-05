import React from 'react';
import { Student, AssessmentSession } from '../types/assessment';
import { abllsData, calculateAgeMonths, getNormsIntervalIndex } from '../utils/storage';
import { Trophy, TrendingUp, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';

interface AnalyticsViewProps {
  student: Student;
  session: AssessmentSession;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ student, session }) => {
  const ageInfo = calculateAgeMonths(student.dob, session.assessmentDate);
  const normIdx = getNormsIntervalIndex(ageInfo.totalMonths);
  const normIntervalName = abllsData.norms_intervals[normIdx] || `${ageInfo.totalMonths}T`;

  // Calculate detailed stats per repertoire
  const repStats = abllsData.repertoires.map(rep => {
    let earned = 0;
    let scoredCount = 0;
    let masteredCount = 0;
    let emergingCount = 0;
    let notPresentCount = 0;

    const repSkills = abllsData.skills.filter(s => s.repertoire_code === rep.code);
    repSkills.forEach(s => {
      const score = session.scores[s.code];
      if (score !== undefined) {
        scoredCount++;
        earned += score;
        if (score === s.max_score) masteredCount++;
        else if (score > 0) emergingCount++;
        else notPresentCount++;
      }
    });

    const percentage = rep.total_points > 0 ? (earned / rep.total_points) * 100 : 0;

    // Norms benchmark
    let normBenchmark = 0;
    const normEntry = abllsData.norms[rep.code];
    if (normEntry && normEntry.values && normEntry.values.length > normIdx) {
      normBenchmark = normEntry.values[normIdx] * 100;
    }

    return {
      code: rep.code,
      name: rep.name,
      name_en: rep.name_en,
      skillsCount: repSkills.length,
      scoredCount,
      masteredCount,
      emergingCount,
      notPresentCount,
      earned,
      total: rep.total_points,
      percentage: Math.round(percentage),
      normBenchmark: Math.round(normBenchmark),
      diff: Math.round(percentage - normBenchmark)
    };
  });

  const totalEarned = repStats.reduce((acc, r) => acc + r.earned, 0);
  const totalMax = repStats.reduce((acc, r) => acc + r.total, 0);
  const totalPercentage = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

  const totalMastered = repStats.reduce((acc, r) => acc + r.masteredCount, 0);
  const totalEmerging = repStats.reduce((acc, r) => acc + r.emergingCount, 0);
  const totalNotPresent = repStats.reduce((acc, r) => acc + r.notPresentCount, 0);

  // Top strengths (highest percentage)
  const strengths = [...repStats].filter(r => r.percentage > 0).sort((a, b) => b.percentage - a.percentage).slice(0, 3);
  // Areas needing most support (biggest negative difference from norms)
  const priorityAreas = [...repStats].sort((a, b) => a.diff - b.diff).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-28 md:pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
              Đối chiếu Mốc tuổi chuẩn (Norms)
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">
              Bảng Phân Tích Năng Lực Phát Triển: {student.fullName}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Độ tuổi đánh giá: <strong>{ageInfo.years} tuổi {ageInfo.months} tháng ({ageInfo.totalMonths} tháng)</strong> | Đối chiếu mốc tuổi chuẩn: <strong>{normIntervalName}</strong> (Partington, 2010)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl text-center">
              <div className="text-2xl font-black">{totalPercentage}%</div>
              <div className="text-[10px] text-slate-300 font-semibold uppercase">Tổng tiến độ</div>
            </div>
            <div className="bg-sky-50 border border-sky-200 text-sky-900 px-5 py-3 rounded-2xl text-center">
              <div className="text-2xl font-black">{totalEarned} / {totalMax}</div>
              <div className="text-[10px] text-sky-700 font-semibold uppercase">Điểm tích lũy</div>
            </div>
          </div>
        </div>

        {/* 4 Cards Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase">Đã thành thạo (Mastered)</span>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-950 mt-2">{totalMastered}</div>
            <p className="text-xs text-emerald-700 mt-1">Kỹ năng đạt điểm tối đa</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase">Đang hình thành (Emerging)</span>
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-3xl font-black text-amber-950 mt-2">{totalEmerging}</div>
            <p className="text-xs text-amber-700 mt-1">Cần củng cố & duy trì</p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase">Chưa xuất hiện (Not present)</span>
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div className="text-3xl font-black text-rose-950 mt-2">{totalNotPresent}</div>
            <p className="text-xs text-rose-700 mt-1">Mục tiêu ưu tiên can thiệp</p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-800 uppercase">Tổng bài đã lượng giá</span>
              <BarChart2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-3xl font-black text-indigo-950 mt-2">
              {totalMastered + totalEmerging + totalNotPresent} / {abllsData.total_skills}
            </div>
            <p className="text-xs text-indigo-700 mt-1">Đợt {session.roundNumber}</p>
          </div>
        </div>
      </div>

      {/* Highlights & Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-900">Điểm mạnh phát triển hàng đầu</h3>
          </div>
          <div className="space-y-3">
            {strengths.map(s => (
              <div key={s.code} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-800">{s.code}. {s.name}</div>
                  <div className="text-xs text-slate-500">{s.earned}/{s.total} điểm ({s.masteredCount} bài đạt tối đa)</div>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-emerald-600">{s.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-base text-slate-900">Lĩnh vực chênh lệch nhiều nhất so với mốc tuổi</h3>
          </div>
          <div className="space-y-3">
            {priorityAreas.map(s => (
              <div key={s.code} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-sm text-slate-800">{s.code}. {s.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {s.earned}/{s.total} điểm
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                    Trẻ đạt: {s.percentage}%
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                    Mốc chuẩn: {s.normBenchmark}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Complete Repertoire Benchmark Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">
            Chi tiết 25 Lĩnh vực Kỹ năng & Đối chiếu Mốc Chuẩn (Partington 2010)
          </h3>
          <span className="text-xs text-slate-500">Mốc tuổi đối chiếu: {normIntervalName}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4">Mã</th>
                <th className="py-3 px-4">Lĩnh vực kỹ năng</th>
                <th className="py-3 px-4 text-center">Điểm đạt</th>
                <th className="py-3 px-4 text-center">Tối đa</th>
                <th className="py-3 px-4">So sánh với Chuẩn Mốc Tuổi</th>
                <th className="py-3 px-4 text-right">Trẻ đạt (%)</th>
                <th className="py-3 px-4 text-right">Chuẩn (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {repStats.map(r => (
                <tr key={r.code} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-black text-slate-800">{r.code}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{r.name}</div>
                    <div className="text-[10px] text-slate-400">{r.name_en}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-700">{r.earned}</td>
                  <td className="py-3 px-4 text-center text-slate-500">{r.total}</td>
                  <td className="py-3 px-4">
                    {/* Progress bar comparison */}
                    <div className="space-y-1 w-48 sm:w-64">
                      {/* Child bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-600 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, r.percentage)}%` }}
                        />
                      </div>
                      {/* Norm benchmark bar */}
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-slate-400 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, r.normBenchmark)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-sky-700">{r.percentage}%</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-500">{r.normBenchmark}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
