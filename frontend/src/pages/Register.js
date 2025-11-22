import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaEnvelope, FaLock, FaUser, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất 1 số';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    if (!formData.full_name || formData.full_name.length < 2) {
      newErrors.full_name = 'Họ tên phải có ít nhất 2 ký tự';
    }

    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);

    if (result.success) {
      toast.success('Đăng ký thành công!');
      navigate('/');
    } else {
      toast.error(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Đăng ký</h2>
          <p className="auth-subtitle">Tạo tài khoản mới để bắt đầu</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">
                <FaEnvelope /> Email <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                className={`input ${errors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="label">
                <FaUser /> Họ và tên <span className="required">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                className={`input ${errors.full_name ? 'error' : ''}`}
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
              />
              {errors.full_name && <span className="error-message">{errors.full_name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">
                  <FaLock /> Mật khẩu <span className="required">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  className={`input ${errors.password ? 'error' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label className="label">
                  <FaLock /> Xác nhận mật khẩu <span className="required">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  className={`input ${errors.confirmPassword ? 'error' : ''}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="label">
                <FaPhone /> Số điện thoại
              </label>
              <input
                type="tel"
                name="phone"
                className={`input ${errors.phone ? 'error' : ''}`}
                value={formData.phone}
                onChange={handleChange}
                placeholder="0123456789"
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label className="label">
                <FaMapMarkerAlt /> Địa chỉ
              </label>
              <textarea
                name="address"
                className="input"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Đường ABC, Quận 1, TP.HCM"
                rows="3"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <div className="auth-links">
            <p>
              Đã có tài khoản?{' '}
              <Link to="/login">Đăng nhập ngay</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

