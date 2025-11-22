import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>📚 Bookstore</h3>
            <p>Hệ thống bán sách trực tuyến uy tín và chất lượng</p>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><FaFacebook /></a>
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Liên kết</h4>
            <ul>
              <li><Link to="/">Trang chủ</Link></li>
              <li><Link to="/my-orders">Đơn hàng</Link></li>
              <li><Link to="/cart">Giỏ hàng</Link></li>
              <li><Link to="/profile">Tài khoản</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Chính sách</h4>
            <ul>
              <li><a href="#">Chính sách đổi trả</a></li>
              <li><a href="#">Chính sách bảo mật</a></li>
              <li><a href="#">Điều khoản sử dụng</a></li>
              <li><a href="#">Hướng dẫn mua hàng</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Liên hệ</h4>
            <ul className="contact-info">
              <li>
                <FaMapMarkerAlt />
                <span>123 Đường ABC, Quận 1, TP.HCM</span>
              </li>
              <li>
                <FaPhone />
                <span>(028) 1234 5678</span>
              </li>
              <li>
                <FaEnvelope />
                <span>contact@bookstore.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 Bookstore. All rights reserved.</p>
          <p>Được phát triển bởi Nhóm dự án</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

