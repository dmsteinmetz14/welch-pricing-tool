export interface FlowerItem {
  id: string;
  name: string;
  quantity: number;
  wholesaleCost: number;
  supplierId?: string;
}

export interface PricedFlowerItem extends FlowerItem {
  stemCost: number;
  retailPerStem: number;
  totalRetail: number;
}
