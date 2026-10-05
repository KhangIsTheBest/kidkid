import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldAlert,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  Filter
} from 'lucide-react';

export const AdminRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modal action
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get<any[]>('/requests');
      setRequests(res);
    } catch (err: any) {
      console.error(err);
      setActionNotice(err.message || 'Lỗi khi tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenAction = (req: any, type: 'approve' | 'reject') => {
    setSelectedRequest(req);
    setActionType(type);
    setAdminNote(type === 'approve' ? 'Đã duyệt yêu cầu thay đổi hồ sơ.' : '');
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      if (actionType === 'approve') {
        await api.post(`/requests/${selectedRequest.id}/approve`, { adminNote });
        setActionNotice(`Đã phê duyệt yêu cầu thành công!`);
      } else {
        await api.post(`/requests/${selectedRequest.id}/reject`, { adminNote });
        setActionNotice(`Đã từ chối yêu cầu.`);
      }

      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xử lý yêu cầu');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">
              Trung Tâm Phê Duyệt Yêu Cầu Học Sinh
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Xem xét và phê duyệt các đề xuất thêm, sửa hoặc xóa hồ sơ học sinh từ giáo viên can thiệp
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold animate-pulse">
            <Clock className="w-4 h-4 text-amber-700" />
            <span>Có {pendingCount} yêu cầu đang chờ bạn duyệt!</span>
          </div>
        )}
      </div>

      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="underline text-xs">
            Đóng
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Chờ Duyệt ({pendingCount})
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            statusFilter === 'approved'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Đã Duyệt ({requests.filter(r => r.status === 'approved').length})
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            statusFilter === 'rejected'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Từ Chối ({requests.filter(r => r.status === 'rejected').length})
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            statusFilter === 'all'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tất Cả ({requests.length})
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">Đang tải danh sách yêu cầu...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Không có yêu cầu nào trong mục này</h3>
          <p className="text-xs text-slate-500">Mọi yêu cầu đã được xử lý xong.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const isCreate = req.request_type === 'create';
            const isUpdate = req.request_type === 'update';
            const isDelete = req.request_type === 'delete';

            const typeBadge = isCreate ? (
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-2xs uppercase">
                Thêm học sinh mới
              </span>
            ) : isUpdate ? (
              <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded-full font-bold text-2xs uppercase">
                Sửa hồ sơ học sinh
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-2xs uppercase">
                Xóa học sinh
              </span>
            );

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {req.user_full_name || 'Giáo viên'}
                        </span>
                        <span className="text-2xs text-slate-400 font-mono">
                          (@{req.user_username})
                        </span>
                        {typeBadge}
                      </div>
                      <span className="text-2xs text-slate-400">
                        Gửi lúc: {new Date(req.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  {/* Actions for Pending */}
                  {req.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAction(req, 'approve')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Phê Duyệt
                      </button>
                      <button
                        onClick={() => handleOpenAction(req, 'reject')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-200"
                      >
                        <X className="w-3.5 h-3.5" />
                        Từ Chối
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-2xs font-bold ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {req.status === 'approved' ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> Đã chấp thuận
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> Đã từ chối
                        </>
                      )}
                    </span>
                  )}
                </div>

                {/* Reason & Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <div>
                      <span className="text-2xs text-slate-400 font-bold block mb-0.5">
                        LÝ DO ĐỀ XUẤT:
                      </span>
                      <p className="text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-medium">
                        {req.reason || 'Không có ghi chú'}
                      </p>
                    </div>

                    {req.admin_note && (
                      <div>
                        <span className="text-2xs text-slate-400 font-bold block mb-0.5">
                          PHẢN HỒI CỦA BẠN:
                        </span>
                        <p className="text-slate-800 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 leading-relaxed">
                          {req.admin_note}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Proposed Payload Details */}
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-2xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      NỘI DUNG ĐỀ XUẤT:
                    </span>

                    {req.student_full_name && (
                      <div className="flex justify-between py-0.5 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Học sinh hiện tại:</span>
                        <strong className="text-slate-900">{req.student_full_name} ({req.student_nickname})</strong>
                      </div>
                    )}

                    {req.payload?.fullName && (
                      <div className="flex justify-between py-0.5 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Họ và tên mới:</span>
                        <strong className="text-slate-900">{req.payload.fullName}</strong>
                      </div>
                    )}

                    {req.payload?.dob && (
                      <div className="flex justify-between py-0.5 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Ngày sinh:</span>
                        <strong className="text-slate-900">{req.payload.dob}</strong>
                      </div>
                    )}

                    {req.payload?.gender && (
                      <div className="flex justify-between py-0.5 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Giới tính:</span>
                        <strong className="text-slate-900">{req.payload.gender === 'female' ? 'Nữ' : 'Nam'}</strong>
                      </div>
                    )}

                    {req.payload?.currentClass && (
                      <div className="flex justify-between py-0.5 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Lớp can thiệp:</span>
                        <strong className="text-slate-900">{req.payload.currentClass}</strong>
                      </div>
                    )}

                    {req.payload?.diagnosis && (
                      <div className="flex justify-between py-0.5 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Chẩn đoán:</span>
                        <strong className="text-slate-900">{req.payload.diagnosis}</strong>
                      </div>
                    )}

                    {req.payload?.parentName && (
                      <div className="flex justify-between py-0.5 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Phụ huynh:</span>
                        <strong className="text-slate-900">{req.payload.parentName} ({req.payload.parentPhone})</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal (Approve / Reject) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {actionType === 'approve' ? 'Phê Duyệt Yêu Cầu' : 'Từ Chối Yêu Cầu'}
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-4 pt-4">
              <p className="text-xs text-slate-600">
                {actionType === 'approve'
                  ? 'Khi phê duyệt, thao tác (thêm/sửa/xóa) sẽ được áp dụng tự động vào cơ sở dữ liệu học sinh.'
                  : 'Vui lòng cung cấp lý do từ chối để giáo viên nắm rõ thông tin.'}
              </p>

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  Ghi chú phản hồi {actionType === 'reject' && '*'}
                </label>
                <textarea
                  required={actionType === 'reject'}
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={
                    actionType === 'approve'
                      ? 'Đồng ý phê duyệt...'
                      : 'Ví dụ: Thiếu thông tin ngày sinh chính xác, vui lòng cập nhật lại...'
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md disabled:opacity-50 ${
                    actionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  }`}
                >
                  {processing ? 'Đang xử lý...' : actionType === 'approve' ? 'Xác Nhận Duyệt' : 'Xác Nhận Từ Chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
