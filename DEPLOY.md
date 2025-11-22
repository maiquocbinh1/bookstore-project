# 🚀 HƯỚNG DẪN TRIỂN KHAI

## CHECKLIST TRƯỚC KHI DEPLOY

### ✅ Bảo mật
- [ ] Đổi JWT_SECRET trong production
- [ ] Đổi password database
- [ ] Bật HTTPS
- [ ] Cấu hình CORS đúng domain
- [ ] Kiểm tra rate limiting

### ✅ Database
- [ ] Backup database
- [ ] Kiểm tra indexes
- [ ] Test stored procedures
- [ ] Verify foreign keys

### ✅ Testing
- [ ] Test tất cả API endpoints
- [ ] Test authentication flow
- [ ] Test payment simulation
- [ ] Test file upload (5MB limit)
- [ ] Test email sending

### ✅ Performance
- [ ] Enable compression
- [ ] Optimize images
- [ ] Cache static files
- [ ] Database query optimization

## LỖI THƯỜNG GẶP VÀ CÁCH SỬA

### 1. "Cannot connect to database"
```bash
# Kiểm tra MySQL đang chạy
# Kiểm tra thông tin .env
# Ping database server
```

### 2. "Module not found"
```bash
npm install
cd frontend && npm install
```

### 3. "Port already in use"
```bash
# Đổi PORT trong .env
# Hoặc kill process:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### 4. "JWT token invalid"
```bash
# Xóa localStorage trong browser
localStorage.clear()
# Đăng nhập lại
```

## CẤU HÌNH PRODUCTION

### Backend (Node.js)
```env
NODE_ENV=production
PORT=80
DB_HOST=your-production-db-host
JWT_SECRET=very_long_random_string_change_this
```

### Frontend (React)
```env
REACT_APP_API_URL=https://your-api-domain.com/api
```

### Build Frontend
```bash
cd frontend
npm run build
# Deploy folder 'build' to static hosting
```

## MONITORING

### Logs
```bash
# Backend logs
pm2 logs

# Database logs
tail -f /var/log/mysql/error.log
```

### Health Check
```bash
curl http://localhost:5000/health
```

## BACKUP

### Database Backup
```bash
mysqldump -u root -p bookstore_db > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
mysql -u root -p bookstore_db < backup_20240101.sql
```

