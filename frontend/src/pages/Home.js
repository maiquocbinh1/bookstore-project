import React, { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import api from '../services/api';
import BookCard from '../components/BookCard';
import './Home.css';

const Home = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [search, selectedCategory, minPrice, maxPrice, page]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/books/categories/all');
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        ...(search && { search }),
        ...(selectedCategory && { category_id: selectedCategory }),
        ...(minPrice && { min_price: minPrice }),
        ...(maxPrice && { max_price: maxPrice })
      };

      const response = await api.get('/books', { params });
      setBooks(response.data.data.books);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="container">
          <h1>📚 Chào mừng đến Bookstore</h1>
          <p>Hệ thống bán sách trực tuyến uy tín và chất lượng</p>
          
          {/* Search Bar - KH-05 */}
          <form className="search-bar" onSubmit={handleSearch}>
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên sách, tác giả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Tìm kiếm
            </button>
          </form>
        </div>
      </div>

      <div className="container">
        <div className="content-layout">
          {/* Sidebar Filters - KH-06 */}
          <aside className="filters-sidebar">
            <div className="filter-section">
              <h3>Lọc sách</h3>
              
              <div className="filter-group">
                <label>Thể loại</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="input"
                >
                  <option value="">Tất cả</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Khoảng giá</label>
                <div className="price-range">
                  <input
                    type="number"
                    placeholder="Từ"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="input"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Đến"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <button onClick={clearFilters} className="btn btn-outline" style={{width: '100%'}}>
                Xóa bộ lọc
              </button>
            </div>
          </aside>

          {/* Books Grid - KH-04 */}
          <main className="books-content">
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
              </div>
            ) : books.length > 0 ? (
              <>
                <div className="books-grid">
                  {books.map(book => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>

                {/* Pagination - KH-13 */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="btn btn-outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Trước
                    </button>
                    <span className="page-info">
                      Trang {page} / {totalPages}
                    </span>
                    <button
                      className="btn btn-outline"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-results">
                <p>Không tìm thấy sách nào</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Home;

