const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');
const { generateReportPDF, generateReportExcel } = require('../utils/reports');

// AD-01: Thêm sách mới
exports.createBook = async (req, res) => {
  try {
    const {
      isbn, title, author, category_id, description,
      price, stock_quantity, publisher, published_year, pages, language
    } = req.body;

    // Kiểm tra ISBN đã tồn tại
    const [existing] = await pool.query('SELECT id FROM books WHERE isbn = ?', [isbn]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'ISBN đã tồn tại'
      });
    }

    // AD-02: Xử lý upload ảnh
    let image_url = null;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    // Thêm sách
    const [result] = await pool.query(
      `INSERT INTO books (isbn, title, author, category_id, description, price, stock_quantity, 
       image_url, publisher, published_year, pages, language)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [isbn, title, author, category_id || null, description, price, stock_quantity,
       image_url, publisher, published_year, pages, language || 'Vietnamese']
    );

    res.status(201).json({
      success: true,
      message: 'Thêm sách thành công',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm sách'
    });
  }
};

// AD-01: Cập nhật sách
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      isbn, title, author, category_id, description,
      price, stock_quantity, publisher, published_year, pages, language
    } = req.body;

    // Kiểm tra sách tồn tại
    const [books] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    const book = books[0];

    // Kiểm tra ISBN trùng (nếu thay đổi ISBN)
    if (isbn !== book.isbn) {
      const [existing] = await pool.query('SELECT id FROM books WHERE isbn = ? AND id != ?', [isbn, id]);
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'ISBN đã tồn tại'
        });
      }
    }

    // AD-02: Xử lý upload ảnh mới
    let image_url = book.image_url;
    if (req.file) {
      // Xóa ảnh cũ nếu có
      if (book.image_url) {
        const oldImagePath = path.join(__dirname, '..', book.image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      image_url = `/uploads/${req.file.filename}`;
    }

    // Cập nhật sách
    await pool.query(
      `UPDATE books SET isbn = ?, title = ?, author = ?, category_id = ?, description = ?,
       price = ?, stock_quantity = ?, image_url = ?, publisher = ?, published_year = ?, 
       pages = ?, language = ?
       WHERE id = ?`,
      [isbn, title, author, category_id || null, description, price, stock_quantity,
       image_url, publisher, published_year, pages, language || 'Vietnamese', id]
    );

    res.json({
      success: true,
      message: 'Cập nhật sách thành công'
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật sách'
    });
  }
};

// AD-01: Xóa sách
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra sách tồn tại
    const [books] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    const book = books[0];

    // Xóa ảnh nếu có
    if (book.image_url) {
      const imagePath = path.join(__dirname, '..', book.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Xóa sách
    await pool.query('DELETE FROM books WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Xóa sách thành công'
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa sách'
    });
  }
};

// AD-03: Cập nhật tồn kho
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;

    const [books] = await pool.query('SELECT id FROM books WHERE id = ?', [id]);
    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    await pool.query('UPDATE books SET stock_quantity = ? WHERE id = ?', [stock_quantity, id]);

    res.json({
      success: true,
      message: 'Cập nhật tồn kho thành công'
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật tồn kho'
    });
  }
};

// AD-04: Quản lý categories - Thêm
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const [result] = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || null]
    );

    res.status(201).json({
      success: true,
      message: 'Thêm thể loại thành công',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm thể loại'
    });
  }
};

// AD-04: Cập nhật category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const [categories] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thể loại'
      });
    }

    await pool.query(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );

    res.json({
      success: true,
      message: 'Cập nhật thể loại thành công'
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thể loại'
    });
  }
};

// AD-04: Xóa category (có cảnh báo nếu có sách thuộc thể loại)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra category tồn tại
    const [categories] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thể loại'
      });
    }

    // Kiểm tra có sách thuộc category không
    const [books] = await pool.query('SELECT COUNT(*) as count FROM books WHERE category_id = ?', [id]);
    if (books[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa. Có ${books[0].count} sách thuộc thể loại này`
      });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Xóa thể loại thành công'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa thể loại'
    });
  }
};

