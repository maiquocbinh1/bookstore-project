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
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
        SUM(CASE WHEN status = 'shipping' THEN 1 ELSE 0 END) as shipping_orders
       FROM orders
       WHERE created_at >= ? AND created_at <= ?`,
      [startDate, endDateStr + ' 23:59:59']
    );

    // Doanh thu theo tháng trong quý
    const [monthlyRevenue] = await pool.query(
      `SELECT 
        MONTH(created_at) as month,
        COUNT(*) as orders_count,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as revenue
       FROM orders
       WHERE created_at >= ? AND created_at <= ?
       GROUP BY MONTH(created_at)
       ORDER BY month`,
      [startDate, endDateStr + ' 23:59:59']
    );

    // Doanh thu theo ngày trong quý (cho biểu đồ)
    const [dailyRevenue] = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders_count,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as revenue
       FROM orders
       WHERE created_at >= ? AND created_at <= ?
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [startDate, endDateStr + ' 23:59:59']
    );

    // So sánh với quý trước
    const prevQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
    const prevYear = currentQuarter === 1 ? currentYear - 1 : currentYear;
    const prevStartMonth = (prevQuarter - 1) * 3 + 1;
    const prevEndMonth = prevQuarter * 3;
    const prevStartDate = `${prevYear}-${prevStartMonth.toString().padStart(2, '0')}-01`;
    const prevEndDate = new Date(prevYear, prevEndMonth, 0);
    const prevEndDateStr = `${prevYear}-${prevEndMonth.toString().padStart(2, '0')}-${prevEndDate.getDate()}`;

    const [prevStats] = await pool.query(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_revenue
       FROM orders
       WHERE created_at >= ? AND created_at <= ?`,
      [prevStartDate, prevEndDateStr + ' 23:59:59']
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
        monthly_breakdown: monthlyRevenue,
        daily_breakdown: dailyRevenue,
        comparison: {
          previous_quarter: {
            quarter: prevQuarter,
            year: prevYear,
            total_orders: prevStats[0]?.total_orders || 0,
            total_revenue: prevStats[0]?.total_revenue || 0
          }
        }
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

