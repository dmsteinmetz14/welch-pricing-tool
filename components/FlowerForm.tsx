'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import InputField from './InputField';
import { usePricing } from '@/contexts/PricingContext';
import { FlowerInputPayload } from '@/types/pricing';
import { Supplier } from '@/types/suppliers';

interface PendingFlower extends FlowerInputPayload {
  id: string;
}

const today = new Date().toISOString().split('T')[0];

const baseDraft = {
  flowerTypeOption: '',
  customFlowerType: '',
  name: '',
  supplierId: '',
  boxes: '',
  quantity: '',
  wholesaleCost: '',
  date: today
};

interface FlowerFormProps {
  selectedSupplier?: Supplier;
}

export default function FlowerForm({ selectedSupplier }: FlowerFormProps) {
  const { suppliers, items, addFlowers } = usePricing();
  const initialDraft = useMemo(
    () => ({
      ...baseDraft,
      supplierId: selectedSupplier?.id ?? ''
    }),
    [selectedSupplier?.id]
  );
  const [draft, setDraft] = useState(initialDraft);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [pending, setPending] = useState<PendingFlower[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [addingNewType, setAddingNewType] = useState(false);

  const flowerTypes = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.flowerType) {
        set.add(item.flowerType);
      }
    });
    return Array.from(set).sort();
  }, [items]);

  const supplierOptions = useMemo(
    () =>
      suppliers.map((supplier) => ({
        id: supplier.id,
        label: supplier.name && supplier.location ? `${supplier.name} — ${supplier.location}` : supplier.name || supplier.location || 'Unnamed supplier'
      })),
    [suppliers]
  );

  useEffect(() => {
    setDraft((prev) => ({
      ...prev,
      supplierId: selectedSupplier?.id ?? ''
    }));
  }, [selectedSupplier?.id]);

  if (!suppliers.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        Add at least one supplier before capturing flower details.
      </div>
    );
  }

  const handleDraftSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string | undefined> = {};

    const normalizedType = addingNewType ? draft.customFlowerType.trim() : draft.flowerTypeOption.trim();
    if (!normalizedType) {
      nextErrors.flowerType = 'Flower type is required';
    }
    const trimmedName = draft.name.trim();
    if (!trimmedName) {
      nextErrors.name = 'Flower name is required';
    }
    if (!draft.supplierId) {
      nextErrors.supplierId = 'Supplier is required';
    }
    const trimmedBoxes = draft.boxes.trim();
    if (!trimmedBoxes) {
      nextErrors.boxes = 'Boxes are required';
    } else if (!Number.isFinite(Number(trimmedBoxes)) || Number(trimmedBoxes) <= 0 || !Number.isInteger(Number(trimmedBoxes))) {
      nextErrors.boxes = 'Boxes must be a positive whole number';
    }
    const trimmedQuantity = draft.quantity.trim();
    if (!trimmedQuantity) {
      nextErrors.quantity = 'Units are required';
    } else if (!Number.isFinite(Number(trimmedQuantity)) || Number(trimmedQuantity) <= 0) {
      nextErrors.quantity = 'Units must be a positive number';
    }
    const trimmedCost = draft.wholesaleCost.trim();
    if (!trimmedCost) {
      nextErrors.wholesaleCost = 'Cost is required';
    } else if (!Number.isFinite(Number(trimmedCost)) || Number(trimmedCost) < 0) {
      nextErrors.wholesaleCost = 'Cost must be a non-negative number';
    }
    if (!draft.date.trim()) {
      nextErrors.date = 'Date is required';
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const pendingFlower: PendingFlower = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      flowerType: normalizedType,
      name: trimmedName,
      supplierId: draft.supplierId,
      boxes: Number(trimmedBoxes),
      quantity: Number(trimmedQuantity),
      wholesaleCost: Number(trimmedCost),
      date: draft.date
    };
    setPending((prev) => [...prev, pendingFlower]);
    setDraft((prev) => ({
      ...initialDraft,
      flowerTypeOption: addingNewType ? '' : prev.flowerTypeOption,
      date: prev.date
    }));
    setAddingNewType(false);
    setErrors({});
  };

  const handleRemovePending = (id: string) => {
    setPending((prev) => prev.filter((flower) => flower.id !== id));
  };

  const handleSubmitAll = async () => {
    if (!pending.length) {
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      const payload = pending.map(({ id, ...flower }) => flower);
      await addFlowers(payload);
      setPending([]);
    } catch (error) {
      console.error('Failed to save flowers', error);
      setFormError(error instanceof Error ? error.message : 'Unable to save flowers right now');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleDraftSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Flower type</span>
            <select
              value={addingNewType ? '__new__' : draft.flowerTypeOption}
              onChange={(event) => {
                const value = event.target.value;
                if (value === '__new__') {
                  setAddingNewType(true);
                  setDraft((prev) => ({ ...prev, flowerTypeOption: '' }));
                } else {
                  setAddingNewType(false);
                  setDraft((prev) => ({ ...prev, flowerTypeOption: value }));
                }
              }}
              className={`rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 ${
                errors.flowerType ? 'border-red-400 focus:ring-red-200' : ''
              }`}
            >
              <option value="">Select a type</option>
              {flowerTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
              <option value="__new__">+ Add new type</option>
            </select>
            {errors.flowerType && <span className="text-xs text-red-500">{errors.flowerType}</span>}
          </label>
          {addingNewType && (
            <InputField
              label="New flower type"
              name="customFlowerType"
              placeholder="Garden rose"
              value={draft.customFlowerType}
              onChange={(event) => setDraft((prev) => ({ ...prev, customFlowerType: event.target.value }))}
              error={errors.flowerType}
            />
        )}
        <InputField
          label="Flower name"
          name="flowerName"
          placeholder="Juliet"
          value={draft.name}
          onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
          error={errors.name}
        />
          {selectedSupplier ? null : (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Supplier</span>
              <select
                value={draft.supplierId}
                onChange={(event) => setDraft((prev) => ({ ...prev, supplierId: event.target.value }))}
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
          )}
          <InputField
            label="Boxes"
            name="boxes"
            type="number"
            min={1}
            step={1}
            placeholder="5"
            value={draft.boxes}
            onChange={(event) => setDraft((prev) => ({ ...prev, boxes: event.target.value }))}
            error={errors.boxes}
          />
          <InputField
            label="Units"
            name="quantity"
            type="number"
            min={1}
            step={1}
            placeholder="120"
            value={draft.quantity}
            onChange={(event) => setDraft((prev) => ({ ...prev, quantity: event.target.value }))}
            error={errors.quantity}
          />
          <InputField
            label="Cost (USD)"
            name="wholesaleCost"
            type="number"
            min={0}
            step="0.01"
            placeholder="120"
            value={draft.wholesaleCost}
            onChange={(event) => setDraft((prev) => ({ ...prev, wholesaleCost: event.target.value }))}
            error={errors.wholesaleCost}
          />
          <InputField
            label="Date"
            name="date"
            type="date"
            value={draft.date}
            onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))}
            error={errors.date}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Add to list
          </button>
        </div>
      </form>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Pending flowers</h3>
            <p className="text-sm text-slate-500">Review entries before saving them to Baserow (table 765394).</p>
          </div>
          <button
            type="button"
            disabled={!pending.length || isSubmitting}
            onClick={handleSubmitAll}
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? 'Saving...' : `Save ${pending.length || ''} flowers`}
          </button>
        </div>
        {formError && <p className="text-sm text-red-500">{formError}</p>}
        {pending.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            Nothing queued yet. Use the form above to add flowers before saving.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Flower</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3 text-right">Boxes</th>
                  <th className="px-4 py-3 text-right">Units</th>
                  <th className="px-4 py-3 text-right">Cost</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                {pending.map((flower) => {
                  const supplierLabel = supplierOptions.find((s) => s.id === flower.supplierId)?.label ?? 'Unassigned';
                  return (
                    <tr key={flower.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{flower.flowerType}</td>
                  <td className="px-4 py-3">{flower.name}</td>
                  <td className="px-4 py-3">{supplierLabel}</td>
                  <td className="px-4 py-3 text-right">{flower.boxes ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{flower.quantity}</td>
                  <td className="px-4 py-3 text-right">${flower.wholesaleCost.toFixed(2)}</td>
                      <td className="px-4 py-3">{flower.date}</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => handleRemovePending(flower.id)} className="text-sm font-medium text-slate-500 hover:text-red-500">
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
