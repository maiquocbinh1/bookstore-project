# 📊 MÔ TẢ ADMIN DASHBOARD

## 🎯 TỔNG QUAN

Admin Dashboard là trang tổng quan của hệ thống quản lý bán sách, cung cấp các thông tin thống kê quan trọng và truy cập nhanh đến các chức năng quản lý.

**URL:** `/admin/dashboard`  
**Yêu cầu:** Phải đăng nhập với tài khoản có role `admin`

---

## 📈 CÁC THÀNH PHẦN CHÍNH

### 1. **Thống Kê Tổng Quan (Overview Stats)**

Hiển thị 4 chỉ số quan trọng nhất của hệ thống:

#### 📦 Tổng Đơn Hàng
- **Icon:** Shopping Cart (màu xanh dương)
- **Dữ liệu:** Tổng số đơn hàng từ khi hệ thống hoạt động
- **API:** `GET /api/admin/reports/dashboard`
- **Trường:** `overview.total_orders`

#### 💰 Tổng Doanh Thu
- **Icon:** Currency Dollar (màu xanh lá)
- **Dữ liệu:** Tổng doanh thu từ các đơn hàng đã thanh toán
- **API:** `GET /api/admin/reports/dashboard`
- **Trường:** `overview.total_revenue`
- **Format:** Định dạng tiền tệ VNĐ (ví dụ: 1.000.000 ₫)

#### 👥 Tổng Khách Hàng
- **Icon:** Users (màu tím)
- **Dữ liệu:** Tổng số khách hàng đã đăng ký
- **API:** `GET /api/admin/reports/dashboard`
- **Trường:** `overview.total_customers`

#### 📚 Tổng Sách
- **Icon:** Book Open (màu cam)
- **Dữ liệu:** Tổng số sách trong hệ thống
- **API:** `GET /api/admin/reports/dashboard`
- **Trường:** `overview.total_books`

---

### 2. **Thống Kê Tháng Này (This Month)**

Hiển thị các chỉ số của tháng hiện tại:

#### 📊 Đơn Hàng Tháng Này
- **Dữ liệu:** Số đơn hàng đã thanh toán trong tháng hiện tại
- **Trường:** `this_month.orders_this_month`
- **Màu:** Xanh dương

#### 💵 Doanh Thu Tháng Này
- **Dữ liệu:** Tổng doanh thu từ các đơn hàng đã thanh toán trong tháng
- **Trường:** `this_month.revenue_this_month`
- **Format:** Định dạng tiền tệ VNĐ
- **Màu:** Xanh lá

---

### 3. **Cảnh Báo (Alerts)**

Hiển thị các cảnh báo quan trọng cần xử lý:

#### ⏰ Đơn Hàng Chờ Xử Lý
- **Icon:** Clock (màu vàng)
- **Dữ liệu:** Số đơn hàng có trạng thái `pending` hoặc `confirmed`
- **Trường:** `pending_orders`
- **Ý nghĩa:** Các đơn hàng cần admin xử lý ngay
- **Hành động:** Click để xem chi tiết tại `/admin/orders`

#### ⚠️ Sách Sắp Hết Hàng
- **Icon:** Exclamation Triangle (màu đỏ)
- **Dữ liệu:** Số sách có `stock_quantity < 10` và `> 0`
- **Trường:** `low_stock_books`
- **Ý nghĩa:** Cần nhập thêm hàng
- **Hành động:** Click để quản lý tại `/admin/books`

---

### 4. **Truy Cập Nhanh (Quick Actions)**

4 nút truy cập nhanh đến các chức năng chính:

#### 📚 Quản Lý Sách
- **URL:** `/admin/books`
- **Màu:** Xanh dương
- **Chức năng:** 
  - Xem danh sách sách
  - Thêm sách mới
  - Sửa thông tin sách
  - Xóa sách
  - Upload hình ảnh
  - Cập nhật tồn kho

#### 🛒 Quản Lý Đơn Hàng
- **URL:** `/admin/orders`
- **Màu:** Xanh lá
- **Chức năng:**
  - Xem tất cả đơn hàng
  - Xem chi tiết đơn hàng
  - Cập nhật trạng thái đơn hàng
  - Xem lịch sử thay đổi trạng thái

