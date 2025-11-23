import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore, CartItem } from '../../store/cartStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import Loading from '../../components/Loading';

interface Address {
    address_id: number;
    recipient_name: string;
    phone: string;
    address_line: string;
    city: string;
    district?: string;
    is_default: boolean;
}

interface OrderSnapshot {
    items: CartItem[];
    subtotal: number;
    vat: number;
    shippingFee: number;
    total: number;
}

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { items, getCartTotal, clearCart } = useCartStore();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const [showAddAddress, setShowAddAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({
        recipient_name: '',
        phone: '',
        address_line: '',
        city: '',
        district: ''
    });

    const [showMomoModal, setShowMomoModal] = useState(false);
    const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

    const [orderSnapshot, setOrderSnapshot] = useState<OrderSnapshot | null>(null);
    const isOrderSuccess = useRef(false);

    useEffect(() => {
        if (isOrderSuccess.current) return;

        if (items.length === 0 && !orderSnapshot) {
            toast.error('Giỏ hàng trống');
            navigate('/cart');
            return;
        }
        fetchAddresses();
    }, [items, navigate, orderSnapshot]);

    const fetchAddresses = async () => {
        try {
            const response = await api.get('/orders/addresses/list');
            const addressList = response.data.data;
            setAddresses(addressList);

            if (addressList.length > 0) {
                const defaultAddr = addressList.find((a: Address) => a.is_default);
                setSelectedAddressId(defaultAddr ? defaultAddr.address_id : addressList[0].address_id);
            } else {
                setShowAddAddress(true);
            }
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải danh sách địa chỉ');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/orders/addresses', {
                ...newAddress,
                is_default: addresses.length === 0
            });

            toast.success('Thêm địa chỉ thành công');
            setNewAddress({ recipient_name: '', phone: '', address_line: '', city: '', district: '' });
            setShowAddAddress(false);
            fetchAddresses();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi thêm địa chỉ');
        }
    };

    const calculateCosts = () => {
        const subtotal = getCartTotal();
        const vat = subtotal * 0.1;
        let shippingFee = 0;
        if (subtotal < 200000) shippingFee = 30000;
        else if (subtotal < 500000) shippingFee = 20000;

        const total = subtotal + vat + shippingFee;
        return { subtotal, vat, shippingFee, total };
    };

    const currentCosts = calculateCosts();

    const displayData = orderSnapshot || {
        items: items,
        ...currentCosts
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            toast.error('Vui lòng chọn địa chỉ giao hàng');
            return;
        }

        setProcessing(true);
        try {
            const orderData = {
                address_id: selectedAddressId,
                payment_method: paymentMethod,
                notes: note
            };

            const response = await api.post('/orders', orderData);

            if (response.data.success) {
                const { order_id } = response.data.data;

                isOrderSuccess.current = true;

                if (paymentMethod === 'e_wallet') {
                    setOrderSnapshot({
                        items: [...items],
                        ...currentCosts
                    });
                    setCreatedOrderId(order_id);
                    await clearCart();
                    setShowMomoModal(true);
                } else {
                    await clearCart();
                    toast.success('Đặt hàng thành công!');
                    navigate('/orders');
                }
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Đặt hàng thất bại';
            toast.error(message);
        } finally {
            if (paymentMethod !== 'e_wallet') {
                setProcessing(false);
            }
        }
    };

    const handleConfirmMomoPayment = async () => {
        if (!createdOrderId) return;

        setProcessing(true);
        try {
            await api.post('/orders/payment', {
                order_id: createdOrderId,
                payment_info: { simulate_success: true }
            });

            toast.success('Thanh toán Momo thành công!');
            setShowMomoModal(false);
            navigate('/orders');
        } catch (error) {
            toast.error('Xác nhận thanh toán thất bại. Vui lòng kiểm tra lại trong đơn hàng.');
            navigate('/orders');
        } finally {
            setProcessing(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    if (loading) return <Loading />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Địa chỉ nhận hàng</h2>
                            <button
                                onClick={() => setShowAddAddress(!showAddAddress)}
                                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                                {showAddAddress ? 'Hủy' : '+ Thêm địa chỉ mới'}
                            </button>
                        </div>

                        {showAddAddress && (
                            <form onSubmit={handleAddAddress} className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên người nhận</label>
                                        <input
                                            required
                                            type="text"
                                            className="input w-full"
                                            value={newAddress.recipient_name}
                                            onChange={e => setNewAddress({ ...newAddress, recipient_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                        <input
                                            required
                                            type="tel"
                                            className="input w-full"
                                            value={newAddress.phone}
                                            onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ (Số nhà, đường)</label>
                                    <input
                                        required
                                        type="text"
                                        className="input w-full"
                                        value={newAddress.address_line}
                                        onChange={e => setNewAddress({ ...newAddress, address_line: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                                        <input
                                            type="text"
                                            className="input w-full"
                                            value={newAddress.district}
                                            onChange={e => setNewAddress({ ...newAddress, district: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</label>
                                        <input
                                            required
                                            type="text"
                                            className="input w-full"
                                            value={newAddress.city}
                                            onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary btn-sm">Lưu địa chỉ</button>
                            </form>
                        )}

                        {addresses.length > 0 ? (
                            <div className="space-y-3">
                                {addresses.map((addr) => (
                                    <label
                                        key={addr.address_id}
                                        className={`block p-4 border rounded-lg cursor-pointer transition-all ${selectedAddressId === addr.address_id
                                                ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-start">
                                            <input
                                                type="radio"
                                                name="address"
                                                className="mt-1 mr-3 text-primary-600 focus:ring-primary-500"
                                                checked={selectedAddressId === addr.address_id}
                                                onChange={() => setSelectedAddressId(addr.address_id)}
                                            />
                                            <div>
                                                <p className="font-bold text-gray-900">
                                                    {addr.recipient_name} <span className="font-normal text-gray-500 text-sm">| {addr.phone}</span>
                                                </p>
                                                <p className="text-gray-600 text-sm mt-1">
                                                    {addr.address_line}, {addr.district ? `${addr.district}, ` : ''}{addr.city}
                                                </p>
                                                {addr.is_default && (
                                                    <span className="inline-block mt-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">Mặc định</span>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            !showAddAddress && <p className="text-gray-500 italic">Chưa có địa chỉ nào. Vui lòng thêm địa chỉ.</p>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Phương thức thanh toán</h2>
                        <div className="space-y-3">
                            <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="payment"
                                    value="cod"
                                    checked={paymentMethod === 'cod'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="mr-3 text-primary-600 focus:ring-primary-500"
                                />
                                <div className="flex items-center">
                                    <span className="font-medium text-gray-900">Thanh toán khi nhận hàng (COD)</span>
                                </div>
                            </label>

                            <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="payment"
                                    value="e_wallet"
                                    checked={paymentMethod === 'e_wallet'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="mr-3 text-primary-600 focus:ring-primary-500"
                                />
                                <div className="flex items-center">
                                    <img
                                        src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                                        alt="Momo"
                                        className="w-8 h-8 mr-3 object-contain rounded"
                                    />
                                    <span className="font-medium text-gray-900">Thanh toán qua Ví Momo</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Ghi chú đơn hàng</h2>
                        <textarea
                            className="input w-full h-24 resize-none"
                            placeholder="Nhập ghi chú cho người bán hoặc shipper..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-24">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Đơn hàng của bạn</h2>

                        <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {displayData.items.map((item) => (
                                <div key={item.cart_id} className="flex gap-3">
                                    <div className="w-12 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                                        {item.image_url && <img src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:5000${item.image_url}`} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 text-sm">
                                        <p className="font-medium text-gray-900 line-clamp-2">{item.title}</p>
                                        <p className="text-gray-500">x{item.quantity}</p>
                                    </div>
                                    <p className="font-medium text-gray-900 text-sm">{formatPrice(item.price * item.quantity)}</p>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 pt-4 space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Tạm tính</span>
                                <span>{formatPrice(displayData.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>VAT (10%)</span>
                                <span>{formatPrice(displayData.vat)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Phí vận chuyển</span>
                                <span>{displayData.shippingFee === 0 ? 'Miễn phí' : formatPrice(displayData.shippingFee)}</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4 mt-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-gray-900 text-lg">Tổng cộng</span>
                                <span className="font-bold text-red-600 text-xl">{formatPrice(displayData.total)}</span>
                            </div>
                            <p className="text-right text-xs text-gray-500">(Đã bao gồm VAT)</p>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={processing || (items.length === 0 && !orderSnapshot)}
                            className="w-full mt-6 btn btn-primary py-3 text-base shadow-lg shadow-primary-200 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                        </button>
                    </div>
                </div>
            </div>

            {showMomoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center animate-fade-in-up">
                        <h3 className="text-2xl font-bold text-[#A50064] mb-2">Thanh toán Momo</h3>
                        <p className="text-gray-600 mb-6">Vui lòng quét mã QR bên dưới để thanh toán</p>

                        <div className="bg-gray-100 p-4 rounded-lg inline-block mb-6">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PAY_MOMO_${createdOrderId}_${displayData.total}`}
                                alt="Momo QR Code"
                                className="w-48 h-48 mx-auto"
                            />
                        </div>

                        <div className="text-lg font-bold text-gray-900 mb-6">
                            Số tiền: <span className="text-red-600">{formatPrice(displayData.total)}</span>
                        </div>

                        <p className="text-sm text-gray-500 mb-6">
                            Nội dung chuyển khoản: <span className="font-mono font-bold text-gray-800">MOMO{createdOrderId}</span>
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={handleConfirmMomoPayment}
                                disabled={processing}
                                className="w-full btn bg-[#A50064] text-white hover:bg-[#8d0055] py-3 text-lg font-medium shadow-lg"
                            >
                                {processing ? 'Đang xác thực...' : 'Tôi đã thanh toán'}
                            </button>

                            <button
                                onClick={() => {
                                    setShowMomoModal(false);
                                    navigate('/orders');
                                    toast('Đơn hàng đã được tạo. Bạn có thể thanh toán lại sau.');
                                }}
                                className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium py-2"
                            >
                                Để sau, xem đơn hàng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutPage;