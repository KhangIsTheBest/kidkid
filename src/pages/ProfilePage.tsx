import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User,
  KeyRound,
  Users,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Change password form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // My assigned students
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // My requests tracking
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    // Fetch assigned students
    api.get<any[]>('/students')
      .then(res => setAssignedStudents(res))
      .catch(console.error)
      .finally(() => setLoadingStudents(false));

    // Fetch user requests
    api.get<any[]>('/requests')
      .then(res => setMyRequests(res))
      .catch(console.error)
      .finally(() => setLoadingRequests(false));
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordNotice({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
      return;
    }

    try {
      setChangingPassword(true);
      await api.post('/auth/change-password', {
        oldPassword,
        newPassword
      });

      setPasswordNotice({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordNotice({ type: 'error', text: err.message || 'Không thể đổi mật khẩu' });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* User Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-sky-500/20">
              {user?.full_name?.split(' ').slice(-1)[0]?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {user?.full_name}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-sky-100 text-sky-700 border border-sky-200'
                  }`}
                >
                  {isAdmin ? 'Quản Trị Viên' : 'Giáo Viên'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1.5">
                <span className="font-mono">@{user?.username}</span>
                {user?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {user.phone}
                  </span>
                )}
                {user?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {user.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => navigate('/admin/users')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Quản lý tài khoản người dùng
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Change Password */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <KeyRound className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Đổi Mật Khẩu
            </h2>
          </div>

          {passwordNotice && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                passwordNotice.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {passwordNotice.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 pt-1">
            <div>
              <label className="block text-2xs font-bold text-slate-600 mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-600 mb-1">
                Mật khẩu mới (tối thiểu 6 ký tự)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-600 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50 mt-2"
            >
              {changingPassword ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
            </button>
          </form>
        </div>

        {/* Right Columns: Assigned Students & Requests Tracking */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Students */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Học Sinh Đang Quản Lý ({assignedStudents.length})
                </h2>
              </div>
              <button
                onClick={() => navigate('/students')}
                className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
              >
                Xem tất cả <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loadingStudents ? (
              <p className="text-xs text-slate-400">Đang tải...</p>
            ) : assignedStudents.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">
                Hiện tại bạn chưa được phân công quản lý học sinh nào.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {assignedStudents.slice(0, 4).map((st) => (
                  <div
                    key={st.id}
                    onClick={() => navigate(`/students/${st.id}`)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/30 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-sky-600 transition-colors">
                        {st.full_name || st.fullName}
                      </h4>
                      <p className="text-2xs text-slate-400 mt-0.5">
                        {st.nickname ? `Bé ${st.nickname} • ` : ''}{st.dob}
                      </p>
                    </div>
                    <span className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-sky-100 text-slate-400 group-hover:text-sky-600 transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Requests Tracking */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Trạng Thái Yêu Cầu Thay Đổi Hồ Sơ ({myRequests.length})
                </h2>
              </div>
            </div>

            {loadingRequests ? (
              <p className="text-xs text-slate-400">Đang tải yêu cầu...</p>
            ) : myRequests.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">
                Bạn chưa gửi yêu cầu thay đổi nào.
              </p>
            ) : (
              <div className="space-y-3 pt-1">
                {myRequests.map((req) => {
                  const typeLabel =
                    req.request_type === 'create'
                      ? 'Thêm học sinh mới'
                      : req.request_type === 'update'
                      ? 'Sửa hồ sơ học sinh'
                      : 'Xóa học sinh';

                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {typeLabel}
                          </span>
                          {(req.student_full_name || req.payload?.fullName) && (
                            <span className="text-2xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-medium">
                              {req.student_full_name || req.payload?.fullName}
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        {req.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" /> Đang chờ duyệt
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> Đã chấp thuận
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3" /> Từ chối
                          </span>
                        )}
                      </div>

                      {req.reason && (
                        <p className="text-slate-600 text-2xs">
                          <strong>Lý do:</strong> {req.reason}
                        </p>
                      )}

                      {req.admin_note && (
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-2xs text-slate-700">
                          <strong className="text-slate-900">Phản hồi Quản trị viên:</strong> {req.admin_note}
                        </div>
                      )}

                      <span className="text-2xs text-slate-400 block pt-1">
                        Gửi lúc: {new Date(req.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
