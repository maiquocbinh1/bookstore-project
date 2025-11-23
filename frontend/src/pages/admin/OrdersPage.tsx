import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { EyeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Order {
  order_id: number;
  order_code: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  full_name: string;
  email: string;
}

const OrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: ordersData, isLoading } = useQuery(
    ['admin-orders', statusFilter],
    async () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/admin/orders${params}`);
      return res.data.data;
    }
  );

  const { data: orderDetail } = useQuery(
    ['order-detail', selectedOrder],
    async () => {
      if (!selectedOrder) return null;
      const res = await api.get(`/admin/orders/${selectedOrder}`);
      return res.data.data;
    },
    { enabled: !!selectedOrder }
  );

  const updateStatusMutation = useMutation(
    async ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      api.patch(`/admin/orders/${id}/status`, { status, notes }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-orders');
        queryClient.invalidateQueries('order-detail');
        toast.success('Cập nhật trạng thái thành công!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Cập nhật thất bại!');
      },
    }
  );

  const updatePaymentMutation = useMutation(
    async ({ id, payment_status }: { id: number; payment_status: string }) =>
      api.patch(`/admin/orders/${id}/payment`, { payment_status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-orders');
        queryClient.invalidateQueries('order-detail');
        queryClient.invalidateQueries('dashboard-stats');
        toast.success('Xác nhận thanh toán thành công! Doanh số đã được cập nhật.');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Xác nhận thanh toán thất bại!');
      },
    }
  );

  const orders: Order[] = ordersData?.orders || [];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipping: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const validTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipping', 'cancelled'],
    shipping: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
  };

  const handleStatusUpdate = (orderId: number, currentStatus: string) => {
    const availableStatuses = validTransitions[currentStatus] || [];
    if (availableStatuses.length === 0) {
      toast.error('Không thể thay đổi trạng thái từ trạng thái này!');
      return;
    }

    const newStatus = prompt(
      `Chọn trạng thái mới:\n${availableStatuses.join(', ')}`,
      availableStatuses[0]
    );

    if (newStatus && availableStatuses.includes(newStatus)) {
      updateStatusMutation.mutate({ id: orderId, status: newStatus });
    } else if (newStatus) {
      toast.error('Trạng thái không hợp lệ!');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Quản lý đơn hàng</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="processing">Đang xử lý</option>
          <option value="shipping">Đang giao</option>
          <option value="delivered">Đã giao</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thanh toán</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Xác nhận</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.order_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.order_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{order.full_name}</div>
                    <div className="text-xs text-gray-400">{order.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        order.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : order.payment_status === 'unpaid'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.payment_status === 'paid' ? 'Đã thanh toán' : 
                         order.payment_status === 'unpaid' ? 'Chưa thanh toán' : 
                         order.payment_status}
                      </span>
                      {order.payment_method && (
                        <span className="text-xs text-gray-500">
                          {order.payment_method === 'cod' ? 'COD' : 
                           order.payment_method === 'bank_transfer' ? 'Chuyển khoản' :
                           order.payment_method === 'credit_card' ? 'Thẻ tín dụng' :
                           order.payment_method === 'e_wallet' ? 'Ví điện tử' : order.payment_method}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.payment_method === 'cod' && order.payment_status === 'unpaid' ? (
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => {
                            if (window.confirm(`Xác nhận đã nhận thanh toán cho đơn hàng ${order.order_code}?\nTổng tiền: ${formatCurrency(order.total_amount)}`)) {
                              updatePaymentMutation.mutate({
                                id: order.order_id,
                                payment_status: 'paid'
                              });
                            }
                          }}
                          disabled={updatePaymentMutation.isLoading}
                          className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="ml-2 text-sm text-gray-700 group-hover:text-green-600">
                          {updatePaymentMutation.isLoading ? 'Đang xử lý...' : 'Xác nhận đã nhận tiền'}
                        </span>
                      </label>
                    ) : order.payment_status === 'paid' ? (
                      <div className="flex items-center">
                        <span className="text-green-600 text-lg mr-2">✓</span>
                        <span className="text-sm text-green-600 font-medium">Đã xác nhận</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOrder(order.order_id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      {validTransitions[order.status]?.length > 0 && (
                        <button
                          onClick={() => handleStatusUpdate(order.order_id, order.status)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && orderDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Chi tiết đơn hàng: {orderDetail.order_code}</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Khách hàng</p>
                  <p className="font-medium">{orderDetail.customer_name}</p>
                  <p className="text-sm text-gray-500">{orderDetail.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tổng tiền</p>
                  <p className="font-medium text-lg">{formatCurrency(orderDetail.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[orderDetail.status]}`}>
                    {orderDetail.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Thanh toán</p>
                  <p className="font-medium">{orderDetail.payment_status}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Sản phẩm</p>
                <div className="border rounded-lg divide-y">
                  {orderDetail.items?.map((item: any) => (
                    <div key={item.order_item_id} className="p-4 flex justify-between">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
