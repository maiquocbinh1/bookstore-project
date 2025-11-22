const { pool } = require('../config/database');

// KH-04: Hiển thị danh sách sách với thông tin cơ bản
exports.getAllBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    // Đếm tổng số sách
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM books');
    const total = countResult[0].total;

    // Lấy danh sách sách với thông tin category
    const [books] = await pool.query(
      `SELECT 
        b.book_id, b.isbn, b.title, b.author, b.publisher, 
        b.publication_year, b.description, b.price, b.stock_quantity,
        b.image_url, b.created_at,
        c.category_id, c.category_name
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.category_id
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: {
        books,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all books error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sách',
      error: error.message
    });
  }
};

// Lấy chi tiết sách
exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const [books] = await pool.query(
      `SELECT 
        b.*, 
        c.category_id, c.category_name
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.category_id
       WHERE b.book_id = ?`,
      [id]
    );

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    // Lấy đánh giá của sách (nếu có)
    const [reviews] = await pool.query(
      `SELECT r.*, u.full_name, u.email
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.book_id = ?
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...books[0],
        reviews
      }
    });
  } catch (error) {
    console.error('Get book by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin sách',
      error: error.message
    });
  }
};

// KH-05: Tìm kiếm sách theo tiêu đề, tác giả hoặc từ khóa
exports.searchBooks = async (req, res) => {
  try {
    const { q } = req.query; // query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập từ khóa tìm kiếm'
      });
    }

    const searchTerm = `%${q}%`;

    // Đếm tổng số kết quả
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM books 
       WHERE title LIKE ? OR author LIKE ? OR description LIKE ? OR isbn LIKE ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );
    const total = countResult[0].total;

    // Tìm kiếm sách
    const [books] = await pool.query(
      `SELECT 
        b.book_id, b.isbn, b.title, b.author, b.publisher, 
        b.publication_year, b.description, b.price, b.stock_quantity,
        b.image_url, b.created_at,
        c.category_id, c.category_name
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.category_id
       WHERE b.title LIKE ? OR b.author LIKE ? OR b.description LIKE ? OR b.isbn LIKE ?
       ORDER BY 
         CASE 
           WHEN b.title LIKE ? THEN 1
           WHEN b.author LIKE ? THEN 2
           ELSE 3
         END,
         b.created_at DESC
       LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit, offset]
    );

    res.json({
      success: true,
      data: {
        books,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        query: q
      }
    });
  } catch (error) {
    console.error('Search books error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm sách',
      error: error.message
    });
  }
};

// KH-06: Lọc sách theo nhiều tiêu chí
exports.filterBooks = async (req, res) => {
  try {
    const {
      category_id,
      min_price,
      max_price,
      author,
      publisher,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    // Build dynamic query
    let whereConditions = [];
    let queryParams = [];

    if (category_id) {
      whereConditions.push('b.category_id = ?');
      queryParams.push(category_id);
    }

    if (min_price) {
      whereConditions.push('b.price >= ?');
      queryParams.push(parseFloat(min_price));
    }

    if (max_price) {
      whereConditions.push('b.price <= ?');
      queryParams.push(parseFloat(max_price));
    }

    if (author) {
      whereConditions.push('b.author LIKE ?');
      queryParams.push(`%${author}%`);
    }

    if (publisher) {
      whereConditions.push('b.publisher LIKE ?');
      queryParams.push(`%${publisher}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Validate sort parameters
    const allowedSortFields = ['title', 'price', 'created_at', 'author'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM books b ${whereClause}`;
    const [countResult] = await pool.query(countQuery, queryParams);
    const total = countResult[0].total;

    // Get filtered books
    const query = `
      SELECT 
        b.book_id, b.isbn, b.title, b.author, b.publisher, 
        b.publication_year, b.description, b.price, b.stock_quantity,
        b.image_url, b.created_at,
        c.category_id, c.category_name
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.category_id
      ${whereClause}
      ORDER BY b.${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    const [books] = await pool.query(query, [...queryParams, limit, offset]);

    res.json({
      success: true,
      data: {
        books,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        filters: {
          category_id,
          min_price,
          max_price,
          author,
          publisher,
          sort_by: sortField,
          sort_order: sortDirection
        }
      }
    });
  } catch (error) {
    console.error('Filter books error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lọc sách',
      error: error.message
    });
  }
};

// Lấy danh sách categories
exports.getCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(
      `SELECT 
        c.*,
        COUNT(b.book_id) as book_count
       FROM categories c
       LEFT JOIN books b ON c.category_id = b.category_id
       GROUP BY c.category_id
       ORDER BY c.category_name`
    );

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách thể loại',
      error: error.message
    });
  }
};