// AD-05: Khóa/Mở khóa tài khoản khách hàng
exports.toggleUserLock = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra user tồn tại và là customer
    const [users] = await pool.query('SELECT * FROM users WHERE id = ? AND role = ?', [id, 'customer']);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

    const user = users[0];
    const newLockStatus = !user.is_locked;

    await pool.query('UPDATE users SET is_locked = ? WHERE id = ?', [newLockStatus, id]);

    res.json({
      success: true,
      message: newLockStatus ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản'
    });
  } catch (error) {
    console.error('Toggle user lock error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy danh sách khách hàng
exports.getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE role = ?',
      ['customer']
    );
    const total = countResult[0].total;

    const [customers] = await pool.query(
      `SELECT id, email, full_name, phone, address, is_locked, created_at
       FROM users WHERE role = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      ['customer', limit, offset]
    );

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// AD-06: Lấy danh sách đơn hàng (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = 'SELECT COUNT(*) as total FROM orders';
    let params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    const [countResult] = await pool.query(query, params);
    const total = countResult[0].total;

    query = `SELECT o.*, u.full_name as customer_name, u.email as customer_email
             FROM orders o
             JOIN users u ON o.user_id = u.id`;
    
    if (status) {
      query += ' WHERE o.status = ?';
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [orders] = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// AD-06: Cập nhật trạng thái đơn hàng (với validation)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    // Kiểm tra order tồn tại
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    const order = orders[0];

    // Kiểm tra transition hợp lệ (không cho chuyển từ delivered/cancelled sang trạng thái khác)
    const invalidTransitions = {
      'delivered': ['pending', 'confirmed', 'processing', 'shipped', 'cancelled'],
      'cancelled': ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
    };

    if (invalidTransitions[order.status] && invalidTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ trạng thái "${order.status}" sang "${status}"`
      });
    }

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// AD-07: Báo cáo doanh thu và số đơn hàng theo quý
exports.getQuarterlyReport = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.floor((new Date().getMonth()) / 3) + 1;

    // Tính ngày bắt đầu và kết thúc quý
    const quarterStartMonth = (currentQuarter - 1) * 3;
    const startDate = new Date(currentYear, quarterStartMonth, 1);
    const endDate = new Date(currentYear, quarterStartMonth + 3, 0, 23, 59, 59);

    // Doanh thu và số đơn hàng
    const [revenueResult] = await pool.query(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_order_value
       FROM orders
       WHERE status != 'cancelled' 
       AND payment_status = 'paid'
       AND created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    // Doanh thu theo tháng trong quý
    const [monthlyRevenue] = await pool.query(
      `SELECT 
        MONTH(created_at) as month,
        COUNT(*) as orders_count,
        SUM(total_amount) as revenue
       FROM orders
       WHERE status != 'cancelled'
       AND payment_status = 'paid'
       AND created_at BETWEEN ? AND ?
       GROUP BY MONTH(created_at)
       ORDER BY month`,
      [startDate, endDate]
    );

    res.json({
      success: true,
      data: {
        quarter: currentQuarter,
        year: currentYear,
        summary: revenueResult[0],
        monthly_breakdown: monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Get quarterly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// AD-08: Báo cáo sách bán chạy nhất
exports.getBestSellingBooks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [books] = await pool.query(
      `SELECT 
        b.id, b.title, b.author, b.price, b.image_url,
        SUM(oi.quantity) as total_sold,
        SUM(oi.subtotal) as total_revenue
       FROM books b
       JOIN order_items oi ON b.id = oi.book_id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'cancelled' AND o.payment_status = 'paid'
       GROUP BY b.id
       ORDER BY total_sold DESC
       LIMIT ?`,
      [limit]
    );

    res.json({
      success: true,
      data: books
    });
  } catch (error) {
    console.error('Get best selling books error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// AD-08: Báo cáo khách hàng mới
exports.getNewCustomers = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [customers] = await pool.query(
      `SELECT 
        id, email, full_name, phone, created_at,
        (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as orders_count
       FROM users
       WHERE role = 'customer' AND created_at >= ?
       ORDER BY created_at DESC`,
      [startDate]
    );

    res.json({
      success: true,
      data: {
        period_days: days,
        total_new_customers: customers.length,
        customers
      }
    });
  } catch (error) {
    console.error('Get new customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// AD-09: Xuất báo cáo ra PDF
exports.exportReportPDF = async (req, res) => {
  try {
    const { type } = req.query; // 'revenue', 'bestsellers', 'customers'

    let data;
    let reportTitle;

    if (type === 'revenue') {
      // Lấy dữ liệu doanh thu
      const currentYear = new Date().getFullYear();
      const currentQuarter = Math.floor((new Date().getMonth()) / 3) + 1;
      const quarterStartMonth = (currentQuarter - 1) * 3;
      const startDate = new Date(currentYear, quarterStartMonth, 1);
      const endDate = new Date(currentYear, quarterStartMonth + 3, 0, 23, 59, 59);

      const [revenueData] = await pool.query(
        `SELECT * FROM orders 
         WHERE status != 'cancelled' AND payment_status = 'paid'
         AND created_at BETWEEN ? AND ?
         ORDER BY created_at DESC`,
        [startDate, endDate]
      );

      data = revenueData;
      reportTitle = `Báo cáo doanh thu Quý ${currentQuarter}/${currentYear}`;
    } else if (type === 'bestsellers') {
      const [booksData] = await pool.query(
        `SELECT 
          b.title, b.author, b.price,
          SUM(oi.quantity) as total_sold,
          SUM(oi.subtotal) as total_revenue
         FROM books b
         JOIN order_items oi ON b.id = oi.book_id
         JOIN orders o ON oi.order_id = o.id
         WHERE o.status != 'cancelled' AND o.payment_status = 'paid'
         GROUP BY b.id
         ORDER BY total_sold DESC
         LIMIT 20`
      );

      data = booksData;
      reportTitle = 'Báo cáo Sách bán chạy nhất';
    }

    const pdfBuffer = await generateReportPDF(reportTitle, data, type);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xuất báo cáo'
    });
  }
};

// AD-09: Xuất báo cáo ra Excel
exports.exportReportExcel = async (req, res) => {
  try {
    const { type } = req.query;

    let data;
    let filename;

    if (type === 'revenue') {
      const currentYear = new Date().getFullYear();
      const currentQuarter = Math.floor((new Date().getMonth()) / 3) + 1;
      const quarterStartMonth = (currentQuarter - 1) * 3;
      const startDate = new Date(currentYear, quarterStartMonth, 1);
      const endDate = new Date(currentYear, quarterStartMonth + 3, 0, 23, 59, 59);

      const [revenueData] = await pool.query(
        `SELECT 
          order_number, total_amount, status, payment_status, created_at
         FROM orders 
         WHERE status != 'cancelled' AND payment_status = 'paid'
         AND created_at BETWEEN ? AND ?
         ORDER BY created_at DESC`,
        [startDate, endDate]
      );

      data = revenueData;
      filename = `revenue-Q${currentQuarter}-${currentYear}`;
    } else if (type === 'bestsellers') {
      const [booksData] = await pool.query(
        `SELECT 
          b.title as 'Tên sách', 
          b.author as 'Tác giả', 
          b.price as 'Giá',
          SUM(oi.quantity) as 'Số lượng bán',
          SUM(oi.subtotal) as 'Doanh thu'
         FROM books b
         JOIN order_items oi ON b.id = oi.book_id
         JOIN orders o ON oi.order_id = o.id
         WHERE o.status != 'cancelled' AND o.payment_status = 'paid'
         GROUP BY b.id
         ORDER BY SUM(oi.quantity) DESC
         LIMIT 50`
      );

      data = booksData;
      filename = 'bestselling-books';
    }

    const excelBuffer = await generateReportExcel(data, type);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}-${Date.now()}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xuất báo cáo'
    });
  }
};

