'use client';

import { FormEvent, useMemo, useState } from 'react';
import InputField from './InputField';
import { usePricing } from '@/contexts/PricingContext';

interface FieldState {
  name: string;
  location: string;
}

const initialState: FieldState = {
  name: '',
  location: ''
};

const initialErrors: Record<keyof FieldState, string | undefined> = {
  name: undefined,
  location: undefined
};

export default function SupplierForm() {
  const { addSupplier } = usePricing();
  const [fields, setFields] = useState<FieldState>(initialState);
  const [errors, setErrors] = useState(initialErrors);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = useMemo(
    () => isSubmitting || !fields.name.trim() || !fields.location.trim(),
    [fields.name, fields.location, isSubmitting]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<keyof FieldState, string | undefined> = { ...initialErrors };

    const trimmedName = fields.name.trim();
    const trimmedLocation = fields.location.trim();
    if (!trimmedName) {
      nextErrors.name = 'Supplier name is required';
    }
    if (!trimmedLocation) {
      nextErrors.location = 'Location is required';
    }

    setErrors(nextErrors);
    const hasError = Object.values(nextErrors).some(Boolean);
    if (hasError) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await addSupplier({
        name: trimmedName,
        location: trimmedLocation
      });
      setFields(initialState);
      setErrors(initialErrors);
    } catch (error) {
      console.error('Failed to create supplier', error);
      setFormError(error instanceof Error ? error.message : 'Unable to add supplier right now');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
      <div className="grid gap-6 sm:grid-cols-2">
        <InputField
          label="Supplier name"
          name="name"
          placeholder="Welch Wholesale"
          value={fields.name}
          onChange={(event) => setFields((prev) => ({ ...prev, name: event.target.value }))}
          error={errors.name}
        />
        <InputField
          label="Location"
          name="location"
          placeholder="Downtown Warehouse"
          value={fields.location}
          onChange={(event) => setFields((prev) => ({ ...prev, location: event.target.value }))}
          error={errors.location}
        />
      </div>
      {formError && <p className="text-sm text-red-500">{formError}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isDisabled}
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? 'Saving...' : 'Add Supplier'}
        </button>
      </div>
    </form>
  );
}
