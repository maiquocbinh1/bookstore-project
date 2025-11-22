import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaSearch, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const cartCount = getCartCount();

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Logo */}
          <Link to="/" className="navbar-logo" onClick={() => setMobileMenuOpen(false)}>
            📚 <span>Bookstore</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* Navigation Links */}
          <div className={`navbar-links ${mobileMenuOpen ? 'active' : ''}`}>
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              Trang chủ
            </Link>

            {user && !isAdmin() && (
              <>
                <Link to="/my-orders" onClick={() => setMobileMenuOpen(false)}>
                  Đơn hàng
                </Link>
                <Link to="/cart" className="cart-link" onClick={() => setMobileMenuOpen(false)}>
                  <FaShoppingCart />
                  <span>Giỏ hàng</span>
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </Link>
              </>
            )}

            {isAdmin() && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                Quản trị
              </Link>
            )}

            {user ? (
              <div className="user-menu">
                <FaUser />
                <span>{user.email}</span>
                <div className="user-dropdown">
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                    Thông tin cá nhân
                  </Link>
                  {isAdmin() && (
                    <>
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                        Dashboard
                      </Link>
                      <Link to="/admin/books" onClick={() => setMobileMenuOpen(false)}>
                        Quản lý sách
                      </Link>
                      <Link to="/admin/orders" onClick={() => setMobileMenuOpen(false)}>
                        Quản lý đơn hàng
                      </Link>
                      <Link to="/admin/reports" onClick={() => setMobileMenuOpen(false)}>
                        Báo cáo
                      </Link>
                    </>
                  )}
                  <button onClick={handleLogout} className="logout-btn">
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setMobileMenuOpen(false)}>
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMobileMenuOpen(false)}>
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

