export interface StandingOrderLineInput {
  flowerType: string;
  name: string;
  quantity: number;
  boxes: number;
  wholesaleCost: number;
}

export interface StandingOrderLine extends StandingOrderLineInput {
  id: string;
  standingOrderId: string;
}

export interface StandingOrderPayload {
  name: string;
  supplierId: string;
  lines: StandingOrderLineInput[];
}

export interface StandingOrder {
  id: string;
  name: string;
  supplierId: string;
  supplierName?: string;
  lines: StandingOrderLine[];
  updatedAt?: string;
  createdAt?: string;
}
