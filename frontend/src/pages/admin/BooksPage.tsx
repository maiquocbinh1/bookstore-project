import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

interface Book {
  book_id: number;
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  publication_year?: number;
  category_id?: number;
  category_name?: string;
  description?: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
}

interface Category {
  category_id: number;
  category_name: string;
  description?: string;
  book_count?: number;
}

type TabType = 'books' | 'categories';

const BooksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('books');
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    category_name: '',
    description: '',
  });
  const [uploadingImageId, setUploadingImageId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    publication_year: '',
    category_id: '',
    description: '',
    price: '',
    stock_quantity: '0',
  });

  // Fetch books
  const { data: booksData, isLoading } = useQuery('admin-books', async () => {
    const res = await api.get('/books?limit=100');
    return res.data.data;
  });

  // Fetch categories with book count
  const { data: categoriesData, refetch: refetchCategories } = useQuery('admin-categories', async () => {
    const res = await api.get('/books/categories');
    const categories = res.data.data || [];
    // Fetch book count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat: Category) => {
        try {
          const booksRes = await api.get(`/books?category_id=${cat.category_id}&limit=1`);
          const total = booksRes.data.data?.pagination?.total || booksRes.data.pagination?.total || 0;
          return {
            ...cat,
            book_count: total,
          };
        } catch (error) {
          console.error(`Error fetching book count for category ${cat.category_id}:`, error);
          return { ...cat, book_count: 0 };
        }
      })
    );
    return categoriesWithCount;
  });

  const books: Book[] = booksData?.books || [];
  const categories: Category[] = categoriesData || [];

  // Category mutations
  const createCategoryMutation = useMutation(
    async (data: { category_name: string; description?: string }) => {
      return api.post('/admin/books/categories', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-categories');
        queryClient.invalidateQueries('categories');
        toast.success('Thêm thể loại thành công!');
        setShowCategoryModal(false);
        setCategoryFormData({ category_name: '', description: '' });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Thêm thể loại thất bại!');
      },
    }
  );

  const updateCategoryMutation = useMutation(
    async ({ id, data }: { id: number; data: { category_name: string; description?: string } }) => {
      return api.put(`/admin/books/categories/${id}`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-categories');
        queryClient.invalidateQueries('categories');
        toast.success('Cập nhật thể loại thành công!');
        setShowCategoryModal(false);
        setEditingCategory(null);
        setCategoryFormData({ category_name: '', description: '' });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Cập nhật thể loại thất bại!');
      },
    }
  );

  const deleteCategoryMutation = useMutation(
    async (id: number) => {
      return api.delete(`/admin/books/categories/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-categories');
        queryClient.invalidateQueries('categories');
        toast.success('Xóa thể loại thành công!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Xóa thể loại thất bại!');
      },
    }
  );

  // Create/Update book
  const bookMutation = useMutation(
    async (data: any) => {
      if (editingBook) {
        return api.put(`/admin/books/${editingBook.book_id}`, data);
      }
      return api.post('/admin/books', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-books');
        toast.success(editingBook ? 'Cập nhật sách thành công!' : 'Thêm sách thành công!');
        setShowModal(false);
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
      },
    }
  );

  // Delete book
  const deleteMutation = useMutation(
    async (id: number) => api.delete(`/admin/books/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-books');
        toast.success('Xóa sách thành công!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Không thể xóa sách!');
      },
    }
  );

  // Update stock
  const stockMutation = useMutation(
    async ({ id, stock }: { id: number; stock: number }) =>
      api.patch(`/admin/books/${id}/stock`, { stock_quantity: stock }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-books');
        toast.success('Cập nhật tồn kho thành công!');
      },
    }
  );

  // Upload image
  const imageMutation = useMutation(
    async ({ id, file }: { id: number; file: File }) => {
      setUploadingImageId(id);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('image', file);
      
      return api.post(`/admin/books/${id}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-books');
        toast.success('Upload hình ảnh thành công!');
        setUploadingImageId(null);
        setUploadProgress(0);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Upload thất bại!');
        setUploadingImageId(null);
        setUploadProgress(0);
      },
    }
  );

  const resetForm = () => {
    setFormData({
      isbn: '',
      title: '',
      author: '',
      publisher: '',
      publication_year: '',
      category_id: '',
      description: '',
      price: '',
      stock_quantity: '0',
    });
    setEditingBook(null);
    setPreviewImage(null);
    setSelectedImageFile(null);
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher || '',
      publication_year: book.publication_year?.toString() || '',
      category_id: book.category_id?.toString() || '',
      description: book.description || '',
      price: book.price.toString(),
      stock_quantity: book.stock_quantity.toString(),
    });
    setPreviewImage(book.image_url ? `http://localhost:5000${book.image_url}` : null);
    setSelectedImageFile(null);
    setShowModal(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)');
      return;
    }

    // Kiểm tra kích thước (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File quá lớn! Tối đa 5MB. File của bạn: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // Preview ảnh
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
      setSelectedImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitWithImage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Submit form data trước
    const submitData = {
      ...formData,
      publication_year: formData.publication_year ? parseInt(formData.publication_year) : null,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity),
    };

    try {
      let bookId = editingBook?.book_id;
      
      if (editingBook) {
        // Update sách
        await bookMutation.mutateAsync(submitData);
        bookId = editingBook.book_id;
      } else {
        // Tạo sách mới
        const result = await bookMutation.mutateAsync(submitData);
        bookId = result.data?.data?.book_id || result.data?.book_id;
      }

      // Upload ảnh nếu có (chỉ khi tạo mới hoặc khi có ảnh mới được chọn)
      if (selectedImageFile && bookId) {
        try {
          await imageMutation.mutateAsync({ id: bookId, file: selectedImageFile });
        } catch (imgError) {
          // Nếu upload ảnh lỗi nhưng đã tạo/sửa sách thành công, vẫn đóng modal
          console.error('Upload image error:', imgError);
        }
      }

      // Chỉ đóng modal và reset nếu không có lỗi từ bookMutation
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      // Error đã được xử lý trong mutation
      console.error('Submit error:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bookMutation.mutate({
      ...formData,
      publication_year: formData.publication_year ? parseInt(formData.publication_year) : null,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity),
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa sách này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleImageUpload = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)');
      return;
    }

    // Kiểm tra kích thước file (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error(`File quá lớn! Tối đa 5MB. File của bạn: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // Preview ảnh trước khi upload
    const reader = new FileReader();
    reader.onloadend = () => {
      // Upload ảnh
      imageMutation.mutate({ id, file });
    };
    reader.readAsDataURL(file);

    // Reset input để có thể chọn lại file cùng tên
    e.target.value = '';
  };

  const handleStockUpdate = (id: number, currentStock: number) => {
    const newStock = prompt('Nhập số lượng tồn kho mới:', currentStock.toString());
    if (newStock && !isNaN(parseInt(newStock))) {
      stockMutation.mutate({ id, stock: parseInt(newStock) });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const handleCategoryEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      category_name: category.category_name,
      description: category.description || '',
    });
    setShowCategoryModal(true);
  };

  const handleCategoryDelete = (categoryId: number) => {
    const category = categories.find((c) => c.category_id === categoryId);
    if (!category) {
      toast.error('Không tìm thấy thể loại');
      return;
    }
    
    // Kiểm tra nếu có sách thuộc thể loại này
    if (category.book_count && category.book_count > 0) {
      toast.error(
        `Không thể xóa thể loại "${category.category_name}". Còn ${category.book_count} sách thuộc thể loại này.`,
        { duration: 4000 }
      );
      return;
    }
    
    // Hiển thị cảnh báo xác nhận
    if (window.confirm(`Bạn có chắc muốn xóa thể loại "${category.category_name}"?`)) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  const resetCategoryForm = () => {
    setCategoryFormData({ category_name: '', description: '' });
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('books')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'books'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Quản lý sách
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Quản lý thể loại
          </button>
        </nav>
      </div>

      {/* Books Tab */}
      {activeTab === 'books' && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-800">Quản lý sách</h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Thêm sách mới
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hình ảnh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ISBN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu đề</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tác giả</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {books.map((book) => (
                <tr key={book.book_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative group">
                      {uploadingImageId === book.book_id ? (
                        <div className="h-16 w-16 bg-blue-50 rounded border border-blue-200 flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-1"></div>
                          <span className="text-xs text-blue-600 font-medium">{uploadProgress}%</span>
                        </div>
                      ) : (
                        <>
                          {book.image_url ? (
                            <img
                              src={`http://localhost:5000${book.image_url}`}
                              alt={book.title}
                              className="h-16 w-16 object-cover rounded border border-gray-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const placeholder = target.nextElementSibling as HTMLElement;
                                if (placeholder) placeholder.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`h-16 w-16 bg-gray-200 rounded flex items-center justify-center border border-gray-300 ${book.image_url ? 'hidden' : ''}`}
                            style={{ display: book.image_url ? 'none' : 'flex' }}
                          >
                            <BookOpenIcon className="h-8 w-8 text-gray-400" />
                          </div>
                          <label 
                            className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 bg-black bg-opacity-60 rounded flex flex-col items-center justify-center transition-opacity z-10"
                            title="Click để upload ảnh mới"
                          >
                            <PhotoIcon className="h-6 w-6 text-white mb-1" />
                            <span className="text-xs text-white text-center px-1">Upload</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              className="hidden"
                              onChange={(e) => handleImageUpload(book.book_id, e)}
                              disabled={uploadingImageId === book.book_id}
                            />
                          </label>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{book.isbn}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{book.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.author}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleStockUpdate(book.book_id, book.stock_quantity)}
                      className={`text-sm font-medium px-2 py-1 rounded ${
                        book.stock_quantity < 10
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {book.stock_quantity}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(book)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(book.book_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">
              {editingBook ? 'Chỉnh sửa sách' : 'Thêm sách mới'}
            </h3>
            <form onSubmit={handleSubmitWithImage} className="space-y-4">
              {/* Upload Image Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh sách (Tối đa 5MB)
                </label>
                <div className="flex items-center gap-4">
                  {previewImage ? (
                    <div className="relative">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="h-32 w-24 object-cover rounded border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(null);
                          setSelectedImageFile(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="h-32 w-24 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                      <PhotoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      <PhotoIcon className="h-5 w-5 mr-2" />
                      {previewImage ? 'Chọn ảnh khác' : 'Chọn ảnh'}
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Định dạng: JPG, PNG, GIF, WebP | Tối đa: 5MB
                    </p>
                    {selectedImageFile && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Đã chọn: {selectedImageFile.name} ({(selectedImageFile.size / 1024 / 1024).toFixed(2)}MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ISBN *</label>
                  <input
                    type="text"
                    required
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tác giả *</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhà xuất bản</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Năm xuất bản</label>
                  <input
                    type="number"
                    value={formData.publication_year}
                    onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Chọn thể loại</option>
                    {categories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={bookMutation.isLoading || imageMutation.isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {bookMutation.isLoading || imageMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    editingBook ? 'Cập nhật' : 'Thêm mới'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-800">Quản lý thể loại</h2>
            <button
              onClick={() => {
                resetCategoryForm();
                setShowCategoryModal(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Thêm thể loại mới
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên thể loại</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số sách</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Chưa có thể loại nào
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
                      <tr key={category.category_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {category.category_id}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {category.category_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {category.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-medium px-2 py-1 rounded ${
                              category.book_count && category.book_count > 0
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {category.book_count || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCategoryEdit(category)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Sửa"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleCategoryDelete(category.category_id)}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title={
                                category.book_count && category.book_count > 0
                                  ? `Không thể xóa (có ${category.book_count} sách)`
                                  : `Xóa thể loại "${category.category_name}"`
                              }
                              disabled={!!(category.book_count && category.book_count > 0)}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold mb-4">
              {editingCategory ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingCategory) {
                  updateCategoryMutation.mutate({
                    id: editingCategory.category_id,
                    data: categoryFormData,
                  });
                } else {
                  createCategoryMutation.mutate(categoryFormData);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên thể loại *
                </label>
                <input
                  type="text"
                  required
                  value={categoryFormData.category_name}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, category_name: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Nhập tên thể loại"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Nhập mô tả thể loại (tùy chọn)"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    resetCategoryForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isLoading || updateCategoryMutation.isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {createCategoryMutation.isLoading || updateCategoryMutation.isLoading
                    ? 'Đang xử lý...'
                    : editingCategory
                    ? 'Cập nhật'
                    : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default BooksPage;
