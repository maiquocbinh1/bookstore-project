import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaStar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import './BookDetail.css';

const BookDetail = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const { user, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookDetail();
  }, [id]);

  const fetchBookDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/books/${id}`);
      setBook(response.data.data);
    } catch (error) {
      console.error('Error fetching book:', error);
      toast.error('Không thể tải thông tin sách');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    await addToCart(book.id, quantity);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập để đánh giá');
      return;
    }

    try {
      await api.post('/books/reviews', {
        book_id: book.id,
        rating: review.rating,
        comment: review.comment
      });
      toast.success('Đánh giá thành công!');
      setReview({ rating: 5, comment: '' });
      fetchBookDetail();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi đánh giá');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!book) {
    return <div className="container"><p>Không tìm thấy sách</p></div>;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="book-detail-page container">
      <div className="book-detail-layout">
        <div className="book-image-section">
          {book.image_url ? (
            <img src={`http://localhost:5000${book.image_url}`} alt={book.title} />
          ) : (
            <div className="no-image-large">📚</div>
          )}
        </div>

        <div className="book-info-section">
          <h1>{book.title}</h1>
          <p className="book-author">Tác giả: {book.author}</p>
          {book.category_name && (
            <span className="badge badge-primary">{book.category_name}</span>
          )}

          <div className="book-price-section">
            <span className="price">{formatPrice(book.price)}</span>
            {book.stock_quantity > 0 ? (
              <span className="stock in-stock">✓ Còn hàng ({book.stock_quantity})</span>
            ) : (
              <span className="stock out-of-stock">✗ Hết hàng</span>
            )}
          </div>

          <div className="book-meta">
            {book.publisher && <p><strong>Nhà xuất bản:</strong> {book.publisher}</p>}
            {book.published_year && <p><strong>Năm xuất bản:</strong> {book.published_year}</p>}
            {book.pages && <p><strong>Số trang:</strong> {book.pages}</p>}
            {book.language && <p><strong>Ngôn ngữ:</strong> {book.language}</p>}
          </div>

          {user && !isAdmin() && book.stock_quantity > 0 && (
            <div className="add-to-cart-section">
              <div className="quantity-selector">
                <label>Số lượng:</label>
                <input
                  type="number"
                  min="1"
                  max={book.stock_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(book.stock_quantity, parseInt(e.target.value) || 1)))}
                  className="input"
                />
              </div>
              <button className="btn btn-primary btn-lg" onClick={handleAddToCart}>
                <FaShoppingCart /> Thêm vào giỏ hàng
              </button>
            </div>
          )}

          {book.description && (
            <div className="book-description">
              <h3>Mô tả sản phẩm</h3>
              <p>{book.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* KH-16: Reviews Section */}
      <div className="reviews-section">
        <h2>Đánh giá của khách hàng</h2>

        {user && !isAdmin() && (
          <form className="review-form card" onSubmit={handleSubmitReview}>
            <h3>Viết đánh giá</h3>
            <div className="rating-input">
              <label>Đánh giá:</label>
              <div className="stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <FaStar
                    key={star}
                    className={star <= review.rating ? 'star active' : 'star'}
                    onClick={() => setReview({ ...review, rating: star })}
                  />
                ))}
              </div>
            </div>
            <textarea
              className="input"
              rows="4"
              placeholder="Nhận xét của bạn..."
              value={review.comment}
              onChange={(e) => setReview({ ...review, comment: e.target.value })}
              required
            />
            <button type="submit" className="btn btn-primary">
              Gửi đánh giá
            </button>
          </form>
        )}

        <div className="reviews-list">
          {book.reviews && book.reviews.length > 0 ? (
            book.reviews.map(rev => (
              <div key={rev.id} className="review-item card">
                <div className="review-header">
                  <strong>{rev.user_name}</strong>
                  <div className="review-rating">
                    {[...Array(rev.rating)].map((_, i) => (
                      <FaStar key={i} className="star active" />
                    ))}
                  </div>
                </div>
                <p>{rev.comment}</p>
                <small className="review-date">
                  {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                </small>
              </div>
            ))
          ) : (
            <p className="no-reviews">Chưa có đánh giá nào</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetail;

