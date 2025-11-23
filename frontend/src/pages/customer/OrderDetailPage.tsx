import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

interface OrderStatusHistory {
    history_id: number;
    status: string;
    created_at: string;
}

interface Order {
    order_id: number;
    order_code: string;
    created_at: string;
    status: string;
    payment_status: string;
    payment_method: string;
    subtotal: number;
    vat: number;
    shipping_fee: number;
    total_amount: number;
    recipient_name: string;
    phone: string;
    address_line: string;
    city: string;
    district: string;
    items: OrderItem[];
    status_history: OrderStatusHistory[];
}

const OrderDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [showMomoModal, setShowMomoModal] = useState(false);

    useEffect(() => {
        fetchOrderDetail();
    }, [id]);

    const fetchOrderDetail = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/orders/${id}`);
            setOrder(response.data.data);
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải thông tin đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;

        setProcessing(true);
        try {
            await api.post(`/orders/${id}/cancel`);
            toast.success('Đã hủy đơn hàng thành công');
            fetchOrderDetail();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể hủy đơn hàng');
        } finally {
            setProcessing(false);
        }
    };

    const handleOpenPaymentModal = () => {
        setShowMomoModal(true);
    };

    const handleConfirmPayment = async () => {
        if (!order) return;

        setProcessing(true);
        try {
            await api.post('/orders/payment', {
                order_id: order.order_id,
                payment_info: { simulate_success: true }
            });
            toast.success('Thanh toán thành công');
            setShowMomoModal(false);
            fetchOrderDetail();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Thanh toán thất bại');
        } finally {
            setProcessing(false);
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

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            pending: 'Đặt hàng thành công',
            confirmed: 'Đã xác nhận',
            shipping: 'Đang giao hàng',
            completed: 'Giao hàng thành công',
            cancelled: 'Đã hủy',
            refunded: 'Đã hoàn tiền'
        };
        return map[status] || status;
    };

    if (loading) return <Loading />;
    if (!order) return <div className="text-center py-8">Không tìm thấy đơn hàng</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            <div className="mb-6">
                <Link to="/orders" className="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4">
                    ← Quay lại danh sách
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Đơn hàng #{order.order_code}</h1>
                        <p className="text-gray-500 text-sm mt-1">Đặt ngày: {formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        {getStatusBadge(order.status)}
                        {(order.status === 'pending' || order.status === 'confirmed') && (
                            <button
                                onClick={handleCancelOrder}
                                disabled={processing}
                                className="btn bg-white border border-red-300 text-red-600 hover:bg-red-50"
                            >
                                {processing ? 'Đang xử lý...' : 'Hủy đơn hàng'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="font-semibold text-gray-900">Sản phẩm</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            {order.items.map((item) => (
                                <div key={item.book_id} className="flex gap-4">
                                    <div className="w-20 h-28 flex-shrink-0 bg-gray-100 rounded border border-gray-200 overflow-hidden">
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
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 line-clamp-2">{item.title}</h3>
                                        <p className="text-sm text-gray-500 mb-2">{item.author}</p>
                                        <div className="flex justify-between items-end">
                                            <p className="text-sm text-gray-600">Số lượng: <span className="font-medium text-gray-900">{item.quantity}</span></p>
                                            <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="font-semibold text-gray-900">Lịch sử đơn hàng</h2>
                        </div>
                        <div className="p-6">
                            <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                                {order.status_history && order.status_history.map((history, index) => (
                                    <div key={history.history_id} className="relative pl-8">
                                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${index === 0 ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300'}`}></div>
                                        <div>
                                            <p className={`text-sm font-medium ${index === 0 ? 'text-primary-700' : 'text-gray-900'}`}>
                                                {getStatusLabel(history.status)}
                                            </p>
                                            <p className="text-xs text-gray-500">{formatDate(history.created_at)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="font-semibold text-gray-900">Thông tin nhận hàng</h2>
                        </div>
                        <div className="p-6 text-sm">
                            <p className="font-bold text-gray-900 mb-1">{order.recipient_name}</p>
                            <p className="text-gray-600 mb-3">{order.phone}</p>
                            <p className="text-gray-600">
                                {order.address_line}, {order.district}, {order.city}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="font-semibold text-gray-900">Thanh toán</h2>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between mb-4">
                                <span className="text-sm text-gray-600">Phương thức</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {order.payment_method === 'cod' ? 'COD - Nhận hàng trả tiền' : 'Ví Momo / Điện tử'}
                                </span>
                            </div>
                            <div className="flex justify-between mb-6">
                                <span className="text-sm text-gray-600">Trạng thái</span>
                                <span className={`text-sm font-bold ${order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                                    {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                </span>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tạm tính</span>
                                    <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">VAT (10%)</span>
                                    <span>{formatPrice(order.vat)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Phí vận chuyển</span>
                                    <span>{formatPrice(order.shipping_fee)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                                    <span>Tổng cộng</span>
                                    <span className="text-red-600">{formatPrice(order.total_amount)}</span>
                                </div>
                            </div>

                            {order.payment_status !== 'paid' && order.payment_method !== 'cod' && order.status !== 'cancelled' && (
                                <button
                                    onClick={handleOpenPaymentModal}
                                    disabled={processing}
                                    className="w-full mt-6 btn bg-[#A50064] text-white hover:bg-[#8d0055]"
                                >
                                    {processing ? 'Đang xử lý...' : 'Thanh toán ngay (Momo)'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showMomoModal && order && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center animate-fade-in-up">
                        <h3 className="text-2xl font-bold text-[#A50064] mb-2">Thanh toán Momo</h3>
                        <p className="text-gray-600 mb-6">Vui lòng quét mã QR bên dưới để thanh toán</p>

                        <div className="bg-gray-100 p-4 rounded-lg inline-block mb-6">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PAY_MOMO_${order.order_id}_${order.total_amount}`}
                                alt="Momo QR Code"
                                className="w-48 h-48 mx-auto"
                            />
                        </div>

                        <div className="text-lg font-bold text-gray-900 mb-6">
                            Số tiền: <span className="text-red-600">{formatPrice(order.total_amount)}</span>
                        </div>

                        <p className="text-sm text-gray-500 mb-6">
                            Nội dung chuyển khoản: <span className="font-mono font-bold text-gray-800">MOMO{order.order_id}</span>
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={handleConfirmPayment}
                                disabled={processing}
                                className="w-full btn bg-[#A50064] text-white hover:bg-[#8d0055] py-3 text-lg font-medium shadow-lg"
                            >
                                {processing ? 'Đang xác thực...' : 'Tôi đã thanh toán'}
                            </button>

                            <button
                                onClick={() => setShowMomoModal(false)}
                                className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium py-2"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetailPage;