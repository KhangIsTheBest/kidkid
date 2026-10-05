import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Student } from '../types/assessment';
import {
  Users,
  Search,
  Plus,
  Send,
  UserCheck,
  Calendar,
  GraduationCap,
  Sparkles,
  BarChart3,
  LayoutGrid,
  FileText,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Clock,
  Phone,
  Baby,
  FileSpreadsheet
} from 'lucide-react';
import { ExcelImportModal } from '../components/ExcelImportModal';

export const StudentsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');

  // Admin Direct Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // User Request Create Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  // Excel Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form State
  const [formFullName, setFormFullName] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formDob, setFormDob] = useState('2022-01-01');
  const [formGender, setFormGender] = useState<'male' | 'female'>('male');
  const [formDiagnosis, setFormDiagnosis] = useState('Rối loạn phổ tự kỷ (ASD)');
  const [formClass, setFormClass] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formReason, setFormReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get<any[]>('/students');
      const mapped: Student[] = res.map(s => ({
        id: s.id,
        fullName: s.full_name || s.fullName,
        nickname: s.nickname || '',
        dob: s.dob,
        gender: s.gender,
        diagnosis: s.diagnosis,
        currentClass: s.current_class || s.currentClass,
        parentName: s.parent_name || s.parentName,
        parentPhone: s.parent_phone || s.parentPhone,
        evaluatorName: s.evaluator_name || s.evaluatorName,
        evaluationDate: s.evaluation_date || s.evaluationDate,
        assignedUserIds: s.assignedUserIds || [],
        createdAt: s.created_at || s.createdAt
      }));
      setStudents(mapped);
    } catch (err: any) {
      console.error(err);
      setActionMessage({ type: 'error', text: err.message || 'Không thể tải danh sách học sinh' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

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
    return `${years} tuổi ${months > 0 ? `${months} th` : ''}`;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim()) return;

    try {
      setSubmitting(true);
      await api.post('/students', {
        fullName: formFullName.trim(),
        nickname: formNickname.trim(),
        dob: formDob,
        gender: formGender,
        diagnosis: formDiagnosis.trim(),
        currentClass: formClass.trim(),
        parentName: formParentName.trim(),
        parentPhone: formParentPhone.trim(),
        assignedUserIds: user ? [user.id] : []
      });

      setActionMessage({ type: 'success', text: `Đã thêm học sinh ${formFullName.trim()} thành công!` });
      setIsCreateModalOpen(false);
      resetForm();
      fetchStudents();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Lỗi khi tạo học sinh' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim()) return;

    try {
      setSubmitting(true);
      await api.post('/requests', {
        requestType: 'create',
        reason: formReason.trim() || 'Giáo viên gửi đề xuất thêm học sinh mới vào hệ thống',
        payload: {
          fullName: formFullName.trim(),
          nickname: formNickname.trim(),
          dob: formDob,
          gender: formGender,
          diagnosis: formDiagnosis.trim(),
          currentClass: formClass.trim(),
          parentName: formParentName.trim(),
          parentPhone: formParentPhone.trim()
        }
      });

      setActionMessage({
        type: 'success',
        text: 'Yêu cầu thêm học sinh đã được gửi đến Quản trị viên. Bạn có thể theo dõi duyệt tại trang Hồ sơ cá nhân!'
      });
      setIsRequestModalOpen(false);
      resetForm();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Lỗi khi gửi yêu cầu' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!isAdmin) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa học sinh "${name}" và toàn bộ kết quả đánh giá? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    try {
      await api.delete(`/students/${id}`);
      setActionMessage({ type: 'success', text: `Đã xóa học sinh ${name}` });
      fetchStudents();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Không thể xóa học sinh' });
    }
  };

  const resetForm = () => {
    setFormFullName('');
    setFormNickname('');
    setFormDob('2022-01-01');
    setFormGender('male');
    setFormDiagnosis('Rối loạn phổ tự kỷ (ASD)');
    setFormClass('');
    setFormParentName('');
    setFormParentPhone('');
    setFormReason('');
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nickname && s.nickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.diagnosis && s.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.currentClass && s.currentClass.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGender = filterGender === 'all' || s.gender === filterGender;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">
              Quản Lý Danh Sách Học Sinh
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {isAdmin
              ? 'Toàn quyền quản trị hồ sơ, phân quyền giáo viên và xem tiến độ đánh giá ABLLS-R'
              : 'Danh sách học sinh được phân công phụ trách. Bạn có quyền chấm điểm trực tiếp và gửi yêu cầu thay đổi'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Nhập Đánh Giá Từ Excel
          </button>

          {isAdmin ? (
            <button
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Thêm Học Sinh Mới
            </button>
          ) : (
            <button
              onClick={() => {
                resetForm();
                setIsRequestModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              Gửi Yêu Cầu Thêm Học Sinh
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs underline hover:opacity-75 font-semibold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên học sinh, tên ở nhà, chẩn đoán, lớp..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">Tất cả giới tính</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </div>
      </div>

      {/* Students List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">Đang tải danh sách học sinh...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Baby className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Chưa tìm thấy học sinh nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {students.length === 0
              ? (isAdmin
                  ? 'Hệ thống chưa có học sinh nào. Hãy nhấn "Thêm Học Sinh Mới" để bắt đầu.'
                  : 'Bạn chưa được phân công học sinh nào. Hãy liên hệ Quản trị viên hoặc gửi yêu cầu thêm học sinh mới.')
              : 'Không có học sinh nào khớp với bộ lọc tìm kiếm của bạn.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map((st) => {
            const ageText = calculateAge(st.dob);
            return (
              <div
                key={st.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-sky-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Header Card */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-xs ${
                          st.gender === 'female'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-sky-50 text-sky-600 border border-sky-200'
                        }`}
                      >
                        {st.fullName.split(' ').slice(-1)[0]?.substring(0, 2).toUpperCase() || 'TR'}
                      </div>
                      <div>
                        <h3
                          onClick={() => navigate(`/students/${st.id}`)}
                          className="font-bold text-slate-900 group-hover:text-sky-600 cursor-pointer transition-colors text-sm sm:text-base leading-snug line-clamp-1"
                        >
                          {st.fullName}
                        </h3>
                        {st.nickname && (
                          <span className="text-xs font-semibold text-slate-400">
                            Biệt danh: {st.nickname}
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteStudent(st.id, st.fullName)}
                        title="Xóa học sinh"
                        className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Attributes Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-2xs font-bold rounded-lg flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {ageText}
                    </span>
                    {st.currentClass && (
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-2xs font-bold rounded-lg flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-indigo-400" />
                        {st.currentClass}
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-1 text-2xs font-bold rounded-lg ${
                        st.gender === 'female'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-sky-50 text-sky-700'
                      }`}
                    >
                      {st.gender === 'female' ? 'Nữ' : 'Nam'}
                    </span>
                  </div>

                  {/* Diagnosis */}
                  {st.diagnosis && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                      <strong className="text-slate-700 font-semibold">Chẩn đoán:</strong> {st.diagnosis}
                    </p>
                  )}

                  {/* Parent info */}
                  {st.parentPhone && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{st.parentName ? `${st.parentName} - ` : ''}{st.parentPhone}</span>
                    </div>
                  )}
                </div>

                {/* Footer Action Links */}
                <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs">
                  <button
                    onClick={() => navigate(`/students/${st.id}`)}
                    className="font-bold text-slate-700 hover:text-sky-600 py-1.5 px-2 rounded-lg hover:bg-white transition-colors"
                  >
                    Xem Hồ Sơ
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/students/${st.id}/scoring`)}
                      title="Chấm điểm ABLLS-R"
                      className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-100 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/students/${st.id}/grid`)}
                      title="Lưới biểu đồ ABLLS-R"
                      className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/students/${st.id}/analytics`)}
                      title="Báo cáo & Thống kê mốc tuổi"
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/students/${st.id}/iep`)}
                      title="Kế hoạch can thiệp IEP & Báo cáo"
                      className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Direct Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Thêm Hồ Sơ Học Sinh Mới (Quản trị viên)
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên học sinh *
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Biệt danh / Ở nhà</label>
                  <input
                    type="text"
                    value={formNickname}
                    onChange={(e) => setFormNickname(e.target.value)}
                    placeholder="Ví dụ: Bé Bơ, Tí..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lớp / Nhóm can thiệp</label>
                  <input
                    type="text"
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    placeholder="Ví dụ: Mầm 1, Can thiệp 1-1"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
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
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chẩn đoán ban đầu
                </label>
                <input
                  type="text"
                  value={formDiagnosis}
                  onChange={(e) => setFormDiagnosis(e.target.value)}
                  placeholder="Ví dụ: Rối loạn phổ tự kỷ (ASD), Tăng động..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ tên phụ huynh</label>
                  <input
                    type="text"
                    value={formParentName}
                    onChange={(e) => setFormParentName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn Ba"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                  <input
                    type="tel"
                    value={formParentPhone}
                    onChange={(e) => setFormParentPhone(e.target.value)}
                    placeholder="Ví dụ: 0912345678"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md shadow-sky-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Thêm Học Sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Normal User Request Create Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                  <Send className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Gửi Yêu Cầu Thêm Học Sinh (Chờ Quản trị viên duyệt)
                </h3>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4 pt-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Vì bạn đang đăng nhập với tài khoản Giáo viên, yêu cầu tạo học sinh mới sẽ được gửi đến Quản trị viên phê duyệt trước khi xuất hiện chính thức trong hệ thống.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên học sinh *
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Ví dụ: Lê Bảo Minh"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Biệt danh</label>
                  <input
                    type="text"
                    value={formNickname}
                    onChange={(e) => setFormNickname(e.target.value)}
                    placeholder="Bé Bon"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lớp can thiệp</label>
                  <input
                    type="text"
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    placeholder="Can thiệp 1-1"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chẩn đoán ban đầu
                </label>
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
                    placeholder="Nguyễn Thị Mẹ"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại phụ huynh</label>
                  <input
                    type="tel"
                    value={formParentPhone}
                    onChange={(e) => setFormParentPhone(e.target.value)}
                    placeholder="0987654321"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý do / Ghi chú gửi Quản trị viên
                </label>
                <textarea
                  rows={2}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Ví dụ: Học sinh mới nhập học ngày 05/10/2026, cần tạo tài khoản để thực hiện đánh giá mốc ban đầu..."
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
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(stId) => {
          fetchStudents();
          if (stId) {
            navigate(`/students/${stId}`);
          }
        }}
      />
    </div>
  );
};
