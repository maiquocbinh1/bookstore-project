import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';

interface OrderItem {
    book_id: number;
    title: string;
    author: string;
    image_url: string;
    quantity: number;
    price: number;
}

interface Order {
    order_id: number;
    order_code: string;
    created_at: string;
    status: string;
    payment_status: string;
    payment_method: string;
    total_amount: number;
    items: OrderItem[];
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const OrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchOrders();
    }, [page]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/orders?page=${page}&limit=5`);
            const { orders, pagination } = response.data.data;
            setOrders(orders);
            setPagination(pagination);
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải lịch sử đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Chờ xử lý</span>;
            case 'confirmed':
                return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Đã xác nhận</span>;
            case 'shipping':
                return <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">Đang giao</span>;
            case 'completed':
                return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Hoàn thành</span>;
            case 'cancelled':
                return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Đã hủy</span>;
            default:
                return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    const getPaymentStatusBadge = (status: string) => {
        return status === 'paid'
            ? <span className="text-green-600 text-xs font-bold flex items-center">✓ Đã thanh toán</span>
            : <span className="text-orange-500 text-xs font-bold">Chưa thanh toán</span>;
    };

    if (loading) return <Loading />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Đơn hàng của tôi</h1>

            {orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Bạn chưa có đơn hàng nào</h3>
                    <p className="text-gray-500 mb-6">Hãy khám phá kho sách và đặt hàng ngay nhé!</p>
                    <Link to="/books" className="btn btn-primary">
                        Mua sắm ngay
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order.order_id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Mã đơn hàng</p>
                                        <p className="text-sm font-bold text-gray-900">#{order.order_code}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Ngày đặt</p>
                                        <p className="text-sm text-gray-900">{formatDate(order.created_at)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold text-right">Tổng tiền</p>
                                        <p className="text-lg font-bold text-red-600">{formatPrice(order.total_amount)}</p>
                                    </div>
                                    <Link
                                        to={`/orders/${order.order_id}`}
                                        className="btn btn-secondary text-sm py-2"
                                    >
                                        Xem chi tiết
                                    </Link>
                                </div>
                            </div>

                            <div className="px-6 py-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(order.status)}
                                        {getPaymentStatusBadge(order.payment_status)}
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Ví điện tử / Chuyển khoản'}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {order.items.map((item, index) => (
                                        <div key={`${order.order_id}-${item.book_id}-${index}`} className="flex items-start gap-4">
                                            <div className="w-16 h-24 flex-shrink-0 bg-gray-100 rounded border border-gray-200 overflow-hidden">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:5000${item.image_url}`}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{item.title}</h4>
                                                <p className="text-sm text-gray-500 mb-1">{item.author}</p>
                                                <div className="flex items-center text-sm">
                                                    <span className="text-gray-500">x{item.quantity}</span>
                                                    <span className="mx-2 text-gray-300">|</span>
                                                    <span className="font-medium text-gray-900">{formatPrice(item.price)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trang trước
                            </button>
                            <span className="text-sm text-gray-600">
                                Trang <span className="font-bold text-gray-900">{page}</span> / {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trang sau
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OrdersPage;