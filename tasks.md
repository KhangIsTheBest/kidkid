# DANH SÁCH NHIỆM VỤ THỰC HIỆN DỰ ÁN (TASK TRACKING)

> **Dự án**: KidKid - Hệ Thống Quan Sát, Đánh Giá & Thiết Lập Can Thiệp ABLLS-R  
> **Trạng thái**: ✅ **HOÀN THÀNH 100% TẤT CẢ CÁC MỤC TIÊU**  

---

## 📋 GIAI ĐOẠN 1: BACKEND EXPRESS, SQLITE & HỆ THỐNG XÁC THỰC (AUTH)
- [x] **Task 1.1**: Khởi tạo cấu trúc Backend Node.js Express + TypeScript (`server/`).
- [x] **Task 1.2**: Cài đặt các thư viện cần thiết (`express`, `better-sqlite3`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`).
- [x] **Task 1.3**: Thiết kế & khởi tạo cơ sở dữ liệu SQLite `kidkid.db`:
  - [x] Bảng `users` (id, username, password_hash, full_name, role, phone, email, is_active).
  - [x] Bảng `students` (id, full_name, nickname, dob, gender, evaluation_date, evaluator_name, diagnosis, parent_name, parent_phone, current_class, assigned_user_ids).
  - [x] Bảng `assessment_sessions` (id, student_id, round_number, scores, skill_rounds, notes, iep_goals...).
  - [x] Bảng `student_requests` (id, user_id, student_id, request_type, payload, reason, status, admin_note...).
- [x] **Task 1.4**: Seed tài khoản Admin mặc định:
  - **Họ tên**: Ngô Thị Thùy Linh
  - **Vai trò**: Quản trị viên (`admin`)
- [x] **Task 1.5**: Import dữ liệu học sinh mẫu (`Hoàng Gia Bảo (Rô)`) và bài đánh giá hiện có vào SQLite.
- [x] **Task 1.6**: Xây dựng các API Xác thực:
  - `POST /api/auth/login` (Xác thực đăng nhập, trả về JWT Token và thông tin user).
  - `GET /api/auth/me` (Lấy thông tin người dùng đang đăng nhập từ token).
  - `POST /api/auth/change-password` (Đổi mật khẩu tài khoản).

---

## 🌐 GIAI ĐOẠN 2: CHUYỂN ĐỔI FRONTEND SANG REACT ROUTER V6
- [x] **Task 2.1**: Cài đặt `react-router-dom` trong frontend.
- [x] **Task 2.2**: Xây dựng `AuthContext` quản lý trạng thái đăng nhập, lưu token, role (`admin` / `user`).
- [x] **Task 2.3**: Xây dựng `ProtectedRoute` kiểm tra phiên đăng nhập và phân quyền truy cập theo role.
- [x] **Task 2.4**: Thiết kế Trang Đăng Nhập (`/login`):
  - Form đăng nhập đẹp mắt, hỗ trợ hiển thị/ẩn mật khẩu, báo lỗi rõ ràng.
  - Tự động chuyển tiếp đến `/students` sau khi đăng nhập thành công.
- [x] **Task 2.5**: Phân tách các Route độc lập trong `App.tsx`:
  - [x] `/login` - Đăng nhập
  - [x] `/students` - Danh sách hồ sơ học sinh
  - [x] `/students/:id` - Chi tiết hồ sơ học sinh
  - [x] `/students/:id/scoring` - Chấm điểm trên lớp (tích hợp InClassScorer)
  - [x] `/students/:id/grid` - Biểu đồ cột tổng quan ABLLS-R (tích hợp AbllsGridTab)
  - [x] `/students/:id/analytics` - Phân tích & đối chiếu chuẩn (tích hợp AnalyticsView)
  - [x] `/students/:id/iep` - Mục tiêu IEP & Xuất báo cáo (tích hợp IepReportView)
  - [x] `/profile` - Hồ sơ cá nhân người dùng
  - [x] `/admin/users` - Quản lý tài khoản người dùng (Chỉ Admin)
  - [x] `/admin/requests` - Phê duyệt yêu cầu thay đổi (Chỉ Admin)
- [x] **Task 2.6**: Cập nhật `AppLayout.tsx` và thanh điều hướng phù hợp với cấu trúc Router mới (Avatar / Profile / Logout / Notification Badge).

---

## 👥 GIAI ĐOẠN 3: PHÂN QUYỀN HỌC SINH & QUY TRÌNH DUYỆT YÊU CẦU
- [x] **Task 3.1**: Xây dựng API Quản lý Người dùng dành cho Admin:
  - `GET /api/users` (Danh sách người dùng).
  - `POST /api/users` (Tạo tài khoản User mới, gán học sinh).
  - `PUT /api/users/:id` (Cập nhật thông tin / phân công học sinh).
  - `DELETE /api/users/:id` (Vô hiệu hóa tài khoản).
- [x] **Task 3.2**: Xây dựng giao diện Trang Quản lý Tài khoản (`/admin/users`).
- [x] **Task 3.3**: Phân quyền hiển thị học sinh:
  - Admin: Thấy toàn bộ danh sách học sinh trung tâm.
  - User: Chỉ thấy các học sinh được gán trong `assigned_user_ids`.
- [x] **Task 3.4**: Xây dựng luồng Gửi yêu cầu từ User:
  - User có thể chấm điểm ABLLS và cập nhật IEP trực tiếp.
  - Khi User muốn Thêm / Sửa / Xóa thông tin học sinh: Hiển thị Modal "Gửi yêu cầu phê duyệt đến Admin".
  - API `POST /api/requests` ghi nhận yêu cầu vào CSDL ở trạng thái `pending`.
- [x] **Task 3.5**: Xây dựng Trang Phê duyệt Yêu cầu (`/admin/requests`):
  - Hiển thị danh sách yêu cầu chờ duyệt kèm số lượng badge thời gian thực.
  - Xem so sánh chi tiết dữ liệu hiện tại vs dữ liệu đề xuất thay đổi.
  - Nút Phê duyệt (`POST /api/requests/:id/approve` -> tự động cập nhật bảng `students`).
  - Nút Từ chối (`POST /api/requests/:id/reject` kèm ghi chú lý do).

---

## 📁 GIAI ĐOẠN 4: TRANG HỒ SƠ NGƯỜI DÙNG & HỒ SƠ HỌC SINH
- [x] **Task 4.1**: Xây dựng Trang Hồ sơ Người Dùng (`/profile`):
  - Thông tin cá nhân: Tên, Email, SĐT, Chức danh / Vai trò.
  - Danh sách các học sinh hiện đang được phân công phụ trách.
  - Bảng theo dõi tiến độ các yêu cầu đã gửi (Thời gian, Loại yêu cầu, Trạng thái: Chờ duyệt / Đã duyệt / Từ chối).
  - Form đổi mật khẩu cá nhân.
- [x] **Task 4.2**: Xây dựng Trang Hồ sơ Học Sinh (`/students/:id`):
  - Thẻ thông tin hành chính, chẩn đoán, phụ huynh, người phụ trách.
  - Bảng tóm tắt tiến độ 4 đợt đánh giá gần nhất.
  - Lối tắt nhanh sang các tab: Chấm điểm, Biểu đồ cột, Phân tích, IEP.
  - Nút tác vụ: Sửa / Xóa (Admin) hoặc Gửi yêu cầu sửa đổi (User).

---

## 📊 GIAI ĐOẠN 5: HIỆU CHỈNH PHÂN TÍCH & BỎ % CHÊNH LỆCH
- [x] **Task 5.1**: Chỉnh sửa component `AnalyticsView.tsx`:
  - Trong mục *"Lĩnh vực chênh lệch nhiều nhất so với mốc tuổi"*:
  - Gỡ bỏ hoàn toàn hiển thị badge chỉ số âm `-{s.gap}%`.
  - Hiển thị rõ ràng 2 chỉ số: **Trẻ đạt: {percentage}%** và **Mốc chuẩn: {normBenchmark}%**.
  - Tối ưu màu sắc và giao diện thẻ cho trực quan, không gây cảm giác tiêu cực.

---

## 📑 GIAI ĐOẠN 6: XUẤT BÁO CÁO KÉP CHUẨN MẪU (.DOCX & .XLSM)
- [x] **Task 6.1**: Xây dựng Engine xuất báo cáo Word `.docx`:
  - Template nguồn: `D:\ChiLinh\BaoCaoDanhGia\template.docx`.
  - API `GET /api/reports/docx/:studentId?round=N`.
  - Điền tự động thông tin học sinh vào Bảng 0.
  - Điền tự động tỷ lệ 25 lĩnh vực và nhận xét vào Bảng 1.
  - Điền nhận xét tổng quan, điểm nổi bật và mục tiêu can thiệp ưu tiên vào các đoạn văn bản.
- [x] **Task 6.2**: Xây dựng Engine xuất báo cáo Excel `.xlsm`:
  - Template nguồn: `D:\ChiLinh\DanhGiaTongHop\ABLLS_DanhGia.xlsm`.
  - API `GET /api/reports/xlsm/:studentId`.
  - Nạp nguyên vẹn file `.xlsm`, điền thông tin trẻ và điểm số cả 4 đợt vào 25 sheet bài đánh giá.
  - Bảo toàn 100% macro VBA, công thức tổng hợp, tháp lưới cột màu.
- [x] **Task 6.3**: Tích hợp các nút xuất báo cáo `.docx` và `.xlsm` vào trang `/students/:id` và `/students/:id/iep`.

---

## 🧪 GIAI ĐOẠN 7: KIỂM THỬ TỔNG THỂ & BÀN GIAO
- [x] **Task 7.1**: Kiểm thử luồng Đăng nhập với tài khoản Admin mặc định `ngothithuylinh.vica`.
- [x] **Task 7.2**: Tạo tài khoản User mới, gán học sinh, đăng nhập và kiểm tra giới hạn truy cập.
- [x] **Task 7.3**: Kiểm thử luồng gửi yêu cầu từ User -> Admin duyệt -> Dữ liệu cập nhật tự động.
- [x] **Task 7.4**: Kiểm thử xuất và mở file `.docx` trên Microsoft Word (Đã xác minh file 155 KB).
- [x] **Task 7.5**: Kiểm thử xuất và mở file `.xlsm` trên Microsoft Excel (Đã xác minh file 496 KB bảo lưu 100% Macro VBA).
- [x] **Task 7.6**: Kiểm thử tính tương thích trên trình duyệt di động và máy tính bảng.
- [x] **Task 7.7**: Bàn giao hướng dẫn vận hành cho người quản trị.
