'use client';

import { FormEvent, useMemo, useState } from 'react';
import InputField from './InputField';
import { usePricing } from '@/contexts/PricingContext';

interface FieldState {
  location: string;
}

interface ChargeField {
  id: string;
  reason: string;
  amount: string;
}

const initialState: FieldState = {
  location: ''
};

const initialErrors: Record<keyof FieldState, string | undefined> = {
  location: undefined
};

export default function SupplierForm() {
  const { addSupplier } = usePricing();
  const [fields, setFields] = useState<FieldState>(initialState);
  const [errors, setErrors] = useState(initialErrors);
  const [charges, setCharges] = useState<ChargeField[]>([]);
  const [chargeErrors, setChargeErrors] = useState<Record<string, { reason?: string; amount?: string }>>({});

  const isDisabled = useMemo(() => !fields.location.trim(), [fields.location]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = { ...initialErrors };

    const trimmedLocation = fields.location.trim();
    if (!trimmedLocation) {
      nextErrors.location = 'Location is required';
    }

    const nextChargeErrors: Record<string, { reason?: string; amount?: string }> = {};
    const normalizedCharges: { reason: string; amount: number }[] = [];

    charges.forEach((charge) => {
      const trimmedReason = charge.reason.trim();
      const amountValue = charge.amount.trim();
      if (!trimmedReason && !amountValue) {
        return;
      }
      const currentErrors: { reason?: string; amount?: string } = {};
      if (!trimmedReason) {
        currentErrors.reason = 'Reason is required';
      }
      if (!amountValue) {
        currentErrors.amount = 'Amount is required';
      } else {
        const parsedAmount = Number(amountValue);
        if (!Number.isFinite(parsedAmount)) {
          currentErrors.amount = 'Enter a valid number';
        } else if (parsedAmount < 0) {
          currentErrors.amount = 'Cannot be negative';
        } else if (!currentErrors.reason) {
          normalizedCharges.push({ reason: trimmedReason, amount: parsedAmount });
        }
      }
      if (currentErrors.reason || currentErrors.amount) {
        nextChargeErrors[charge.id] = currentErrors;
      }
    });

    setErrors(nextErrors);
    setChargeErrors(nextChargeErrors);
    const hasError = Object.values(nextErrors).some(Boolean) || Object.keys(nextChargeErrors).length > 0;
    if (hasError) {
      return;
    }

    addSupplier({
      location: trimmedLocation,
      additionalCharges: normalizedCharges
    });

    setFields(initialState);
    setErrors(initialErrors);
    setCharges([]);
    setChargeErrors({});
  };

  const handleAddChargeField = () => {
    const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    setCharges((prev) => [...prev, { id, reason: '', amount: '' }]);
  };

  const handleRemoveChargeField = (id: string) => {
    setCharges((prev) => prev.filter((charge) => charge.id !== id));
    setChargeErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleChargeFieldChange = (id: string, key: 'reason' | 'amount', value: string) => {
    setCharges((prev) => prev.map((charge) => (charge.id === id ? { ...charge, [key]: value } : charge)));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
      <div className="grid gap-6 sm:grid-cols-2">
        <InputField
          label="Location"
          name="location"
          placeholder="Downtown Warehouse"
          value={fields.location}
          onChange={(event) => setFields((prev) => ({ ...prev, location: event.target.value }))}
          error={errors.location}
        />
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Additional Charges</h3>
            <p className="text-sm text-slate-500">Add as many reason/amount pairs as you need.</p>
          </div>
          <button
            type="button"
            onClick={handleAddChargeField}
            className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Add charge
          </button>
        </div>
        {!charges.length && <p className="text-sm text-slate-500">No additional charges added.</p>}
        <div className="space-y-4">
          {charges.map((charge, index) => (
            <div
              key={charge.id}
              className="space-y-4 rounded-lg border border-slate-200 p-4 sm:space-y-0 sm:rounded-xl sm:p-4 md:flex md:items-end md:gap-4"
            >
              <div className="md:flex-1">
                <InputField
                  label={`Reason ${charges.length > 1 ? index + 1 : ''}`.trim()}
                  name={`reason-${charge.id}`}
                  placeholder="Special handling"
                  value={charge.reason}
                  onChange={(event) => handleChargeFieldChange(charge.id, 'reason', event.target.value)}
                  error={chargeErrors[charge.id]?.reason}
                />
              </div>
              <div className="md:w-48">
                <InputField
                  label="Amount (USD)"
                  name={`amount-${charge.id}`}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="15"
                  value={charge.amount}
                  onChange={(event) => handleChargeFieldChange(charge.id, 'amount', event.target.value)}
                  error={chargeErrors[charge.id]?.amount}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveChargeField(charge.id)}
                className="inline-flex h-10 items-center rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isDisabled}
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Add Supplier
        </button>
      </div>
    </form>
  );
}
