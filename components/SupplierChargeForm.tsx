'use client';

import { FormEvent, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import InputField from './InputField';
import { Supplier } from '@/types/suppliers';

interface SupplierChargeFormProps {
  suppliers: Supplier[];
}

interface FieldState {
  chargeType: string;
  description: string;
  supplierId: string;
  amount: string;
  date: string;
}

const today = new Date();
const defaultDate = today.toISOString().split('T')[0];

const initialState: FieldState = {
  chargeType: '',
  description: '',
  supplierId: '',
  amount: '',
  date: defaultDate
};

const initialErrors: Record<keyof FieldState, string | undefined> = {
  chargeType: undefined,
  description: undefined,
  supplierId: undefined,
  amount: undefined,
  date: undefined
};

export default function SupplierChargeForm({ suppliers }: SupplierChargeFormProps) {
  const [fields, setFields] = useState<FieldState>(initialState);
  const [errors, setErrors] = useState(initialErrors);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isDisabled = useMemo(
    () => isPending || !fields.chargeType.trim() || !fields.supplierId || !fields.amount.trim() || !fields.date.trim(),
    [fields.chargeType, fields.supplierId, fields.amount, fields.date, isPending]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<keyof FieldState, string | undefined> = { ...initialErrors };

    const trimmedType = fields.chargeType.trim();
    const trimmedDescription = fields.description.trim();
    const trimmedAmount = fields.amount.trim();
    const trimmedDate = fields.date.trim();

    if (!trimmedType) {
      nextErrors.chargeType = 'Charge type is required';
    }
    if (!trimmedDescription) {
      nextErrors.description = 'Description is required';
    }
    if (!fields.supplierId) {
      nextErrors.supplierId = 'Supplier is required';
    }
    if (!trimmedAmount) {
      nextErrors.amount = 'Amount is required';
    } else {
      const parsedAmount = Number(trimmedAmount);
      if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
        nextErrors.amount = 'Amount must be a non-negative number';
      }
    }
    if (!trimmedDate) {
      nextErrors.date = 'Date is required';
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setFormError(null);
    startTransition(async () => {
      try {
        const response = await fetch('/api/supplier-charges', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chargeType: trimmedType,
            description: trimmedDescription,
            supplierId: fields.supplierId,
            amount: Number(trimmedAmount),
            date: trimmedDate
          })
        });
        const payload = (await response.json()) as { charge?: unknown; error?: string };
        if (!response.ok) {
          throw new Error(payload.error || 'Unable to save charge');
        }
        setFields(initialState);
        setErrors(initialErrors);
        router.refresh();
      } catch (error) {
        console.error('Failed to create supplier charge', error);
        setFormError(error instanceof Error ? error.message : 'Unable to create supplier charge right now');
      }
    });
  };

  const supplierOptions = useMemo(
    () =>
      suppliers.map((supplier) => ({
        id: supplier.id,
        label: supplier.name ? `${supplier.name}${supplier.location ? ` — ${supplier.location}` : ''}` : supplier.location || 'Unnamed supplier'
      })),
    [suppliers]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
      <div className="grid gap-6 md:grid-cols-2">
        <InputField
          label="Charge type"
          name="chargeType"
          placeholder="Freight"
          value={fields.chargeType}
          onChange={(event) => setFields((prev) => ({ ...prev, chargeType: event.target.value }))}
          error={errors.chargeType}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Supplier</span>
          <select
            value={fields.supplierId}
            onChange={(event) => setFields((prev) => ({ ...prev, supplierId: event.target.value }))}
            className={`rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 ${
              errors.supplierId ? 'border-red-400 focus:ring-red-200' : ''
            }`}
          >
            <option value="">Select a supplier</option>
            {supplierOptions.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.label}
              </option>
            ))}
          </select>
          {errors.supplierId && <span className="text-xs text-red-500">{errors.supplierId}</span>}
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Charge description</span>
        <textarea
          name="description"
          placeholder="Inbound freight for Holland shipment"
          value={fields.description}
          onChange={(event) => setFields((prev) => ({ ...prev, description: event.target.value }))}
          className={`rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 ${
            errors.description ? 'border-red-400 focus:ring-red-200' : ''
          }`}
          rows={3}
        />
        {errors.description && <span className="text-xs text-red-500">{errors.description}</span>}
      </label>
      <div className="grid gap-6 md:grid-cols-2">
        <InputField
          label="Charge amount (USD)"
          name="amount"
          type="number"
          min={0}
          step="0.01"
          placeholder="150"
          value={fields.amount}
          onChange={(event) => setFields((prev) => ({ ...prev, amount: event.target.value }))}
          error={errors.amount}
        />
        <InputField
          label="Charge date"
          name="date"
          type="date"
          value={fields.date}
          onChange={(event) => setFields((prev) => ({ ...prev, date: event.target.value }))}
          error={errors.date}
        />
      </div>
      {formError && <p className="text-sm text-red-500">{formError}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isDisabled}
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isPending ? 'Saving...' : 'Add supplier charge'}
        </button>
      </div>
    </form>
  );
}
