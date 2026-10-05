# 🌟 KidKid - Hệ Thống Quan Sát, Đánh Giá & Thiết Lập Can Thiệp Trẻ Đặc Biệt (ABLLS-R)

Hệ thống quản lý, đánh giá phát triển và lập kế hoạch giáo dục cá nhân hóa (IEP) dựa trên bộ công cụ chuẩn quốc tế **ABLLS-R** (The Assessment of Basic Language and Learning Skills - Revised).

---

## 🚀 Tính Năng Nổi Bật

### 1. Số hóa 100% Bộ Công Cụ ABLLS-R Chuẩn Quốc Tế
- Đầy đủ **25 nhóm lĩnh vực kỹ năng** (A đến Z: Hợp tác, Quan sát, Nhận biết, Bắt chước, Nói theo, Yêu cầu, Gọi tên, Hội thoại liên tưởng, Ngôn ngữ tự phát, Cú pháp, Vui chơi, Tương tác xã hội, Nề nếp lớp, Khái quát hóa, Học đường Đọc - Toán - Viết - Vần, Tự phục vụ Mặc - Ăn - Vệ sinh, Vận động thô & Vận động tinh).
- Toàn bộ **544 mục tiêu kỹ năng chi tiết**, có đầy đủ câu hỏi khảo sát, hướng dẫn tiêu chí chấm (thang 0-2 hoặc 0-4 điểm) và ví dụ thực tế.

### 2. Chấm Điểm Đa Đợt & Biểu Đồ Lưới Ma Trận Màu (Grid Chart)
- Hỗ trợ đánh giá lũy tiến **4 đợt** (Đợt 1: Vàng, Đợt 2: Cam, Đợt 3: Xanh lá, Đợt 4: Xanh dương).
- Biểu đồ tháp cột 25 lĩnh vực đồng bộ 100% quy ước màu sắc chuẩn quốc tế.
- Bộ lọc mốc tuổi phát triển (2 tuổi: 123 bài, 3 tuổi: 316 bài, 4 tuổi: 423 bài, 5 tuổi: 499 bài).
- Tự động lưu tức thời (Auto-save) và ghi nhận nhật ký nhận xét chuyên môn.

### 3. Phân Tích & Đối Chiếu Chuẩn Phát Triển (Partington Norms)
- Tự động tính tuổi theo tháng và đối chiếu với chuẩn phát triển Partington (2010).
- Thống kê tỷ lệ thành thạo, đang hình thành và chưa xuất hiện.
- Phân tích lĩnh vực thế mạnh và lĩnh vực cần ưu tiên can thiệp.

### 4. Hệ Thống Xuất Báo Cáo Kép Chuẩn Hóa
- **Xuất Báo Cáo Word (.docx):** Điền tự động thông tin học sinh, bảng điểm 25 lĩnh vực, nhận xét chuyên môn và mục tiêu IEP ưu tiên.
- **Xuất Báo Cáo Excel (.xlsm):** Bảo lưu 100% Macro VBA, công thức tổng hợp, tháp lưới cột màu nguyên bản từ file gốc `ABLLS_DanhGia.xlsm`.

### 5. Nhập Đánh Giá Tự Động Từ Excel (.xlsm / .xlsx)
- Tải lên tệp Excel đánh giá có sẵn của giáo viên để tự động trích xuất điểm số 544 kỹ năng, 4 đợt đánh giá và toàn bộ ghi chú từ 25 sheet bài test lên hệ thống web.
- Bản xem trước thông minh (Preview) và tùy chọn đồng bộ linh hoạt.

### 6. Phân Quyền Bảo Mật & Quy Trình Duyệt Yêu Cầu
- **Phân quyền 2 vai trò:**
  - `Admin`: Toàn quyền quản trị học sinh, tài khoản người dùng, phân công giáo viên và duyệt yêu cầu.
  - `User` (Giáo viên): Xem và chấm điểm các học sinh được phân công; gửi yêu cầu Thêm / Sửa / Xóa học sinh để Quản trị viên phê duyệt.
- Quản lý phiên làm việc bằng JWT Token và mã hóa mật khẩu an toàn.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide React, React Router v6, Vite.
- **Backend:** Node.js, Express, TypeScript, Better-SQLite3, JWT, Bcryptjs.
- **Data Engine:** Python 3 (openpyxl, python-docx) cho bộ xử lý nhập/xuất tài liệu Word & Excel Macro chuyên sâu.
- **Database:** SQLite (WAL mode).

---

## 📦 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Yêu cầu môi trường
- Node.js >= 18
- Python >= 3.9 (kèm các thư viện `openpyxl`, `python-docx`)

### 2. Cài đặt Dependencies
```bash
# Cài đặt thư viện Node.js
npm install

# Cài đặt thư viện Python (nếu chưa có)
pip install openpyxl python-docx
```

### 3. Khởi động Ứng Dụng

Khởi động đồng thời Frontend và Backend:

**Backend Server (Cổng 5001):**
```bash
npm run server
```

**Frontend Dev Server (Cổng 3000):**
```bash
npm run dev
```

Truy cập ứng dụng tại: `http://localhost:3000`

---

## 📝 Bản Quyền & Giấy Phép
Phát triển cho hệ thống giáo dục đặc biệt & can thiệp sớm KidKid.
