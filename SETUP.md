# 🚀 HƯỚNG DẪN SETUP NHANH

## Bước 1: Tạo Database trong MySQL Workbench

1. Mở **MySQL Workbench**
2. Click vào connection của bạn (IOT hoặc Card game)
3. Nhập password: **123456**
4. Mở file `backend/config/database.sql`
5. Copy toàn bộ nội dung và paste vào MySQL Workbench
6. Click biểu tượng ⚡ (Execute) hoặc Ctrl+Shift+Enter

✅ Database `bookstore_db` sẽ được tạo với tất cả bảng và dữ liệu mẫu!

## Bước 2: Tạo file .env

Tạo file `.env` trong thư mục gốc project với nội dung:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=123456
DB_NAME=bookstore_db
DB_PORT=3306

# JWT Secret
JWT_SECRET=bookstore_secret_key_2024_very_secure
JWT_EXPIRE=7d

# Email Configuration (tùy chọn)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@bookstore.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Security
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=3
LOCK_TIME=15
```

## Bước 3: Cài đặt và chạy Backend

```bash
# Mở terminal trong thư mục prototype
npm install
npm run dev
```

Thấy thông báo này là thành công:
```
✅ MySQL Database connected successfully
🚀 Server running on: http://localhost:5000
```

## Bước 4: Cài đặt và chạy Frontend

```bash
# Mở terminal MỚI
cd frontend
npm install
npm start
```

Website tự động mở tại: http://localhost:3000

## 🔐 TÀI KHOẢN ĐĂNG NHẬP

### Tài khoản Admin (đã tạo sẵn)
- **Email**: admin@bookstore.com
- **Password**: Admin@123

### Tài khoản Customer
- Đăng ký mới tại: http://localhost:3000/register

## ✅ KIỂM TRA SETUP THÀNH CÔNG

1. Backend chạy: http://localhost:5000/health
   - Phải thấy: `{"success":true,"message":"Server is running"}`

2. Frontend chạy: http://localhost:3000
   - Phải thấy trang chủ Bookstore

3. Đăng nhập Admin: http://localhost:3000/login
   - Email: admin@bookstore.com
   - Password: Admin@123
   - Sau khi đăng nhập, vào: http://localhost:3000/admin

## 🐛 GẶP LỖI?

### Lỗi: "Cannot connect to database"
→ Kiểm tra MySQL đã chạy chưa, password có đúng 123456 không

### Lỗi: "Port 5000 already in use"
→ Đổi PORT=5001 trong file .env

### Lỗi: "Module not found"
→ Chạy lại: `npm install` (backend) và `cd frontend && npm install`

---
**Cần hỗ trợ thêm? Hỏi tôi nhé! 😊**

