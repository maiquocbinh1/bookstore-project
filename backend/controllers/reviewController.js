const { pool } = require('../config/database');

// KH-16: Thêm bình luận/đánh giá (Would be Nice)
exports.addReview = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { book_id, rating, comment } = req.body;

    // Kiểm tra user đã mua sách này chưa
    const [purchases] = await pool.query(
      `SELECT o.order_id 
       FROM orders o
       JOIN order_items oi ON o.order_id = oi.order_id
       WHERE o.user_id = ? AND oi.book_id = ? AND o.payment_status = 'paid'
       LIMIT 1`,
      [userId, book_id]
    );

    if (purchases.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Bạn chỉ có thể đánh giá sách đã mua'
      });
    }

    // Kiểm tra đã đánh giá chưa
    const [existingReviews] = await pool.query(
      'SELECT review_id FROM reviews WHERE user_id = ? AND book_id = ?',
      [userId, book_id]
    );

    if (existingReviews.length > 0) {
      // Cập nhật đánh giá cũ
      await pool.query(
        'UPDATE reviews SET rating = ?, comment = ? WHERE review_id = ?',
        [rating, comment, existingReviews[0].review_id]
      );

      return res.json({
        success: true,
        message: 'Cập nhật đánh giá thành công'
      });
    }

    // Thêm đánh giá mới
    const [result] = await pool.query(
      'INSERT INTO reviews (book_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [book_id, userId, rating, comment]
    );

    res.status(201).json({
      success: true,
      message: 'Thêm đánh giá thành công',
      data: {
        review_id: result.insertId
      }
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm đánh giá',
      error: error.message
    });
  }
};

// Lấy đánh giá của sách
exports.getBookReviews = async (req, res) => {
  try {
    const { book_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Đếm tổng số review
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM reviews WHERE book_id = ?',
      [book_id]
    );
    const total = countResult[0].total;

    // Lấy danh sách reviews
    const [reviews] = await pool.query(
      `SELECT r.*, u.full_name, u.email
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.book_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [book_id, limit, offset]
    );

    // Tính rating trung bình
    const [avgResult] = await pool.query(
      `SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as total_reviews
       FROM reviews 
       WHERE book_id = ?`,
      [book_id]
    );

    res.json({
      success: true,
      data: {
        reviews,
        statistics: {
          avg_rating: avgResult[0].avg_rating ? parseFloat(avgResult[0].avg_rating).toFixed(1) : 0,
          total_reviews: avgResult[0].total_reviews
        },
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get book reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy đánh giá',
      error: error.message
    });
  }
};

// Xóa đánh giá của mình
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const [result] = await pool.query(
      'DELETE FROM reviews WHERE review_id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    res.json({
      success: true,
      message: 'Xóa đánh giá thành công'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa đánh giá',
      error: error.message
    });
  }
};

