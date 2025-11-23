const { pool } = require('../config/database');

// AD-06: Xem tất cả đơn hàng
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || '';
    const search = req.query.search || '';

    let whereConditions = [];
    let queryParams = [];

    if (status) {
      whereConditions.push('o.status = ?');
      queryParams.push(status);
    }

    if (search) {
      whereConditions.push('(o.order_code LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Đếm tổng số đơn hàng
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // Lấy danh sách đơn hàng
    const [orders] = await pool.query(
      `SELECT 
        o.order_id, o.order_code, o.total_amount, o.status, 
        o.payment_status, o.payment_method, o.created_at, o.updated_at,
        u.user_id, u.full_name, u.email,
        a.recipient_name, a.phone, a.address_line, a.city
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       LEFT JOIN addresses a ON o.address_id = a.address_id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
};

// AD-06: Xem chi tiết đơn hàng
exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(
      `SELECT 
        o.*,
        u.full_name as customer_name, u.email as customer_email, u.phone as customer_phone,
        a.recipient_name, a.phone, a.address_line, a.city, a.district
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       LEFT JOIN addresses a ON o.address_id = a.address_id
       WHERE o.order_id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    const order = orders[0];

    // Lấy chi tiết sản phẩm
    const [items] = await pool.query(
      `SELECT oi.*, b.title, b.author, b.isbn, b.image_url
       FROM order_items oi
       JOIN books b ON oi.book_id = b.book_id
       WHERE oi.order_id = ?`,
      [id]
    );

    order.items = items;

    // Lấy lịch sử trạng thái
    const [history] = await pool.query(
      `SELECT h.*, u.full_name as changed_by_name
       FROM order_status_history h
       LEFT JOIN users u ON h.changed_by = u.user_id
       WHERE h.order_id = ?
       ORDER BY h.created_at DESC`,
      [id]
    );

    order.status_history = history;

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết đơn hàng',
      error: error.message
    });
  }
};

// AD-06: Cập nhật trạng thái đơn hàng (với validation chuyển trạng thái hợp lệ)
exports.updateOrderStatus = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user.user_id;

    // Lấy trạng thái hiện tại
    const [orders] = await connection.query(
      'SELECT status FROM orders WHERE order_id = ?',
      [id]
    );

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    const currentStatus = orders[0].status;

    // AD-06: Kiểm tra tính hợp lệ của quy trình chuyển trạng thái
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipping', 'cancelled'],
      'shipping': ['delivered', 'cancelled'],
      'delivered': [], // Không thể chuyển từ delivered
      'cancelled': []  // Không thể chuyển từ cancelled
    };

    if (!validTransitions[currentStatus].includes(status)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển trạng thái từ "${currentStatus}" sang "${status}"`
      });
    }

    // Cập nhật trạng thái
    await connection.query(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [status, id]
    );

    // Ghi lại lịch sử
    await connection.query(
      'INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes) VALUES (?, ?, ?, ?, ?)',
      [id, currentStatus, status, adminId, notes || null]
    );

    // Nếu hủy đơn, hoàn lại tồn kho
    if (status === 'cancelled') {
      const [items] = await connection.query(
        'SELECT book_id, quantity FROM order_items WHERE order_id = ?',
        [id]
      );

      for (const item of items) {
        await connection.query(
          'UPDATE books SET stock_quantity = stock_quantity + ? WHERE book_id = ?',
          [item.quantity, item.book_id]
        );
      }

      // Cập nhật payment_status
      await connection.query(
        'UPDATE orders SET payment_status = ? WHERE order_id = ?',
        ['refunded', id]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái đơn hàng',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Cập nhật trạng thái thanh toán (cho đơn COD)
exports.updatePaymentStatus = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { payment_status } = req.body;

    // Kiểm tra payment_status hợp lệ
    const validStatuses = ['unpaid', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(payment_status)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Trạng thái thanh toán không hợp lệ'
      });
    }

    // Lấy thông tin đơn hàng
    const [orders] = await connection.query(
      'SELECT order_id, payment_status, payment_method, total_amount FROM orders WHERE order_id = ?',
      [id]
    );

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    const order = orders[0];

    // Chỉ cho phép cập nhật từ unpaid sang paid cho đơn COD
    if (payment_status === 'paid' && order.payment_status === 'unpaid' && order.payment_method === 'cod') {
      // Cập nhật payment_status
      await connection.query(
        'UPDATE orders SET payment_status = ? WHERE order_id = ?',
        [payment_status, id]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Xác nhận thanh toán thành công. Doanh số đã được cập nhật.'
      });
    } else {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể xác nhận thanh toán cho đơn COD chưa thanh toán'
      });
    }
  } catch (error) {
    await connection.rollback();
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái thanh toán',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Thống kê trạng thái đơn hàng
exports.getOrderStatusStats = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_amount
       FROM orders
       GROUP BY status`
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get order status stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê đơn hàng',
      error: error.message
    });
  }
};

