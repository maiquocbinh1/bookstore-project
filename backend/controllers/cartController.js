const { pool } = require('../config/database');

// KH-07: Lấy giỏ hàng của user
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [cartItems] = await pool.query(
      `SELECT 
        c.cart_id, c.quantity, c.created_at,
        b.book_id, b.title, b.author, b.price, b.stock_quantity, b.image_url
       FROM cart c
       JOIN books b ON c.book_id = b.book_id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );

    // Tính tổng tiền
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({
      success: true,
      data: {
        items: cartItems,
        subtotal,
        total_items: cartItems.length
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy giỏ hàng',
      error: error.message
    });
  }
};

// KH-07: Thêm sản phẩm vào giỏ hàng
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { book_id, quantity = 1 } = req.body;

    // Kiểm tra sách tồn tại và còn hàng
    const [books] = await pool.query(
      'SELECT book_id, title, stock_quantity FROM books WHERE book_id = ?',
      [book_id]
    );

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    const book = books[0];

    if (book.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Chỉ còn ${book.stock_quantity} sản phẩm trong kho`
      });
    }

    // Kiểm tra sách đã có trong giỏ hàng chưa
    const [existingItems] = await pool.query(
      'SELECT cart_id, quantity FROM cart WHERE user_id = ? AND book_id = ?',
      [userId, book_id]
    );

    if (existingItems.length > 0) {
      // Cập nhật số lượng
      const newQuantity = existingItems[0].quantity + quantity;

      if (book.stock_quantity < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Chỉ có thể thêm tối đa ${book.stock_quantity} sản phẩm`
        });
      }

      await pool.query(
        'UPDATE cart SET quantity = ? WHERE cart_id = ?',
        [newQuantity, existingItems[0].cart_id]
      );

      return res.json({
        success: true,
        message: 'Cập nhật số lượng trong giỏ hàng thành công'
      });
    }

    // Thêm mới vào giỏ hàng
    await pool.query(
      'INSERT INTO cart (user_id, book_id, quantity) VALUES (?, ?, ?)',
      [userId, book_id, quantity]
    );

    res.status(201).json({
      success: true,
      message: 'Thêm sách vào giỏ hàng thành công'
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm vào giỏ hàng',
      error: error.message
    });
  }
};

// KH-07: Cập nhật số lượng sản phẩm trong giỏ hàng
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { cart_id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng phải lớn hơn 0'
      });
    }

    // Kiểm tra item thuộc về user
    const [cartItems] = await pool.query(
      `SELECT c.cart_id, c.book_id, b.stock_quantity
       FROM cart c
       JOIN books b ON c.book_id = b.book_id
       WHERE c.cart_id = ? AND c.user_id = ?`,
      [cart_id, userId]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong giỏ hàng'
      });
    }

    const item = cartItems[0];

    // Kiểm tra tồn kho
    if (item.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Chỉ còn ${item.stock_quantity} sản phẩm trong kho`
      });
    }

    // Cập nhật số lượng
    await pool.query(
      'UPDATE cart SET quantity = ? WHERE cart_id = ?',
      [quantity, cart_id]
    );

    res.json({
      success: true,
      message: 'Cập nhật số lượng thành công'
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật giỏ hàng',
      error: error.message
    });
  }
};

// KH-07: Xóa sản phẩm khỏi giỏ hàng
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { cart_id } = req.params;

    // Xóa item (chỉ xóa item của user)
    const [result] = await pool.query(
      'DELETE FROM cart WHERE cart_id = ? AND user_id = ?',
      [cart_id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong giỏ hàng'
      });
    }

    res.json({
      success: true,
      message: 'Xóa sản phẩm khỏi giỏ hàng thành công'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa khỏi giỏ hàng',
      error: error.message
    });
  }
};

// Xóa toàn bộ giỏ hàng
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.user_id;

    await pool.query('DELETE FROM cart WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      message: 'Đã xóa toàn bộ giỏ hàng'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa giỏ hàng',
      error: error.message
    });
  }
};
