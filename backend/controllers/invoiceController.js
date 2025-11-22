const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

// KH-15: Tạo và xuất hóa đơn PDF
exports.generateInvoicePDF = async (req, res) => {
  try {
    const { order_id } = req.params;
    const userId = req.user.user_id;

    // Lấy thông tin đơn hàng và hóa đơn
    const [orders] = await pool.query(
      `SELECT 
        o.*, i.invoice_code, i.invoice_date,
        a.recipient_name, a.phone, a.address_line, a.city, a.district,
        u.full_name as customer_name, u.email as customer_email
       FROM orders o
       LEFT JOIN invoices i ON o.order_id = i.order_id
       LEFT JOIN addresses a ON o.address_id = a.address_id
       LEFT JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = ? AND o.user_id = ?`,
      [order_id, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    const order = orders[0];

    if (!order.invoice_code) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng chưa có hóa đơn'
      });
    }

    // Lấy chi tiết sản phẩm
    const [items] = await pool.query(
      `SELECT oi.*, b.title, b.author, b.isbn
       FROM order_items oi
       JOIN books b ON oi.book_id = b.book_id
       WHERE oi.order_id = ?`,
      [order_id]
    );

    // Tạo PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.invoice_code}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('HÓA ĐƠN BÁN HÀNG', { align: 'center' });
    doc.fontSize(10).text('BOOKSTORE SYSTEM', { align: 'center' });
    doc.moveDown();

    // Thông tin hóa đơn
    doc.fontSize(12).text(`Mã hóa đơn: ${order.invoice_code}`, { bold: true });
    doc.fontSize(10).text(`Mã đơn hàng: ${order.order_code}`);
    doc.text(`Ngày lập: ${new Date(order.invoice_date).toLocaleString('vi-VN')}`);
    doc.moveDown();

    // Thông tin khách hàng
    doc.fontSize(12).text('THÔNG TIN KHÁCH HÀNG', { underline: true });
    doc.fontSize(10).text(`Họ tên: ${order.customer_name}`);
    doc.text(`Email: ${order.customer_email}`);
    doc.text(`Người nhận: ${order.recipient_name}`);
    doc.text(`Điện thoại: ${order.phone}`);
    doc.text(`Địa chỉ: ${order.address_line}, ${order.district || ''}, ${order.city}`);
    doc.moveDown();

    // Bảng sản phẩm
    doc.fontSize(12).text('CHI TIẾT ĐƠN HÀNG', { underline: true });
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    const itemX = 50;
    const quantityX = 320;
    const priceX = 380;
    const amountX = 480;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Sản phẩm', itemX, tableTop);
    doc.text('SL', quantityX, tableTop);
    doc.text('Đơn giá', priceX, tableTop);
    doc.text('Thành tiền', amountX, tableTop);
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Table rows
    doc.font('Helvetica');
    let y = tableTop + 25;
    
    items.forEach((item, i) => {
      doc.fontSize(9);
      doc.text(item.title.substring(0, 40), itemX, y, { width: 260 });
      doc.text(item.quantity.toString(), quantityX, y);
      doc.text(item.price.toLocaleString('vi-VN') + 'đ', priceX, y);
      doc.text(item.subtotal.toLocaleString('vi-VN') + 'đ', amountX, y);
      y += 25;
    });

    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    // Tổng cộng
    doc.fontSize(10);
    doc.text('Tạm tính:', priceX, y);
    doc.text(order.subtotal.toLocaleString('vi-VN') + 'đ', amountX, y);
    y += 20;

    doc.text('VAT (10%):', priceX, y);
    doc.text(order.vat.toLocaleString('vi-VN') + 'đ', amountX, y);
    y += 20;

    doc.text('Phí vận chuyển:', priceX, y);
    doc.text(order.shipping_fee.toLocaleString('vi-VN') + 'đ', amountX, y);
    y += 20;

    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('TỔNG CỘNG:', priceX, y);
    doc.text(order.total_amount.toLocaleString('vi-VN') + 'đ', amountX, y);

    // Footer
    doc.fontSize(9).font('Helvetica');
    doc.moveDown(3);
    doc.text('Cảm ơn quý khách đã mua hàng!', { align: 'center' });
    doc.text('Mọi thắc mắc xin liên hệ: support@bookstore.com', { align: 'center' });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Generate invoice PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo hóa đơn PDF',
      error: error.message
    });
  }
};

// Lấy thông tin hóa đơn
exports.getInvoice = async (req, res) => {
  try {
    const { order_id } = req.params;
    const userId = req.user.user_id;

    const [invoices] = await pool.query(
      `SELECT i.*, o.order_code, o.total_amount, o.user_id
       FROM invoices i
       JOIN orders o ON i.order_id = o.order_id
       WHERE i.order_id = ? AND o.user_id = ?`,
      [order_id, userId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hóa đơn'
      });
    }

    res.json({
      success: true,
      data: invoices[0]
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin hóa đơn',
      error: error.message
    });
  }
};

