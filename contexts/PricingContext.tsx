'use client';

import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { FlowerItem, PricedFlowerItem } from '@/types/pricing';
import { Supplier, SupplierInput } from '@/types/suppliers';
import { buildPricedItem, DEFAULT_MARKUP_PERCENT } from '@/lib/pricing';

interface PricingState {
  items: FlowerItem[];
  markup: number;
  suppliers: Supplier[];
}

interface PricingContextValue {
  items: FlowerItem[];
  pricedItems: PricedFlowerItem[];
  totals: {
    wholesale: number;
    retail: number;
  };
  markup: number;
  suppliers: Supplier[];
  addItem: (item: Omit<FlowerItem, 'id'>) => void;
  setMarkup: (markup: number) => void;
  addSupplier: (supplier: SupplierInput) => void;
}

const PricingContext = createContext<PricingContextValue | undefined>(undefined);

const initialState: PricingState = {
  items: [],
  markup: DEFAULT_MARKUP_PERCENT,
  suppliers: []
};

type PricingAction =
  | { type: 'ADD_ITEM'; payload: Omit<FlowerItem, 'id'> }
  | { type: 'SET_MARKUP'; payload: number }
  | { type: 'ADD_SUPPLIER'; payload: SupplierInput };

function pricingReducer(state: PricingState, action: PricingAction): PricingState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      const nextItem: FlowerItem = { ...action.payload, id };
      return { ...state, items: [...state.items, nextItem] };
    }
    case 'ADD_SUPPLIER': {
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      const nextSupplier: Supplier = { ...action.payload, id, additionalCharges: action.payload.additionalCharges ?? [] };
      return { ...state, suppliers: [...state.suppliers, nextSupplier] };
    }
    case 'SET_MARKUP': {
      const normalized = Number.isFinite(action.payload) ? Math.max(0, action.payload) : state.markup;
      return { ...state, markup: normalized };
    }
    default:
      return state;
  }
}

export function PricingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(pricingReducer, initialState);

  const pricedItems = useMemo(() => state.items.map((item) => buildPricedItem(item, state.markup)), [state.items, state.markup]);

  const totals = useMemo(() => {
    const wholesale = pricedItems.reduce((acc, item) => acc + item.wholesaleCost, 0);
    const retail = pricedItems.reduce((acc, item) => acc + item.totalRetail, 0);
    return {
      wholesale,
      retail
    };
  }, [pricedItems]);

  const addItem = useCallback((item: Omit<FlowerItem, 'id'>) => dispatch({ type: 'ADD_ITEM', payload: item }), []);
  const setMarkup = useCallback((markup: number) => dispatch({ type: 'SET_MARKUP', payload: markup }), []);
  const addSupplier = useCallback((supplier: SupplierInput) => dispatch({ type: 'ADD_SUPPLIER', payload: supplier }), []);

  const value = useMemo(
    () => ({
      items: state.items,
      pricedItems,
      totals,
      markup: state.markup,
      suppliers: state.suppliers,
      addItem,
      setMarkup,
      addSupplier
    }),
    [state.items, pricedItems, totals, state.markup, state.suppliers, addItem, setMarkup, addSupplier]
  );

  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
}

export function usePricing() {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error('usePricing must be used within PricingProvider');
  }
  return context;
}
