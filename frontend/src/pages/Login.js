import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success('Đăng nhập thành công!');
      
      // Redirect based on role
      if (result.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      toast.error(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Đăng nhập</h2>
          <p className="auth-subtitle">Chào mừng bạn quay lại!</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">
                <FaEnvelope /> Email
              </label>
              <input
                type="email"
                name="email"
                className="input"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="example@email.com"
              />
            </div>

            <div className="form-group">
              <label className="label">
                <FaLock /> Mật khẩu
              </label>
              <input
                type="password"
                name="password"
                className="input"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>

            <div className="form-footer">
              <Link to="/password-reset-request" className="forgot-password">
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="auth-links">
            <p>
              Chưa có tài khoản?{' '}
              <Link to="/register">Đăng ký ngay</Link>
            </p>
          </div>

          <div className="demo-accounts">
            <p><strong>Tài khoản demo:</strong></p>
            <p>🔹 Admin: admin@bookstore.com / admin123</p>
            <p>🔹 Customer: customer@bookstore.com / customer123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

