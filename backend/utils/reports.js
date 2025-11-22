const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');

// AD-09: Tạo báo cáo PDF
const generateReportPDF = async (title, data, type) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(18).text(title, { align: 'center' });
      doc.fontSize(10).text(`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`, { align: 'center' });
      doc.moveDown(2);

      if (type === 'revenue') {
        // Báo cáo doanh thu
        doc.fontSize(12).text('Thống kê doanh thu', { underline: true });
        doc.moveDown();

        const totalRevenue = data.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
        const avgOrderValue = totalRevenue / data.length;

        doc.fontSize(10);
        doc.text(`Tổng số đơn hàng: ${data.length}`);
        doc.text(`Tổng doanh thu: ${totalRevenue.toLocaleString('vi-VN')} VNĐ`);
        doc.text(`Giá trị đơn hàng trung bình: ${avgOrderValue.toLocaleString('vi-VN')} VNĐ`);
        doc.moveDown();

        // Top 10 đơn hàng
        doc.text('Top 10 đơn hàng có giá trị cao nhất:', { underline: true });
        doc.moveDown(0.5);

        const sortedData = [...data].sort((a, b) => b.total_amount - a.total_amount).slice(0, 10);
        
        sortedData.forEach((order, index) => {
          doc.text(
            `${index + 1}. ${order.order_number} - ${parseFloat(order.total_amount).toLocaleString('vi-VN')} VNĐ - ${new Date(order.created_at).toLocaleDateString('vi-VN')}`
          );
        });

      } else if (type === 'bestsellers') {
        // Báo cáo sách bán chạy
        doc.fontSize(12).text('Danh sách sách bán chạy nhất', { underline: true });
        doc.moveDown();

        data.forEach((book, index) => {
          doc.fontSize(10);
          doc.text(`${index + 1}. ${book.title}`, { continued: true });
          doc.text(` - ${book.author}`);
          doc.fontSize(9);
          doc.text(`   Đã bán: ${book.total_sold} quyển | Doanh thu: ${parseFloat(book.total_revenue).toLocaleString('vi-VN')} VNĐ`);
          doc.moveDown(0.5);
        });
      }

      // Footer
      doc.fontSize(8).text('© 2024 Bookstore System', 50, 750, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// AD-09: Tạo báo cáo Excel
const generateReportExcel = async (data, type) => {
  try {
    let worksheet;
    
    if (type === 'revenue') {
      // Chuyển đổi dữ liệu cho revenue report
      const wsData = data.map(order => ({
        'Mã đơn hàng': order.order_number,
        'Tổng tiền': parseFloat(order.total_amount),
        'Trạng thái': order.status,
        'Thanh toán': order.payment_status,
        'Ngày tạo': new Date(order.created_at).toLocaleString('vi-VN')
      }));
      
      worksheet = XLSX.utils.json_to_sheet(wsData);
    } else if (type === 'bestsellers') {
      // Dữ liệu đã có label tiếng Việt từ query
      worksheet = XLSX.utils.json_to_sheet(data);
    } else {
      worksheet = XLSX.utils.json_to_sheet(data);
    }

    // Tự động điều chỉnh độ rộng cột
    const maxWidth = 50;
    const wscols = Object.keys(data[0] || {}).map(key => ({
      wch: Math.min(Math.max(key.length, 10), maxWidth)
    }));
    worksheet['!cols'] = wscols;

    // Tạo workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    // Xuất ra buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return excelBuffer;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateReportPDF,
  generateReportExcel
};

