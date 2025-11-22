# 📚 HỆ THỐNG BÁN SÁCH TRỰC TUYẾN - BOOKSTORE

## 🚀 CÁCH CHẠY PROJECT

### 1. Cài đặt MySQL
- Tải và cài đặt MySQL Server
- Mở MySQL Workbench

### 2. Tạo Database
```sql
-- Mở MySQL Workbench, chạy file:
backend/config/database.sql
```

### 3. Cấu hình Backend
```bash
# Copy file .env
copy .env.example .env

# Chỉnh sửa file .env với thông tin MySQL của bạn:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=bookstore_db
```

### 4. Cài đặt và chạy Backend
```bash
# Cài đặt dependencies
npm install

# Chạy server
npm run dev
```
Server chạy tại: http://localhost:5000

### 5. Cài đặt và chạy Frontend (Terminal mới)
```bash
cd frontend
npm install
npm start
```
Website chạy tại: http://localhost:3000

## 📝 TÀI KHOẢN MẪU

### Admin (tạo sau khi chạy database.sql)
- Email: `admin@bookstore.com`
- Password: `Admin@123` (cần hash trong database.sql trước)

### Tạo tài khoản mới
- Đăng ký tại: http://localhost:3000/register

## 🔥 TÍNH NĂNG CHÍNH

### Khách hàng (Customer)
✅ Đăng ký/Đăng nhập (KH-01, KH-02)
✅ Quên mật khẩu qua email (KH-03)
✅ Xem danh sách sách (KH-04)
✅ Tìm kiếm sách (KH-05)
✅ Lọc sách theo tiêu chí (KH-06)
✅ Giỏ hàng (KH-07)
✅ Đặt hàng với tính VAT + phí ship (KH-08, KH-09)
✅ Thanh toán giả lập (KH-10, KH-11)
✅ Xem lịch sử đơn hàng (KH-13)
✅ Hóa đơn PDF (KH-12, KH-15)
✅ Đánh giá sách (KH-16)

### Quản trị viên (Admin)
✅ Quản lý sách: Thêm/Sửa/Xóa (AD-01)
✅ Upload ảnh sách (giới hạn 5MB) (AD-02)
✅ Quản lý tồn kho (AD-03)
✅ Quản lý thể loại (AD-04)
✅ Khóa/Mở khóa tài khoản KH (AD-05)
✅ Quản lý đơn hàng (AD-06)
✅ Báo cáo doanh thu quý (AD-07)
✅ Sách bán chạy & KH mới (AD-08)
✅ Xuất báo cáo Excel/PDF (AD-09)

### Bảo mật (HT-01)
✅ Mã hóa password (bcrypt)
✅ JWT Authentication
✅ Rate limiting
✅ Phân quyền Customer/Admin
✅ Khóa tài khoản sau 3 lần sai password

## 📡 API ENDPOINTS

### Auth
- POST `/api/auth/register` - Đăng ký
- POST `/api/auth/login` - Đăng nhập
- POST `/api/auth/forgot-password` - Quên MK
- POST `/api/auth/reset-password` - Reset MK

### Books (Public)
- GET `/api/books` - Danh sách sách
- GET `/api/books/search?q=keyword` - Tìm kiếm
- GET `/api/books/filter?category_id=1&min_price=0` - Lọc
- GET `/api/books/:id` - Chi tiết sách

### Cart (Cần đăng nhập)
- GET `/api/cart` - Xem giỏ hàng
- POST `/api/cart` - Thêm vào giỏ
- PUT `/api/cart/:id` - Cập nhật số lượng
- DELETE `/api/cart/:id` - Xóa khỏi giỏ

### Orders (Cần đăng nhập)
- POST `/api/orders` - Tạo đơn hàng
- GET `/api/orders` - Lịch sử đơn hàng
- POST `/api/orders/payment` - Thanh toán
- GET `/api/invoices/:order_id/pdf` - Tải hóa đơn

### Admin (Chỉ Admin)
- POST `/api/admin/books` - Thêm sách
- PUT `/api/admin/books/:id` - Sửa sách
- DELETE `/api/admin/books/:id` - Xóa sách
- GET `/api/admin/orders` - Quản lý đơn hàng
- GET `/api/admin/reports/quarter` - Báo cáo quý

## 🛠️ CÔNG NGHỆ SỬ DỤNG

### Backend
- Node.js + Express
- MySQL (MySQL Workbench)
- JWT Authentication
- Bcrypt (mã hóa password)
- Nodemailer (gửi email)
- PDFKit (tạo hóa đơn PDF)
- XLSX (xuất Excel)

### Frontend
- React 18 + TypeScript
- React Router DOM
- Tailwind CSS
- Axios
- React Query
- Zustand (state management)
- React Hook Form

## 📂 CẤU TRÚC THƯ MỤC

```
prototype/
├── backend/
│   ├── config/          # Database config
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, validation
│   ├── routes/          # API routes
│   ├── utils/           # Email service
│   └── server.js        # Entry point
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/  # UI components
│       ├── layouts/     # Layout components
│       ├── pages/       # Pages
│       ├── store/       # Zustand stores
│       └── lib/         # API client
└── uploads/             # Upload files
```

## ⚠️ LƯU Ý

1. **Email Service**: Cấu hình SMTP trong `.env` để gửi email reset password
2. **Upload folder**: Tự động tạo khi upload ảnh
3. **Admin account**: Cần tạo thủ công trong MySQL sau khi chạy script
4. **Port**: Backend (5000), Frontend (3000)

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi kết nối MySQL
```bash
# Kiểm tra MySQL đã chạy chưa
# Kiểm tra thông tin trong file .env
```

### Lỗi npm install
```bash
# Xóa node_modules và cài lại
rm -rf node_modules
npm install
```

### Port đã được sử dụng
```bash
# Thay đổi PORT trong .env (backend)
# Hoặc kill process đang dùng port
```

## 📞 HỖ TRỢ

Mọi thắc mắc vui lòng liên hệ team phát triển.

---
**© 2024 Bookstore System - Dự án hệ thống bán sách trực tuyến**

