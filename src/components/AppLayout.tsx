import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Sparkles,
  Users,
  BookOpen,
  LayoutGrid,
  BarChart3,
  FileText,
  UserCheck,
  ShieldAlert,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: currentStudentId } = useParams<{ id?: string }>();
  
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [currentStudent, setCurrentStudent] = useState<any>(null);

  // If on a student sub-route, fetch basic student info for breadcrumb
  useEffect(() => {
    if (currentStudentId) {
      api.get<{ student: any }>(`/students/${currentStudentId}`)
        .then(res => setCurrentStudent(res.student))
        .catch(() => setCurrentStudent(null));
    } else {
      setCurrentStudent(null);
    }
  }, [currentStudentId]);

  // Fetch pending requests count for Admin badge
  useEffect(() => {
    if (isAdmin) {
      api.get<any[]>('/requests')
        .then(reqs => {
          const pending = reqs.filter(r => r.status === 'pending').length;
          setPendingRequestsCount(pending);
        })
        .catch(() => {});
    }
  }, [isAdmin, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isStudentSubpage = !!currentStudentId;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo & Main Navigation */}
            <div className="flex items-center gap-3 sm:gap-4">
              <NavLink to="/students" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="font-black text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  KidKid
                </span>
              </NavLink>

              {/* Main Nav: Danh Sách Học Sinh */}
              <nav className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <NavLink
                  to="/students"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                  title="Xem toàn bộ danh sách học sinh"
                >
                  <Users className="w-4 h-4 text-sky-600" />
                  <span className="font-bold">Danh Sách Học Sinh</span>
                </NavLink>

                {/* Active Student Breadcrumb if inside student profile/evaluation */}
                {currentStudent && (
                  <div className="hidden md:flex items-center gap-1.5 text-xs">
                    <span className="text-slate-300 font-bold">/</span>
                    <NavLink
                      to={`/students/${currentStudent.id}`}
                      className="font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 px-2.5 py-1.5 rounded-xl border border-sky-200/80 transition-colors flex items-center gap-1"
                      title="Xem hồ sơ chi tiết học sinh này"
                    >
                      <span>{currentStudent.full_name}</span>
                      {currentStudent.nickname && (
                        <span className="text-2xs text-sky-600 font-semibold">({currentStudent.nickname})</span>
                      )}
                    </NavLink>
                  </div>
                )}
              </nav>
            </div>

            {/* Right User Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Admin Requests link */}
              {isAdmin && (
                <NavLink
                  to="/admin/requests"
                  className={({ isActive }) =>
                    `relative px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-amber-50 text-amber-900 border border-amber-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                  title="Duyệt yêu cầu thay đổi hồ sơ học sinh"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">Duyệt Yêu Cầu</span>
                  {pendingRequestsCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                      {pendingRequestsCount}
                    </span>
                  )}
                </NavLink>
              )}

              {/* Admin Users link */}
              {isAdmin && (
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                  title="Quản lý tài khoản và phân quyền"
                >
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">QL Người Dùng</span>
                </NavLink>
              )}

              {/* User Profile Pill */}
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1 sm:py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-800 border-sky-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <div className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="hidden md:flex flex-col text-left leading-tight">
                  <span className="font-bold truncate max-w-[120px]">{user?.full_name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">{user?.role === 'admin' ? 'Admin' : 'Giáo viên'}</span>
                </div>
              </NavLink>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 pb-16 md:pb-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg px-1 py-1.5">
        <div className={`grid ${isStudentSubpage && currentStudentId ? 'grid-cols-6' : 'grid-cols-4'} gap-0.5 text-center`}>
          <NavLink
            to="/students"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 rounded-xl text-[8px] sm:text-[9px] font-bold ${
                isActive ? 'text-sky-600 bg-sky-50' : 'text-slate-500'
              }`
            }
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
            <span className="truncate">Học sinh</span>
          </NavLink>

          {isStudentSubpage && currentStudentId ? (
            <>
              <NavLink
                to={`/students/${currentStudentId}/scoring`}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 rounded-xl text-[8px] sm:text-[9px] font-bold ${
                    isActive ? 'text-sky-600 bg-sky-50' : 'text-slate-500'
                  }`
                }
              >
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
                <span className="truncate">Chấm điểm</span>
              </NavLink>

              <NavLink
                to={`/students/${currentStudentId}/grid`}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 rounded-xl text-[8px] sm:text-[9px] font-bold ${
                    isActive ? 'text-sky-600 bg-sky-50' : 'text-slate-500'
                  }`
                }
              >
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
                <span className="truncate">Biểu đồ</span>
              </NavLink>

              <NavLink
                to={`/students/${currentStudentId}/analytics`}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 rounded-xl text-[8px] sm:text-[9px] font-bold ${
                    isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'
                  }`
                }
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
                <span className="truncate">Thống kê</span>
              </NavLink>

              <NavLink
                to={`/students/${currentStudentId}/iep`}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 rounded-xl text-[8px] sm:text-[9px] font-bold ${
                    isActive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500'
                  }`
                }
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
                <span className="truncate">Báo cáo</span>
              </NavLink>
            </>
          ) : (
            <>
              {isAdmin && (
                <NavLink
                  to="/admin/requests"
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center py-1 rounded-xl text-[8px] sm:text-[9px] font-bold ${
                      isActive ? 'text-amber-600 bg-amber-50' : 'text-slate-500'
                    }`
                  }
                >
                  <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
                  <span className="truncate">Duyệt yêu cầu</span>
                </NavLink>
              )}

              {isAdmin && (
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center py-1 rounded-xl text-[8px] sm:text-[9px] font-bold ${
                      isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'
                    }`
                  }
                >
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
                  <span className="truncate">QL User</span>
                </NavLink>
              )}
            </>
          )}

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 rounded-xl text-[8px] sm:text-[9px] font-bold ${
                isActive ? 'text-sky-600 bg-sky-50' : 'text-slate-500'
              }`
            }
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
            <span className="truncate">Cá nhân</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};
