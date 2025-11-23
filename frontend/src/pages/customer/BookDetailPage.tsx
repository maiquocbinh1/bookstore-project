import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { Book } from '../../types';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';

const BookDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { user, isAuthenticated } = useAuthStore();
    const { addItem } = useCartStore();

    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    // Sử dụng useCallback để tránh cảnh báo missing dependency
    const fetchBookDetail = useCallback(async () => {
        if (!id) return;
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
    }, [id]);

    useEffect(() => {
        fetchBookDetail();
    }, [fetchBookDetail]);

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            toast('Vui lòng đăng nhập để mua hàng', { icon: '🔒' });
            navigate('/login');
            return;
        }

        if (book) {
            const bookId = book.book_id || book.id;
            if (bookId) {
                // SỬA LẠI: Chỉ truyền bookId và quantity
                addItem(bookId, quantity);
            }
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để đánh giá');
            return;
        }

        if (!book) return;

        try {
            setSubmittingReview(true);
            await api.post('/reviews', {
                book_id: book.book_id || book.id,
                rating,
                comment
            });
            toast.success('Đánh giá thành công!');
            setComment('');
            setRating(5);
            fetchBookDetail();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Không thể gửi đánh giá';
            toast.error(message);
        } finally {
            setSubmittingReview(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    if (loading) return <Loading />;
    if (!book) return <div className="text-center py-10">Không tìm thấy sách</div>;

    const imageUrl = book.image_url
        ? (book.image_url.startsWith('http') ? book.image_url : `http://localhost:5000${book.image_url}`)
        : '';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="md:flex">
                    <div className="md:w-1/3 lg:w-1/4 bg-gray-50 p-8 flex items-center justify-center">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={book.title}
                                className="w-full h-auto max-h-[500px] object-contain shadow-lg rounded-md"
                            />
                        ) : (
                            <div className="w-full h-64 flex items-center justify-center bg-gray-200 rounded-md text-4xl">
                                📚
                            </div>
                        )}
                    </div>

                    <div className="md:w-2/3 lg:w-3/4 p-8">
                        <div className="mb-4">
                            {book.category_name && (
                                <span className="text-primary-600 text-sm font-semibold tracking-wide uppercase">
                                    {book.category_name}
                                </span>
                            )}
                            <h1 className="mt-2 text-3xl font-bold text-gray-900">{book.title}</h1>
                            <p className="text-lg text-gray-600 mt-1">Tác giả: <span className="font-medium text-gray-900">{book.author}</span></p>
                        </div>

                        <div className="border-t border-b border-gray-100 py-6 my-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span className="text-3xl font-bold text-red-600 block">{formatPrice(book.price)}</span>
                                <span className={`text-sm font-medium mt-1 block ${book.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {book.stock_quantity > 0 ? `✓ Còn hàng (${book.stock_quantity})` : '✗ Hết hàng'}
                                </span>
                            </div>

                            {isAuthenticated && user?.role !== 'admin' && book.stock_quantity > 0 && (
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center border border-gray-300 rounded-lg">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            max={book.stock_quantity}
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, Math.min(book.stock_quantity, parseInt(e.target.value) || 1)))}
                                            className="w-12 text-center border-none focus:ring-0"
                                        />
                                        <button
                                            onClick={() => setQuantity(Math.min(book.stock_quantity, quantity + 1))}
                                            className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleAddToCart}
                                        className="btn btn-primary flex items-center space-x-2 px-6 py-3"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span>Thêm vào giỏ</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm mb-8">
                            {book.publisher && (
                                <div>
                                    <span className="text-gray-500">Nhà xuất bản:</span>
                                    <p className="font-medium text-gray-900">{book.publisher}</p>
                                </div>
                            )}
                            {(book.published_year || book.publication_year) && (
                                <div>
                                    <span className="text-gray-500">Năm xuất bản:</span>
                                    <p className="font-medium text-gray-900">{book.published_year || book.publication_year}</p>
                                </div>
                            )}
                            {book.pages && (
                                <div>
                                    <span className="text-gray-500">Số trang:</span>
                                    <p className="font-medium text-gray-900">{book.pages}</p>
                                </div>
                            )}
                            {book.isbn && (
                                <div>
                                    <span className="text-gray-500">ISBN:</span>
                                    <p className="font-medium text-gray-900">{book.isbn}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Giới thiệu sách</h3>
                            <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                                {book.description || 'Chưa có mô tả cho sách này.'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Đánh giá từ khách hàng</h2>

                    {book.reviews && book.reviews.length > 0 ? (
                        <div className="space-y-4">
                            {book.reviews.map((rev) => (
                                <div key={rev.review_id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-gray-900">{rev.full_name || rev.user_name || 'Người dùng ẩn danh'}</p>
                                            <div className="flex items-center mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg
                                                        key={i}
                                                        className={`w-4 h-4 ${i < rev.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    <p className="text-gray-600">{rev.comment}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-lg text-center border border-dashed border-gray-300">
                            <p className="text-gray-500">Chưa có đánh giá nào cho sách này.</p>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    {isAuthenticated && user?.role !== 'admin' ? (
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-24">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Viết đánh giá của bạn</h3>
                            <form onSubmit={handleSubmitReview}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá sao</label>
                                    <div className="flex space-x-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className={`text-2xl focus:outline-none transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'
                                                    }`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nhận xét</label>
                                    <textarea
                                        className="input w-full h-32 resize-none"
                                        placeholder="Chia sẻ cảm nghĩ của bạn về cuốn sách này..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="w-full btn btn-primary disabled:opacity-50"
                                >
                                    {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        !isAuthenticated && (
                            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                                <p className="text-blue-800 text-center mb-3">Bạn muốn viết đánh giá?</p>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full btn bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Đăng nhập ngay
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookDetailPage;