import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import Loading from '../../components/Loading';

const CartPage: React.FC = () => {
    const navigate = useNavigate();

    // Lấy state và actions từ store
    const {
        items,
        loading,
        fetchCart,
        updateQuantity,
        removeItem,
        getCartTotal // Đã đổi tên từ calculateTotal sang getCartTotal
    } = useCartStore();

    // Tải dữ liệu giỏ hàng khi vào trang
    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleQuantityChange = (itemId: number, newQuantity: number, stock: number) => {
        // Kiểm tra số lượng hợp lệ (1 <= quantity <= stock)
        if (newQuantity >= 1 && newQuantity <= stock) {
            updateQuantity(itemId, newQuantity);
        }
    };

    // Tính toán chi phí
    const subtotal = getCartTotal(); // Gọi hàm tính tổng
    const vat = subtotal * 0.1; // Thuế 10%

    // Phí vận chuyển
    let shippingFee = 0;
    if (subtotal > 0) {
        if (subtotal < 200000) shippingFee = 30000;
        else if (subtotal < 500000) shippingFee = 20000;
        else shippingFee = 0;
    }

    const total = subtotal + vat + shippingFee;

    if (loading && items.length === 0) {
        return <Loading />;
    }

    // Giao diện khi giỏ hàng trống
    if (items.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h2>
                <p className="text-gray-500 mb-8">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
                <Link to="/books" className="btn btn-primary inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Tiếp tục mua sắm
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ hàng của bạn</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cột bên trái: Danh sách sản phẩm */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div key={item.cart_id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-4">
                            {/* Ảnh sách */}
                            <div className="w-24 h-32 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                {item.image_url ? (
                                    <img
                                        src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:5000${item.image_url}`}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
                                )}
                            </div>

                            {/* Thông tin & Điều khiển */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 mr-2">
                                            <Link to={`/books/${item.book_id}`} className="hover:text-green-600 transition-colors">
                                                {item.title}
                                            </Link>
                                        </h3>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
                                                    removeItem(item.cart_id);
                                                }
                                            }}
                                            className="text-gray-400 hover:text-red-500 p-1"
                                            title="Xóa"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500">{item.author}</p>
                                    <p className="text-red-600 font-bold mt-1">{formatPrice(item.price)}</p>
                                </div>

                                <div className="flex items-center mt-4">
                                    {/* Bộ điều khiển số lượng */}
                                    <div className="flex items-center border border-gray-300 rounded-md">
                                        <button
                                            onClick={() => handleQuantityChange(item.cart_id, item.quantity - 1, item.stock_quantity)}
                                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                            disabled={item.quantity <= 1}
                                        >
                                            -
                                        </button>
                                        <span className="px-3 py-1 text-gray-900 font-medium border-l border-r border-gray-300 min-w-[2.5rem] text-center">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => handleQuantityChange(item.cart_id, item.quantity + 1, item.stock_quantity)}
                                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                            disabled={item.quantity >= item.stock_quantity}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className="ml-auto text-sm font-medium text-gray-900">
                                        Tổng: {formatPrice(item.price * item.quantity)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cột bên phải: Tổng kết đơn hàng */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-24">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Tổng đơn hàng</h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Tạm tính</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>VAT (10%)</span>
                                <span>{formatPrice(vat)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Phí vận chuyển</span>
                                <span>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
                            </div>

                            {shippingFee > 0 && (
                                <p className="text-xs text-green-600 italic bg-green-50 p-2 rounded">
                                    Mua thêm {formatPrice(500000 - subtotal)} để được Freeship (đơn &gt; 500k)
                                </p>
                            )}

                            <div className="border-t border-gray-200 pt-3 mt-3">
                                <div className="flex justify-between text-base font-bold text-gray-900">
                                    <span>Tổng cộng</span>
                                    <span className="text-red-600 text-xl">{formatPrice(total)}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-right">(Đã bao gồm VAT)</p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/checkout')}
                            className="w-full mt-6 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5"
                        >
                            Tiến hành thanh toán
                        </button>

                        <Link to="/books" className="block text-center mt-4 text-sm text-gray-600 hover:text-green-600 transition-colors">
                            ← Tiếp tục mua sắm
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;