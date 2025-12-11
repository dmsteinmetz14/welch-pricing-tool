export interface FlowerItem {
  id: string;
  flowerType?: string;
  name: string;
  quantity: number;
  wholesaleCost: number;
  supplierId?: string;
  date?: string;
  unitOfMeasure?: 'Per Bunch' | 'Per Stem';
}

export interface PricedFlowerItem extends FlowerItem {
  stemCost: number;
  retailPerStem: number;
  totalRetail: number;
}

export interface FlowerInputPayload {
  flowerType: string;
  name: string;
  quantity: number;
  wholesaleCost: number;
  supplierId: string;
  date: string;
  unitOfMeasure: 'Per Bunch' | 'Per Stem';
}
