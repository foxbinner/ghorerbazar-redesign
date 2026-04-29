import { createContext, useContext, useReducer, useEffect } from 'react';
import { useSettings } from './SettingsContext';

const CartContext = createContext(null);
const STORAGE_KEY = 'gb_cart';

function cartReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, items: action.payload };
    case 'ADD': {
      const addQty = action.payload.qty ?? 1;
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.payload.id ? { ...i, qty: i.qty + addQty } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.payload, qty: addQty }] };
    }
    case 'INCREASE':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload ? { ...i, qty: i.qty + 1 } : i
        ),
      };
    case 'DECREASE': {
      const item = state.items.find(i => i.id === action.payload);
      if (!item || item.qty <= 1) {
        return { ...state, items: state.items.filter(i => i.id !== action.payload) };
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload ? { ...i, qty: i.qty - 1 } : i
        ),
      };
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    case 'CLEAR':
      return { ...state, items: [], isOpen: false };
    case 'OPEN':
      return { ...state, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false };
    case 'TOGGLE':
      return { ...state, isOpen: !state.isOpen };
    default:
      return state;
  }
}

function loadCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const items = JSON.parse(saved);
      if (Array.isArray(items)) return { items, isOpen: false };
    }
  } catch {}
  return { items: [], isOpen: false };
}

export function CartProvider({ children }) {
  const { threshold, discount_amount } = useSettings();
  const aovTarget = parseInt(threshold, 10) || 1000;
  const discountAmt = parseInt(discount_amount, 10) || 0;

  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const totalQty = state.items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = state.items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = discountAmt > 0 && totalPrice >= aovTarget ? discountAmt : 0;
  const discountedTotal = totalPrice - discount;
  const aovProgress = discount > 0 ? 100 : Math.min((totalPrice / aovTarget) * 100, 100);
  const aovRemaining = discount > 0 ? 0 : Math.max(aovTarget - totalPrice, 0);

  return (
    <CartContext.Provider value={{ ...state, totalQty, totalPrice, discount, discountAmt, discountedTotal, aovTarget, aovProgress, aovRemaining, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  return useContext(CartContext);
}
