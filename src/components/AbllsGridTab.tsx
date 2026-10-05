import React, { useState, useMemo } from 'react';
import { Student, AssessmentSession } from '../types/assessment';
import { abllsData, ROUND_COLORS, calculateAgeMonths, getNormsIntervalIndex } from '../utils/storage';
import { LayoutGrid, ZoomIn, ZoomOut, CheckCircle2, BarChart2, Compass, FileSpreadsheet, ArrowUpRight, Info } from 'lucide-react';

interface AbllsGridTabProps {
  student: Student;
  session: AssessmentSession;
  onNavigateToSkill: (skillCode: string, repCode: string) => void;
}

// Target points for each repertoire at ages 2, 3, 4, 5 (from ABLLS_DanhGia.xlsm sheets Mốc tuổi)
const AGE_TARGETS: Record<number, Record<string, number>> = {
  2: {
    A: 25, B: 4, C: 53, D: 19, E: 17, F: 26, G: 16, H: 3, I: 13, J: 0,
    K: 14, L: 20, M: 0, N: 0, P: 1, Q: 0, R: 0, S: 1, T: 0, U: 0,
    V: 5, W: 0, X: 0, Y: 3, Z: 4
  },
  3: {
    A: 48, B: 22, C: 108, D: 57, E: 44, F: 60, G: 90, H: 48, I: 26, J: 16,
    K: 35, L: 44, M: 2, N: 0, P: 10, Q: 0, R: 2, S: 1, T: 0, U: 9,
    V: 7, W: 3, X: 6, Y: 13, Z: 10
  },
  4: {
    A: 52, B: 50, C: 157, D: 77, E: 51, F: 74, G: 129, H: 112, I: 28, J: 27,
    K: 45, L: 63, M: 23, N: 0, P: 12, Q: 0, R: 6, S: 3, T: 0, U: 13,
    V: 10, W: 6, X: 15, Y: 19, Z: 18
  },
  5: {
    A: 52, B: 94, C: 182, D: 80, E: 55, F: 74, G: 151, H: 172, I: 28, J: 41,
    K: 52, L: 79, M: 36, N: 23, P: 12, Q: 6, R: 37, S: 23, T: 1, U: 25,
    V: 14, W: 11, X: 18, Y: 24, Z: 27
  }
};

// Calculate developmental age in years and months based on Partington 2010 norms interpolation
function calculateDevelopmentalAge(percentageDecimal: number, repCode?: string): { years: string; months: string } {
  if (percentageDecimal <= 0) {
    return { years: '< 0.5 tuổi', months: '< 6 tháng' };
  }

  const normsEntry = repCode && abllsData.norms[repCode] ? abllsData.norms[repCode] : abllsData.norms['AVG'];
  if (!normsEntry || !normsEntry.values || normsEntry.values.length === 0) {
    return { years: '-', months: '-' };
  }

  const values = normsEntry.values;
  const monthIntervals = [6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60];

  if (percentageDecimal < values[0]) {
    return { years: '< 0.5 tuổi', months: '< 6 tháng' };
  }
  if (percentageDecimal >= values[values.length - 1]) {
    return { years: '>= 5.0 tuổi', months: '>= 60 tháng' };
  }

  let matchIdx = 0;
  for (let i = 0; i < values.length; i++) {
    if (percentageDecimal >= values[i]) {
      matchIdx = i;
    } else {
      break;
    }
  }

  const baseMonths = monthIntervals[matchIdx];
  const nextVal = values[matchIdx + 1] !== undefined ? values[matchIdx + 1] : values[matchIdx];
  const currVal = values[matchIdx];
  const fraction = nextVal > currVal ? (percentageDecimal - currVal) / (nextVal - currVal) : 0;
  const estMonths = Math.round(baseMonths + fraction * 3);
  const estYears = (estMonths / 12).toFixed(1);

  return {
    years: `${estYears} tuổi`,
    months: `${estMonths} tháng`
  };
}

