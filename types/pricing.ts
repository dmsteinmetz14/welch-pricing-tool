export interface FlowerItem {
  id: string;
  flowerType?: string;
  name: string;
  quantity: number;
  wholesaleCost: number;
  supplierId?: string;
  date?: string;
  boxes?: number | null;
}

export interface PricedFlowerItem extends FlowerItem {
  stemCost: number;
  retailPerStem: number;
  totalRetail: number;
  appliedMarkup: number;
  baseWholesaleCost: number;
  allocatedChargeTotal: number;
  effectiveWholesaleCost: number;
}

export interface FlowerInputPayload {
  flowerType: string;
  name: string;
  quantity: number;
  wholesaleCost: number;
  supplierId: string;
  date: string;
  boxes?: number | null;
}
