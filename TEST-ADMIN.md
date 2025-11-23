# 🔐 HƯỚNG DẪN KIỂM TRA CHỨC NĂNG ADMIN

## ✅ TÀI KHOẢN ADMIN MẶC ĐỊNH

**Email:** `admin@bookstore.com`  
**Password:** `Admin@123`

---

## 📋 CÁCH 1: KIỂM TRA QUA FRONTEND (Dễ nhất)

### Bước 1: Đăng nhập Admin
1. Mở trình duyệt: http://localhost:3000
2. Click **"Đăng nhập"**
3. Nhập:
   - Email: `admin@bookstore.com`
   - Password: `Admin@123`
4. Click **"Đăng nhập"**

### Bước 2: Truy cập Admin Dashboard
- Sau khi đăng nhập, bạn sẽ tự động được chuyển đến **Admin Dashboard**
- Hoặc truy cập trực tiếp: http://localhost:3000/admin

### Bước 3: Kiểm tra các chức năng Admin

**📚 Quản lý Sách** (`/admin/books`)
- Xem danh sách sách
- Thêm sách mới
- Sửa thông tin sách
- Xóa sách
- Upload ảnh sách
- Cập nhật số lượng tồn kho

**👥 Quản lý Khách hàng** (`/admin/users`)
- Xem danh sách khách hàng
- Xem chi tiết khách hàng
- Khóa/Mở khóa tài khoản
- Kích hoạt/Vô hiệu hóa tài khoản

**📦 Quản lý Đơn hàng** (`/admin/orders`)
- Xem tất cả đơn hàng
- Xem chi tiết đơn hàng
- Cập nhật trạng thái đơn hàng
- Xem thống kê đơn hàng

**📊 Báo cáo** (`/admin/reports`)
- Dashboard thống kê
- Doanh thu
- Số lượng đơn hàng
- Top sách bán chạy

---

## 📋 CÁCH 2: KIỂM TRA QUA API (Postman/Thunder Client)

### Bước 1: Đăng nhập để lấy Token

**POST** `http://localhost:5000/api/auth/login`

**Body (JSON):**
```json
{
  "email": "admin@bookstore.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": 1,
      "email": "admin@bookstore.com",
      "full_name": "Administrator",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Copy token này để dùng cho các request sau!**

---

### Bước 2: Test các API Admin

#### 📚 **Quản lý Sách**

**1. Lấy danh sách sách (Public - không cần admin)**
```
GET http://localhost:5000/api/books
```

**2. Tạo sách mới (Cần Admin)**
```
POST http://localhost:5000/api/admin/books
Headers: Authorization: Bearer {token}
Body:
{
  "isbn": "9781234567890",
  "title": "Sách Test",
  "author": "Tác giả Test",
  "publisher": "NXB Test",
  "publication_year": 2024,
  "category_id": 3,
  "description": "Mô tả sách test",
  "price": 100000,
  "stock_quantity": 50
}
```

**3. Cập nhật sách (Cần Admin)**
```
PUT http://localhost:5000/api/admin/books/1
Headers: Authorization: Bearer {token}
Body: {same as create}
```

**4. Xóa sách (Cần Admin)**
```
DELETE http://localhost:5000/api/admin/books/1
Headers: Authorization: Bearer {token}
```

---

#### 👥 **Quản lý Khách hàng**

**1. Lấy danh sách khách hàng (Cần Admin)**
```
GET http://localhost:5000/api/admin/users
Headers: Authorization: Bearer {token}
```

**2. Xem chi tiết khách hàng (Cần Admin)**
```
GET http://localhost:5000/api/admin/users/2
Headers: Authorization: Bearer {token}
```

**3. Khóa/Mở khóa tài khoản (Cần Admin)**
```
PATCH http://localhost:5000/api/admin/users/2/lock
Headers: Authorization: Bearer {token}
```

**4. Kích hoạt/Vô hiệu hóa tài khoản (Cần Admin)**
```
PATCH http://localhost:5000/api/admin/users/2/active
Headers: Authorization: Bearer {token}
```

---

#### 📦 **Quản lý Đơn hàng**

**1. Lấy tất cả đơn hàng (Cần Admin)**
```
GET http://localhost:5000/api/admin/orders
Headers: Authorization: Bearer {token}
```

**2. Xem chi tiết đơn hàng (Cần Admin)**
```
GET http://localhost:5000/api/admin/orders/1
Headers: Authorization: Bearer {token}
```

**3. Cập nhật trạng thái đơn hàng (Cần Admin)**
```
PATCH http://localhost:5000/api/admin/orders/1/status
Headers: Authorization: Bearer {token}
Body:
{
  "status": "confirmed"
}
```

**4. Thống kê đơn hàng (Cần Admin)**
```
GET http://localhost:5000/api/admin/orders/stats
Headers: Authorization: Bearer {token}
```

---

#### 📊 **Báo cáo**

**1. Dashboard Stats (Cần Admin)**
```
GET http://localhost:5000/api/admin/reports/dashboard
Headers: Authorization: Bearer {token}
```

---

## ⚠️ KIỂM TRA PHÂN QUYỀN

### Test 1: Customer không thể truy cập Admin API
1. Đăng ký/Đăng nhập với tài khoản customer
2. Lấy token của customer
3. Thử gọi API admin → Phải trả về lỗi 403

### Test 2: Không có token → Lỗi 401
Gọi API admin không có header Authorization → Phải trả về lỗi 401

### Test 3: Token không hợp lệ → Lỗi 401
Gọi API admin với token sai → Phải trả về lỗi 401

---

## 🧪 TEST NHANH BẰNG CURL

```bash
# 1. Đăng nhập
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bookstore.com","password":"Admin@123"}'

# 2. Lấy danh sách khách hàng (thay {token} bằng token từ bước 1)
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer {token}"

# 3. Lấy dashboard stats
curl -X GET http://localhost:5000/api/admin/reports/dashboard \
  -H "Authorization: Bearer {token}"
```

---

## ✅ CHECKLIST KIỂM TRA

- [ ] Đăng nhập admin thành công
- [ ] Truy cập được Admin Dashboard
- [ ] Xem được danh sách sách
- [ ] Thêm được sách mới
- [ ] Sửa được thông tin sách
- [ ] Xóa được sách
- [ ] Xem được danh sách khách hàng
- [ ] Khóa/Mở khóa được tài khoản
- [ ] Xem được danh sách đơn hàng
- [ ] Cập nhật được trạng thái đơn hàng
- [ ] Xem được dashboard stats
- [ ] Customer không thể truy cập admin routes

---

**🎉 Chúc bạn test thành công!**

