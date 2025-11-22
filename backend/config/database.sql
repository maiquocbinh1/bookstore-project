-- =====================================================
-- HỆ THỐNG BÁN SÁCH TRỰC TUYẾN - DATABASE SCHEMA
-- MySQL Workbench Script
-- =====================================================

-- Tạo database
CREATE DATABASE IF NOT EXISTS bookstore_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bookstore_db;

-- =====================================================
-- 1. BẢNG USERS (Người dùng)
-- =====================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('customer', 'admin') DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    is_locked BOOLEAN DEFAULT FALSE,
    failed_login_attempts INT DEFAULT 0,
    locked_until DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. BẢNG PASSWORD_RESET_TOKENS (Token đặt lại mật khẩu)
-- =====================================================
CREATE TABLE password_reset_tokens (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. BẢNG CATEGORIES (Thể loại sách)
-- =====================================================
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. BẢNG BOOKS (Sách)
-- =====================================================
CREATE TABLE books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    isbn VARCHAR(13) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    publication_year INT,
    category_id INT,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    INDEX idx_title (title),
    INDEX idx_author (author),
    INDEX idx_isbn (isbn),
    INDEX idx_category (category_id),
    FULLTEXT idx_search (title, author, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. BẢNG ADDRESSES (Địa chỉ giao hàng)
-- =====================================================
CREATE TABLE addresses (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. BẢNG ORDERS (Đơn hàng)
-- =====================================================
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_code VARCHAR(50) NOT NULL UNIQUE,
    address_id INT,
    subtotal DECIMAL(10, 2) NOT NULL,
    vat DECIMAL(10, 2) DEFAULT 0,
    shipping_fee DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('unpaid', 'paid', 'failed', 'refunded') DEFAULT 'unpaid',
    payment_method ENUM('cod', 'bank_transfer', 'credit_card', 'e_wallet') DEFAULT 'cod',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (address_id) REFERENCES addresses(address_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_order_code (order_code),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. BẢNG ORDER_ITEMS (Chi tiết đơn hàng)
-- =====================================================
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    book_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE RESTRICT,
    INDEX idx_order (order_id),
    INDEX idx_book (book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. BẢNG INVOICES (Hóa đơn)
-- =====================================================
CREATE TABLE invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    invoice_code VARCHAR(50) NOT NULL UNIQUE,
    invoice_date DATETIME NOT NULL,
    pdf_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_code (invoice_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. BẢNG CART (Giỏ hàng)
-- =====================================================
CREATE TABLE cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_book (user_id, book_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. BẢNG REVIEWS (Đánh giá/Bình luận - Would be Nice)
-- =====================================================
CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_book (book_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. BẢNG ORDER_STATUS_HISTORY (Lịch sử trạng thái đơn hàng)
-- =====================================================
CREATE TABLE order_status_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DỮ LIỆU MẪU (Sample Data)
-- =====================================================

-- Thêm admin mặc định (password: Admin@123)
-- QUAN TRỌNG: Chạy lệnh này sau khi tạo database
-- Hash được tạo từ bcrypt với 10 rounds cho password: Admin@123
INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES
('admin@bookstore.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Administrator', 'admin', TRUE)
ON DUPLICATE KEY UPDATE email = email;

-- Thêm categories mẫu
INSERT INTO categories (category_name, description) VALUES
('Văn học', 'Sách văn học trong nước và ngoại quốc'),
('Kinh tế', 'Sách về kinh tế, kinh doanh, khởi nghiệp'),
('Kỹ năng sống', 'Sách phát triển bản thân và kỹ năng mềm'),
('Công nghệ', 'Sách về lập trình, công nghệ thông tin'),
('Thiếu nhi', 'Sách dành cho trẻ em và thanh thiếu niên'),
('Lịch sử', 'Sách về lịch sử Việt Nam và thế giới'),
('Khoa học', 'Sách khoa học tự nhiên và ứng dụng'),
('Tâm lý', 'Sách về tâm lý học và hành vi con người');

-- Thêm sách mẫu
INSERT INTO books (isbn, title, author, publisher, publication_year, category_id, description, price, stock_quantity, image_url) VALUES
('9780062316097', 'Sapiens: Lược Sử Loài Người', 'Yuval Noah Harari', 'NXB Trẻ', 2018, 6, 'Cuốn sách về lịch sử loài người từ thời kỳ đồ đá đến hiện đại', 189000, 100, '/images/sapiens.jpg'),
('9780735211292', 'Atomic Habits', 'James Clear', 'NXB Tổng Hợp', 2020, 3, 'Hướng dẫn xây dựng thói quen tốt và phá vỡ thói quen xấu', 159000, 150, '/images/atomic-habits.jpg'),
('9780062457714', 'The Subtle Art of Not Giving a F*ck', 'Mark Manson', 'NXB Thế Giới', 2019, 3, 'Nghệ thuật tinh tế của việc không bận tâm', 129000, 80, '/images/subtle-art.jpg'),
('9781593279509', 'Eloquent JavaScript', 'Marijn Haverbeke', 'No Starch Press', 2018, 4, 'Giới thiệu về lập trình JavaScript hiện đại', 299000, 50, '/images/eloquent-js.jpg'),
('9780596517748', 'JavaScript: The Good Parts', 'Douglas Crockford', 'O Reilly Media', 2008, 4, 'Các phần tốt nhất của JavaScript', 249000, 60, '/images/js-good-parts.jpg');

-- =====================================================
-- VIEWS (Các view hữu ích)
-- =====================================================

-- View: Thống kê sách bán chạy
CREATE OR REPLACE VIEW v_bestselling_books AS
SELECT 
    b.book_id,
    b.title,
    b.author,
    b.price,
    COUNT(oi.order_item_id) as order_count,
    SUM(oi.quantity) as total_sold,
    SUM(oi.subtotal) as total_revenue
FROM books b
INNER JOIN order_items oi ON b.book_id = oi.book_id
INNER JOIN orders o ON oi.order_id = o.order_id
WHERE o.status NOT IN ('cancelled')
GROUP BY b.book_id, b.title, b.author, b.price
ORDER BY total_sold DESC;

-- View: Doanh thu theo tháng
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT 
    YEAR(created_at) as year,
    MONTH(created_at) as month,
    COUNT(order_id) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
FROM orders
WHERE payment_status = 'paid'
GROUP BY YEAR(created_at), MONTH(created_at)
ORDER BY year DESC, month DESC;

-- View: Khách hàng mới
CREATE OR REPLACE VIEW v_new_customers AS
SELECT 
    user_id,
    email,
    full_name,
    created_at as registration_date,
    (SELECT COUNT(*) FROM orders WHERE orders.user_id = users.user_id) as total_orders
FROM users
WHERE role = 'customer'
ORDER BY created_at DESC;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- Procedure: Cập nhật tồn kho sau khi đặt hàng
DELIMITER //
CREATE PROCEDURE sp_update_stock_after_order(IN p_order_id INT)
BEGIN
    UPDATE books b
    INNER JOIN order_items oi ON b.book_id = oi.book_id
    SET b.stock_quantity = b.stock_quantity - oi.quantity
    WHERE oi.order_id = p_order_id;
END //
DELIMITER ;

-- Procedure: Kiểm tra tồn kho trước khi đặt hàng
DELIMITER //
CREATE PROCEDURE sp_check_stock_availability(IN p_book_id INT, IN p_quantity INT, OUT p_available BOOLEAN)
BEGIN
    DECLARE v_stock INT;
    SELECT stock_quantity INTO v_stock FROM books WHERE book_id = p_book_id;
    SET p_available = (v_stock >= p_quantity);
END //
DELIMITER ;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Ghi lại lịch sử thay đổi trạng thái đơn hàng
DELIMITER //
CREATE TRIGGER trg_order_status_change
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO order_status_history (order_id, old_status, new_status, notes)
        VALUES (NEW.order_id, OLD.status, NEW.status, CONCAT('Status changed from ', OLD.status, ' to ', NEW.status));
    END IF;
END //
DELIMITER ;

-- Trigger: Kiểm tra số lượng trước khi xóa category
DELIMITER //
CREATE TRIGGER trg_prevent_category_delete
BEFORE DELETE ON categories
FOR EACH ROW
BEGIN
    DECLARE book_count INT;
    SELECT COUNT(*) INTO book_count FROM books WHERE category_id = OLD.category_id;
    IF book_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete category with existing books';
    END IF;
END //
DELIMITER ;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_books_price ON books(price);
CREATE INDEX idx_books_stock ON books(stock_quantity);

-- =====================================================
-- GRANT PERMISSIONS (Tùy chỉnh theo nhu cầu)
-- =====================================================
-- CREATE USER 'bookstore_user'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON bookstore_db.* TO 'bookstore_user'@'localhost';
-- FLUSH PRIVILEGES;
