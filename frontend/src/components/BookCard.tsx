import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { Book } from '../types';

interface BookCardProps {
    book: Book;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
    const { isAuthenticated, user } = useAuthStore();
    const { addItem } = useCartStore();
    const navigate = useNavigate();

    const bookId = book.book_id || book.id;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        // FIX: Chỉ truyền bookId và số lượng mặc định là 1
        if (bookId) {
            addItem(bookId, 1);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const imageUrl = book.image_url
        ? (book.image_url.startsWith('http') ? book.image_url : `http://localhost:5000${book.image_url}`)
        : '';

    return (
        <Link to={`/books/${bookId}`} className="group flex flex-col h-full bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 overflow-hidden">
            <div className="relative pt-[140%] bg-gray-100 overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={book.title}
                        className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-4xl text-gray-300">
                        📚
                    </div>
                )}
                {book.stock_quantity === 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        Hết hàng
                    </div>
                )}
            </div>

            <div className="flex flex-col flex-grow p-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
                    {book.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{book.author}</p>

                {book.category_name && (
                    <span className="inline-block bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full w-fit mb-3">
                        {book.category_name}
                    </span>
                )}

                <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-bold text-red-600">{formatPrice(book.price)}</span>

                    {isAuthenticated && user?.role !== 'admin' && book.stock_quantity > 0 && (
                        <button
                            onClick={handleAddToCart}
                            className="p-2 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white transition-colors"
                            title="Thêm vào giỏ"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </button>
                    )}
                </div>

                {book.stock_quantity > 0 && book.stock_quantity <= 10 && (
                    <p className="text-xs text-orange-500 mt-2 font-medium">
                        Chỉ còn {book.stock_quantity} quyển
                    </p>
                )}
            </div>
        </Link>
    );
};

export default BookCard;