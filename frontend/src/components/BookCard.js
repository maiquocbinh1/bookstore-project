import React from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './BookCard.css';

const BookCard = ({ book }) => {
  const { user, isAdmin } = useAuth();
  const { addToCart } = useCart();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    await addToCart(book.id, 1);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <Link to={`/books/${book.id}`} className="book-card">
      <div className="book-image">
        {book.image_url ? (
          <img src={`http://localhost:5000${book.image_url}`} alt={book.title} />
        ) : (
          <div className="no-image">📚</div>
        )}
        {book.stock_quantity === 0 && (
          <div className="out-of-stock-badge">Hết hàng</div>
        )}
      </div>

      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>
        {book.category_name && (
          <span className="badge badge-primary">{book.category_name}</span>
        )}
        <div className="book-footer">
          <span className="book-price">{formatPrice(book.price)}</span>
          {user && !isAdmin() && book.stock_quantity > 0 && (
            <button
              className="btn btn-primary btn-sm add-to-cart-btn"
              onClick={handleAddToCart}
            >
              <FaShoppingCart />
            </button>
          )}
        </div>
        {book.stock_quantity > 0 && book.stock_quantity <= 10 && (
          <p className="stock-warning">Chỉ còn {book.stock_quantity} quyển</p>
        )}
      </div>
    </Link>
  );
};

export default BookCard;

