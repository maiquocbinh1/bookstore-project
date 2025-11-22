const { pool } = require('../config/database');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

// Hàm tạo mã đơn hàng unique
const generateOrderCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// KH-08, KH-09, KH-10: Tạo đơn hàng với tính toán chính xác
exports.createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.user.user_id;
    const { address_id, payment_method = 'cod', notes } = req.body;

    // Lấy thông tin địa chỉ
    const [addresses] = await connection.query(
      'SELECT * FROM addresses WHERE address_id = ? AND user_id = ?',
      [address_id, userId]
    );

    if (addresses.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Địa chỉ giao hàng không hợp lệ'
      });
    }

    // Lấy giỏ hàng
    const [cartItems] = await connection.query(
      `SELECT c.*, b.price, b.stock_quantity, b.title
       FROM cart c
       JOIN books b ON c.book_id = b.book_id
       WHERE c.user_id = ?`,
      [userId]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng trống'
      });
    }

    // Kiểm tra tồn kho
    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Sách "${item.title}" chỉ còn ${item.stock_quantity} trong kho`
        });
      }
    }

    // KH-08: Tính toán chính xác
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vat = subtotal * 0.1; // VAT 10%
    
    // Phí vận chuyển (giả lập theo logic)
    let shipping_fee = 0;
    if (subtotal < 200000) {
      shipping_fee = 30000; // < 200k: phí 30k
    } else if (subtotal < 500000) {
      shipping_fee = 20000; // 200k-500k: phí 20k
    } else {
      shipping_fee = 0; // >= 500k: miễn phí
    }

    const total_amount = subtotal + vat + shipping_fee;

    // Tạo đơn hàng
    const order_code = generateOrderCode();
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, order_code, address_id, subtotal, vat, shipping_fee, 
        total_amount, status, payment_status, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?, ?)`,
      [userId, order_code, address_id, subtotal, vat, shipping_fee, total_amount, payment_method, notes]
    );

    const order_id = orderResult.insertId;

    // Thêm order items
    for (const item of cartItems) {
      const item_subtotal = item.price * item.quantity;
      await connection.query(
        'INSERT INTO order_items (order_id, book_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [order_id, item.book_id, item.quantity, item.price, item_subtotal]
      );

      // Giảm tồn kho
      await connection.query(
        'UPDATE books SET stock_quantity = stock_quantity - ? WHERE book_id = ?',
        [item.quantity, item.book_id]
      );
    }

    // Xóa giỏ hàng
    await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);

    await connection.commit();

    // Lấy thông tin đơn hàng vừa tạo
    const [orders] = await pool.query(
      `SELECT o.*, a.recipient_name, a.phone, a.address_line, a.city, a.district
       FROM orders o
       JOIN addresses a ON o.address_id = a.address_id
       WHERE o.order_id = ?`,
      [order_id]
    );

    res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thành công',
      data: orders[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đơn hàng',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// KH-10, KH-11: Mô phỏng thanh toán (Payment Gateway giả lập)
exports.processPayment = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { order_id, payment_info } = req.body;
    const userId = req.user.user_id;

    // Kiểm tra đơn hàng
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
      [order_id, userId]
    );

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    const order = orders[0];

    if (order.payment_status === 'paid') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được thanh toán'
      });
    }

    // Mô phỏng xử lý thanh toán
    // KH-10: Thành công, KH-11: Thất bại
    const isPaymentSuccess = payment_info.simulate_success !== false; // Mặc định thành công

    if (isPaymentSuccess) {
      // KH-10: Thanh toán thành công
      await connection.query(
        'UPDATE orders SET payment_status = ?, status = ? WHERE order_id = ?',
        ['paid', 'confirmed', order_id]
      );

      // KH-12: Tạo hóa đơn
      const invoice_code = `INV-${order.order_code}`;
      const invoice_date = new Date();

      await connection.query(
        'INSERT INTO invoices (order_id, invoice_code, invoice_date) VALUES (?, ?, ?)',
        [order_id, invoice_code, invoice_date]
      );

      await connection.commit();

      // Gửi email xác nhận
      const [userInfo] = await pool.query('SELECT email FROM users WHERE user_id = ?', [userId]);
      if (userInfo.length > 0) {
        await sendOrderConfirmationEmail(userInfo[0].email, order);
      }

      res.json({
        success: true,
        message: 'Thanh toán thành công',
        data: {
          order_id,
          payment_status: 'paid',
          invoice_code
        }
      });
    } else {
      // KH-11: Thanh toán thất bại
      await connection.query(
        'UPDATE orders SET payment_status = ? WHERE order_id = ?',
        ['failed', order_id]
      );

      await connection.commit();

      res.status(400).json({
        success: false,
        message: 'Thanh toán thất bại. Vui lòng thử lại.',
        data: {
          order_id,
          payment_status: 'failed'
        }
      });
    }
  } catch (error) {
    await connection.rollback();
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý thanh toán',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// KH-13: Lấy lịch sử đơn hàng (10 đơn gần nhất, có phân trang)
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Đếm tổng số đơn hàng
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
      [userId]
    );
    const total = countResult[0].total;

    // Lấy danh sách đơn hàng
    const [orders] = await pool.query(
      `SELECT 
        o.order_id, o.order_code, o.subtotal, o.vat, o.shipping_fee, 
        o.total_amount, o.status, o.payment_status, o.payment_method,
        o.created_at, o.updated_at,
        a.recipient_name, a.phone, a.address_line, a.city
       FROM orders o
       LEFT JOIN addresses a ON o.address_id = a.address_id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // Lấy items cho mỗi đơn hàng
    for (let order of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, b.title, b.author, b.image_url
         FROM order_items oi
         JOIN books b ON oi.book_id = b.book_id
         WHERE oi.order_id = ?`,
        [order.order_id]
      );
      order.items = items;
    }

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
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử đơn hàng',
      error: error.message
    });
  }
};

