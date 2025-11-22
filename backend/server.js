const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Khởi tạo Express app
const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Rate limiting
app.use('/api/', apiLimiter);

// Static files - uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// =====================================================
// ROUTES
// =====================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/books', require('./routes/book.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/invoices', require('./routes/invoice.routes'));

// Admin Routes (HT-01: Phân quyền - chỉ admin mới truy cập được)
app.use('/api/admin/books', require('./routes/admin/book.routes'));
app.use('/api/admin/users', require('./routes/admin/user.routes'));
app.use('/api/admin/orders', require('./routes/admin/order.routes'));
app.use('/api/admin/reports', require('./routes/admin/report.routes'));

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint không tồn tại'
  });
});

// Error Handler Middleware (phải đặt cuối cùng)
app.use(errorHandler);

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Không thể kết nối database. Kiểm tra cấu hình trong file .env');
      console.log('\n📝 Hướng dẫn:');
      console.log('1. Copy file .env.example thành .env');
      console.log('2. Cập nhật thông tin database MySQL trong file .env');
      console.log('3. Chạy script database.sql trong MySQL Workbench');
      process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 SERVER STARTED SUCCESSFULLY');
      console.log('='.repeat(50));
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔐 Admin Routes: http://localhost:${PORT}/api/admin`);
      console.log('='.repeat(50) + '\n');
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});
