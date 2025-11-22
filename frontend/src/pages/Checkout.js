import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shipping_name: '',
    shipping_phone: '',
    shipping_address: '',
    payment_method: 'cod',
    notes: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // KH-09: Tạo đơn hàng
      const orderResponse = await api.post('/orders', formData);
      const orderId = orderResponse.data.data.order_id;

      toast.success('Đặt hàng thành công!');

      // KH-10, KH-11: Xử lý thanh toán nếu là online
      if (formData.payment_method === 'online') {
        // Giả lập thanh toán
        const paymentSuccess = window.confirm('Giả lập thanh toán online. Chấp nhận thanh toán?');
        await api.post('/orders/payment', {
          order_id: orderId,
          payment_success: paymentSuccess
        });
      }

      await clearCart();
      navigate(`/orders/${orderId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đặt hàng thất bại');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const subtotal = getCartTotal();
  const vat = subtotal * 0.1;
  const shippingFee = 30000;
  const total = subtotal + vat + shippingFee;

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="checkout-page container">
      <h1>Thanh toán</h1>

      <div className="checkout-layout">
        <form className="checkout-form card" onSubmit={handleSubmit}>
          <h2>Thông tin giao hàng</h2>

          <div className="form-group">
            <label className="label">Họ và tên <span className="required">*</span></label>
            <input
              type="text"
              name="shipping_name"
              className="input"
              value={formData.shipping_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Số điện thoại <span className="required">*</span></label>
            <input
              type="tel"
              name="shipping_phone"
              className="input"
              value={formData.shipping_phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Địa chỉ giao hàng <span className="required">*</span></label>
            <textarea
              name="shipping_address"
              className="input"
              rows="3"
              value={formData.shipping_address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Phương thức thanh toán</label>
            <select
              name="payment_method"
              className="input"
              value={formData.payment_method}
              onChange={handleChange}
            >
              <option value="cod">Thanh toán khi nhận hàng (COD)</option>
              <option value="online">Thanh toán online (Giả lập)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">Ghi chú</label>
            <textarea
              name="notes"
              className="input"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Ghi chú cho đơn hàng..."
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Đang xử lý...' : 'Đặt hàng'}
          </button>
        </form>

        <div className="order-summary card">
          <h2>Đơn hàng ({cartItems.length} sản phẩm)</h2>

          <div className="summary-items">
            {cartItems.map(item => (
              <div key={item.id} className="summary-item">
                <span>{item.title} x{item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row">
            <span>Tạm tính:</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <div className="summary-row">
            <span>VAT (10%):</span>
            <span>{formatPrice(vat)}</span>
          </div>

          <div className="summary-row">
            <span>Phí vận chuyển:</span>
            <span>{formatPrice(shippingFee)}</span>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row total">
            <span>Tổng cộng:</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

