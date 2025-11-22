const { pool } = require('../config/database');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

// AD-07: Báo cáo doanh thu và thống kê đơn hàng quý hiện tại
exports.getCurrentQuarterReport = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);

    // Tính tháng bắt đầu và kết thúc của quý
    const startMonth = (currentQuarter - 1) * 3 + 1;
    const endMonth = currentQuarter * 3;

    const startDate = `${currentYear}-${startMonth.toString().padStart(2, '0')}-01`;
    const endDate = new Date(currentYear, endMonth, 0); // Ngày cuối cùng của tháng cuối quý
    const endDateStr = `${currentYear}-${endMonth.toString().padStart(2, '0')}-${endDate.getDate()}`;

    // Doanh thu và số lượng đơn hàng
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN payment_status = 'paid' THEN total_amount ELSE NULL END) as avg_order_value,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
       FROM orders
       WHERE created_at >= ? AND created_at <= ?`,
      [startDate, endDateStr + ' 23:59:59']
    );

    // Doanh thu theo tháng trong quý
    const [monthlyRevenue] = await pool.query(
      `SELECT 
        MONTH(created_at) as month,
        COUNT(*) as orders_count,
        SUM(total_amount) as revenue
       FROM orders
       WHERE created_at >= ? AND created_at <= ? AND payment_status = 'paid'
       GROUP BY MONTH(created_at)
       ORDER BY month`,
      [startDate, endDateStr + ' 23:59:59']
    );

    res.json({
      success: true,
      data: {
        quarter: currentQuarter,
        year: currentYear,
        period: {
          start: startDate,
          end: endDateStr
        },
        statistics: stats[0],
        monthly_breakdown: monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Get current quarter report error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy báo cáo quý',
      error: error.message
    });
  }
};

// AD-08: Sách bán chạy nhất
exports.getBestsellingBooks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    let dateCondition = '';
    let queryParams = [];

    if (startDate && endDate) {
      dateCondition = 'AND o.created_at >= ? AND o.created_at <= ?';
      queryParams.push(startDate, endDate + ' 23:59:59');
    }

    const [books] = await pool.query(
      `SELECT 
        b.book_id, b.title, b.author, b.price, b.isbn,
        COUNT(oi.order_item_id) as order_count,
        SUM(oi.quantity) as total_sold,
        SUM(oi.subtotal) as total_revenue
       FROM books b
       INNER JOIN order_items oi ON b.book_id = oi.book_id
       INNER JOIN orders o ON oi.order_id = o.order_id
       WHERE o.payment_status = 'paid' ${dateCondition}
       GROUP BY b.book_id, b.title, b.author, b.price, b.isbn
       ORDER BY total_sold DESC
       LIMIT ?`,
      [...queryParams, limit]
    );

    res.json({
      success: true,
      data: {
        books,
        period: startDate && endDate ? { start: startDate, end: endDate } : 'all_time'
      }
    });
  } catch (error) {
    console.error('Get bestselling books error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sách bán chạy',
      error: error.message
    });
  }
};

// AD-08: Khách hàng mới
exports.getNewCustomers = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const limit = parseInt(req.query.limit) || 20;

    const [customers] = await pool.query(
      `SELECT 
        u.user_id, u.email, u.full_name, u.phone, u.created_at,
        COUNT(o.order_id) as total_orders,
        SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END) as total_spent
       FROM users u
       LEFT JOIN orders o ON u.user_id = o.user_id
       WHERE u.role = 'customer' AND u.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY u.user_id, u.email, u.full_name, u.phone, u.created_at
       ORDER BY u.created_at DESC
       LIMIT ?`,
      [days, limit]
    );

    res.json({
      success: true,
      data: {
        customers,
        period_days: days
      }
    });
  } catch (error) {
    console.error('Get new customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách khách hàng mới',
      error: error.message
    });
  }
};

// Thống kê tổng quan dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    // Tổng quan
    const [overview] = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
        (SELECT COUNT(*) FROM books) as total_books,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT SUM(total_amount) FROM orders WHERE payment_status = 'paid') as total_revenue`
    );

    // Thống kê tháng này
    const [thisMonth] = await pool.query(
      `SELECT 
        COUNT(*) as orders_this_month,
        SUM(total_amount) as revenue_this_month
       FROM orders
       WHERE YEAR(created_at) = YEAR(CURDATE()) 
       AND MONTH(created_at) = MONTH(CURDATE())
       AND payment_status = 'paid'`
    );

    // Đơn hàng chờ xử lý
    const [pendingOrders] = await pool.query(
      `SELECT COUNT(*) as pending_count
       FROM orders
       WHERE status IN ('pending', 'confirmed')`
    );

    // Sách sắp hết hàng
    const [lowStock] = await pool.query(
      `SELECT COUNT(*) as low_stock_count
       FROM books
       WHERE stock_quantity < 10 AND stock_quantity > 0`
    );

    res.json({
      success: true,
      data: {
        overview: overview[0],
        this_month: thisMonth[0],
        pending_orders: pendingOrders[0].pending_count,
        low_stock_books: lowStock[0].low_stock_count
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê dashboard',
      error: error.message
    });
  }
};

