export interface AdditionalCharge {
  reason: string;
  amount: number;
}

export interface Supplier {
  id: string;
  location: string;
  additionalCharges: AdditionalCharge[];
}

export type SupplierInput = Omit<Supplier, 'id'>;
