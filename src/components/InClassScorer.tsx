import React, { useState, useMemo } from 'react';
import { AssessmentSession } from '../types/assessment';
import { abllsData, ROUND_COLORS, AGE_TARGETS } from '../utils/storage';
import { Search, Filter, CheckCircle2, AlertCircle, Clock, Check, MessageSquare } from 'lucide-react';

interface InClassScorerProps {
  session: AssessmentSession;
  onUpdateScore: (skillCode: string, score: number) => void;
  onUpdateNote: (skillCode: string, note: string) => void;
  initialRepCode?: string;
  targetSkillCode?: string;
}

export const InClassScorer: React.FC<InClassScorerProps> = ({
  session,
  onUpdateScore,
  onUpdateNote,
  initialRepCode = 'A',
  targetSkillCode
}) => {
  const [selectedAge, setSelectedAge] = useState<number | 'all'>('all');
  const [selectedRepCode, setSelectedRepCode] = useState<string>(initialRepCode);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scored' | 'unscored'>('all');

  // React to initialRepCode or targetSkillCode updates from outside (e.g. navigation from Grid tab)
  React.useEffect(() => {
    if (initialRepCode && initialRepCode !== selectedRepCode) {
      setSelectedRepCode(initialRepCode);
    }
  }, [initialRepCode]);

  React.useEffect(() => {
    if (targetSkillCode) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`skill-${targetSkillCode}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [targetSkillCode, selectedRepCode]);

  // YÊU CẦU 1: Khi chuyển từ lĩnh vực này sang lĩnh vực khác, scroll lại đầu trang
  const handleSelectRepertoire = (repCode: string) => {
    setSelectedRepCode(repCode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter skills based on Repertoire, Age, Search, and Status
  const filteredSkills = useMemo(() => {
    return abllsData.skills.filter(s => {
      // Repertoire filter
      if (selectedRepCode !== 'all' && s.repertoire_code !== selectedRepCode) {
        return false;
      }
      // Age filter
      if (selectedAge !== 'all' && !s.ages.includes(selectedAge)) {
        return false;
      }
      // Status filter
      const isScored = (session.scores[s.code] || 0) > 0;
      if (statusFilter === 'scored' && !isScored) return false;
      if (statusFilter === 'unscored' && isScored) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchCode = s.code.toLowerCase().includes(query);
        const matchTitle = s.title.toLowerCase().includes(query);
        const matchQuestion = s.question.toLowerCase().includes(query);
        const matchObjective = s.objective.toLowerCase().includes(query);
        return matchCode || matchTitle || matchQuestion || matchObjective;
      }
      return true;
    });
  }, [selectedRepCode, selectedAge, statusFilter, searchQuery, session.scores]);

  // Calculate current repertoire stats based on selected age milestone
  const activeRep = abllsData.repertoires.find(r => r.code === selectedRepCode);
  
  const currentRepSkills = useMemo(() => {
    return abllsData.skills.filter(s => {
      if (s.repertoire_code !== selectedRepCode) return false;
      if (selectedAge !== 'all' && !s.ages.includes(selectedAge)) return false;
      return true;
    });
  }, [selectedRepCode, selectedAge]);

  const repPointsEarned = useMemo(() => {
    return currentRepSkills.reduce((acc, s) => acc + (session.scores[s.code] || 0), 0);
  }, [currentRepSkills, session.scores]);

  const repPointsTarget = useMemo(() => {
    if (!activeRep) return 0;
    if (selectedAge === 'all') return activeRep.total_points;
    return AGE_TARGETS[selectedAge]?.[activeRep.code] ?? activeRep.total_points;
  }, [activeRep, selectedAge]);

  const repScoredCount = useMemo(() => {
    return currentRepSkills.filter(s => (session.scores[s.code] || 0) > 0).length;
  }, [currentRepSkills, session.scores]);

  const repPercent = repPointsTarget > 0 
    ? Math.round((repPointsEarned / repPointsTarget) * 100) 
    : (repPointsEarned > 0 ? 100 : 0);

  // Active round config
  const currentRoundConfig = ROUND_COLORS[session.roundNumber] || ROUND_COLORS[1];

  return (
    <div className="pb-28 md:pb-12">
      {/* STICKY FILTER & 25 REPERTOIRES BAR */}
      <div className="sticky top-14 md:top-[105px] z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 space-y-2">
          {/* Top row: Age pills, Quick Search & Round Color Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Age Filter horizontal slider */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              <span className="hidden sm:inline-flex text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 items-center gap-1">
                <Filter className="w-3 h-3" />
                Tuổi:
              </span>
              <button
                onClick={() => setSelectedAge('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedAge === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({abllsData.total_skills})
              </button>
              {[2, 3, 4, 5].map(age => (
                <button
                  key={age}
                  onClick={() => setSelectedAge(age)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    selectedAge === age
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {age}T
                </button>
              ))}
            </div>

            {/* Quick Round Colors Legend & Active Round Indicator */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">
                <span className="font-semibold text-slate-500">Mã màu:</span>
                {[1, 2, 3, 4].map(rnd => (
                  <span
                    key={rnd}
                    style={{ backgroundColor: ROUND_COLORS[rnd].bg }}
                    className="px-1.5 py-0.2 rounded text-[10px] font-black text-black border border-black/10"
                    title={ROUND_COLORS[rnd].name}
                  >
                    Đ{rnd}
                  </span>
                ))}
              </div>

              {/* Current Active Round Badge */}
              <div
                style={{ backgroundColor: currentRoundConfig.bg, borderColor: currentRoundConfig.border }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-black text-black shadow-xs"
                title={`Khi chấm hoặc sửa điểm sẽ lưu theo màu của Đợt ${session.roundNumber}`}
              >
                <span>Đang chấm: Đợt {session.roundNumber}</span>
              </div>

              {/* Quick Search */}
              <div className="relative w-32 sm:w-48 flex-shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Tìm mã (A1...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Bottom row: 25 Repertoires Slider */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {abllsData.repertoires.map(rep => {
              const skillsInRep = abllsData.skills.filter(s => {
                if (s.repertoire_code !== rep.code) return false;
                if (selectedAge !== 'all' && !s.ages.includes(selectedAge)) return false;
                return true;
              });
              const earned = skillsInRep.reduce((sum, s) => sum + (session.scores[s.code] || 0), 0);
              const target = selectedAge === 'all'
                ? rep.total_points
                : (AGE_TARGETS[selectedAge]?.[rep.code] ?? rep.total_points);
              const isSelected = selectedRepCode === rep.code;

              return (
                <button
                  key={rep.code}
                  onClick={() => handleSelectRepertoire(rep.code)}
                  className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-sky-50 border-sky-500 shadow-xs ring-1 ring-sky-500'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-md text-[11px] font-black flex items-center justify-center ${
                      isSelected ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {rep.code}
                    </span>
                    <span className="text-xs font-bold text-slate-800 whitespace-nowrap max-w-[85px] sm:max-w-[120px] truncate">
                      {rep.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {earned}/{target}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4">
        {/* Active Repertoire Info Banner */}
        {activeRep && (
          <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-800 rounded-2xl text-white p-4 sm:p-5 mb-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] sm:text-xs font-black uppercase tracking-wide">
                    Lĩnh vực {activeRep.code}
                  </span>
                  {selectedAge !== 'all' && (
                    <span className="px-2 py-0.5 rounded bg-sky-400/30 text-[10px] sm:text-xs font-bold text-sky-100 border border-sky-400/30">
                      Mốc {selectedAge} tuổi
                    </span>
                  )}
                  <span className="text-xs text-sky-200 hidden sm:inline">{activeRep.name_en}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold">{activeRep.name}</h2>
                <p className="text-[11px] sm:text-xs text-sky-100 mt-0.5">
                  {selectedAge === 'all'
                    ? `Gồm ${activeRep.skills_count} bài đánh giá | Thang điểm tối đa: ${activeRep.total_points} điểm`
                    : `Mốc ${selectedAge} tuổi: Gồm ${currentRepSkills.length} bài đánh giá | Điểm mục tiêu: ${repPointsTarget} điểm`}
                </p>
              </div>

              {/* Score summary metrics */}
              <div className="flex items-center gap-3 sm:gap-4 bg-white/10 backdrop-blur-md px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl border border-white/20">
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-black">{repPointsEarned}/{repPointsTarget}</div>
                  <div className="text-[9px] sm:text-[10px] text-sky-200 uppercase font-bold">
                    {selectedAge === 'all' ? 'Điểm đạt' : `Điểm đạt (${selectedAge}T)`}
                  </div>
                </div>
                <div className="w-px h-6 sm:h-8 bg-white/20" />
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-black">{repPercent}%</div>
                  <div className="text-[9px] sm:text-[10px] text-sky-200 uppercase font-bold">
                    {selectedAge === 'all' ? 'Hoàn thành' : `Mục tiêu ${selectedAge}T`}
                  </div>
                </div>
                <div className="w-px h-6 sm:h-8 bg-white/20" />
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-black">{repScoredCount}/{currentRepSkills.length}</div>
                  <div className="text-[9px] sm:text-[10px] text-sky-200 uppercase font-bold">
                    {selectedAge === 'all' ? 'Đã chấm' : `Đã chấm (${selectedAge}T)`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase hidden sm:inline">Trạng thái:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Tất cả ({filteredSkills.length})
            </button>
            <button
              onClick={() => setStatusFilter('scored')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'scored' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Đã chấm
            </button>
            <button
              onClick={() => setStatusFilter('unscored')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'unscored' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Chưa chấm
            </button>
          </div>
        </div>

        {/* Skill Cards List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredSkills.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-slate-400" />
              <p className="font-bold text-sm sm:text-base">Không tìm thấy bài đánh giá nào</p>
              <p className="text-xs text-slate-400 mt-1">Hãy thử xóa từ khóa tìm kiếm hoặc chọn mốc tuổi khác.</p>
            </div>
          ) : (
            filteredSkills.map(skill => {
              const currentScore = session.scores[skill.code];
              const currentNote = session.notes[skill.code] || '';
              const isScored = currentScore !== undefined && currentScore > 0;
              const skillLevels = session.skillRounds?.[skill.code] || {};

              // Find maximum round attained for this skill (chuẩn mod_SyncEngine.bas: maxColorNum)
              let maxAttainedRound = 1;
              if (currentScore && currentScore > 0) {
                for (let lvl = 1; lvl <= currentScore; lvl++) {
                  const r = skillLevels[lvl] || 1;
                  if (r > maxAttainedRound) maxAttainedRound = r;
                }
              }
              const maxRoundConfig = ROUND_COLORS[maxAttainedRound] || ROUND_COLORS[1];

              const isTargeted = targetSkillCode === skill.code;

              return (
                <div
                  key={skill.code}
                  id={`skill-${skill.code}`}
                  className={`bg-white rounded-2xl border transition-all p-3.5 sm:p-5 shadow-xs hover:shadow-sm ${
                    isTargeted
                      ? 'ring-4 ring-sky-400 border-sky-400 shadow-lg scale-[1.01]'
                      : isScored
                        ? currentScore === skill.max_score
                          ? 'border-emerald-300 ring-1 ring-emerald-300/40'
                          : 'border-amber-300 ring-1 ring-amber-300/40'
                        : 'border-slate-200'
                  }`}
                >
                  {/* Card Header: Code, Title, Ages */}
                  <div className="flex items-start justify-between gap-2.5 mb-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-900 text-white font-black text-sm sm:text-base flex items-center justify-center shadow-xs flex-shrink-0 mt-0.5">
                        {skill.code}
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                          {skill.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[11px] text-slate-500 font-medium">
                            Thang 0 - {skill.max_score} điểm
                          </span>
                          {skill.ages.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-300">•</span>
                              {skill.ages.map(a => (
                                <span key={a} className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                  {a}T
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Scored badge với màu đợt đánh giá đạt được */}
                    <div className="flex-shrink-0">
                      {isScored ? (
                        <span
                          style={
                            currentScore > 0
                              ? { backgroundColor: maxRoundConfig.bg, borderColor: maxRoundConfig.border, color: '#000000' }
                              : {}
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-black border shadow-2xs ${
                            currentScore === 0 ? 'bg-slate-100 text-slate-700 border-slate-200' : ''
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {currentScore}/{skill.max_score}đ {currentScore > 0 && `(Đ${maxAttainedRound})`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-slate-100 text-slate-500">
                          <Clock className="w-3 h-3" /> Chưa chấm
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question, Objective, Example */}
                  <div className="bg-slate-50/80 rounded-xl p-2.5 sm:p-3.5 text-xs text-slate-700 space-y-1 mb-3 border border-slate-100">
                    {skill.question && (
                      <div>
                        <strong className="text-sky-800 font-bold">Câu hỏi: </strong>
                        <span className="font-medium">{skill.question}</span>
                      </div>
                    )}
                    {skill.objective && (
                      <div className="hidden sm:block">
                        <strong className="text-slate-800 font-bold">Mục tiêu: </strong>
                        <span>{skill.objective}</span>
                      </div>
                    )}
                    {skill.example && (
                      <div className="text-slate-500 italic">
                        <strong>VD: </strong>
                        <span>{skill.example}</span>
                      </div>
                    )}
                  </div>

                  {/* NÚT CHẤM ĐIỂM: 1..max_score (Bỏ nút 0 điểm, chạm lại điểm đang chọn để hủy chấm) */}
                  <div className="mb-3">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Chấm điểm trực tiếp:</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Chạm lại điểm đang chọn để hủy
                      </span>
                    </div>
                    <div className={`grid ${
                      skill.max_score === 1
                        ? 'grid-cols-1'
                        : skill.max_score === 2
                        ? 'grid-cols-2'
                        : skill.max_score === 3
                        ? 'grid-cols-3'
                        : 'grid-cols-2 sm:grid-cols-4'
                    } gap-1.5 sm:gap-2`}>
                      {/* Scores 1 to max */}
                      {Array.from({ length: skill.max_score }, (_, i) => i + 1).map(pts => {
                        const criterion = skill.criteria.find(c => c.score === pts);
                        const isAttained = currentScore !== undefined && currentScore >= pts;
                        
                        // Round that this specific score level was attained in:
                        const attainedRound = skillLevels[pts] || session.roundNumber;
                        const roundColor = ROUND_COLORS[attainedRound] || ROUND_COLORS[1];

                        return (
                          <button
                            key={pts}
                            onClick={() => {
                              // Toggle deselect: chạm lại điểm đang chọn thì đưa về 0 (hủy chấm)
                              if (currentScore === pts) {
                                onUpdateScore(skill.code, 0);
                              } else {
                                onUpdateScore(skill.code, pts);
                              }
                            }}
                            style={
                              isAttained
                                ? {
                                    backgroundColor: roundColor.bg,
                                    borderColor: roundColor.border,
                                    color: '#000000',
                                  }
                                : {}
                            }
                            className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all active:scale-[0.98] ${
                              isAttained
                                ? 'shadow-xs ring-1 ring-black/10'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm font-black">
                                {pts} điểm
                              </span>
                              {isAttained && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[10px] font-black bg-black/15 text-black">
                                  <Check className="w-3 h-3" />
                                  Đ{attainedRound}
                                </span>
                              )}
                            </div>
                            <div className={`text-[10px] sm:text-[11px] mt-0.5 line-clamp-2 ${
                              isAttained ? 'text-black/80 font-medium' : 'text-slate-500'
                            }`}>
                              {criterion ? criterion.description : 'Đạt yêu cầu tương ứng'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Observation Note box */}
                  <div className="relative">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Ghi chú nhanh biểu hiện thực tế của trẻ..."
                      value={currentNote}
                      onChange={(e) => onUpdateNote(skill.code, e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
