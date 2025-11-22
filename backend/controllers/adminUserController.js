const { pool } = require('../config/database');

// AD-05: Danh sách khách hàng
exports.getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = "WHERE role = 'customer'";
    let queryParams = [];

    if (search) {
      whereClause += " AND (email LIKE ? OR full_name LIKE ?)";
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Đếm tổng số khách hàng
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // Lấy danh sách khách hàng
    const [customers] = await pool.query(
      `SELECT 
        user_id, email, full_name, phone, is_active, is_locked, 
        failed_login_attempts, created_at,
        (SELECT COUNT(*) FROM orders WHERE orders.user_id = users.user_id) as total_orders,
        (SELECT SUM(total_amount) FROM orders WHERE orders.user_id = users.user_id AND payment_status = 'paid') as total_spent
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách khách hàng',
      error: error.message
    });
  }
};

// AD-05: Tạm khóa/mở khóa tài khoản khách hàng
exports.toggleLockAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_locked, reason } = req.body;

    // Không cho phép khóa tài khoản admin
    const [users] = await pool.query(
      'SELECT role, is_locked FROM users WHERE user_id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    if (users[0].role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Không thể khóa tài khoản quản trị viên'
      });
    }

    // Cập nhật trạng thái khóa
    if (is_locked) {
      // Khóa tài khoản
      await pool.query(
        'UPDATE users SET is_locked = TRUE, locked_until = NULL WHERE user_id = ?',
        [id]
      );
    } else {
      // Mở khóa tài khoản
      await pool.query(
        'UPDATE users SET is_locked = FALSE, locked_until = NULL, failed_login_attempts = 0 WHERE user_id = ?',
        [id]
      );
    }

    res.json({
      success: true,
      message: is_locked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản'
    });
  } catch (error) {
    console.error('Toggle lock account error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái tài khoản',
      error: error.message
    });
  }
};

// Vô hiệu hóa/kích hoạt tài khoản
exports.toggleActiveAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Không cho phép vô hiệu hóa tài khoản admin
    const [users] = await pool.query(
      'SELECT role FROM users WHERE user_id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    if (users[0].role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Không thể vô hiệu hóa tài khoản quản trị viên'
      });
    }

    await pool.query(
      'UPDATE users SET is_active = ? WHERE user_id = ?',
      [is_active, id]
    );

    res.json({
      success: true,
      message: is_active ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản'
    });
  } catch (error) {
    console.error('Toggle active account error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái tài khoản',
      error: error.message
    });
  }
};

// Xem chi tiết khách hàng
exports.getCustomerDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [customers] = await pool.query(
      `SELECT 
        user_id, email, full_name, phone, is_active, is_locked, 
        failed_login_attempts, created_at, updated_at
       FROM users
       WHERE user_id = ? AND role = 'customer'`,
      [id]
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

    const customer = customers[0];

    // Thống kê đơn hàng
    const [orderStats] = await pool.query(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_spent,
        MAX(created_at) as last_order_date
       FROM orders
       WHERE user_id = ?`,
      [id]
    );

    customer.order_statistics = orderStats[0];

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Get customer detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin khách hàng',
      error: error.message
    });
  }
};

