const nodemailer = require('nodemailer');

// Cấu hình transporter
const createTransporter = () => {
  // Trong production, sử dụng SMTP thật
  // Trong development, có thể dùng ethereal email để test
  
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Giả lập gửi email trong development
    return {
      sendMail: async (options) => {
        console.log('📧 [DEVELOPMENT] Email would be sent:');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Content:', options.html);
        return { messageId: 'dev-' + Date.now() };
      }
    };
  }
};

// KH-03: Gửi email reset password
const sendPasswordResetEmail = async (email, fullName, resetUrl) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@bookstore.com',
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
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #4CAF50; 
              color: white; 
              text-decoration: none; 
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .warning { color: #d32f2f; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Đặt lại mật khẩu</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${fullName}</strong>,</p>
              <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản tại Bookstore.</p>
              <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
              </p>
              <p class="warning">⚠️ Link này sẽ hết hạn sau 5 phút.</p>
              <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
              <p>Hoặc copy link sau vào trình duyệt:</p>
              <p style="word-break: break-all; font-size: 12px; color: #666;">${resetUrl}</p>
            </div>
            <div class="footer">
              <p>© 2024 Bookstore. All rights reserved.</p>
              <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
};

// Gửi email xác nhận đơn hàng
const sendOrderConfirmationEmail = async (email, fullName, orderNumber, totalAmount) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@bookstore.com',
      to: email,
      subject: `Xác nhận đơn hàng #${orderNumber} - Bookstore`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .order-info { background: white; padding: 15px; margin: 15px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Đơn hàng đã được xác nhận</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${fullName}</strong>,</p>
              <p>Cảm ơn bạn đã đặt hàng tại Bookstore!</p>
              <div class="order-info">
                <p><strong>Mã đơn hàng:</strong> ${orderNumber}</p>
                <p><strong>Tổng tiền:</strong> ${totalAmount.toLocaleString('vi-VN')} VNĐ</p>
              </div>
              <p>Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.</p>
              <p>Bạn có thể theo dõi trạng thái đơn hàng trong tài khoản của mình.</p>
            </div>
            <div class="footer">
              <p>© 2024 Bookstore. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Order confirmation email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error);
    // Không throw error vì email không phải critical
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendOrderConfirmationEmail
};

