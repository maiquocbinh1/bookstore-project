import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../lib/api';
import { 
  ShoppingCartIcon, 
  CurrencyDollarIcon, 
  UsersIcon, 
  BookOpenIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  overview: {
    total_customers: number;
    total_books: number;
    total_orders: number;
    total_revenue: number;
  };
  this_month: {
    orders_this_month: number;
    revenue_this_month: number;
  };
  pending_orders: number;
  low_stock_books: number;
}

const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery<{ data: DashboardStats }>(
    'dashboard-stats',
    async () => {
      const response = await api.get('/admin/reports/dashboard');
      return response.data;
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const stats = data?.data;

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold mt-2" style={{ color }}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          {icon}
        </div>
      </div>
    </div>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Lỗi khi tải dữ liệu dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-500">
          Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng đơn hàng"
          value={stats?.overview.total_orders || 0}
          icon={<ShoppingCartIcon className="h-8 w-8" style={{ color: '#3b82f6' }} />}
          color="#3b82f6"
        />
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(stats?.overview.total_revenue || 0)}
          icon={<CurrencyDollarIcon className="h-8 w-8" style={{ color: '#10b981' }} />}
          color="#10b981"
        />
        <StatCard
          title="Tổng khách hàng"
          value={stats?.overview.total_customers || 0}
          icon={<UsersIcon className="h-8 w-8" style={{ color: '#8b5cf6' }} />}
          color="#8b5cf6"
        />
        <StatCard
          title="Tổng sách"
          value={stats?.overview.total_books || 0}
          icon={<BookOpenIcon className="h-8 w-8" style={{ color: '#f59e0b' }} />}
          color="#f59e0b"
        />
      </div>

      {/* This Month Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tháng này</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Đơn hàng:</span>
              <span className="text-xl font-bold text-blue-600">
                {stats?.this_month.orders_this_month || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Doanh thu:</span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(stats?.this_month.revenue_this_month || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cảnh báo</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
                <span className="text-gray-700">Đơn hàng chờ xử lý:</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">
                {stats?.pending_orders || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                <span className="text-gray-700">Sách sắp hết hàng:</span>
              </div>
              <span className="text-xl font-bold text-red-600">
                {stats?.low_stock_books || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Truy cập nhanh</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/admin/books"
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors"
          >
            <BookOpenIcon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-sm font-medium text-blue-600">Quản lý sách</p>
          </a>
          <a
            href="/admin/orders"
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors"
          >
            <ShoppingCartIcon className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-sm font-medium text-green-600">Quản lý đơn hàng</p>
          </a>
          <a
            href="/admin/customers"
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors"
          >
            <UsersIcon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <p className="text-sm font-medium text-purple-600">Quản lý khách hàng</p>
          </a>
          <a
            href="/admin/reports"
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition-colors"
          >
            <CurrencyDollarIcon className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <p className="text-sm font-medium text-orange-600">Báo cáo</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
