import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ArrowLeft,
  Calendar,
  GraduationCap,
  Sparkles,
  LayoutGrid,
  BarChart3,
  FileText,
  FileDown,
  Edit2,
  Trash2,
  Phone,
  Send,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  UserCheck,
  Shield,
  FileSpreadsheet,
  FileUp
} from 'lucide-react';
import { ExcelImportModal } from '../components/ExcelImportModal';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [student, setStudent] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Export/Import states
  const [exportRound, setExportRound] = useState<number>(1);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingXlsm, setDownloadingXlsm] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Edit/Request modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<'update' | 'delete'>('update');

  // Form states
  const [formFullName, setFormFullName] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formGender, setFormGender] = useState<'male' | 'female'>('male');
  const [formDiagnosis, setFormDiagnosis] = useState('');
  const [formClass, setFormClass] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formReason, setFormReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStudentData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ student: any; sessions: any[] }>(`/students/${id}`);
      setStudent(res.student);
      setSessions(res.sessions || []);

      // Pre-fill form
      setFormFullName(res.student.full_name || res.student.fullName || '');
      setFormNickname(res.student.nickname || '');
      setFormDob(res.student.dob || '');
      setFormGender(res.student.gender || 'male');
      setFormDiagnosis(res.student.diagnosis || '');
      setFormClass(res.student.current_class || res.student.currentClass || '');
      setFormParentName(res.student.parent_name || res.student.parentName || '');
      setFormParentPhone(res.student.parent_phone || res.student.parentPhone || '');
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin học sinh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const calculateAge = (dobString: string) => {
    if (!dobString) return '';
    const birth = new Date(dobString);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years} tuổi ${months > 0 ? `${months} tháng` : ''}`;
  };

  // Direct Admin update
  const handleAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSubmitting(true);
      await api.put(`/students/${id}`, {
        fullName: formFullName.trim(),
        nickname: formNickname.trim(),
        dob: formDob,
        gender: formGender,
        diagnosis: formDiagnosis.trim(),
        currentClass: formClass.trim(),
        parentName: formParentName.trim(),
        parentPhone: formParentPhone.trim()
      });

      setDownloadNotice('Cập nhật thông tin học sinh thành công!');
      setIsEditModalOpen(false);
      fetchStudentData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật học sinh');
    } finally {
      setSubmitting(false);
    }
  };

  // Normal User Request update / delete
  const handleUserRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSubmitting(true);
      await api.post('/requests', {
        studentId: id,
        requestType,
        reason: formReason.trim() || (requestType === 'update' ? 'Đề xuất cập nhật thông tin học sinh' : 'Đề xuất xóa học sinh khỏi danh sách'),
        payload: requestType === 'update' ? {
          fullName: formFullName.trim(),
          nickname: formNickname.trim(),
          dob: formDob,
          gender: formGender,
          diagnosis: formDiagnosis.trim(),
          currentClass: formClass.trim(),
          parentName: formParentName.trim(),
          parentPhone: formParentPhone.trim()
        } : {}
      });

      setDownloadNotice('Đã gửi yêu cầu thành công tới Quản trị viên!');
      setIsRequestModalOpen(false);
      setFormReason('');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  // Direct Admin delete
  const handleAdminDelete = async () => {
    if (!id || !student) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa học sinh "${student.full_name}"? Mọi dữ liệu đánh giá ABLLS sẽ bị xóa vĩnh viễn.`)) {
      return;
    }

    try {
      await api.delete(`/students/${id}`);
      navigate('/students');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa học sinh');
    }
  };

  // Export DOCX
  const handleExportDocx = async () => {
    if (!id) return;
    try {
      setDownloadingDocx(true);
      setDownloadNotice('Đang tổng hợp dữ liệu và tạo tệp Word (.docx)...');
      await api.downloadFile(`/reports/docx/${id}?round=${exportRound}`, `BaoCao_ABLLS_${student?.full_name || id}_Dot${exportRound}.docx`);
      setDownloadNotice('Tải tệp Word thành công!');
    } catch (err: any) {
      alert('Không thể xuất tệp Word: ' + (err.message || 'Lỗi server'));
    } finally {
      setDownloadingDocx(false);
    }
  };

  // Export XLSM
  const handleExportXlsm = async () => {
    if (!id) return;
    try {
      setDownloadingXlsm(true);
      setDownloadNotice('Đang tổng hợp dữ liệu và tạo tệp Excel Macro (.xlsm)...');
      await api.downloadFile(`/reports/xlsm/${id}`, `ABLLS_DanhGia_${student?.full_name || id}.xlsm`);
      setDownloadNotice('Tải tệp Excel .xlsm bảo lưu 100% macro thành công!');
    } catch (err: any) {
      alert('Không thể xuất tệp Excel: ' + (err.message || 'Lỗi server'));
    } finally {
      setDownloadingXlsm(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-slate-500 font-medium text-sm">Đang tải thông tin hồ sơ học sinh...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Không tìm thấy học sinh</h2>
        <p className="text-sm text-slate-500">{error || 'Học sinh không tồn tại hoặc bạn không có quyền truy cập.'}</p>
        <Link
          to="/students"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  const ageText = calculateAge(student.dob);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/students')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 py-1.5 px-3 rounded-xl hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách học sinh
        </button>

        {/* Quick round selector for export */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span>Học sinh ID:</span>
          <code className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-2xs">
            {student.id}
          </code>
        </div>
      </div>

      {/* Student Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-inner shrink-0 ${
                student.gender === 'female'
                  ? 'bg-rose-50 text-rose-600 border-2 border-rose-200'
                  : 'bg-sky-50 text-sky-600 border-2 border-sky-200'
              }`}
            >
              {student.full_name?.split(' ').slice(-1)[0]?.substring(0, 2).toUpperCase() || 'TR'}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900">
                  {student.full_name}
                </h1>
                {student.nickname && (
                  <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 text-xs font-bold rounded-lg">
                    {student.nickname}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Sinh ngày: <strong>{student.dob}</strong> ({ageText})
                </span>
                <span>•</span>
                <span className="capitalize font-medium">
                  Giới tính: <strong>{student.gender === 'female' ? 'Nữ' : 'Nam'}</strong>
                </span>
                {student.current_class && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      Lớp: <strong>{student.current_class}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors"
            >
              <FileUp className="w-3.5 h-3.5 text-emerald-600" />
              Nhập Đánh Giá Excel
            </button>

            {isAdmin ? (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Chỉnh Sửa
                </button>
                <button
                  onClick={handleAdminDelete}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setRequestType('update');
                    setIsRequestModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gửi Yêu Cầu Sửa
                </button>
                <button
                  onClick={() => {
                    setRequestType('delete');
                    setIsRequestModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gửi Yêu Cầu Xóa
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notice Alert */}
      {downloadNotice && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs sm:text-sm text-sky-900 flex items-center justify-between">
          <span>{downloadNotice}</span>
          <button
            onClick={() => setDownloadNotice(null)}
            className="text-xs font-bold underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Quick Evaluation Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => navigate(`/students/${id}/scoring`)}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-sky-500 hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 group-hover:text-sky-600 transition-colors">
            Chấm Điểm ABLLS
          </h3>
          <p className="text-2xs text-slate-400 mt-0.5">Đánh giá 544 kỹ năng theo 4 đợt</p>
        </button>

        <button
          onClick={() => navigate(`/students/${id}/grid`)}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-500 hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">
            Lưới Biểu Đồ
          </h3>
          <p className="text-2xs text-slate-400 mt-0.5">Theo dõi ma trận 25 lĩnh vực</p>
        </button>

        <button
          onClick={() => navigate(`/students/${id}/analytics`)}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 group-hover:text-emerald-600 transition-colors">
            Thống Kê Mốc Tuổi
          </h3>
          <p className="text-2xs text-slate-400 mt-0.5">So sánh mốc chuẩn 2-5 tuổi</p>
        </button>

        <button
          onClick={() => navigate(`/students/${id}/iep`)}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-500 hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 group-hover:text-amber-600 transition-colors">
            Kế Hoạch IEP
          </h3>
          <p className="text-2xs text-slate-400 mt-0.5">Mục tiêu ưu tiên & Chiến lược</p>
        </button>
      </div>

      {/* Dual Report Generation Center */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-sky-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-2xs font-bold uppercase tracking-wider text-sky-300">
              <FileDown className="w-3.5 h-3.5" />
              Trung Tâm Xuất Báo Cáo Chuẩn Hóa
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Xuất Báo Cáo Đánh Giá & Dữ Liệu ABLLS-R
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tải xuống hồ sơ báo cáo định dạng <strong>Word (.docx)</strong> hoàn chỉnh theo biểu mẫu hoặc tệp <strong>Excel Macro (.xlsm)</strong> bảo lưu 100% macro VBA, bảng màu và biểu đồ nguyên bản.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Word Export Controls */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/15">
              <select
                value={exportRound}
                onChange={(e) => setExportRound(Number(e.target.value))}
                className="bg-transparent text-white text-xs font-bold px-2 py-2 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value={1} className="text-slate-900">Đợt 1 (Ban đầu)</option>
                <option value={2} className="text-slate-900">Đợt 2 (3 tháng)</option>
                <option value={3} className="text-slate-900">Đợt 3 (6 tháng)</option>
                <option value={4} className="text-slate-900">Đợt 4 (12 tháng)</option>
              </select>

              <button
                onClick={handleExportDocx}
                disabled={downloadingDocx}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-sky-500/30"
              >
                <FileText className="w-4 h-4" />
                {downloadingDocx ? 'Đang tạo...' : 'Xuất Word (.docx)'}
              </button>
            </div>

            {/* Excel Export Button */}
            <button
              onClick={handleExportXlsm}
              disabled={downloadingXlsm}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/30"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {downloadingXlsm ? 'Đang tạo Excel...' : 'Xuất Excel (.xlsm)'}
            </button>

            {/* Excel Import Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all border border-white/20 backdrop-blur-md shadow-md"
            >
              <FileUp className="w-4 h-4 text-emerald-300" />
              Nhập Excel (.xlsm)
            </button>
          </div>
        </div>
      </div>

      {/* Student Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 space-y-6">
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-sky-600" />
            Thông Tin Chi Tiết Hồ Sơ
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-semibold block mb-1">Chẩn đoán y khoa</span>
              <p className="font-bold text-slate-800 text-sm">{student.diagnosis || 'Chưa cập nhật'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-semibold block mb-1">Lớp / Nhóm Can Thiệp</span>
              <p className="font-bold text-slate-800 text-sm">{student.current_class || 'Chưa phân lớp'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-semibold block mb-1">Họ tên phụ huynh</span>
              <p className="font-bold text-slate-800 text-sm">{student.parent_name || 'Chưa cập nhật'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-semibold block mb-1">Số điện thoại liên hệ</span>
              <p className="font-bold text-slate-800 text-sm">{student.parent_phone || 'Chưa cập nhật'}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
              Lịch Sử Các Đợt Đánh Giá ({sessions.length}/4 Đợt)
            </h4>

            {sessions.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Chưa có phiên đánh giá nào được lưu.</p>
            ) : (
              <div className="space-y-2.5">
                {sessions.map((sess) => {
                  const scoredCount = Object.keys(sess.scores || {}).length;
                  return (
                    <div
                      key={sess.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-bold rounded-md text-2xs">
                            Đợt {sess.round_number}
                          </span>
                          <span className="font-bold text-slate-800">
                            Ngày: {sess.assessment_date}
                          </span>
                        </div>
                        <p className="text-slate-500 text-2xs mt-0.5">
                          Người đánh giá: {sess.assessor_name} • Đã chấm {scoredCount} kỹ năng
                        </p>
                      </div>

                      <button
                        onClick={() => navigate(`/students/${id}/scoring`)}
                        className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
                      >
                        Mở đánh giá
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-5">
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            Quyền Hạn & Giáo Viên
          </h3>

          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-2">
            <p className="font-bold">
              {isAdmin ? 'Quản Trị Viên Hệ Thống' : 'Giáo Viên Phụ Trách'}
            </p>
            <p className="text-slate-600 leading-relaxed">
              {isAdmin
                ? 'Bạn có toàn quyền thêm, sửa, xóa học sinh này và phân công cho giáo viên khác.'
                : 'Bạn có quyền chấm điểm trực tiếp 544 kỹ năng và cập nhật mục tiêu IEP. Các thay đổi về thông tin cá nhân cần gửi yêu cầu phê duyệt.'}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h4 className="font-bold text-xs text-slate-700">Mã định danh</h4>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-600 break-all">
              {student.id}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Direct Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Chỉnh Sửa Hồ Sơ Học Sinh (Quản trị viên)
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminUpdate} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Biệt danh</label>
                  <input
                    type="text"
                    value={formNickname}
                    onChange={(e) => setFormNickname(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lớp can thiệp</label>
                  <input
                    type="text"
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh *</label>
                  <input
                    type="date"
                    required
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chẩn đoán</label>
                <input
                  type="text"
                  value={formDiagnosis}
                  onChange={(e) => setFormDiagnosis(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ tên phụ huynh</label>
                  <input
                    type="text"
                    value={formParentName}
                    onChange={(e) => setFormParentName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formParentPhone}
                    onChange={(e) => setFormParentPhone(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md shadow-sky-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Gửi Yêu Cầu {requestType === 'update' ? 'Chỉnh Sửa' : 'Xóa'} Học Sinh
              </h3>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUserRequest} className="space-y-4 pt-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                Yêu cầu của bạn sẽ được gửi tới Quản trị viên để xét duyệt.
              </div>

              {requestType === 'update' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên</label>
                    <input
                      type="text"
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Biệt danh</label>
                      <input
                        type="text"
                        value={formNickname}
                        onChange={(e) => setFormNickname(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Lớp can thiệp</label>
                      <input
                        type="text"
                        value={formClass}
                        onChange={(e) => setFormClass(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh</label>
                      <input
                        type="date"
                        value={formDob}
                        onChange={(e) => setFormDob(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính</label>
                      <select
                        value={formGender}
                        onChange={(e) => setFormGender(e.target.value as any)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Chẩn đoán</label>
                    <input
                      type="text"
                      value={formDiagnosis}
                      onChange={(e) => setFormDiagnosis(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lý do gửi yêu cầu *</label>
                <textarea
                  required
                  rows={3}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Ghi rõ lý do tại sao cần sửa/xóa học sinh này..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Assessment Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        targetStudent={student}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchStudentData();
          setDownloadNotice('Đã đồng bộ thành công dữ liệu đánh giá từ file Excel!');
        }}
      />
    </div>
  );
};
