import React, { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  BookOpenIcon,
  UsersIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  TruckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type PeriodType = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'quarter' | 'revenue' | 'bestselling' | 'customers'>('revenue');
  const [period, setPeriod] = useState<PeriodType>('quarter');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Revenue Report
  const { data: revenueData, isLoading: revenueLoading, refetch: refetchRevenue } = useQuery(
    ['revenue-report', period, startDate, endDate],
    async () => {
      const params = new URLSearchParams({ period });
      if (period === 'custom' && startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      const res = await api.get(`/admin/reports/revenue?${params.toString()}`);
      return res.data.data;
    },
    {
      enabled: reportType === 'revenue',
    }
  );

  // Quarter Report
  const { data: quarterData, isLoading: quarterLoading } = useQuery(
    'quarter-report',
    async () => {
      const res = await api.get('/admin/reports/quarter');
      return res.data.data;
    },
    {
      enabled: reportType === 'quarter',
    }
  );

  // Bestselling Books
  const { data: bestsellingData, isLoading: bestsellingLoading, refetch: refetchBestselling } = useQuery(
    ['bestselling-books', startDate, endDate],
    async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const res = await api.get(`/admin/reports/bestselling?${params.toString()}`);
      return res.data.data;
    },
    {
      enabled: reportType === 'bestselling',
    }
  );

  // New Customers
  const [customerDays, setCustomerDays] = useState(30);
  const { data: newCustomersData, isLoading: customersLoading, refetch: refetchCustomers } = useQuery(
    ['new-customers', customerDays],
    async () => {
      const res = await api.get(`/admin/reports/new-customers?days=${customerDays}&limit=50`);
      return res.data.data;
    },
    {
      enabled: reportType === 'customers',
    }
  );

  const handleExport = async (type: 'excel' | 'pdf', reportType: string) => {
    try {
      const endpoint = type === 'excel' ? '/admin/reports/export/excel' : '/admin/reports/export/pdf';
      const params = new URLSearchParams({ report_type: reportType });
      
      // Thêm tham số thời gian nếu có
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (reportType === 'customers' || reportType === 'new-customers') {
        params.append('days', customerDays.toString());
      }
      
      const res = await api.get(`${endpoint}?${params.toString()}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportType}-${Date.now()}.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Đã tải file thành công!');
    } catch (error) {
      toast.error('Xuất file thất bại!');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Chuẩn bị dữ liệu cho biểu đồ
  const prepareChartData = (breakdown: any[]) => {
    if (!breakdown || breakdown.length === 0) return [];
    
    return breakdown.map((item: any) => {
      const period = item.period;
      let label = '';
      
      if (typeof period === 'number') {
        // Tháng hoặc giờ
        if (period <= 12) {
          label = `Tháng ${period}`;
        } else {
          label = `${period}:00`;
        }
      } else {
        // Ngày
        label = formatDate(period);
      }
      
      return {
        period: label,
        doanhThu: item.revenue || 0,
        soDon: item.orders_count || 0,
      };
    });
  };

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Báo cáo & Thống kê</h2>
        <div className="flex gap-2">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="revenue">Báo cáo Doanh thu</option>
            <option value="quarter">Báo cáo quý</option>
            <option value="bestselling">Sách bán chạy</option>
            <option value="customers">Khách hàng mới</option>
          </select>
        </div>
      </div>

      {/* Revenue Report - Báo cáo Doanh thu & Đơn hàng */}
      {reportType === 'revenue' && (
        <div className="space-y-6">
          {/* Bộ lọc thời gian */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <label className="flex items-center gap-2 font-medium">
                <CalendarIcon className="h-5 w-5" />
                Khoảng thời gian:
              </label>
              <select
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value as PeriodType)}
                className="border rounded-lg px-4 py-2"
              >
                <option value="today">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="quarter">Quý này</option>
                <option value="year">Năm này</option>
                <option value="custom">Tùy chỉnh</option>
              </select>
              
              {period === 'custom' && (
                <>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border rounded-lg px-4 py-2"
                  />
                  <span>đến</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border rounded-lg px-4 py-2"
                  />
                  <button
                    onClick={() => refetchRevenue()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Xem báo cáo
                  </button>
                </>
              )}
            </div>
          </div>

          {revenueLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : revenueData ? (
            <>
              {/* Thống kê tổng quan */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Tổng đơn hàng</p>
                      <p className="text-3xl font-bold">{revenueData.statistics?.total_orders || 0}</p>
                    </div>
                    <ShoppingCartIcon className="h-12 w-12 opacity-50" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm mb-1">Tổng doanh thu</p>
                      <p className="text-2xl font-bold">{formatCurrency(revenueData.statistics?.total_revenue || 0)}</p>
                    </div>
                    <CurrencyDollarIcon className="h-12 w-12 opacity-50" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm mb-1">Đơn hàng trung bình</p>
                      <p className="text-2xl font-bold">{formatCurrency(revenueData.statistics?.avg_order_value || 0)}</p>
                    </div>
                    <ChartBarIcon className="h-12 w-12 opacity-50" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm mb-1">Đơn đã giao</p>
                      <p className="text-3xl font-bold">{revenueData.statistics?.delivered_orders || 0}</p>
                    </div>
                    <TruckIcon className="h-12 w-12 opacity-50" />
                  </div>
                </div>
              </div>

              {/* Thống kê trạng thái đơn hàng */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
                  <p className="text-sm text-gray-600 mb-1">Chờ xử lý</p>
                  <p className="text-2xl font-bold text-yellow-600">{revenueData.statistics?.pending_orders || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                  <p className="text-sm text-gray-600 mb-1">Đã xác nhận</p>
                  <p className="text-2xl font-bold text-blue-600">{revenueData.statistics?.confirmed_orders || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500">
                  <p className="text-sm text-gray-600 mb-1">Đang giao</p>
                  <p className="text-2xl font-bold text-indigo-600">{revenueData.statistics?.shipping_orders || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                  <p className="text-sm text-gray-600 mb-1">Đã thanh toán</p>
                  <p className="text-2xl font-bold text-green-600">{revenueData.statistics?.paid_orders || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
                  <p className="text-sm text-gray-600 mb-1">Đã hủy</p>
                  <p className="text-2xl font-bold text-red-600">{revenueData.statistics?.cancelled_orders || 0}</p>
                </div>
              </div>

              {/* Biểu đồ doanh thu */}
              {revenueData.breakdown && revenueData.breakdown.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Biểu đồ Doanh thu & Số lượng đơn hàng</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExport('excel', 'orders')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <DocumentArrowDownIcon className="h-5 w-5" />
                        Excel
                      </button>
                      <button
                        onClick={() => handleExport('pdf', 'quarter')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <DocumentArrowDownIcon className="h-5 w-5" />
                        PDF
                      </button>
                    </div>
                  </div>
                  
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={prepareChartData(revenueData.breakdown)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip
                        formatter={(value: any, name: string) => {
                          if (name === 'doanhThu') {
                            return [formatCurrency(value), 'Doanh thu'];
                          }
                          return [value, 'Số đơn'];
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="doanhThu"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Doanh thu"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="soDon"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Số đơn hàng"
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Biểu đồ cột */}
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4">Doanh thu theo thời gian</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={prepareChartData(revenueData.breakdown)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: any) => formatCurrency(value)}
                        />
                        <Legend />
                        <Bar dataKey="doanhThu" fill="#10b981" name="Doanh thu" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Top 10 đơn hàng lớn nhất */}
              {revenueData.top_orders && revenueData.top_orders.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold mb-4">Top 10 đơn hàng lớn nhất</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn hàng</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thanh toán</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {revenueData.top_orders.map((order: any, index: number) => (
                          <tr key={order.order_code}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_code}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              {formatCurrency(order.total_amount || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'shipping' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {order.status === 'delivered' ? 'Đã giao' :
                                 order.status === 'pending' ? 'Chờ xử lý' :
                                 order.status === 'confirmed' ? 'Đã xác nhận' :
                                 order.status === 'shipping' ? 'Đang giao' :
                                 'Đã hủy'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(order.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Quarter Report */}
      {reportType === 'quarter' && (
        <div className="space-y-6">
          {quarterLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : quarterData ? (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">
                    Báo cáo quý {quarterData.quarter}/{quarterData.year}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport('excel', 'quarter')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      Excel
                    </button>
                    <button
                      onClick={() => handleExport('pdf', 'quarter')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      PDF
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {quarterData.statistics?.total_orders || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Tổng doanh thu</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(quarterData.statistics?.total_revenue || 0)}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Đơn đã giao</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {quarterData.statistics?.delivered_orders || 0}
                    </p>
                  </div>
                </div>
                {quarterData.monthly_breakdown && quarterData.monthly_breakdown.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-4">Doanh thu theo tháng</h4>
                    <div className="space-y-2">
                      {quarterData.monthly_breakdown.map((month: any) => (
                        <div key={month.month} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span>Tháng {month.month}</span>
                          <div className="flex gap-4">
                            <span>{month.orders_count} đơn</span>
                            <span className="font-medium">{formatCurrency(month.revenue || 0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Bestselling Books - UC-AD-08 */}
      {reportType === 'bestselling' && (
        <div className="space-y-6">
          {/* Bộ lọc thời gian */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <label className="flex items-center gap-2 font-medium">
                <CalendarIcon className="h-5 w-5" />
                Lọc theo thời gian:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-lg px-4 py-2"
                placeholder="Từ ngày"
              />
              <span>đến</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded-lg px-4 py-2"
                placeholder="Đến ngày"
              />
              <button
                onClick={() => refetchBestselling()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Áp dụng
              </button>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    refetchBestselling();
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          {bestsellingLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : bestsellingData ? (
            <>
              {/* Thống kê tổng quan */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Tổng số sách đã bán</p>
                      <p className="text-3xl font-bold">{bestsellingData.statistics?.total_books_sold || 0}</p>
                    </div>
                    <BookOpenIcon className="h-12 w-12 opacity-50" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm mb-1">Tổng số lượng bán</p>
                      <p className="text-3xl font-bold">{bestsellingData.statistics?.total_books_sold_quantity || 0}</p>
                    </div>
                    <ShoppingCartIcon className="h-12 w-12 opacity-50" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm mb-1">Tổng doanh thu</p>
                      <p className="text-2xl font-bold">{formatCurrency(bestsellingData.statistics?.total_revenue || 0)}</p>
                    </div>
                    <CurrencyDollarIcon className="h-12 w-12 opacity-50" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm mb-1">Giá trung bình</p>
                      <p className="text-2xl font-bold">{formatCurrency(bestsellingData.statistics?.avg_book_price || 0)}</p>
                    </div>
                    <ChartBarIcon className="h-12 w-12 opacity-50" />
                  </div>
                </div>
              </div>

              {/* Bảng xếp hạng sách bán chạy */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Bảng xếp hạng sách bán chạy nhất</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport('excel', 'bestselling')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      Excel
                    </button>
                    <button
                      onClick={() => handleExport('pdf', 'bestselling')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      PDF
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạng</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sách</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tác giả</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ISBN</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số đơn hàng</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng bán</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bestsellingData?.books?.map((book: any, index: number) => (
                        <tr key={book.book_id} className={index < 3 ? 'bg-yellow-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                              {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                              {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                              <span className="text-sm font-bold text-gray-900">{index + 1}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{book.title}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{book.author}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.isbn}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{book.order_count || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{book.total_sold || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(book.total_revenue || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Biểu đồ xếp hạng */}
                {bestsellingData?.books && bestsellingData.books.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4">Biểu đồ số lượng bán</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={bestsellingData.books.slice(0, 10).map((book: any, index: number) => ({
                        name: book.title.length > 20 ? book.title.substring(0, 20) + '...' : book.title,
                        'Số lượng bán': book.total_sold || 0,
                        'Doanh thu': book.total_revenue || 0,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip
                          formatter={(value: any, name: string) => {
                            if (name === 'Doanh thu') {
                              return [formatCurrency(value), 'Doanh thu'];
                            }
                            return [value, 'Số lượng bán'];
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="Số lượng bán" fill="#3b82f6" name="Số lượng bán" />
                        <Bar yAxisId="right" dataKey="Doanh thu" fill="#10b981" name="Doanh thu" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* New Customers - UC-AD-08 */}
      {reportType === 'customers' && (
        <div className="space-y-6">
          {/* Bộ lọc số ngày */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <label className="flex items-center gap-2 font-medium">
                <CalendarIcon className="h-5 w-5" />
                Khách hàng mới trong:
              </label>
              <select
                value={customerDays}
                onChange={(e) => {
                  setCustomerDays(parseInt(e.target.value));
                  refetchCustomers();
                }}
                className="border rounded-lg px-4 py-2"
              >
                <option value="7">7 ngày qua</option>
                <option value="14">14 ngày qua</option>
                <option value="30">30 ngày qua</option>
                <option value="60">60 ngày qua</option>
                <option value="90">90 ngày qua</option>
              </select>
            </div>
          </div>

          {customersLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : newCustomersData ? (
            <>
              {/* Thống kê tổng quan */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Tổng khách hàng mới</p>
                      <p className="text-3xl font-bold">{newCustomersData.statistics?.total_new_customers || 0}</p>
                    </div>
                    <UsersIcon className="h-12 w-12 opacity-50" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm mb-1">Có đơn hàng</p>
                      <p className="text-3xl font-bold">{newCustomersData.statistics?.customers_with_orders || 0}</p>
                    </div>
                    <ShoppingCartIcon className="h-12 w-12 opacity-50" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm mb-1">Tổng doanh thu</p>
                      <p className="text-2xl font-bold">{formatCurrency(newCustomersData.statistics?.total_revenue_from_new || 0)}</p>
                    </div>
                    <CurrencyDollarIcon className="h-12 w-12 opacity-50" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm mb-1">Chi tiêu trung bình</p>
                      <p className="text-2xl font-bold">{formatCurrency(newCustomersData.statistics?.avg_spending_per_customer || 0)}</p>
                    </div>
                    <ChartBarIcon className="h-12 w-12 opacity-50" />
                  </div>
                </div>
              </div>

              {/* Biểu đồ khách hàng mới theo ngày */}
              {newCustomersData.daily_breakdown && newCustomersData.daily_breakdown.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold mb-4">Biểu đồ khách hàng mới theo ngày</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={newCustomersData.daily_breakdown.map((item: any) => ({
                      date: formatDate(item.date),
                      'Số khách hàng': item.customers_count || 0,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Số khách hàng" fill="#3b82f6" name="Số khách hàng mới" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Bảng danh sách khách hàng mới */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Danh sách khách hàng mới ({newCustomersData.period_days} ngày qua)</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport('excel', 'new-customers')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      Excel
                    </button>
                    <button
                      onClick={() => handleExport('pdf', 'new-customers')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      PDF
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điện thoại</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số đơn hàng</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng chi tiêu</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đăng ký</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {newCustomersData?.customers?.map((customer: any, index: number) => (
                        <tr key={customer.user_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {customer.full_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.total_orders || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(customer.total_spent || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(customer.created_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {customer.is_active ? 'Hoạt động' : 'Khóa'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
