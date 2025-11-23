# 🖼️ HƯỚNG DẪN THÊM ẢNH NHANH

## ⚡ CÁCH NHANH NHẤT

### Bước 1: Tìm ảnh bìa sách
1. Mở Google Images
2. Tìm: "Sapiens book cover", "Atomic Habits book cover", etc.
3. Chọn ảnh chất lượng tốt

### Bước 2: Download và đổi tên
Download 5 ảnh và đổi tên thành:
- `sapiens.jpg`
- `atomic_habits.jpg`
- `subtle_art.jpg`
- `eloquent_js.jpg`
- `js_good_parts.jpg`

### Bước 3: Copy vào thư mục
Copy tất cả ảnh vào:
```
C:\Users\BINH\Desktop\bac\backup\backend\uploads\
```

### Bước 4: Kiểm tra
```powershell
cd C:\Users\BINH\Desktop\bac\backup\backend\uploads
node check-images.js
```

Nếu thấy "✅ Đã có: 5/5" → Thành công!

---

## 🔗 KIỂM TRA ẢNH HOẠT ĐỘNG

Sau khi thêm ảnh, mở các link sau trong browser:

1. `http://localhost:5000/uploads/sapiens.jpg`
2. `http://localhost:5000/uploads/atomic_habits.jpg`
3. `http://localhost:5000/uploads/subtle_art.jpg`
4. `http://localhost:5000/uploads/eloquent_js.jpg`
5. `http://localhost:5000/uploads/js_good_parts.jpg`

Nếu thấy ảnh → Thành công! ✅

---

## 📱 XEM TRÊN FRONTEND

1. **Trang chủ:** `http://localhost:3000`
2. **Danh sách sách:** `http://localhost:3000/books`
3. **Admin - Quản lý sách:** `http://localhost:3000/admin/books`

Ảnh sẽ tự động hiển thị!

---

## ⚠️ LƯU Ý

- **Tên file:** Phải chính xác (không viết hoa, không dấu cách)
- **Định dạng:** JPG, PNG, WebP
- **Kích thước:** Khuyến nghị < 500KB để tải nhanh
- **Restart backend:** Nếu ảnh không hiển thị, thử restart backend

---

## 🎨 GỢI Ý ẢNH

- **Kích thước:** 300x400px hoặc tỷ lệ tương tự
- **Chất lượng:** Rõ ràng, không mờ
- **Nền:** Nền trắng hoặc nền sách thực tế
- **Format:** JPG để giảm dung lượng

---

**✅ Sau khi thêm ảnh, website sẽ đẹp và chuyên nghiệp hơn!**

