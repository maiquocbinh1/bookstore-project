import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { LockClosedIcon, LockOpenIcon, UserIcon } from '@heroicons/react/24/outline';

interface Customer {
  user_id: number;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  is_locked: boolean;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

const CustomersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: customersData, isLoading } = useQuery(
    ['admin-customers', searchTerm],
    async () => {
      const params = searchTerm ? `?search=${searchTerm}` : '';
      const res = await api.get(`/admin/users${params}`);
      return res.data.data;
    }
  );

  const { data: customerDetail } = useQuery(
    ['customer-detail', selectedCustomer],
    async () => {
      if (!selectedCustomer) return null;
      const res = await api.get(`/admin/users/${selectedCustomer}`);
      return res.data.data;
    },
    { enabled: !!selectedCustomer }
  );

  const toggleLockMutation = useMutation(
    async ({ id, is_locked }: { id: number; is_locked: boolean }) =>
      api.patch(`/admin/users/${id}/lock`, { is_locked }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-customers');
        toast.success('Cập nhật trạng thái thành công!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Cập nhật thất bại!');
      },
    }
  );

  const toggleActiveMutation = useMutation(
    async ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.patch(`/admin/users/${id}/active`, { is_active }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-customers');
        toast.success('Cập nhật trạng thái thành công!');
      },
    }
  );

  const customers: Customer[] = customersData?.customers || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
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
        <h2 className="text-3xl font-bold text-gray-800">Quản lý khách hàng</h2>
        <input
          type="text"
          placeholder="Tìm kiếm theo email hoặc tên..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-lg px-4 py-2 w-64"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số đơn hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng chi tiêu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đăng ký</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.user_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{customer.full_name}</div>
                        {customer.phone && (
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.total_orders || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {formatCurrency(customer.total_spent || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </span>
                      {customer.is_locked && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          Đã khóa
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(customer.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedCustomer(customer.user_id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Chi tiết
                      </button>
                      <button
                        onClick={() => toggleLockMutation.mutate({
                          id: customer.user_id,
                          is_locked: !customer.is_locked,
                        })}
                        className={customer.is_locked ? 'text-green-600 hover:text-green-900' : 'text-yellow-600 hover:text-yellow-900'}
                        title={customer.is_locked ? 'Mở khóa' : 'Khóa tài khoản'}
                      >
                        {customer.is_locked ? (
                          <LockOpenIcon className="h-5 w-5" />
                        ) : (
                          <LockClosedIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && customerDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Chi tiết khách hàng</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Họ tên</p>
                  <p className="font-medium">{customerDetail.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{customerDetail.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="font-medium">{customerDetail.phone || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      customerDetail.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {customerDetail.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
                    </span>
                    {customerDetail.is_locked && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Đã khóa
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {customerDetail.order_statistics && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Thống kê đơn hàng</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Tổng đơn hàng</p>
                      <p className="font-medium text-lg">{customerDetail.order_statistics.total_orders || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tổng chi tiêu</p>
                      <p className="font-medium text-lg">
                        {formatCurrency(customerDetail.order_statistics.total_spent || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
