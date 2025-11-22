import React from 'react';
import Loading from '../../components/Loading';

const BooksPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Danh sách sách</h1>
      <div className="text-center py-12">
        <p className="text-gray-600">Trang này đang được phát triển...</p>
        <p className="text-sm text-gray-500 mt-2">
          Vui lòng xem file README.md để biết thêm chi tiết về cách sử dụng API
        </p>
      </div>
    </div>
  );
};

export default BooksPage;

