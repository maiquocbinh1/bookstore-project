const nodemailer = require('nodemailer');

// Cấu hình transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true cho port 465, false cho các port khác
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Gửi email đặt lại mật khẩu
exports.sendPasswordResetEmail = async (email, resetToken, userName) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"Bookstore System" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Đặt lại mật khẩu - Bookstore',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .warning { color: #d32f2f; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Đặt lại mật khẩu</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${userName}</strong>,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p>Nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
            <center>
              <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
            </center>
            <p>Hoặc copy link sau vào trình duyệt:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd;">${resetUrl}</p>
            <p class="warning">⚠️ Link này chỉ có hiệu lực trong 5 phút.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            <p>&copy; 2024 Bookstore System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Gửi email xác nhận đơn hàng
exports.sendOrderConfirmationEmail = async (email, orderData) => {
  const mailOptions = {
    from: `"Bookstore System" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Xác nhận đơn hàng #${orderData.order_code}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .order-details { background: white; padding: 15px; margin: 20px 0; border: 1px solid #ddd; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          .total { font-size: 18px; font-weight: bold; color: #4CAF50; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Đơn hàng đã được xác nhận</h1>
          </div>
          <div class="content">
            <p>Cảm ơn bạn đã đặt hàng tại Bookstore!</p>
            <div class="order-details">
              <h3>Thông tin đơn hàng</h3>
              <p><strong>Mã đơn hàng:</strong> ${orderData.order_code}</p>
              <p><strong>Ngày đặt:</strong> ${new Date(orderData.created_at).toLocaleString('vi-VN')}</p>
              <p><strong>Tổng tiền:</strong> <span class="total">${orderData.total_amount.toLocaleString('vi-VN')}đ</span></p>
            </div>
            <p>Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận và giao hàng.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Bookstore System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
};

