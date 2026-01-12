'use client';

import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import InputField from './InputField';
import { Supplier } from '@/types/suppliers';
import { formatDateInput, getStartOfCurrentWeek } from '@/lib/date';

interface SupplierChargeFormProps {
  suppliers: Supplier[];
  onSaved?: () => void;
  lockedSupplier?: Supplier;
}

interface FieldState {
  chargeType: string;
  description: string;
  supplierId: string;
  amount: string;
  date: string;
  unitOfCharge: 'Per Box' | 'Per Shipment';
  boxCountMode: 'all' | 'custom';
  boxCount: string;
}

const defaultDate = formatDateInput(getStartOfCurrentWeek());

const initialState: FieldState = {
  chargeType: '',
  description: '',
  supplierId: '',
  amount: '',
  date: defaultDate,
  unitOfCharge: 'Per Box',
  boxCountMode: 'all',
  boxCount: ''
};

const initialErrors: Record<keyof FieldState, string | undefined> = {
  chargeType: undefined,
  description: undefined,
  supplierId: undefined,
  amount: undefined,
  date: undefined,
  unitOfCharge: undefined,
  boxCount: undefined,
  boxCountMode: undefined
};

export default function SupplierChargeForm({ suppliers, onSaved, lockedSupplier }: SupplierChargeFormProps) {
  const [fields, setFields] = useState<FieldState>(initialState);
  const [errors, setErrors] = useState(initialErrors);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const lockedSupplierId = lockedSupplier?.id ?? '';

  const isDisabled = useMemo(() => {
    const requiresBoxCount = fields.unitOfCharge === 'Per Box' && fields.boxCountMode === 'custom';
    const parsedBoxCount = Number(fields.boxCount);
    const hasInvalidBoxCount =
      requiresBoxCount && (!fields.boxCount.trim() || !Number.isInteger(parsedBoxCount) || parsedBoxCount <= 0);
    return (
      isPending ||
      !fields.chargeType.trim() ||
      !fields.supplierId ||
      !fields.amount.trim() ||
      !fields.date.trim() ||
      !fields.unitOfCharge ||
      hasInvalidBoxCount
    );
  }, [
    fields.chargeType,
    fields.supplierId,
    fields.amount,
    fields.date,
    fields.unitOfCharge,
    fields.boxCountMode,
    fields.boxCount,
    isPending
  ]);

  useEffect(() => {
    setFields((prev) => ({ ...prev, supplierId: lockedSupplierId }));
  }, [lockedSupplierId]);

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
    if (fields.unitOfCharge !== 'Per Box' && fields.unitOfCharge !== 'Per Shipment') {
      nextErrors.unitOfCharge = 'Select how this charge applies';
    }
    if (fields.unitOfCharge === 'Per Box' && fields.boxCountMode === 'custom') {
      if (!fields.boxCount.trim()) {
        nextErrors.boxCount = 'Enter the number of boxes this charge covers';
      } else {
        const parsedBoxes = Number(fields.boxCount);
        if (!Number.isInteger(parsedBoxes) || parsedBoxes <= 0) {
          nextErrors.boxCount = 'Box count must be a positive whole number';
        }
      }
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
            date: trimmedDate,
            unitOfCharge: fields.unitOfCharge,
            boxCount:
              fields.unitOfCharge === 'Per Box' && fields.boxCountMode === 'custom'
                ? Number(fields.boxCount)
                : null
          })
        });
        const payload = (await response.json()) as { charge?: unknown; error?: string };
        if (!response.ok) {
          throw new Error(payload.error || 'Unable to save charge');
        }
        setFields(initialState);
        setErrors(initialErrors);
        if (onSaved) {
          onSaved();
        } else {
          router.refresh();
        }
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
    <form onSubmit={handleSubmit} className="space-y-6 rounded-card border border-stone bg-white p-6 shadow-card">
      <div className="grid gap-6 md:grid-cols-3">
        {lockedSupplier ? null : (
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-moss">Supplier</span>
            <select
              value={fields.supplierId}
              onChange={(event) => setFields((prev) => ({ ...prev, supplierId: event.target.value }))}
              className={`rounded-md border border-stone bg-white px-3 py-2 text-base text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60 ${
                errors.supplierId ? 'border-[#C7563D] focus:ring-[#F2B8A4]' : ''
              }`}
            >
              <option value="">Select a supplier</option>
              {supplierOptions.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.label}
                </option>
              ))}
            </select>
            {errors.supplierId && <span className="text-xs font-medium text-[#B42318]">{errors.supplierId}</span>}
          </label>
        )}
        <InputField
          label="Charge type"
          name="chargeType"
          placeholder="Freight"
          value={fields.chargeType}
          onChange={(event) => setFields((prev) => ({ ...prev, chargeType: event.target.value }))}
          error={errors.chargeType}
        />
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-moss">Unit of charge</span>
          <select
            value={fields.unitOfCharge}
            onChange={(event) =>
              setFields((prev) => {
                const nextUnit = event.target.value === 'Per Shipment' ? 'Per Shipment' : 'Per Box';
                return {
                  ...prev,
                  unitOfCharge: nextUnit,
                  boxCountMode: nextUnit === 'Per Shipment' ? 'all' : prev.boxCountMode
                };
              })
            }
            className={`rounded-md border border-stone bg-white px-3 py-2 text-base text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60 ${
              errors.unitOfCharge ? 'border-[#C7563D] focus:ring-[#F2B8A4]' : ''
            }`}
          >
            <option value="Per Box">Per Box</option>
            <option value="Per Shipment">Per Shipment</option>
          </select>
          {errors.unitOfCharge && <span className="text-xs font-medium text-[#B42318]">{errors.unitOfCharge}</span>}
        </label>
      </div>
      {fields.unitOfCharge === 'Per Box' && (
        <div className="space-y-3 rounded-lg border border-stone bg-warm-white p-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-moss">Number of boxes</span>
            <select
              value={fields.boxCountMode}
              onChange={(event) =>
                setFields((prev) => ({
                  ...prev,
                  boxCountMode: event.target.value === 'custom' ? 'custom' : 'all'
                }))
              }
              className="rounded-md border border-stone bg-white px-3 py-2 text-base text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
            >
              <option value="all">All boxes</option>
              <option value="custom">Specific number</option>
            </select>
          </label>
          {fields.boxCountMode === 'custom' ? (
            <InputField
              label="Boxes to charge"
              name="boxCount"
              type="number"
              min={1}
              step={1}
              placeholder="10"
              value={fields.boxCount}
              onChange={(event) => setFields((prev) => ({ ...prev, boxCount: event.target.value }))}
              error={errors.boxCount}
            />
          ) : (
            <p className="text-xs text-sage">Default: the charge applies to every box in the shipment.</p>
          )}
        </div>
      )}
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-moss">Charge description</span>
        <textarea
          name="description"
          placeholder="(Optional)"
          value={fields.description}
          onChange={(event) => setFields((prev) => ({ ...prev, description: event.target.value }))}
          className={`rounded-md border border-stone bg-white px-3 py-2 text-base text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60 ${
            errors.description ? 'border-[#C7563D] focus:ring-[#F2B8A4]' : ''
          }`}
          rows={3}
        />
        {errors.description && <span className="text-xs font-medium text-[#B42318]">{errors.description}</span>}
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
      {formError && <p className="text-sm font-medium text-[#B42318]">{formError}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isDisabled}
          className="inline-flex items-center rounded-md bg-harvest px-5 py-2 text-sm font-semibold text-warm-white transition hover:bg-harvest-hover active:bg-harvest-active disabled:cursor-not-allowed disabled:bg-harvest/60"
        >
          {isPending ? 'Saving...' : 'Add supplier charge'}
        </button>
      </div>
    </form>
  );
}