// KH-14: Lấy chi tiết đơn hàng
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const [orders] = await pool.query(
      `SELECT 
        o.*,
        a.recipient_name, a.phone, a.address_line, a.city, a.district
       FROM orders o
       LEFT JOIN addresses a ON o.address_id = a.address_id
       WHERE o.order_id = ? AND o.user_id = ?`,
      [id, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    const order = orders[0];

    // Lấy items
    const [items] = await pool.query(
      `SELECT oi.*, b.title, b.author, b.image_url, b.isbn
       FROM order_items oi
       JOIN books b ON oi.book_id = b.book_id
       WHERE oi.order_id = ?`,
      [id]
    );

    order.items = items;

    // Lấy lịch sử trạng thái
    const [statusHistory] = await pool.query(
      `SELECT * FROM order_status_history 
       WHERE order_id = ? 
       ORDER BY created_at DESC`,
      [id]
    );

    order.status_history = statusHistory;

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin đơn hàng',
      error: error.message
    });
  }
};

// Hủy đơn hàng (chỉ khi đơn hàng ở trạng thái pending hoặc confirmed)
exports.cancelOrder = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const userId = req.user.user_id;

    // Lấy thông tin đơn hàng
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
      [id, userId]
    );

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    const order = orders[0];

    // Kiểm tra trạng thái có thể hủy
    if (!['pending', 'confirmed'].includes(order.status)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn hàng ở trạng thái hiện tại'
      });
    }

    // Hoàn lại tồn kho
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

    // Cập nhật trạng thái đơn hàng
    await connection.query(
      'UPDATE orders SET status = ?, payment_status = ? WHERE order_id = ?',
      ['cancelled', 'refunded', id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Hủy đơn hàng thành công'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy đơn hàng',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Quản lý địa chỉ giao hàng
exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [addresses] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách địa chỉ',
      error: error.message
    });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { recipient_name, phone, address_line, city, district, is_default } = req.body;

    // Nếu đặt làm địa chỉ mặc định, bỏ mặc định các địa chỉ khác
    if (is_default) {
      await pool.query(
        'UPDATE addresses SET is_default = FALSE WHERE user_id = ?',
        [userId]
      );
    }

    const [result] = await pool.query(
      `INSERT INTO addresses (user_id, recipient_name, phone, address_line, city, district, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, recipient_name, phone, address_line, city, district || null, is_default || false]
    );

    res.status(201).json({
      success: true,
      message: 'Thêm địa chỉ thành công',
      data: {
        address_id: result.insertId
      }
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm địa chỉ',
      error: error.message
    });
  }
};
