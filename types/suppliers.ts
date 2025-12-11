export interface AdditionalCharge {
  reason: string;
  amount: number;
}

export interface Supplier {
  id: string;
  name: string;
  location: string;
  additionalCharges: AdditionalCharge[];
}

export interface SupplierInput {
  name: string;
  location: string;
}

export interface SupplierCharge {
  id: string;
  chargeType: string;
  description: string;
  amount: number;
  date?: string;
  supplierId?: string;
  supplierName?: string;
  unitOfCharge?: 'Per Box' | 'Per Shipment';
}
