import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';

export interface CartItem {
  cart_id: number;
  book_id: number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  image_url?: string;
  stock_quantity: number;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (bookId: number, quantity?: number) => Promise<void>;
  updateQuantity: (cartId: number, quantity: number) => Promise<void>;
  removeItem: (cartId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/cart');
      const items = response.data.data.items || [];
      set({ items, loading: false });
    } catch (error) {
      console.error('Error fetching cart:', error);
      set({ items: [], loading: false });
    }
  },

  addItem: async (bookId: number, quantity = 1) => {
    try {
      await api.post('/cart', { book_id: bookId, quantity });
      await get().fetchCart();
      toast.success('Đã thêm vào giỏ hàng');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Không thể thêm vào giỏ hàng';
      toast.error(message);
    }
  },

  updateQuantity: async (cartId: number, quantity: number) => {
    if (quantity < 1) return;

    const oldItems = get().items;
    set({
      items: oldItems.map((item) =>
        item.cart_id === cartId ? { ...item, quantity } : item
      ),
    });

    try {
      await api.put(`/cart/${cartId}`, { quantity });
    } catch (error: any) {
      set({ items: oldItems });
      toast.error(error.response?.data?.message || 'Lỗi cập nhật số lượng');
    }
  },

  removeItem: async (cartId: number) => {
    try {
      await api.delete(`/cart/${cartId}`);
      set((state) => ({
        items: state.items.filter((item) => item.cart_id !== cartId),
      }));
      toast.success('Đã xóa sản phẩm');
    } catch (error: any) {
      toast.error('Không thể xóa sản phẩm');
    }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart');
      set({ items: [] });
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  },

  getCartTotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getCartCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));