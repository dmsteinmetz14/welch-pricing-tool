'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import InputField from './InputField';
import { usePricing } from '@/contexts/PricingContext';

interface FlowerField {
  id: string;
  name: string;
  quantity: string;
  wholesaleCost: string;
}

const createField = (): FlowerField => ({
  id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
  name: '',
  quantity: '',
  wholesaleCost: ''
});

export default function FlowerForm() {
  const { addItem, suppliers } = usePricing();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [fields, setFields] = useState<FlowerField[]>([createField()]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, Partial<Record<keyof Omit<FlowerField, 'id'>, string>>>>({});
  const [supplierError, setSupplierError] = useState<string | undefined>();

  useEffect(() => {
    if (suppliers.length === 1) {
      setSelectedSupplierId((prev) => prev || suppliers[0].id);
    }
  }, [suppliers]);

  const isDisabled = useMemo(() => !selectedSupplierId || !fields.some((field) => field.name && field.quantity && field.wholesaleCost), [fields, selectedSupplierId]);

  const handleAddField = () => {
    setFields((prev) => [...prev, createField()]);
  };

  const handleRemoveField = (id: string) => {
    setFields((prev) => prev.filter((field) => field.id !== id));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleFieldChange = (id: string, key: 'name' | 'quantity' | 'wholesaleCost', value: string) => {
    setFields((prev) => prev.map((field) => (field.id === id ? { ...field, [key]: value } : field)));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let hasError = false;

    if (!selectedSupplierId) {
      setSupplierError('Select a supplier to continue');
      hasError = true;
    } else {
      setSupplierError(undefined);
    }

    const nextErrors: typeof fieldErrors = {};

    fields.forEach((field) => {
      const trimmedName = field.name.trim();
      const errors: Record<string, string | undefined> = {};

      if (!trimmedName) {
        errors.name = 'Name is required';
      }

      const quantity = Number(field.quantity);
      if (!field.quantity.trim()) {
        errors.quantity = 'Quantity is required';
      } else if (!Number.isFinite(quantity) || quantity <= 0) {
        errors.quantity = 'Enter a quantity greater than zero';
      }

      const wholesaleCost = Number(field.wholesaleCost);
      if (!field.wholesaleCost.trim()) {
        errors.wholesaleCost = 'Cost is required';
      } else if (!Number.isFinite(wholesaleCost) || wholesaleCost < 0) {
        errors.wholesaleCost = 'Cost cannot be negative';
      }

      if (errors.name || errors.quantity || errors.wholesaleCost) {
        nextErrors[field.id] = errors;
        hasError = true;
      }
    });

    setFieldErrors(nextErrors);

    if (hasError) {
      return;
    }

    fields.forEach((field) => {
      addItem({
        name: field.name.trim(),
        quantity: Number(field.quantity),
        wholesaleCost: Number(field.wholesaleCost),
        supplierId: selectedSupplierId
      });
    });

    setFields([createField()]);
    setFieldErrors({});
  };

  if (!suppliers.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        Add at least one supplier before capturing flower details.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Supplier
          <select
            value={selectedSupplierId}
            onChange={(event) => setSelectedSupplierId(event.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Select a supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.location}
              </option>
            ))}
          </select>
        </label>
        {supplierError && <p className="text-xs text-red-500">{supplierError}</p>}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Flowers</h3>
            <p className="text-sm text-slate-500">Add multiple flowers for the selected supplier.</p>
          </div>
          <button
            type="button"
            onClick={handleAddField}
            className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Add flower
          </button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-4 rounded-lg border border-slate-200 p-4 sm:space-y-0 sm:rounded-xl sm:p-4 md:grid md:grid-cols-3 md:gap-4">
              <InputField
                label={`Flower name ${fields.length > 1 ? index + 1 : ''}`.trim()}
                name={`name-${field.id}`}
                placeholder="Garden Rose"
                value={field.name}
                onChange={(event) => handleFieldChange(field.id, 'name', event.target.value)}
                error={fieldErrors[field.id]?.name}
              />
              <InputField
                label="Quantity"
                name={`quantity-${field.id}`}
                type="number"
                min={1}
                step={1}
                placeholder="50"
                value={field.quantity}
                onChange={(event) => handleFieldChange(field.id, 'quantity', event.target.value)}
                error={fieldErrors[field.id]?.quantity}
              />
              <InputField
                label="Wholesale cost (USD)"
                name={`cost-${field.id}`}
                type="number"
                min={0}
                step="0.01"
                placeholder="120"
                value={field.wholesaleCost}
                onChange={(event) => handleFieldChange(field.id, 'wholesaleCost', event.target.value)}
                error={fieldErrors[field.id]?.wholesaleCost}
              />
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveField(field.id)}
                  className="inline-flex h-10 items-center rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 md:col-span-3 md:justify-self-start"
                >
                  Remove
                </button>
              )}
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
          Add Flowers
        </button>
      </div>
    </form>
  );
}
