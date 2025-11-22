const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs');

// AD-01: Thêm sách (với validation)
exports.createBook = async (req, res) => {
  try {
    const {
      isbn, title, author, publisher, publication_year,
      category_id, description, price, stock_quantity
    } = req.body;

    // Validation: ISBN không được trống
    if (!isbn || isbn.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'ISBN không được để trống'
      });
    }

    // Kiểm tra ISBN đã tồn tại
    const [existingBooks] = await pool.query(
      'SELECT book_id FROM books WHERE isbn = ?',
      [isbn]
    );

    if (existingBooks.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'ISBN đã tồn tại trong hệ thống'
      });
    }

    // Thêm sách mới
    const [result] = await pool.query(
      `INSERT INTO books (isbn, title, author, publisher, publication_year, 
        category_id, description, price, stock_quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [isbn, title, author, publisher || null, publication_year || null,
       category_id || null, description || null, price, stock_quantity || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Thêm sách thành công',
      data: {
        book_id: result.insertId
      }
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm sách',
      error: error.message
    });
  }
};

// AD-01: Chỉnh sửa sách
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      isbn, title, author, publisher, publication_year,
      category_id, description, price, stock_quantity
    } = req.body;

    // Validation: ISBN không được trống
    if (!isbn || isbn.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'ISBN không được để trống'
      });
    }

    // Kiểm tra sách tồn tại
    const [books] = await pool.query('SELECT book_id FROM books WHERE book_id = ?', [id]);
    
    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    // Kiểm tra ISBN trùng (trừ chính nó)
    const [duplicateBooks] = await pool.query(
      'SELECT book_id FROM books WHERE isbn = ? AND book_id != ?',
      [isbn, id]
    );

    if (duplicateBooks.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'ISBN đã được sử dụng bởi sách khác'
      });
    }

    // Cập nhật sách
    await pool.query(
      `UPDATE books 
       SET isbn = ?, title = ?, author = ?, publisher = ?, publication_year = ?,
           category_id = ?, description = ?, price = ?, stock_quantity = ?
       WHERE book_id = ?`,
      [isbn, title, author, publisher || null, publication_year || null,
       category_id || null, description || null, price, stock_quantity || 0, id]
    );

    res.json({
      success: true,
      message: 'Cập nhật sách thành công'
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật sách',
      error: error.message
    });
  }
};

// AD-01: Xóa sách
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra sách có trong đơn hàng nào không
    const [orderItems] = await pool.query(
      'SELECT order_item_id FROM order_items WHERE book_id = ? LIMIT 1',
      [id]
    );

    if (orderItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa sách đã có trong đơn hàng'
      });
    }

    // Xóa sách
    const [result] = await pool.query('DELETE FROM books WHERE book_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    res.json({
      success: true,
      message: 'Xóa sách thành công'
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa sách',
      error: error.message
    });
  }
};

// AD-02: Upload và gán hình ảnh sách (với giới hạn kích thước)
exports.uploadBookImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file hình ảnh'
      });
    }

    // Kiểm tra kích thước file (giới hạn 5MB)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5242880; // 5MB
    if (req.file.size > maxSize) {
      // Xóa file đã upload
      fs.unlinkSync(req.file.path);
      
      return res.status(400).json({
        success: false,
        message: 'Kích thước file vượt quá 5MB'
      });
    }

    // Cập nhật đường dẫn hình ảnh trong database
    const image_url = `/uploads/${req.file.filename}`;
    
    await pool.query(
      'UPDATE books SET image_url = ? WHERE book_id = ?',
      [image_url, id]
    );

    res.json({
      success: true,
      message: 'Upload hình ảnh thành công',
      data: {
        image_url
      }
    });
  } catch (error) {
    console.error('Upload book image error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload hình ảnh',
      error: error.message
    });
  }
};

// AD-03: Cập nhật tồn kho
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;

    if (stock_quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng tồn kho không thể âm'
      });
    }

    const [result] = await pool.query(
      'UPDATE books SET stock_quantity = ? WHERE book_id = ?',
      [stock_quantity, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật tồn kho thành công'
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật tồn kho',
      error: error.message
    });
  }
};

// AD-04: Quản lý thể loại - Thêm category
exports.createCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body;

    // Kiểm tra tên category đã tồn tại
    const [existing] = await pool.query(
      'SELECT category_id FROM categories WHERE category_name = ?',
      [category_name]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tên thể loại đã tồn tại'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (category_name, description) VALUES (?, ?)',
      [category_name, description || null]
    );

    res.status(201).json({
      success: true,
      message: 'Thêm thể loại thành công',
      data: {
        category_id: result.insertId
      }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm thể loại',
      error: error.message
    });
  }
};

// AD-04: Cập nhật category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, description } = req.body;

    const [result] = await pool.query(
      'UPDATE categories SET category_name = ?, description = ? WHERE category_id = ?',
      [category_name, description || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thể loại'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật thể loại thành công'
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thể loại',
      error: error.message
    });
  }
};

// AD-04: Xóa category (với cảnh báo/chặn nếu có sách)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra có sách nào thuộc category này không
    const [books] = await pool.query(
      'SELECT COUNT(*) as count FROM books WHERE category_id = ?',
      [id]
    );

    if (books[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa thể loại. Còn ${books[0].count} sách thuộc thể loại này.`,
        data: {
          book_count: books[0].count
        }
      });
    }

    // Xóa category
    const [result] = await pool.query('DELETE FROM categories WHERE category_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thể loại'
      });
    }

    res.json({
      success: true,
      message: 'Xóa thể loại thành công'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa thể loại',
      error: error.message
    });
  }
};

