'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { FlowerInputPayload, FlowerItem, PricedFlowerItem } from '@/types/pricing';
import { Supplier, SupplierInput, SupplierCharge } from '@/types/suppliers';
import { buildPricedItem, DEFAULT_MARKUP_PERCENT } from '@/lib/pricing';

interface PricingState {
  items: FlowerItem[];
  markup: number;
  suppliers: Supplier[];
  itemMarkups: Record<string, number | undefined>;
  charges: SupplierCharge[];
}

interface PricingContextValue {
  items: FlowerItem[];
  pricedItems: PricedFlowerItem[];
  totals: {
    wholesale: number;
    wholesaleWithCharges: number;
    retail: number;
  };
  markup: number;
  suppliers: Supplier[];
  addFlowers: (flowers: FlowerInputPayload[]) => Promise<void>;
  setMarkup: (markup: number) => void;
  setItemMarkup: (id: string, markup: number | null | undefined) => void;
  resetItemMarkup: (id: string) => void;
  applyMarkupToAll: () => void;
  itemMarkups: Record<string, number | undefined>;
  addSupplier: (supplier: SupplierInput) => Promise<void>;
}

const PricingContext = createContext<PricingContextValue | undefined>(undefined);

const initialState: PricingState = {
  items: [],
  markup: DEFAULT_MARKUP_PERCENT,
  suppliers: [],
  itemMarkups: {},
  charges: []
};

