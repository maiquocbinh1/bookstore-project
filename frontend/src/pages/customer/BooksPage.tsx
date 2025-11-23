import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import BookCard from '../../components/BookCard';
import Loading from '../../components/Loading';
import { Book, Category } from '../../types';
import toast from 'react-hot-toast';

const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/books/categories');
        const data = response.data.data || response.data;
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: 12,
          q: search || undefined,
          category_id: selectedCategory || undefined,
          min_price: minPrice || undefined,
          max_price: maxPrice || undefined
        };

        const endpoint = search ? '/books/search' : '/books';
        const response = await api.get(endpoint, { params });

        const responseData = response.data.data || response.data;

        if (responseData.books) {
          setBooks(responseData.books);
          setTotalPages(responseData.pagination?.totalPages || 1);
        } else if (Array.isArray(responseData)) {
          setBooks(responseData);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
        toast.error('Không thể tải danh sách sách');
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchBooks();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, selectedCategory, minPrice, maxPrice, page]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tủ Sách</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tên sách, tác giả..."
              className="input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="card p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Thể loại</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="input"
            >
              <option value="">Tất cả thể loại</option>
              {categories.map((cat) => (
                <option key={cat.category_id || cat.id} value={cat.category_id || cat.id}>
                  {cat.category_name || cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="card p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng giá</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Từ"
                className="input text-sm"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Đến"
                className="input text-sm"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="w-full btn btn-secondary"
          >
            Xóa bộ lọc
          </button>
        </div>

        <div className="lg:col-span-3">
          {loading ? (
            <Loading />
          ) : books.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {books.map((book) => (
                  <BookCard key={book.book_id || book.id} book={book} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4">
                  <button
                    className="btn btn-secondary disabled:opacity-50"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Trước
                  </button>
                  <span className="text-gray-700 font-medium">
                    Trang {page} / {totalPages}
                  </span>
                  <button
                    className="btn btn-secondary disabled:opacity-50"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-500 text-lg">Không tìm thấy sách nào phù hợp.</p>
              <button onClick={clearFilters} className="mt-4 text-primary-600 hover:underline">
                Thử xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BooksPage;