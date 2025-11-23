/**
 * Utility function để xử lý đường dẫn ảnh
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Lấy URL ảnh đầy đủ từ image_url
 * @param imageUrl - Đường dẫn ảnh từ database (có thể là relative hoặc absolute)
 * @returns URL đầy đủ để hiển thị ảnh
 */
export const getImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '';
  
  // Nếu đã là URL đầy đủ (http/https), trả về nguyên
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Nếu là đường dẫn relative, thêm base URL
  if (imageUrl.startsWith('/')) {
    return `${API_BASE_URL}${imageUrl}`;
  }
  
  // Nếu không có / ở đầu, thêm /uploads/
  return `${API_BASE_URL}/uploads/${imageUrl}`;
};

/**
 * Lấy URL placeholder nếu không có ảnh
 */
export const getPlaceholderImage = (): string => {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn5GqPC90ZXh0Pjwvc3ZnPg==';
};