type PricingAction =
  | { type: 'ADD_ITEM'; payload: Omit<FlowerItem, 'id'> }
  | { type: 'SET_MARKUP'; payload: number }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
  | { type: 'SET_ITEMS'; payload: FlowerItem[] }
  | { type: 'ADD_ITEMS'; payload: FlowerItem[] }
  | { type: 'SET_ITEM_MARKUP'; payload: { id: string; markup?: number } }
  | { type: 'APPLY_MARKUP_TO_ALL' }
  | { type: 'RESET_ITEM_MARKUP'; payload: { id: string } }
  | { type: 'SET_CHARGES'; payload: SupplierCharge[] };

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
      const allowedIds = new Set(action.payload.map((item) => item.id));
      const nextItemMarkups = Object.fromEntries(
        Object.entries(state.itemMarkups).filter(([id]) => allowedIds.has(id))
      );
      return { ...state, items: action.payload, itemMarkups: nextItemMarkups };
    }
    case 'ADD_ITEMS': {
      return { ...state, items: [...state.items, ...action.payload] };
    }
    case 'SET_MARKUP': {
      const normalized = Number.isFinite(action.payload) ? Math.max(0, action.payload) : state.markup;
      return { ...state, markup: normalized };
    }
    case 'SET_ITEM_MARKUP': {
      const normalized = Number.isFinite(action.payload.markup) ? Math.max(0, action.payload.markup ?? 0) : undefined;
      const nextMap = { ...state.itemMarkups };
      if (normalized === undefined) {
        delete nextMap[action.payload.id];
      } else {
        nextMap[action.payload.id] = normalized;
      }
      return { ...state, itemMarkups: nextMap };
    }
    case 'RESET_ITEM_MARKUP': {
      const nextMap = { ...state.itemMarkups };
      delete nextMap[action.payload.id];
      return { ...state, itemMarkups: nextMap };
    }
    case 'APPLY_MARKUP_TO_ALL': {
      const nextMap: Record<string, number> = {};
      state.items.forEach((item) => {
        nextMap[item.id] = state.markup;
      });
      return { ...state, itemMarkups: nextMap };
    }
    case 'SET_CHARGES': {
      return { ...state, charges: action.payload };
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
        const [suppliersResponse, flowersResponse, chargesResponse] = await Promise.all([
          fetch('/api/suppliers'),
          fetch('/api/flowers'),
          fetch('/api/supplier-charges')
        ]);
        const suppliersPayload = (await suppliersResponse.json()) as { suppliers?: Supplier[]; error?: string };
        const flowersPayload = (await flowersResponse.json()) as { flowers?: FlowerItem[]; error?: string };
        const chargesPayload = (await chargesResponse.json()) as { charges?: SupplierCharge[]; error?: string };
        if (!suppliersResponse.ok) {
          throw new Error(suppliersPayload.error || 'Unable to load suppliers');
        }
        if (!flowersResponse.ok) {
          throw new Error(flowersPayload.error || 'Unable to load flowers');
        }
        if (!chargesResponse.ok) {
          throw new Error(chargesPayload.error || 'Unable to load supplier charges');
        }
        if (isMounted) {
          if (suppliersPayload.suppliers) {
            dispatch({ type: 'SET_SUPPLIERS', payload: suppliersPayload.suppliers });
          }
          if (flowersPayload.flowers) {
            dispatch({ type: 'SET_ITEMS', payload: flowersPayload.flowers });
          }
          if (chargesPayload.charges) {
            dispatch({ type: 'SET_CHARGES', payload: chargesPayload.charges });
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

  const allocationMap = useMemo(() => {
    if (!state.items.length || !state.charges.length) {
      return new Map<string, number>();
    }
    const flowersBySupplier = new Map<string, FlowerItem[]>();
    state.items.forEach((item) => {
      if (!item.supplierId) {
        return;
      }
      const existing = flowersBySupplier.get(item.supplierId) ?? [];
      existing.push(item);
      flowersBySupplier.set(item.supplierId, existing);
    });
    const allocation = new Map<string, number>();
    state.charges.forEach((charge) => {
      if (!charge.supplierId) {
        return;
      }
      const flowers = flowersBySupplier.get(charge.supplierId);
      if (!flowers?.length) {
        return;
      }
      let totalCharge = 0;
      if (charge.unitOfCharge === 'Per Shipment') {
        totalCharge = charge.amount;
      } else if (charge.unitOfCharge === 'Per Box') {
        if (charge.boxCount && Number.isFinite(charge.boxCount)) {
          totalCharge = charge.amount * charge.boxCount;
        } else {
          totalCharge = charge.amount;
        }
      }
      if (!totalCharge) {
        return;
      }
      const perFlower = totalCharge / flowers.length;
      flowers.forEach((flower) => {
        allocation.set(flower.id, (allocation.get(flower.id) ?? 0) + perFlower);
      });
    });
    return allocation;
  }, [state.items, state.charges]);

  const pricedItems = useMemo(
    () =>
      state.items.map((item) => {
        const allocatedChargeTotal = allocationMap.get(item.id) ?? 0;
        const chargePerUnit = item.quantity > 0 ? allocatedChargeTotal / item.quantity : 0;
        const effectiveWholesale = item.wholesaleCost + chargePerUnit;
        const appliedMarkup = state.itemMarkups[item.id] ?? state.markup;
        const priced = buildPricedItem({ ...item, wholesaleCost: effectiveWholesale }, appliedMarkup);
        return {
          ...priced,
          appliedMarkup,
          baseWholesaleCost: item.wholesaleCost,
          allocatedChargeTotal,
          effectiveWholesaleCost: effectiveWholesale
        };
      }),
    [state.items, state.itemMarkups, state.markup, allocationMap]
  );

  const totals = useMemo(() => {
    const wholesale = pricedItems.reduce((acc, item) => acc + item.baseWholesaleCost * item.quantity, 0);
    const wholesaleWithCharges = pricedItems.reduce(
      (acc, item) => acc + item.baseWholesaleCost * item.quantity + item.allocatedChargeTotal,
      0
    );
    const retail = pricedItems.reduce((acc, item) => acc + item.totalRetail, 0);
    return {
      wholesale,
      wholesaleWithCharges,
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

  const setItemMarkup = useCallback((id: string, markup: number | null | undefined) => {
    dispatch({
      type: 'SET_ITEM_MARKUP',
      payload: {
        id,
        markup: markup === null ? undefined : markup
      }
    });
  }, []);

  const resetItemMarkup = useCallback((id: string) => {
    dispatch({ type: 'RESET_ITEM_MARKUP', payload: { id } });
  }, []);

  const applyMarkupToAll = useCallback(() => {
    dispatch({ type: 'APPLY_MARKUP_TO_ALL' });
  }, []);

  const value = useMemo(
    () => ({
      items: state.items,
      pricedItems,
      totals,
      markup: state.markup,
      suppliers: state.suppliers,
      itemMarkups: state.itemMarkups,
      addFlowers,
      setMarkup,
      setItemMarkup,
      resetItemMarkup,
      applyMarkupToAll,
      addSupplier
    }),
    [
      state.items,
      pricedItems,
      totals,
      state.markup,
      state.suppliers,
      state.itemMarkups,
      addFlowers,
      setMarkup,
      setItemMarkup,
      resetItemMarkup,
      applyMarkupToAll,
      addSupplier
    ]
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
