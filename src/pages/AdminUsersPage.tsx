import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  UserCheck,
  Plus,
  Search,
  Shield,
  Edit2,
  Lock,
  X,
  CheckCircle,
  AlertCircle,
  Users,
  KeyRound,
  Phone,
  Mail
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createRole, setCreateRole] = useState<'admin' | 'user'>('user');
  const [createPhone, setCreatePhone] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createAssignedIds, setCreateAssignedIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Edit Modal
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editAssignedIds, setEditAssignedIds] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, sRes] = await Promise.all([
        api.get<any[]>('/users'),
        api.get<any[]>('/students')
      ]);
      setUsers(uRes);
      setStudents(sRes);
    } catch (err: any) {
      console.error(err);
      setNotice({ type: 'error', text: err.message || 'Lỗi khi tải dữ liệu người dùng' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUsername.trim() || !createPassword.trim() || !createFullName.trim()) return;

    try {
      setCreating(true);
      await api.post('/users', {
        username: createUsername.trim(),
        password: createPassword,
        fullName: createFullName.trim(),
        role: createRole,
        phone: createPhone.trim(),
        email: createEmail.trim(),
        assignedStudentIds: createAssignedIds
      });

      setNotice({ type: 'success', text: `Tạo tài khoản ${createUsername} thành công!` });
      setIsCreateModalOpen(false);
      resetCreateForm();
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Không thể tạo tài khoản');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setEditFullName(user.full_name || user.fullName || '');
    setEditRole(user.role);
    setEditPhone(user.phone || '');
    setEditEmail(user.email || '');
    setEditIsActive(user.is_active === 1 || user.isActive === 1);
    setEditNewPassword('');

    // Pre-check students assigned to this user
    const assignedIds = (user.assignedStudents || []).map((s: any) => s.id);
    setEditAssignedIds(assignedIds);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setUpdating(true);
      await api.put(`/users/${editingUser.id}`, {
        fullName: editFullName.trim(),
        role: editRole,
        phone: editPhone.trim(),
        email: editEmail.trim(),
        isActive: editIsActive ? 1 : 0,
        password: editNewPassword.trim() ? editNewPassword.trim() : undefined,
        assignedStudentIds: editAssignedIds
      });

      setNotice({ type: 'success', text: `Cập nhật tài khoản ${editingUser.username} thành công!` });
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật tài khoản');
    } finally {
      setUpdating(false);
    }
  };

  const resetCreateForm = () => {
    setCreateUsername('');
    setCreatePassword('');
    setCreateFullName('');
    setCreateRole('user');
    setCreatePhone('');
    setCreateEmail('');
    setCreateAssignedIds([]);
  };

  const toggleStudentAssign = (list: string[], setList: (val: string[]) => void, studentId: string) => {
    if (list.includes(studentId)) {
      setList(list.filter(id => id !== studentId));
    } else {
      setList([...list, studentId]);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">
              Quản Trị Tài Khoản Người Dùng
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Tạo tài khoản giáo viên, phân quyền truy cập và chỉ định học sinh phụ trách
          </p>
        </div>

        <button
          onClick={() => {
            resetCreateForm();
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Tạo Người Dùng Mới
        </button>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} className="font-bold underline text-xs">
            Đóng
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo tên đăng nhập, họ tên, số điện thoại..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">Đang tải danh sách người dùng...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-2xs">
                <tr>
                  <th className="py-3 px-4">Tài Khoản</th>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4">Vai Trò</th>
                  <th className="py-3 px-4">Liên Hệ</th>
                  <th className="py-3 px-4">Học Sinh Phụ Trách</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 font-mono text-xs">
                        {u.username}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {u.full_name || u.fullName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-2xs uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {u.role === 'admin' ? 'Quản Trị' : 'Giáo Viên'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-2xs space-y-0.5">
                      {u.phone && <div>{u.phone}</div>}
                      {u.email && <div>{u.email}</div>}
                      {!u.phone && !u.email && <div className="text-slate-300">-</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-2xs">
                        {u.assignedStudentsCount || 0} học sinh
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          u.is_active === 1 || u.isActive === 1
                            ? 'bg-emerald-500'
                            : 'bg-rose-400'
                        }`}
                        title={u.is_active === 1 ? 'Hoạt động' : 'Tạm khóa'}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-bold text-xs inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tạo Tài Khoản Người Dùng Mới</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">
                    Tên đăng nhập *
                  </label>
                  <input
                    type="text"
                    required
                    value={createUsername}
                    onChange={(e) => setCreateUsername(e.target.value)}
                    placeholder="giaovien2"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">
                    Mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  Họ và tên đầy đủ *
                </label>
                <input
                  type="text"
                  required
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  placeholder="Ví dụ: Trần Thị Hương"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">Vai trò</label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="user">Giáo viên (User)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="0912345678"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="huongtran@gmail.com"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Assign Students */}
              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-2">
                  Phân công học sinh phụ trách:
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50">
                  {students.map((st) => (
                    <label
                      key={st.id}
                      className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={createAssignedIds.includes(st.id)}
                        onChange={() => toggleStudentAssign(createAssignedIds, setCreateAssignedIds, st.id)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-semibold text-slate-800">
                        {st.full_name || st.fullName}
                      </span>
                      {st.nickname && (
                        <span className="text-2xs text-slate-400">({st.nickname})</span>
                      )}
                    </label>
                  ))}
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
                  disabled={creating}
                  className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shadow-purple-500/20 disabled:opacity-50"
                >
                  {creating ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Chỉnh Sửa Tài Khoản: @{editingUser.username}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 pt-4">
              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  Họ và tên đầy đủ *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">Vai trò</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="user">Giáo viên (User)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={editIsActive ? '1' : '0'}
                    onChange={(e) => setEditIsActive(e.target.value === '1')}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="1">Đang hoạt động</option>
                    <option value="0">Tạm khóa tài khoản</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  Đặt lại mật khẩu mới (Bỏ trống nếu không muốn đổi)
                </label>
                <input
                  type="password"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Assign Students */}
              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-2">
                  Học sinh được phân công phụ trách:
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50">
                  {students.map((st) => (
                    <label
                      key={st.id}
                      className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={editAssignedIds.includes(st.id)}
                        onChange={() => toggleStudentAssign(editAssignedIds, setEditAssignedIds, st.id)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-semibold text-slate-800">
                        {st.full_name || st.fullName}
                      </span>
                      {st.nickname && (
                        <span className="text-2xs text-slate-400">({st.nickname})</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shadow-purple-500/20 disabled:opacity-50"
                >
                  {updating ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