// Báo cáo doanh thu theo khoảng thời gian tùy chỉnh
exports.getRevenueReport = async (req, res) => {
  try {
    const { period, start_date, end_date } = req.query;
    
    let startDate, endDate, groupBy, dateFormat;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Xác định khoảng thời gian
    if (period === 'today') {
      startDate = new Date(currentYear, currentMonth - 1, now.getDate());
      endDate = new Date(currentYear, currentMonth - 1, now.getDate(), 23, 59, 59);
      groupBy = 'HOUR(created_at)';
      dateFormat = 'HOUR(created_at) as period';
    } else if (period === 'week') {
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
      startDate = new Date(currentYear, currentMonth - 1, diff);
      endDate = new Date(currentYear, currentMonth - 1, diff + 6, 23, 59, 59);
      groupBy = 'DATE(created_at)';
      dateFormat = 'DATE(created_at) as period';
    } else if (period === 'month') {
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
      groupBy = 'DATE(created_at)';
      dateFormat = 'DATE(created_at) as period';
    } else if (period === 'quarter') {
      const currentQuarter = Math.ceil(currentMonth / 3);
      const startMonth = (currentQuarter - 1) * 3 + 1;
      const endMonth = currentQuarter * 3;
      startDate = new Date(currentYear, startMonth - 1, 1);
      endDate = new Date(currentYear, endMonth, 0, 23, 59, 59);
      groupBy = 'MONTH(created_at)';
      dateFormat = 'MONTH(created_at) as period';
    } else if (period === 'year') {
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59);
      groupBy = 'MONTH(created_at)';
      dateFormat = 'MONTH(created_at) as period';
    } else if (period === 'custom' && start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date + ' 23:59:59');
      groupBy = 'DATE(created_at)';
      dateFormat = 'DATE(created_at) as period';
    } else {
      // Mặc định là quý hiện tại
      const currentQuarter = Math.ceil(currentMonth / 3);
      const startMonth = (currentQuarter - 1) * 3 + 1;
      const endMonth = currentQuarter * 3;
      startDate = new Date(currentYear, startMonth - 1, 1);
      endDate = new Date(currentYear, endMonth, 0, 23, 59, 59);
      groupBy = 'DATE(created_at)';
      dateFormat = 'DATE(created_at) as period';
    }

    // Thống kê tổng quan
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN payment_status = 'paid' THEN total_amount ELSE NULL END) as avg_order_value,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
        SUM(CASE WHEN status = 'shipping' THEN 1 ELSE 0 END) as shipping_orders,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as unpaid_orders
       FROM orders
       WHERE created_at >= ? AND created_at <= ?`,
      [startDate, endDate]
    );

    // Doanh thu theo khoảng thời gian (cho biểu đồ)
    const [breakdown] = await pool.query(
      `SELECT 
        ${dateFormat},
        COUNT(*) as orders_count,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as revenue
       FROM orders
       WHERE created_at >= ? AND created_at <= ?
       GROUP BY ${groupBy}
       ORDER BY period`,
      [startDate, endDate]
    );

    // Top 10 đơn hàng lớn nhất
    const [topOrders] = await pool.query(
      `SELECT 
        order_code,
        total_amount,
        status,
        payment_status,
        created_at
       FROM orders
       WHERE created_at >= ? AND created_at <= ? AND payment_status = 'paid'
       ORDER BY total_amount DESC
       LIMIT 10`,
      [startDate, endDate]
    );

    res.json({
      success: true,
      data: {
        period: period || 'quarter',
        period_range: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        statistics: stats[0],
        breakdown: breakdown,
        top_orders: topOrders
      }
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy báo cáo doanh thu',
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
    let dateConditionStats = '';
    let queryParamsStats = [];

    if (startDate && endDate) {
      dateCondition = 'AND o.created_at >= ? AND o.created_at <= ?';
      queryParams.push(startDate, endDate + ' 23:59:59');
      dateConditionStats = 'WHERE o.created_at >= ? AND o.created_at <= ?';
      queryParamsStats.push(startDate, endDate + ' 23:59:59');
    }

    // Lấy danh sách sách bán chạy
    const [books] = await pool.query(
      `SELECT 
        b.book_id, b.title, b.author, b.price, b.isbn, b.category_id,
        COUNT(DISTINCT oi.order_id) as order_count,
        SUM(oi.quantity) as total_sold,
        SUM(oi.subtotal) as total_revenue,
        AVG(oi.quantity) as avg_quantity_per_order
       FROM books b
       INNER JOIN order_items oi ON b.book_id = oi.book_id
       INNER JOIN orders o ON oi.order_id = o.order_id
       WHERE o.payment_status = 'paid' ${dateCondition}
       GROUP BY b.book_id, b.title, b.author, b.price, b.isbn, b.category_id
       ORDER BY total_sold DESC
       LIMIT ?`,
      [...queryParams, limit]
    );

    // Thống kê tổng quan
    let statsQuery = '';
    let statsParams = [];
    
    if (startDate && endDate) {
      statsQuery = `SELECT 
        COUNT(DISTINCT b.book_id) as total_books_sold,
        SUM(oi.quantity) as total_books_sold_quantity,
        SUM(oi.subtotal) as total_revenue,
        AVG(oi.subtotal / oi.quantity) as avg_book_price
       FROM books b
       INNER JOIN order_items oi ON b.book_id = oi.book_id
       INNER JOIN orders o ON oi.order_id = o.order_id
       WHERE o.payment_status = 'paid' AND o.created_at >= ? AND o.created_at <= ?`;
      statsParams = [startDate, endDate + ' 23:59:59'];
    } else {
      statsQuery = `SELECT 
        COUNT(DISTINCT b.book_id) as total_books_sold,
        SUM(oi.quantity) as total_books_sold_quantity,
        SUM(oi.subtotal) as total_revenue,
        AVG(oi.subtotal / oi.quantity) as avg_book_price
       FROM books b
       INNER JOIN order_items oi ON b.book_id = oi.book_id
       INNER JOIN orders o ON oi.order_id = o.order_id
       WHERE o.payment_status = 'paid'`;
      statsParams = [];
    }
    
    const [stats] = await pool.query(statsQuery, statsParams);

    res.json({
      success: true,
      data: {
        books,
        statistics: stats[0] || {},
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

    // Lấy danh sách khách hàng mới
    const [customers] = await pool.query(
      `SELECT 
        u.user_id, u.email, u.full_name, u.phone, u.created_at, u.is_active,
        COUNT(o.order_id) as total_orders,
        SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END) as total_spent,
        MAX(o.created_at) as last_order_date
       FROM users u
       LEFT JOIN orders o ON u.user_id = o.user_id
       WHERE u.role = 'customer' AND u.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY u.user_id, u.email, u.full_name, u.phone, u.created_at, u.is_active
       ORDER BY u.created_at DESC
       LIMIT ?`,
      [days, limit]
    );

    // Thống kê tổng quan
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_new_customers,
        SUM(CASE WHEN o.order_id IS NOT NULL THEN 1 ELSE 0 END) as customers_with_orders,
        SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END) as total_revenue_from_new,
        AVG(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE NULL END) as avg_spending_per_customer
       FROM users u
       LEFT JOIN orders o ON u.user_id = o.user_id
       WHERE u.role = 'customer' AND u.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    // Thống kê theo ngày (cho biểu đồ)
    const [dailyStats] = await pool.query(
      `SELECT 
        DATE(u.created_at) as date,
        COUNT(*) as customers_count
       FROM users u
       WHERE u.role = 'customer' AND u.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(u.created_at)
       ORDER BY date DESC
       LIMIT 30`,
      [days]
    );

    res.json({
      success: true,
      data: {
        customers,
        statistics: stats[0] || {},
        daily_breakdown: dailyStats,
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
    const { report_type, start_date, end_date, days } = req.query;

    let data = [];
    let sheetName = 'Report';

    if (report_type === 'orders' || report_type === 'revenue') {
      // Báo cáo đơn hàng/doanh thu
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
          u.email as 'Email',
          o.total_amount as 'Tổng tiền',
          o.status as 'Trạng thái',
          o.payment_status as 'Thanh toán',
          DATE(o.created_at) as 'Ngày tạo'
         FROM orders o
         JOIN users u ON o.user_id = u.user_id
         ${dateCondition}
         ORDER BY o.created_at DESC`,
        queryParams
      );

      data = orders;
      sheetName = 'Doanh thu & Đơn hàng';

    } else if (report_type === 'bestselling') {
      // Báo cáo sách bán chạy
      let dateCondition = '';
      let queryParams = [];

      if (start_date && end_date) {
        dateCondition = 'AND o.created_at >= ? AND o.created_at <= ?';
        queryParams.push(start_date, end_date + ' 23:59:59');
      }

      const [books] = await pool.query(
        `SELECT 
          ROW_NUMBER() OVER (ORDER BY SUM(oi.quantity) DESC) as 'STT',
          b.title as 'Tên sách',
          b.author as 'Tác giả',
          b.isbn as 'ISBN',
          b.price as 'Giá bán',
          COUNT(DISTINCT oi.order_id) as 'Số đơn hàng',
          SUM(oi.quantity) as 'Số lượng bán',
          SUM(oi.subtotal) as 'Doanh thu'
         FROM books b
         INNER JOIN order_items oi ON b.book_id = oi.book_id
         INNER JOIN orders o ON oi.order_id = o.order_id
         WHERE o.payment_status = 'paid' ${dateCondition}
         GROUP BY b.book_id, b.title, b.author, b.isbn, b.price
         ORDER BY SUM(oi.quantity) DESC
         LIMIT 100`
      );

      data = books;
      sheetName = 'Sách bán chạy';

    } else if (report_type === 'customers' || report_type === 'new-customers') {
      // Báo cáo khách hàng mới
      const daysFilter = parseInt(days) || 30;
      
      const [customers] = await pool.query(
        `SELECT 
          u.full_name as 'Họ tên',
          u.email as 'Email',
          u.phone as 'Điện thoại',
          COUNT(o.order_id) as 'Số đơn hàng',
          SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END) as 'Tổng chi tiêu',
          DATE(u.created_at) as 'Ngày đăng ký',
          CASE WHEN u.is_active = 1 THEN 'Hoạt động' ELSE 'Khóa' END as 'Trạng thái'
         FROM users u
         LEFT JOIN orders o ON u.user_id = o.user_id
         WHERE u.role = 'customer' AND u.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY u.user_id, u.full_name, u.email, u.phone, u.created_at, u.is_active
         ORDER BY u.created_at DESC`,
        [daysFilter]
      );

      data = customers;
      sheetName = 'Khách hàng mới';

    } else if (report_type === 'quarter') {
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

      const [orders] = await pool.query(
        `SELECT 
          o.order_code as 'Mã đơn hàng',
          u.full_name as 'Khách hàng',
          o.total_amount as 'Tổng tiền',
          o.status as 'Trạng thái',
          o.payment_status as 'Thanh toán',
          DATE(o.created_at) as 'Ngày tạo'
         FROM orders o
         JOIN users u ON o.user_id = u.user_id
         WHERE o.created_at >= ? AND o.created_at <= ?
         ORDER BY o.created_at DESC`,
        [startDate, endDateStr + ' 23:59:59']
      );

      data = orders;
      sheetName = `Báo cáo Quý ${currentQuarter}/${currentYear}`;
    }

    // Tạo workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Điều chỉnh độ rộng cột
    const maxWidth = 50;
    const wscols = Object.keys(data[0] || {}).map(key => ({
      wch: Math.min(Math.max(key.length, 10), maxWidth)
    }));
    ws['!cols'] = wscols;
    
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
    const { report_type, start_date, end_date, days } = req.query;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

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
          SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_revenue,
          AVG(CASE WHEN payment_status = 'paid' THEN total_amount ELSE NULL END) as avg_order_value
         FROM orders
         WHERE created_at >= ? AND created_at <= ?`,
        [startDate, endDateStr + ' 23:59:59']
      );

      doc.fontSize(16).text(`BÁO CÁO QUÝ ${currentQuarter}/${currentYear}`, { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Tổng số đơn hàng: ${stats[0].total_orders}`);
      doc.text(`Tổng doanh thu: ${(stats[0].total_revenue || 0).toLocaleString('vi-VN')} VNĐ`);
      doc.text(`Giá trị đơn hàng trung bình: ${(stats[0].avg_order_value || 0).toLocaleString('vi-VN')} VNĐ`);

    } else if (report_type === 'bestselling') {
      // Báo cáo sách bán chạy
      let dateCondition = '';
      let queryParams = [];

      if (start_date && end_date) {
        dateCondition = 'AND o.created_at >= ? AND o.created_at <= ?';
        queryParams.push(start_date, end_date + ' 23:59:59');
      }

      const [books] = await pool.query(
        `SELECT 
          b.title, b.author, b.isbn,
          SUM(oi.quantity) as total_sold,
          SUM(oi.subtotal) as total_revenue
         FROM books b
         INNER JOIN order_items oi ON b.book_id = oi.book_id
         INNER JOIN orders o ON oi.order_id = o.order_id
         WHERE o.payment_status = 'paid' ${dateCondition}
         GROUP BY b.book_id, b.title, b.author, b.isbn
         ORDER BY total_sold DESC
         LIMIT 50`,
        queryParams
      );

      doc.fontSize(16).text('BÁO CÁO SÁCH BÁN CHẠY NHẤT', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      
      books.forEach((book: any, index: number) => {
        doc.text(`${index + 1}. ${book.title} - ${book.author}`);
        doc.fontSize(10);
        doc.text(`   Số lượng bán: ${book.total_sold} | Doanh thu: ${(book.total_revenue || 0).toLocaleString('vi-VN')} VNĐ`);
        doc.fontSize(12);
        doc.moveDown(0.5);
      });

    } else if (report_type === 'customers' || report_type === 'new-customers') {
      // Báo cáo khách hàng mới
      const daysFilter = parseInt(days) || 30;

      const [customers] = await pool.query(
        `SELECT 
          u.full_name, u.email, u.phone,
          COUNT(o.order_id) as total_orders,
          SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END) as total_spent,
          u.created_at
         FROM users u
         LEFT JOIN orders o ON u.user_id = o.user_id
         WHERE u.role = 'customer' AND u.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY u.user_id, u.full_name, u.email, u.phone, u.created_at
         ORDER BY u.created_at DESC
         LIMIT 50`,
        [daysFilter]
      );

      const [stats] = await pool.query(
        `SELECT 
          COUNT(*) as total_customers,
          SUM(CASE WHEN o.order_id IS NOT NULL THEN 1 ELSE 0 END) as customers_with_orders,
          SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END) as total_revenue
         FROM users u
         LEFT JOIN orders o ON u.user_id = o.user_id
         WHERE u.role = 'customer' AND u.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [daysFilter]
      );

      doc.fontSize(16).text(`BÁO CÁO KHÁCH HÀNG MỚI (${daysFilter} ngày qua)`, { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Tổng số khách hàng mới: ${stats[0].total_customers}`);
      doc.text(`Số khách hàng có đơn hàng: ${stats[0].customers_with_orders}`);
      doc.text(`Tổng doanh thu: ${(stats[0].total_revenue || 0).toLocaleString('vi-VN')} VNĐ`);
      doc.moveDown();
      doc.text('Danh sách chi tiết:', { underline: true });
      doc.moveDown(0.5);

      customers.forEach((customer: any, index: number) => {
        doc.fontSize(10);
        doc.text(`${index + 1}. ${customer.full_name} (${customer.email})`);
        doc.text(`   Số đơn hàng: ${customer.total_orders} | Tổng chi tiêu: ${(customer.total_spent || 0).toLocaleString('vi-VN')} VNĐ`);
        doc.text(`   Ngày đăng ký: ${new Date(customer.created_at).toLocaleDateString('vi-VN')}`);
        doc.moveDown(0.3);
      });
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