// AD-09: Xuất báo cáo Excel
exports.exportReportExcel = async (req, res) => {
  try {
    const { report_type, start_date, end_date } = req.query;

    let data = [];
    let sheetName = 'Report';

    if (report_type === 'orders') {
      // Báo cáo đơn hàng
      let dateCondition = '';
      let queryParams = [];

      if (start_date && end_date) {
        dateCondition = 'WHERE o.created_at >= ? AND o.created_at <= ?';
        queryParams.push(start_date, end_date + ' 23:59:59');
      }

      const [orders] = await pool.query(
        `SELECT 
          o.order_code as 'Mã đơn hàng',
          u.full_name as 'Khách hàng',
          o.total_amount as 'Tổng tiền',
          o.status as 'Trạng thái',
          o.payment_status as 'Thanh toán',
          o.created_at as 'Ngày tạo'
         FROM orders o
         JOIN users u ON o.user_id = u.user_id
         ${dateCondition}
         ORDER BY o.created_at DESC`,
        queryParams
      );

      data = orders;
      sheetName = 'Orders';

    } else if (report_type === 'bestselling') {
      // Báo cáo sách bán chạy
      const [books] = await pool.query(
        `SELECT 
          b.title as 'Tên sách',
          b.author as 'Tác giả',
          b.isbn as 'ISBN',
          SUM(oi.quantity) as 'Số lượng bán',
          SUM(oi.subtotal) as 'Doanh thu'
         FROM books b
         INNER JOIN order_items oi ON b.book_id = oi.book_id
         INNER JOIN orders o ON oi.order_id = o.order_id
         WHERE o.payment_status = 'paid'
         GROUP BY b.book_id, b.title, b.author, b.isbn
         ORDER BY SUM(oi.quantity) DESC
         LIMIT 50`
      );

      data = books;
      sheetName = 'Bestselling';

    } else if (report_type === 'customers') {
      // Báo cáo khách hàng
      const [customers] = await pool.query(
        `SELECT 
          u.full_name as 'Họ tên',
          u.email as 'Email',
          u.phone as 'Điện thoại',
          COUNT(o.order_id) as 'Số đơn hàng',
          SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END) as 'Tổng chi tiêu',
          u.created_at as 'Ngày đăng ký'
         FROM users u
         LEFT JOIN orders o ON u.user_id = o.user_id
         WHERE u.role = 'customer'
         GROUP BY u.user_id, u.full_name, u.email, u.phone, u.created_at
         ORDER BY u.created_at DESC`
      );

      data = customers;
      sheetName = 'Customers';
    }

    // Tạo workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Xuất file
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=report-${report_type}-${Date.now()}.xlsx`);
    res.send(buffer);

  } catch (error) {
    console.error('Export report Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xuất báo cáo Excel',
      error: error.message
    });
  }
};

// AD-09: Xuất báo cáo PDF
exports.exportReportPDF = async (req, res) => {
  try {
    const { report_type } = req.query;

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${report_type}-${Date.now()}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('BÁO CÁO HỆ THỐNG', { align: 'center' });
    doc.fontSize(12).text(`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`, { align: 'center' });
    doc.moveDown(2);

    if (report_type === 'quarter') {
      // Báo cáo quý
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const currentQuarter = Math.ceil(currentMonth / 3);

      const startMonth = (currentQuarter - 1) * 3 + 1;
      const endMonth = currentQuarter * 3;
      const startDate = `${currentYear}-${startMonth.toString().padStart(2, '0')}-01`;
      const endDate = new Date(currentYear, endMonth, 0);
      const endDateStr = `${currentYear}-${endMonth.toString().padStart(2, '0')}-${endDate.getDate()}`;

      const [stats] = await pool.query(
        `SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_revenue
         FROM orders
         WHERE created_at >= ? AND created_at <= ?`,
        [startDate, endDateStr + ' 23:59:59']
      );

      doc.fontSize(16).text(`BÁO CÁO QUÝ ${currentQuarter}/${currentYear}`, { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Tổng số đơn hàng: ${stats[0].total_orders}`);
      doc.text(`Tổng doanh thu: ${(stats[0].total_revenue || 0).toLocaleString('vi-VN')} VNĐ`);
    }

    doc.end();

  } catch (error) {
    console.error('Export report PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xuất báo cáo PDF',
      error: error.message
    });
  }
};

