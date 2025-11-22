const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// KH-12, KH-15: Tạo hóa đơn PDF
const generateInvoicePDF = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('HÓA ĐƠN BÁN HÀNG', { align: 'center' });
      doc.fontSize(10).text('BOOKSTORE SYSTEM', { align: 'center' });
      doc.moveDown();

      // Thông tin công ty (giả lập)
      doc.fontSize(10);
      doc.text('CÔNG TY TNHH BOOKSTORE', 50, 120);
      doc.text('Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM');
      doc.text('Điện thoại: (028) 1234 5678');
      doc.text('Email: contact@bookstore.com');
      doc.text('Mã số thuế: 0123456789');
      doc.moveDown();

      // Thông tin đơn hàng
      doc.fontSize(12).text(`Mã đơn hàng: ${order.order_number}`, { bold: true });
      doc.fontSize(10);
      doc.text(`Ngày đặt: ${new Date(order.created_at).toLocaleString('vi-VN')}`);
      doc.text(`Trạng thái: ${getStatusText(order.status)}`);
      doc.text(`Thanh toán: ${getPaymentMethodText(order.payment_method)}`);
      doc.moveDown();

      // Thông tin khách hàng
      doc.fontSize(12).text('THÔNG TIN KHÁCH HÀNG', { underline: true });
      doc.fontSize(10);
      doc.text(`Họ tên: ${order.shipping_name}`);
      doc.text(`Điện thoại: ${order.shipping_phone}`);
      doc.text(`Địa chỉ: ${order.shipping_address}`);
      doc.moveDown();

      // Bảng chi tiết sản phẩm
      doc.fontSize(12).text('CHI TIẾT ĐỠN HÀNG', { underline: true });
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      const itemCodeX = 50;
      const descriptionX = 100;
      const quantityX = 350;
      const priceX = 400;
      const totalX = 480;

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('STT', itemCodeX, tableTop);
      doc.text('Tên sách', descriptionX, tableTop);
      doc.text('SL', quantityX, tableTop);
      doc.text('Đơn giá', priceX, tableTop);
      doc.text('Thành tiền', totalX, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table content
      doc.font('Helvetica');
      let y = tableTop + 25;

      order.items.forEach((item, index) => {
        doc.text((index + 1).toString(), itemCodeX, y);
        doc.text(item.title.substring(0, 30), descriptionX, y);
        doc.text(item.quantity.toString(), quantityX, y);
        doc.text(formatCurrency(item.price), priceX, y);
        doc.text(formatCurrency(item.subtotal), totalX, y);
        y += 25;
      });

      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 15;

      // Tổng cộng
      doc.font('Helvetica');
      doc.text('Tạm tính:', priceX, y);
      doc.text(formatCurrency(order.subtotal), totalX, y, { align: 'right' });
      y += 20;

      doc.text('VAT (10%):', priceX, y);
      doc.text(formatCurrency(order.vat), totalX, y, { align: 'right' });
      y += 20;

      doc.text('Phí vận chuyển:', priceX, y);
      doc.text(formatCurrency(order.shipping_fee), totalX, y, { align: 'right' });
      y += 20;

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('TỔNG CỘNG:', priceX, y);
      doc.text(formatCurrency(order.total_amount), totalX, y, { align: 'right' });

      // Footer
      doc.fontSize(9).font('Helvetica');
      doc.text('Cảm ơn quý khách đã mua hàng!', 50, 720, { align: 'center' });
      doc.text('Hotline hỗ trợ: 1900-xxxx', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Helper functions
const getStatusText = (status) => {
  const statusMap = {
    'pending': 'Chờ xác nhận',
    'confirmed': 'Đã xác nhận',
    'processing': 'Đang xử lý',
    'shipped': 'Đang giao',
    'delivered': 'Đã giao',
    'cancelled': 'Đã hủy'
  };
  return statusMap[status] || status;
};

const getPaymentMethodText = (method) => {
  const methodMap = {
    'cod': 'Thanh toán khi nhận hàng',
    'online': 'Thanh toán online'
  };
  return methodMap[method] || method;
};

const formatCurrency = (amount) => {
  return amount.toLocaleString('vi-VN') + ' đ';
};

module.exports = {
  generateInvoicePDF
};

