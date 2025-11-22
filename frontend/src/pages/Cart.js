import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
  const { cartItems, updateCartItem, removeFromCart, getCartTotal, loading } = useCart();
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateCartItem(itemId, newQuantity);
  };

  const handleRemove = async (itemId) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      await removeFromCart(itemId);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="empty-cart container">
        <FaShoppingCart className="empty-icon" />
        <h2>Giỏ hàng trống</h2>
        <p>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
        <Link to="/" className="btn btn-primary btn-lg">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page container">
      <h1>Giỏ hàng của bạn</h1>
      <p className="cart-count">{cartItems.length} sản phẩm</p>

      <div className="cart-layout">
        <div className="cart-items">
          {cartItems.map(item => (
            <div key={item.id} className="cart-item card">
              <div className="item-image">
                {item.image_url ? (
                  <img src={`http://localhost:5000${item.image_url}`} alt={item.title} />
                ) : (
                  <div className="no-image">📚</div>
                )}
              </div>

              <div className="item-info">
                <Link to={`/books/${item.book_id}`} className="item-title">
                  {item.title}
                </Link>
                <p className="item-author">{item.author}</p>
                <p className="item-price">{formatPrice(item.price)}</p>
              </div>

              <div className="item-actions">
                <div className="quantity-control">
                  <button
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                    min="1"
                    max={item.stock_quantity}
                  />
                  <button
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock_quantity}
                  >
                    +
                  </button>
                </div>

                <p className="item-subtotal">
                  {formatPrice(item.price * item.quantity)}
                </p>

                <button
                  className="btn-remove"
                  onClick={() => handleRemove(item.id)}
                  title="Xóa"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary card">
          <h2>Tổng đơn hàng</h2>
          
          <div className="summary-row">
            <span>Tạm tính:</span>
            <span>{formatPrice(getCartTotal())}</span>
          </div>
          
          <div className="summary-row">
            <span>VAT (10%):</span>
            <span>{formatPrice(getCartTotal() * 0.1)}</span>
          </div>
          
          <div className="summary-row">
            <span>Phí vận chuyển:</span>
            <span>{formatPrice(30000)}</span>
          </div>
          
          <div className="summary-divider"></div>
          
          <div className="summary-row total">
            <span>Tổng cộng:</span>
            <span>{formatPrice(getCartTotal() + getCartTotal() * 0.1 + 30000)}</span>
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            onClick={handleCheckout}
          >
            Tiến hành thanh toán
          </button>

          <Link to="/" className="btn btn-outline" style={{ width: '100%', marginTop: '10px' }}>
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;

