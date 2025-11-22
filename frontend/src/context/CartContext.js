import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      setCartItems(response.data.data.items);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (bookId, quantity = 1) => {
    try {
      await api.post('/cart', { book_id: bookId, quantity });
      await fetchCart();
      toast.success('Đã thêm vào giỏ hàng');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Không thể thêm vào giỏ hàng';
      toast.error(message);
      return { success: false, message };
    }
  };

  const updateCartItem = async (cartItemId, quantity) => {
    try {
      await api.put(`/cart/${cartItemId}`, { quantity });
      await fetchCart();
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Không thể cập nhật giỏ hàng';
      toast.error(message);
      return { success: false, message };
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await api.delete(`/cart/${cartItemId}`);
      await fetchCart();
      toast.success('Đã xóa khỏi giỏ hàng');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Không thể xóa khỏi giỏ hàng';
      toast.error(message);
      return { success: false, message };
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      setCartItems([]);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    loading,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;

