import React from 'react';
const DashboardPage: React.FC = () => <div><h2 className="text-2xl font-bold mb-6">Dashboard</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-6"><div className="card"><h3 className="text-gray-500 text-sm">Tổng đơn hàng</h3><p className="text-3xl font-bold mt-2">0</p></div><div className="card"><h3 className="text-gray-500 text-sm">Doanh thu</h3><p className="text-3xl font-bold mt-2">0đ</p></div><div className="card"><h3 className="text-gray-500 text-sm">Khách hàng</h3><p className="text-3xl font-bold mt-2">0</p></div><div className="card"><h3 className="text-gray-500 text-sm">Sách</h3><p className="text-3xl font-bold mt-2">0</p></div></div></div>;
export default DashboardPage;

