# 📸 HƯỚNG DẪN THÊM ẢNH SÁCH

## 🎯 MỤC ĐÍCH

Thêm các ảnh bìa sách vào thư mục `backend/uploads/` để hiển thị trên giao diện frontend.

---

## 📋 DANH SÁCH ẢNH CẦN THIẾT

Bạn cần thêm 5 file ảnh với tên chính xác như sau:

1. **sapiens.jpg** - Sapiens: Lược Sử Loài Người
2. **atomic_habits.jpg** - Atomic Habits  
3. **subtle_art.jpg** - The Subtle Art of Not Giving a F*ck
4. **eloquent_js.jpg** - Eloquent JavaScript
5. **js_good_parts.jpg** - JavaScript: The Good Parts

---

## 📥 CÁCH 1: TẢI ẢNH TỪ INTERNET (Khuyến nghị)

### Bước 1: Tìm ảnh bìa sách
- Google Images: Tìm "Sapiens book cover", "Atomic Habits book cover", etc.
- Amazon: Tìm sách và lấy ảnh bìa
- Goodreads: Tìm sách và download ảnh bìa

### Bước 2: Download ảnh
- Click chuột phải vào ảnh → "Save image as..."
- Đổi tên file theo danh sách trên
- Lưu vào: `backup/backend/uploads/`

### Bước 3: Kiểm tra
- Mở: `http://localhost:5000/uploads/sapiens.jpg`
- Nếu thấy ảnh → Thành công!

---

## 📥 CÁCH 2: SỬ DỤNG SCRIPT DOWNLOAD

### Bước 1: Chỉnh sửa URL ảnh
Mở file `backend/uploads/download-images.js` và cập nhật URL ảnh thực tế.

### Bước 2: Chạy script
```powershell
cd C:\Users\BINH\Desktop\bac\backup\backend\uploads
node download-images.js
```

### Bước 3: Kiểm tra
Kiểm tra xem các file đã được download chưa.

---

## 📥 CÁCH 3: UPLOAD QUA ADMIN PANEL

### Bước 1: Đăng nhập Admin
- Email: `admin@bookstore.com`
- Password: `Admin@123`

### Bước 2: Vào Quản lý Sách
- Truy cập: `http://localhost:3000/admin/books`

### Bước 3: Upload ảnh
- Tìm sách cần upload ảnh
- Hover vào vùng ảnh (sẽ thấy icon camera)
- Click và chọn file ảnh
- Ảnh sẽ tự động upload và cập nhật

---

## 📁 CẤU TRÚC THƯ MỤC

```
backend/
└── uploads/
    ├── sapiens.jpg
    ├── atomic_habits.jpg
    ├── subtle_art.jpg
    ├── eloquent_js.jpg
    ├── js_good_parts.jpg
    ├── README.md
    └── download-images.js
```

---

## ⚙️ CẤU HÌNH

### Backend đã cấu hình sẵn:
- **Thư mục upload:** `backend/uploads/`
- **Route static:** `/uploads` → `http://localhost:5000/uploads/`
- **Giới hạn file:** 5MB
- **Định dạng:** JPG, PNG, WebP

### Database đã cấu hình:
- Tất cả sách đã có `image_url` trỏ đến `/uploads/filename.jpg`
- Frontend sẽ tự động load ảnh từ `http://localhost:5000/uploads/...`

---

## ✅ KIỂM TRA SAU KHI THÊM ẢNH

1. **Kiểm tra file tồn tại:**
   ```powershell
   cd C:\Users\BINH\Desktop\bac\backup\backend\uploads
   dir
   ```

2. **Kiểm tra qua browser:**
   - Mở: `http://localhost:5000/uploads/sapiens.jpg`
   - Nếu thấy ảnh → OK!

3. **Kiểm tra trên frontend:**
   - Mở: `http://localhost:3000/books`
   - Xem danh sách sách có hiển thị ảnh không

---

## 🔧 TROUBLESHOOTING

### Lỗi 404 khi truy cập ảnh:
- ✅ Kiểm tra tên file có đúng không
- ✅ Kiểm tra file có trong thư mục `backend/uploads/` không
- ✅ Restart backend server

### Ảnh không hiển thị trên frontend:
- ✅ Kiểm tra `image_url` trong database
- ✅ Kiểm tra CORS đã cấu hình chưa
- ✅ Xem console browser có lỗi không

### Upload qua admin panel bị lỗi:
- ✅ Kiểm tra thư mục `uploads` có quyền ghi không
- ✅ Kiểm tra file size < 5MB
- ✅ Kiểm tra định dạng file (JPG, PNG, WebP)

---

## 💡 GỢI Ý

1. **Sử dụng ảnh chất lượng tốt:** 300x400px hoặc lớn hơn
2. **Tối ưu kích thước:** Nén ảnh để giảm dung lượng (< 500KB)
3. **Đặt tên file rõ ràng:** Dễ quản lý và tìm kiếm
4. **Backup ảnh:** Lưu ảnh gốc ở nơi khác để dự phòng

---

**🎉 Sau khi thêm ảnh, website sẽ đẹp hơn nhiều!**