export const AbllsGridTab: React.FC<AbllsGridTabProps> = ({
  student,
  session,
  onNavigateToSkill
}) => {
  const [zoomLevel, setZoomLevel] = useState<'compact' | 'normal' | 'large'>('normal');
  const [tableMode, setTableMode] = useState<'overview' | 2 | 3 | 4 | 5>('overview');
  const [hoveredSkill, setHoveredSkill] = useState<{
    code: string;
    repCode: string;
    title: string;
    score: number;
    maxScore: number;
    skillLevels: Record<number, number>;
  } | null>(null);

  const ageInfo = calculateAgeMonths(student.dob, session.assessmentDate);
  const normIdx = getNormsIntervalIndex(ageInfo.totalMonths);
  const normIntervalName = abllsData.norms_intervals[normIdx] || `${ageInfo.totalMonths}T`;

  // Maximum items across all repertoires (C has 57 items)
  const maxRowItems = 57;

  // Build grid data for each repertoire: items sorted by item index ascending (A1 -> A19)
  const repertoiresGrid = useMemo(() => {
    return abllsData.repertoires.map(rep => {
      const skillsInRep = abllsData.skills
        .filter(s => s.repertoire_code === rep.code)
        .sort((a, b) => {
          const numA = parseInt(a.code.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.code.replace(/\D/g, '')) || 0;
          return numA - numB;
        });

      const earned = skillsInRep.reduce((sum, s) => sum + (session.scores[s.code] || 0), 0);
      const total = rep.total_points;
      const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;

      // Norm benchmark %
      let normBenchmark = 0;
      const normEntry = abllsData.norms[rep.code];
      if (normEntry && normEntry.values && normEntry.values.length > normIdx) {
        normBenchmark = Math.round(normEntry.values[normIdx] * 100);
      }

      return {
        ...rep,
        skills: skillsInRep,
        earned,
        total,
        percentage,
        normBenchmark
      };
    });
  }, [session.scores, normIdx]);

  // Overall totals
  const totalEarned = repertoiresGrid.reduce((sum, r) => sum + r.earned, 0);
  const totalMax = repertoiresGrid.reduce((sum, r) => sum + r.total, 0);
  const totalPercent = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

  // Box size configurations
  const boxHeight = zoomLevel === 'compact' ? 14 : zoomLevel === 'normal' ? 20 : 28;
  const colWidth = zoomLevel === 'compact' ? 36 : zoomLevel === 'normal' ? 52 : 72;

  // Radar chart points generator for 25 repertoires
  const radarPoints = useMemo(() => {
    const size = 340;
    const center = size / 2;
    const radius = size * 0.4;
    const totalReps = repertoiresGrid.length;

    // Child polygon points
    const childPoints: string[] = [];
    // Norm polygon points
    const normPoints: string[] = [];
    // Axis lines and labels
    const axes: { x: number; y: number; label: string; lx: number; ly: number }[] = [];

    repertoiresGrid.forEach((rep, idx) => {
      const angle = (idx / totalReps) * 2 * Math.PI - Math.PI / 2;
      const rChild = radius * (Math.min(100, rep.percentage) / 100);
      const rNorm = radius * (Math.min(100, rep.normBenchmark) / 100);

      const cx = center + rChild * Math.cos(angle);
      const cy = center + rChild * Math.sin(angle);
      childPoints.push(`${cx},${cy}`);

      const nx = center + rNorm * Math.cos(angle);
      const ny = center + rNorm * Math.sin(angle);
      normPoints.push(`${nx},${ny}`);

      const ax = center + radius * Math.cos(angle);
      const ay = center + radius * Math.sin(angle);
      const lx = center + (radius + 18) * Math.cos(angle);
      const ly = center + (radius + 18) * Math.sin(angle);
      axes.push({ x: ax, y: ay, label: rep.code, lx, ly });
    });

    return {
      childPolygon: childPoints.join(' '),
      normPolygon: normPoints.join(' '),
      axes,
      center,
      radius,
      size
    };
  }, [repertoiresGrid]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-28 md:pb-12">
      {/* Top Banner: Overview & Color Legend */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 flex items-center gap-1">
                <LayoutGrid className="w-3.5 h-3.5" />
                Sheet Tổng Quan ABLLS-R
              </span>
              <span className="text-xs text-slate-400">• The Big Book of ABA Programs</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              Biểu Đồ Lưới & Bảng Đánh Giá Tổng Hợp
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Học sinh: <strong>{student.fullName}</strong> | Tuổi: <strong>{ageInfo.years}t {ageInfo.months}th ({ageInfo.totalMonths} tháng)</strong> | Đối chiếu mốc: <strong>{normIntervalName}</strong>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-slate-900 text-white px-4 py-2 sm:px-5 sm:py-3 rounded-2xl text-center">
              <div className="text-xl sm:text-2xl font-black">{totalPercent}%</div>
              <div className="text-[10px] text-slate-300 font-semibold uppercase">Tổng tiến độ</div>
            </div>
            <div className="bg-sky-50 border border-sky-200 text-sky-900 px-4 py-2 sm:px-5 sm:py-3 rounded-2xl text-center">
              <div className="text-xl sm:text-2xl font-black">{totalEarned} / {totalMax}</div>
              <div className="text-[10px] text-sky-700 font-semibold uppercase">Điểm tích lũy</div>
            </div>
          </div>
        </div>

        {/* Round Colors Legend Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-600 mr-1">Quy ước màu 4 đợt (Chuẩn ABLLS-R):</span>
            {[1, 2, 3, 4].map(rnd => (
              <div
                key={rnd}
                style={{ backgroundColor: ROUND_COLORS[rnd].bg }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-black font-black border border-black/10 shadow-2xs text-xs"
              >
                <span>{ROUND_COLORS[rnd].name}</span>
              </div>
            ))}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold border border-slate-200 text-xs">
              <span>Chưa đạt (Trắng)</span>
            </div>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setZoomLevel('compact')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                zoomLevel === 'compact' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Thu nhỏ toàn cảnh"
            >
              <ZoomOut className="w-3.5 h-3.5 inline mr-1" />
              Gọn
            </button>
            <button
              onClick={() => setZoomLevel('normal')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                zoomLevel === 'normal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kích thước chuẩn"
            >
              Chuẩn
            </button>
            <button
              onClick={() => setZoomLevel('large')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                zoomLevel === 'large' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Phóng to chi tiết"
            >
              <ZoomIn className="w-3.5 h-3.5 inline mr-1" />
              Lớn
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: BIỂU ĐỒ LƯỚI CỘT ABLLS-R CHUẨN (Mô phỏng 100% Sheet Tổng hợp) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-sky-600" />
              Biểu Đồ Lưới Cột ABLLS-R Chuẩn (25 Lĩnh Vực Kỹ Năng)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Các cột kỹ năng xếp từ dưới lên trên. Chạm/rê chuột vào ô để xem chi tiết hoặc click để nhảy thẳng sang bài đó.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
            25 Lĩnh vực • 544 Bài đánh giá
          </span>
        </div>

        {/* The Scrollable Grid Canvas */}
        <div className="p-4 overflow-x-auto scrollbar-thin bg-slate-50/50">
          <div className="inline-flex flex-col min-w-max">
            {/* The 25 Tower Columns (Rendered side-by-side) */}
            <div className="flex items-end gap-1 pb-3">
              {repertoiresGrid.map(rep => {
                const totalSkillsInRep = rep.skills.length;

                return (
                  <div
                    key={rep.code}
                    style={{ width: `${colWidth}px` }}
                    className="flex flex-col items-center flex-shrink-0"
                  >
                    {/* Top Header: Code badge (A, B, C...) + percentage */}
                    <div
                      onClick={() => onNavigateToSkill(rep.skills[0]?.code || '', rep.code)}
                      className="cursor-pointer hover:opacity-80 transition-opacity mb-1 text-center"
                      title={`${rep.code}: ${rep.name}`}
                    >
                      <div className="w-6 h-6 mx-auto rounded-md bg-slate-900 text-white font-black text-[11px] flex items-center justify-center shadow-2xs">
                        {rep.code}
                      </div>
                      <div className="text-[10px] font-black text-sky-700 mt-0.5">
                        {rep.percentage}%
                      </div>
                    </div>

                    {/* Column Tower: stacked boxes from item max down to item 1 (bottom-to-top) */}
                    <div className="w-full flex flex-col-reverse bg-white border border-slate-300 rounded-md overflow-hidden shadow-2xs">
                      {rep.skills.map(skill => {
                        const currentScore = session.scores[skill.code] || 0;
                        const skillLevels = session.skillRounds?.[skill.code] || {};
                        const isHovered = hoveredSkill?.code === skill.code;

                        return (
                          <div
                            key={skill.code}
                            data-skill={skill.code}
                            style={{ height: `${boxHeight}px` }}
                            onClick={() => onNavigateToSkill(skill.code, rep.code)}
                            onMouseEnter={() => setHoveredSkill({
                              code: skill.code,
                              repCode: rep.code,
                              title: skill.title,
                              score: currentScore,
                              maxScore: skill.max_score,
                              skillLevels
                            })}
                            onMouseLeave={() => setHoveredSkill(null)}
                            className={`w-full border-t border-slate-200/80 cursor-pointer transition-all flex items-center justify-center relative ${
                              isHovered ? 'ring-2 ring-sky-500 z-10' : ''
                            }`}
                            title={`${skill.code}: ${skill.title} (${currentScore}/${skill.max_score}đ)`}
                          >
                            {/* Inner score levels blocks (e.g. 2 blocks for 2-point, 4 blocks for 4-point) */}
                            <div className="w-full h-full flex pointer-events-none">
                              {Array.from({ length: skill.max_score }, (_, i) => i + 1).map(lvl => {
                                const isAttained = currentScore >= lvl;
                                const roundAttained = skillLevels[lvl] || 1;
                                const colorConfig = ROUND_COLORS[roundAttained] || ROUND_COLORS[1];

                                return (
                                  <div
                                    key={lvl}
                                    style={{
                                      backgroundColor: isAttained ? colorConfig.bg : '#FFFFFF',
                                    }}
                                    className={`flex-1 h-full border-r last:border-r-0 border-slate-300/60 transition-colors flex items-center justify-center`}
                                  />
                                );
                              })}
                            </div>

                            {/* Code label text inside box (visible in normal and large zoom) */}
                            {zoomLevel !== 'compact' && (
                              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-800/80 pointer-events-none select-none">
                                {skill.code}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Column Base Footer: Code (A, B, C...) + Earned/Max */}
                    <div
                      onClick={() => onNavigateToSkill(rep.skills[0]?.code || '', rep.code)}
                      className="mt-2 text-center cursor-pointer hover:text-sky-600 transition-colors"
                    >
                      <div className="w-7 h-7 mx-auto rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {rep.code}
                      </div>
                      <div className="text-[10px] font-bold text-slate-700 mt-1 truncate max-w-[60px]" title={rep.name}>
                        {rep.name}
                      </div>
                      <div className="text-[9px] font-semibold text-slate-400">
                        {rep.earned}/{rep.total}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hovered Skill Floating Quick Bar */}
        {hoveredSkill && (
          <div className="p-3 bg-sky-50 border-t border-sky-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-sky-700 text-white font-black flex items-center justify-center text-xs">
                {hoveredSkill.code}
              </span>
              <div>
                <strong className="text-slate-900">{hoveredSkill.title}</strong>
                <span className="text-slate-500 ml-2">
                  (Điểm đạt: {hoveredSkill.score}/{hoveredSkill.maxScore}đ)
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigateToSkill(hoveredSkill.code, hoveredSkill.repCode)}
              className="flex items-center gap-1 px-3 py-1 bg-sky-600 text-white rounded-lg font-bold text-xs hover:bg-sky-700 shadow-xs"
            >
              <span>Chấm bài này</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2 & 3: BIỂU ĐỒ CỘT 25 LĨNH VỰC & BIỂU ĐỒ RADAR MẠNG NHỆN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ Cột Tiến độ 25 Lĩnh vực */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-base text-slate-900">
                Tiến Độ 25 Lĩnh Vực So Với Chuẩn Mốc Tuổi
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">Chuẩn: {normIntervalName}</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1 scrollbar-thin flex-1">
            {repertoiresGrid.map(r => (
              <div key={r.code} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center">
                      {r.code}
                    </span>
                    <span className="truncate max-w-[180px] sm:max-w-[240px]">{r.name}</span>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="font-extrabold text-sky-700">{r.percentage}%</span>
                    <span className="text-slate-400 font-medium text-[11px]">(Chuẩn {r.normBenchmark}%)</span>
                  </div>
                </div>

                {/* Double Progress Bar: Child vs Norms */}
                <div className="space-y-0.5">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, r.percentage)}%` }}
                    />
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-400 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, r.normBenchmark)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Biểu đồ Radar Mạng Nhện (Competency Spider Web Chart) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-base text-slate-900">
                Biểu Đồ Mạng Nhện Cân Bằng Năng Lực (Radar)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-sky-600">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Trẻ
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Chuẩn tuổi
              </span>
            </div>
          </div>

          {/* SVG Radar Chart */}
          <div className="w-full flex items-center justify-center p-2 flex-1">
            <svg
              viewBox={`0 0 ${radarPoints.size} ${radarPoints.size}`}
              className="w-full max-w-[340px] h-auto overflow-visible"
            >
              {/* Concentric Reference Circles */}
              {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => (
                <circle
                  key={i}
                  cx={radarPoints.center}
                  cy={radarPoints.center}
                  r={radarPoints.radius * ratio}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeDasharray={i < 3 ? '3 3' : 'none'}
                />
              ))}

              {/* Axis Spoke Lines & Labels */}
              {radarPoints.axes.map((axis, i) => (
                <g key={i}>
                  <line
                    x1={radarPoints.center}
                    y1={radarPoints.center}
                    x2={axis.x}
                    y2={axis.y}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                  />
                  <text
                    x={axis.lx}
                    y={axis.ly}
                    fontSize="9"
                    fontWeight="800"
                    fill="#64748B"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {axis.label}
                  </text>
                </g>
              ))}

              {/* Norms Polygon (Gray dashed) */}
              <polygon
                points={radarPoints.normPolygon}
                fill="rgba(148, 163, 184, 0.15)"
                stroke="#94A3B8"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />

              {/* Child Polygon (Blue filled) */}
              <polygon
                points={radarPoints.childPolygon}
                fill="rgba(14, 165, 233, 0.35)"
                stroke="#0284C7"
                strokeWidth="2"
              />
            </svg>
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-2">
            Đa giác màu xanh thể hiện phạm vi năng lực thực tế của trẻ so với đa giác nét đứt (chuẩn mốc tuổi).
          </p>
        </div>
      </div>

      {/* SECTION 4: BẢNG ĐÁNH GIÁ TỔNG HỢP CHI TIẾT (Hỗ trợ Bảng Tổng Quát & Mốc 2/3/4/5 Tuổi) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {tableMode === 'overview'
                  ? 'Bảng Số Liệu Đánh Giá Tổng Hợp Chi Tiết (25 Lĩnh Vực)'
                  : `Bảng Đánh Giá Chi Tiết Theo Mốc ${tableMode} Tuổi (25 Lĩnh Vực)`}
              </h3>
              <p className="text-[11px] text-slate-400">
                {tableMode === 'overview'
                  ? 'Đối chiếu độ tuổi phát triển (năm & tháng) tính từ chuẩn Partington 2010 Norms'
                  : `Mô phỏng 100% sheet 'Mốc ${tableMode} tuổi' trong ABLLS_DanhGia.xlsm`}
              </p>
            </div>
          </div>

          {/* Table Mode Selector (Pills) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setTableMode('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tableMode === 'overview'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Bảng Tổng Quát
            </button>
            {([2, 3, 4, 5] as const).map(age => (
              <button
                key={age}
                onClick={() => setTableMode(age)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tableMode === age
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Mốc {age} Tuổi
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 border-b border-slate-200">
                <th className="py-3 px-3 sm:px-4">KỸ NĂNG</th>
                <th className="py-3 px-3 sm:px-4 text-center">MÃ</th>
                <th className="py-3 px-3 sm:px-4 text-center">Mục tiêu</th>
                <th className="py-3 px-3 sm:px-4 text-center">Mục tiêu Đạt</th>
                <th className="py-3 px-3 sm:px-4 text-center">Mục tiêu Chưa đạt</th>
                <th className="py-3 px-3 sm:px-4 text-right">TỶ LỆ % ĐẠT</th>

                {tableMode === 'overview' ? (
                  <>
                    <th className="py-3 px-3 sm:px-4 text-right">Mức tuổi</th>
                    <th className="py-3 px-3 sm:px-4 text-right">Mức tuổi theo tháng</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-3 sm:px-4 text-center bg-sky-50 text-sky-800">
                      Mục tiêu {tableMode} tuổi
                    </th>
                    <th className="py-3 px-3 sm:px-4 text-right bg-sky-50 text-sky-800">
                      TỶ LỆ % ĐẠT ({tableMode} TUỔI)
                    </th>
                    <th className="py-3 px-3 sm:px-4 text-right">Mức tuổi</th>
                  </>
                )}

                <th className="py-3 px-3 sm:px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repertoiresGrid.map(r => {
                const unachieved = Math.max(0, r.total - r.earned);
                const devAge = calculateDevelopmentalAge(r.total > 0 ? r.earned / r.total : 0, r.code);
                const ageTarget = typeof tableMode === 'number' ? (AGE_TARGETS[tableMode]?.[r.code] || 0) : 0;
                const ageTargetPercent = ageTarget > 0
                  ? Math.round((r.earned / ageTarget) * 100)
                  : (r.earned > 0 ? 100 : 0);

                return (
                  <tr key={r.code} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 sm:px-4">
                      <div className="font-bold text-slate-900">{r.name}</div>
                      <div className="text-[10px] text-slate-400">{r.name_en}</div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-black text-slate-900">
                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-800 inline-flex items-center justify-center font-black text-xs">
                        {r.code}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center text-slate-500 font-semibold">{r.total}</td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-slate-800">{r.earned}</td>
                    <td className="py-3 px-3 sm:px-4 text-center text-rose-600 font-semibold">{unachieved}</td>
                    <td className="py-3 px-3 sm:px-4 text-right font-black text-sky-700">{r.percentage}%</td>

                    {tableMode === 'overview' ? (
                      <>
                        <td className="py-3 px-3 sm:px-4 text-right font-semibold text-slate-700">
                          {devAge.years}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right font-semibold text-slate-500">
                          {devAge.months}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-3 sm:px-4 text-center font-bold bg-sky-50/50 text-slate-800">
                          {ageTarget}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right font-black bg-sky-50/50">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            ageTargetPercent >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : ageTargetPercent >= 50
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-slate-100 text-slate-700'
                          }`}>
                            {ageTargetPercent}%
                          </span>
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right font-semibold text-slate-700">
                          {devAge.years}
                        </td>
                      </>
                    )}

                    <td className="py-3 px-3 sm:px-4 text-center">
                      <button
                        onClick={() => onNavigateToSkill(r.skills[0]?.code || '', r.code)}
                        className="px-2.5 py-1 rounded-lg font-bold text-xs text-sky-600 hover:bg-sky-50 border border-sky-200 transition-colors inline-flex items-center gap-1"
                      >
                        <span>Chấm điểm</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Total Summary Row (Chuẩn mẫu Row 91 trong Excel) */}
              {(() => {
                const totalUnachieved = Math.max(0, totalMax - totalEarned);
                const totalDevAge = calculateDevelopmentalAge(totalMax > 0 ? totalEarned / totalMax : 0);
                const currentAgeTargetSum = typeof tableMode === 'number'
                  ? Object.values(AGE_TARGETS[tableMode] || {}).reduce((a, b) => a + b, 0)
                  : 0;
                const currentAgePercentSum = currentAgeTargetSum > 0
                  ? Math.round((totalEarned / currentAgeTargetSum) * 100)
                  : 0;

                return (
                  <tr className="bg-slate-100/90 font-black text-slate-900 border-t-2 border-slate-300">
                    <td className="py-3 px-3 sm:px-4">
                      TỔNG CỘNG ({totalMax} MỤC TIÊU)
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center">ALL</td>
                    <td className="py-3 px-3 sm:px-4 text-center">{totalMax}</td>
                    <td className="py-3 px-3 sm:px-4 text-center text-sky-700">{totalEarned}</td>
                    <td className="py-3 px-3 sm:px-4 text-center text-rose-700">{totalUnachieved}</td>
                    <td className="py-3 px-3 sm:px-4 text-right text-sky-800">{totalPercent}%</td>

                    {tableMode === 'overview' ? (
                      <>
                        <td className="py-3 px-3 sm:px-4 text-right font-bold text-slate-800">
                          {totalDevAge.years}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right font-bold text-slate-600">
                          {totalDevAge.months}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-3 sm:px-4 text-center font-black bg-sky-100/50 text-slate-900">
                          {currentAgeTargetSum}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right font-black bg-sky-100/50 text-sky-800">
                          {currentAgePercentSum}%
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right font-bold text-slate-800">
                          {totalDevAge.years}
                        </td>
                      </>
                    )}

                    <td className="py-3 px-3 sm:px-4 text-center text-slate-400">-</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
