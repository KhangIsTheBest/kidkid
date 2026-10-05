import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Student } from '../types/assessment';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  User,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  HelpCircle
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStudent?: Student | null;
  onSuccess: (studentId: string) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  targetStudent,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(targetStudent?.id || 'auto');
  const [createIfNotFound, setCreateIfNotFound] = useState(true);

  // Parsing states
  const [analyzing, setAnalyzing] = useState(false);
  const [parseResult, setParseResult] = useState<any | null>(null);
  const [selectedRounds, setSelectedRounds] = useState<number[]>([1, 2, 3, 4]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Syncing states
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Load all students for the dropdown
      api.get<any[]>('/students')
        .then(res => {
          const mapped: Student[] = res.map(s => ({
            id: s.id,
            fullName: s.full_name || s.fullName,
            nickname: s.nickname || '',
            dob: s.dob,
            gender: s.gender,
            currentClass: s.current_class || s.currentClass
          }));
          setStudents(mapped);
        })
        .catch(console.error);

      if (targetStudent) {
        setSelectedStudentId(targetStudent.id);
      } else {
        setSelectedStudentId('auto');
      }
      resetState();
    }
  }, [isOpen, targetStudent]);

  const resetState = () => {
    setFile(null);
    setFileBase64(null);
    setParseResult(null);
    setErrorMsg(null);
    setImportSuccess(null);
    setSelectedRounds([1, 2, 3, 4]);
  };

  if (!isOpen) return null;

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsm' && ext !== 'xlsx') {
      setErrorMsg('Vui lòng chọn tệp Excel có định dạng .xlsm hoặc .xlsx!');
      return;
    }

    setFile(selectedFile);
    setErrorMsg(null);
    setParseResult(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setFileBase64(base64);

      // Auto-analyze file preview
      analyzeFile(base64, selectedFile.name);
    };
    reader.readAsDataURL(selectedFile);
  };

  const analyzeFile = async (base64: string, fileName: string) => {
    try {
      setAnalyzing(true);
      setErrorMsg(null);
      const res = await api.post<{ success: boolean; parsed: any; matchedStudent: any }>('/students/parse-excel', {
        fileBase64: base64,
        fileName
      });

      setParseResult(res.parsed);

      // Auto-select matched student if currently 'auto' and no student was locked
      if ((!targetStudent || selectedStudentId === 'auto') && res.matchedStudent) {
        setSelectedStudentId(res.matchedStudent.id);
      }

      // Check which rounds have scored items
      const roundsWithScores = (res.parsed.rounds || [])
        .filter((r: any) => r.totalSkillsScored > 0)
        .map((r: any) => r.roundNumber);

      if (roundsWithScores.length > 0) {
        setSelectedRounds(roundsWithScores);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Không thể đọc nội dung file Excel');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleToggleRound = (roundNumber: number) => {
    if (selectedRounds.includes(roundNumber)) {
      setSelectedRounds(selectedRounds.filter(r => r !== roundNumber));
    } else {
      setSelectedRounds([...selectedRounds, roundNumber].sort());
    }
  };

  const handleExecuteImport = async () => {
    if (!fileBase64 && !parseResult) {
      setErrorMsg('Vui lòng chọn tệp Excel trước khi đồng bộ!');
      return;
    }

    if (selectedRounds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một đợt đánh giá để đồng bộ!');
      return;
    }

    try {
      setImporting(true);
      setErrorMsg(null);

      const res = await api.post<any>('/students/import-excel', {
        studentId: selectedStudentId,
        parsedData: parseResult,
        fileBase64,
        fileName: file?.name || 'import.xlsm',
        createIfNotFound,
        roundsToImport: selectedRounds
      });

      setImportSuccess(res.message);

      setTimeout(() => {
        onSuccess(res.studentId);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Lỗi khi nhập dữ liệu đánh giá từ Excel');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Nhập Đánh Giá Từ File Excel (.xlsm)
              </h3>
              <p className="text-2xs sm:text-xs text-slate-500">
                Tự động đồng bộ điểm số 25 lĩnh vực, mốc 4 đợt và ghi chú từ file Excel lên web
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {importSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-bold">{importSuccess}</span>
          </div>
        )}

        {/* File Dropzone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            1. Chọn hoặc kéo thả tệp Excel đánh giá:
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              file
                ? 'border-emerald-400 bg-emerald-50/40 hover:bg-emerald-50/70'
                : 'border-slate-300 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsm,.xlsx"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileCheck className="w-10 h-10 text-emerald-600" />
                <div>
                  <p className="font-bold text-xs sm:text-sm text-slate-900">{file.name}</p>
                  <p className="text-2xs text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB • Nhấn để chọn file khác
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-slate-400" />
                <p className="font-bold text-xs sm:text-sm text-slate-700">
                  Nhấp để tải lên hoặc kéo thả tệp Excel vào đây
                </p>
                <p className="text-2xs text-slate-400">
                  Hỗ trợ định dạng chuẩn <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">.xlsm</code> (Macro) hoặc <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">.xlsx</code>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Target Student Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            2. Học sinh mục tiêu tiếp nhận dữ liệu:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="auto">Tự động nhận diện theo tên trong file Excel</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName || s.full_name} {s.nickname ? `(${s.nickname})` : ''}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={createIfNotFound}
                onChange={(e) => setCreateIfNotFound(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-2xs">Tự động tạo học sinh mới nếu chưa có</span>
            </label>
          </div>
        </div>

        {/* Analyzing Spinner */}
        {analyzing && (
          <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 text-center space-y-1">
            <div className="animate-spin w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-xs font-bold text-sky-800">Đang phân tích ma trận dữ liệu Excel...</p>
          </div>
        )}

        {/* Parse Preview */}
        {parseResult && !analyzing && (
          <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800">
                  Dữ Liệu Nhận Diện Từ Tệp Excel:
                </span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-2xs">
                {parseResult.student?.fullName || 'Không rõ tên'}
                {parseResult.student?.nickname ? ` (${parseResult.student.nickname})` : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-2xs">
              <div className="p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-slate-400 block">Ngày sinh</span>
                <strong className="text-slate-800">{parseResult.student?.dob || 'Chưa có'}</strong>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-slate-400 block">Ghi chú chuyên môn</span>
                <strong className="text-slate-800">
                  {Object.keys(parseResult.rounds[0]?.notes || {}).length} nhận xét
                </strong>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block">Trạng thái nhận diện</span>
                <strong className="text-emerald-700">Đã đọc ma trận 25 lĩnh vực</strong>
              </div>
            </div>

            {/* Rounds Selector Pills */}
            <div className="space-y-1.5 pt-1">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                Chọn các đợt đánh giá cần đồng bộ vào web:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(parseResult.rounds || []).map((r: any) => {
                  const isChecked = selectedRounds.includes(r.roundNumber);
                  return (
                    <div
                      key={r.roundNumber}
                      onClick={() => handleToggleRound(r.roundNumber)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">Đợt {r.roundNumber}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-emerald-600 pointer-events-none"
                        />
                      </div>
                      <p className="text-2xs font-semibold">
                        {r.totalSkillsScored} kỹ năng ({r.totalPoints} đ)
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {r.assessmentDate || 'Ngày hiện tại'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={importing || !parseResult || selectedRounds.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Đang đồng bộ dữ liệu...' : 'Xác Nhận Đồng Bộ Lên Web'}
          </button>
        </div>
      </div>
    </div>
  );
};
