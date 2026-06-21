import { useState, useCallback } from 'react';
import { DIGITAL_PRODUCTS, DigitalProduct } from '@/lib/constructionData';

export interface CartItem extends DigitalProduct {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
}

export const useCart = () => {
  const [cart, setCart] = useState<CartState>(() => {
    const savedCart = localStorage.getItem('construsmart_cart');
    return savedCart ? JSON.parse(savedCart) : { items: [], total: 0 };
  });

  const saveCart = (newCart: CartState) => {
    setCart(newCart);
    localStorage.setItem('construsmart_cart', JSON.stringify(newCart));
  };

  const addToCart = useCallback((product: DigitalProduct) => {
    setCart((prevCart) => {
      const existingItem = prevCart.items.find(item => item.id === product.id);
      
      let newItems: CartItem[];
      if (existingItem) {
        newItems = prevCart.items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...prevCart.items, { ...product, quantity: 1 }];
      }

      const newCart = {
        items: newItems,
        total: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      };

      localStorage.setItem('construsmart_cart', JSON.stringify(newCart));
      return newCart;
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.filter(item => item.id !== productId);
      const newCart = {
        items: newItems,
        total: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      };

      localStorage.setItem('construsmart_cart', JSON.stringify(newCart));
      return newCart;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return;

    setCart((prevCart) => {
      const newItems = prevCart.items.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      );

      const newCart = {
        items: newItems,
        total: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      };

      localStorage.setItem('construsmart_cart', JSON.stringify(newCart));
      return newCart;
    });
  }, []);

  const clearCart = useCallback(() => {
    const newCart = { items: [], total: 0 };
    setCart(newCart);
    localStorage.setItem('construsmart_cart', JSON.stringify(newCart));
  }, []);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount,
    isEmpty: cart.items.length === 0,
  };
};