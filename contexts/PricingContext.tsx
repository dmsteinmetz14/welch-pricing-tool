'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { FlowerInputPayload, FlowerItem, PricedFlowerItem } from '@/types/pricing';
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
  addFlowers: (flowers: FlowerInputPayload[]) => Promise<void>;
  setMarkup: (markup: number) => void;
  addSupplier: (supplier: SupplierInput) => Promise<void>;
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
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
  | { type: 'SET_ITEMS'; payload: FlowerItem[] }
  | { type: 'ADD_ITEMS'; payload: FlowerItem[] };

function pricingReducer(state: PricingState, action: PricingAction): PricingState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      const nextItem: FlowerItem = { ...action.payload, id };
      return { ...state, items: [...state.items, nextItem] };
    }
    case 'ADD_SUPPLIER': {
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    }
    case 'SET_SUPPLIERS': {
      return { ...state, suppliers: action.payload };
    }
    case 'SET_ITEMS': {
      return { ...state, items: action.payload };
    }
    case 'ADD_ITEMS': {
      return { ...state, items: [...state.items, ...action.payload] };
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
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [suppliersResponse, flowersResponse] = await Promise.all([fetch('/api/suppliers'), fetch('/api/flowers')]);
        const suppliersPayload = (await suppliersResponse.json()) as { suppliers?: Supplier[]; error?: string };
        const flowersPayload = (await flowersResponse.json()) as { flowers?: FlowerItem[]; error?: string };
        if (!suppliersResponse.ok) {
          throw new Error(suppliersPayload.error || 'Unable to load suppliers');
        }
        if (!flowersResponse.ok) {
          throw new Error(flowersPayload.error || 'Unable to load flowers');
        }
        if (isMounted) {
          if (suppliersPayload.suppliers) {
            dispatch({ type: 'SET_SUPPLIERS', payload: suppliersPayload.suppliers });
          }
          if (flowersPayload.flowers) {
            dispatch({ type: 'SET_ITEMS', payload: flowersPayload.flowers });
          }
        }
      } catch (error) {
        console.error('Failed to hydrate pricing data', error);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const pricedItems = useMemo(() => state.items.map((item) => buildPricedItem(item, state.markup)), [state.items, state.markup]);

  const totals = useMemo(() => {
    const wholesale = pricedItems.reduce((acc, item) => acc + item.wholesaleCost, 0);
    const retail = pricedItems.reduce((acc, item) => acc + item.totalRetail, 0);
    return {
      wholesale,
      retail
    };
  }, [pricedItems]);

  const setMarkup = useCallback((markup: number) => dispatch({ type: 'SET_MARKUP', payload: markup }), []);
  const addFlowers = useCallback(
    async (flowers: FlowerInputPayload[]) => {
      const response = await fetch('/api/flowers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ flowers })
      });
      const payload = (await response.json()) as { flowers?: FlowerItem[]; error?: string };
      if (!response.ok || !payload.flowers) {
        throw new Error(payload.error || 'Unable to create flowers');
      }
      dispatch({ type: 'ADD_ITEMS', payload: payload.flowers });
    },
    [dispatch]
  );
  const addSupplier = useCallback(async (supplier: SupplierInput) => {
    const response = await fetch('/api/suppliers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(supplier)
    });
    const payload = (await response.json()) as { supplier?: Supplier; error?: string };
    if (!response.ok || !payload.supplier) {
      throw new Error(payload.error || 'Unable to create supplier');
    }
    dispatch({ type: 'ADD_SUPPLIER', payload: payload.supplier });
  }, [dispatch]);

  const value = useMemo(
    () => ({
      items: state.items,
      pricedItems,
      totals,
      markup: state.markup,
      suppliers: state.suppliers,
      addFlowers,
      setMarkup,
      addSupplier
    }),
    [state.items, pricedItems, totals, state.markup, state.suppliers, addFlowers, setMarkup, addSupplier]
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