#### 👥 Quản Lý Khách Hàng
- **URL:** `/admin/customers`
- **Màu:** Tím
- **Chức năng:**
  - Xem danh sách khách hàng
  - Xem chi tiết khách hàng
  - Khóa/Mở khóa tài khoản
  - Kích hoạt/Vô hiệu hóa tài khoản

#### 📊 Báo Cáo
- **URL:** `/admin/reports`
- **Màu:** Cam
- **Chức năng:**
  - Báo cáo doanh thu theo quý
  - Sách bán chạy nhất
  - Khách hàng mới
  - Xuất báo cáo Excel/PDF

---

## 🔄 TỰ ĐỘNG CẬP NHẬT

- **Refresh Interval:** Dashboard tự động làm mới dữ liệu mỗi **30 giây**
- **Real-time:** Hiển thị thời gian cập nhật lần cuối
- **Loading State:** Hiển thị spinner khi đang tải dữ liệu
- **Error Handling:** Hiển thị thông báo lỗi nếu không tải được dữ liệu

---

## 🎨 THIẾT KẾ UI/UX

### Màu Sắc
- **Xanh dương (#3b82f6):** Đơn hàng
- **Xanh lá (#10b981):** Doanh thu
- **Tím (#8b5cf6):** Khách hàng
- **Cam (#f59e0b):** Sách
- **Vàng:** Cảnh báo nhẹ
- **Đỏ:** Cảnh báo nghiêm trọng

### Layout
- **Responsive:** Tự động điều chỉnh theo kích thước màn hình
- **Grid System:** 
  - Desktop: 4 cột cho overview stats
  - Tablet: 2 cột
  - Mobile: 1 cột

### Icons
Sử dụng **Heroicons** (React Icons) cho tất cả các icon

---

## 🔌 API ENDPOINTS

### GET `/api/admin/reports/dashboard`

**Authentication:** Required (Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_customers": 10,
      "total_books": 5,
      "total_orders": 25,
      "total_revenue": 5000000
    },
    "this_month": {
      "orders_this_month": 5,
      "revenue_this_month": 1000000
    },
    "pending_orders": 3,
    "low_stock_books": 2
  }
}
```

---

## 📋 CÁC TÍNH NĂNG LIÊN QUAN

Dashboard tích hợp với các tính năng admin sau:

### ✅ AD-01: Quản lý sách (CRUD)
- Hiển thị tổng số sách
- Cảnh báo sách sắp hết hàng
- Link đến trang quản lý sách

### ✅ AD-05: Quản lý khách hàng
- Hiển thị tổng số khách hàng
- Link đến trang quản lý khách hàng

### ✅ AD-06: Quản lý đơn hàng
- Hiển thị tổng số đơn hàng
- Cảnh báo đơn hàng chờ xử lý
- Link đến trang quản lý đơn hàng

### ✅ AD-07: Báo cáo doanh thu
- Hiển thị tổng doanh thu
- Doanh thu tháng này
- Link đến trang báo cáo chi tiết

---

## 🚀 CÁCH SỬ DỤNG

1. **Đăng nhập** với tài khoản admin
2. **Truy cập** `/admin/dashboard` hoặc click "Dashboard" trong menu admin
3. **Xem** các thống kê tổng quan
4. **Kiểm tra** các cảnh báo cần xử lý
5. **Click** vào các nút truy cập nhanh để quản lý từng phần

---

## 💡 LƯU Ý

- Dashboard tự động refresh mỗi 30 giây
- Dữ liệu được lấy từ database real-time
- Cần có quyền admin để truy cập
- Tất cả số liệu chỉ tính các đơn hàng đã thanh toán (`payment_status = 'paid'`)

---

## 🔐 BẢO MẬT

- **Authentication:** Yêu cầu JWT token
- **Authorization:** Chỉ admin mới truy cập được
- **Route Protection:** Sử dụng `AdminRoute` component
- **API Protection:** Middleware `protect` + `isAdmin`

---

**📝 Cập nhật lần cuối:** 2024  
**👨‍💻 Developer:** Bookstore Team

