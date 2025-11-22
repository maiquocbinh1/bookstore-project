import create from 'zustand';

interface CartItem {
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
  total: number;
  setCart: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  updateQuantity: (cart_id: number, quantity: number) => void;
  removeItem: (cart_id: number) => void;
  clearCart: () => void;
  calculateTotal: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,

  setCart: (items) => {
    set({ items });
    get().calculateTotal();
  },

  addItem: (item) => {
    set((state) => ({
      items: [...state.items, item],
    }));
    get().calculateTotal();
  },

  updateQuantity: (cart_id, quantity) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.cart_id === cart_id ? { ...item, quantity } : item
      ),
    }));
    get().calculateTotal();
  },

  removeItem: (cart_id) => {
    set((state) => ({
      items: state.items.filter((item) => item.cart_id !== cart_id),
    }));
    get().calculateTotal();
  },

  clearCart: () => {
    set({ items: [], total: 0 });
  },

  calculateTotal: () => {
    const items = get().items;
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    set({ total });
  },
}));

