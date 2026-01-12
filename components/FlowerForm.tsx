'use client';

import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useState } from 'react';
import InputField from './InputField';
import { usePricing } from '@/contexts/PricingContext';
import { FlowerInputPayload } from '@/types/pricing';
import { Supplier } from '@/types/suppliers';
import { formatDateInput, getStartOfCurrentWeek } from '@/lib/date';
import { StandingOrderPayload } from '@/types/standingOrders';

interface PendingFlower extends FlowerInputPayload {
  id: string;
}

const defaultDate = formatDateInput(getStartOfCurrentWeek());

const baseDraft = {
  flowerTypeOption: '',
  customFlowerType: '',
  name: '',
  supplierId: '',
  boxes: '',
  quantity: '',
  wholesaleCost: '',
  date: defaultDate
};

interface FlowerFormProps {
  selectedSupplier?: Supplier;
}

export default function FlowerForm({ selectedSupplier }: FlowerFormProps) {
  const { suppliers, items, addFlowers, standingOrders, createStandingOrder, updateStandingOrder } = usePricing();
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
  const [selectedStandingOrderId, setSelectedStandingOrderId] = useState('');
  const [loadedStandingOrderId, setLoadedStandingOrderId] = useState<string | null>(null);
  const [standingOrderName, setStandingOrderName] = useState('');
  const [isNamingStandingOrder, setIsNamingStandingOrder] = useState(false);
  const [standingOrderMessage, setStandingOrderMessage] = useState<string | null>(null);
  const [standingOrderError, setStandingOrderError] = useState<string | null>(null);
  const [isSavingStandingOrder, setIsSavingStandingOrder] = useState(false);
  const [editingFlower, setEditingFlower] = useState<PendingFlower | null>(null);
  const [editDraft, setEditDraft] = useState(initialDraft);
  const [editErrors, setEditErrors] = useState<Record<string, string | undefined>>({});
  const [editAddingNewType, setEditAddingNewType] = useState(false);

  const flowerTypes = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.flowerType) {
        set.add(item.flowerType);
      }
    });
    return Array.from(set).sort();
  }, [items]);

  const supplierStandingOrders = useMemo(
    () => standingOrders.filter((order) => order.supplierId === selectedSupplier?.id),
    [standingOrders, selectedSupplier?.id]
  );

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

  useEffect(() => {
    if (selectedStandingOrderId && !supplierStandingOrders.find((order) => order.id === selectedStandingOrderId)) {
      setSelectedStandingOrderId('');
    }
    if (loadedStandingOrderId && !supplierStandingOrders.find((order) => order.id === loadedStandingOrderId)) {
      setLoadedStandingOrderId(null);
    }
  }, [loadedStandingOrderId, selectedStandingOrderId, supplierStandingOrders]);

  useEffect(() => {
    if (!editingFlower) {
      setEditDraft(initialDraft);
      setEditAddingNewType(false);
      setEditErrors({});
    }
  }, [editingFlower, initialDraft]);

  if (!suppliers.length) {
    return (
      <div className="rounded-card border border-dashed border-stone bg-white p-6 text-sm text-sage shadow-card">
        Add at least one supplier before capturing flower details.
      </div>
    );
  }

  function validateDraftState(
    currentDraft: typeof draft,
    isAddingNew: boolean,
    setErrorState: Dispatch<SetStateAction<Record<string, string | undefined>>>
  ): FlowerInputPayload | null {
    const nextErrors: Record<string, string | undefined> = {};

    const normalizedType = isAddingNew ? currentDraft.customFlowerType.trim() : currentDraft.flowerTypeOption.trim();
    if (!normalizedType) {
      nextErrors.flowerType = 'Flower type is required';
    }
    const trimmedName = currentDraft.name.trim();
    if (!trimmedName) {
      nextErrors.name = 'Flower name is required';
    }
    if (!currentDraft.supplierId) {
      nextErrors.supplierId = 'Supplier is required';
    }
    const trimmedBoxes = currentDraft.boxes.trim();
    if (!trimmedBoxes) {
      nextErrors.boxes = 'Boxes are required';
    } else if (!Number.isFinite(Number(trimmedBoxes)) || Number(trimmedBoxes) <= 0 || !Number.isInteger(Number(trimmedBoxes))) {
      nextErrors.boxes = 'Boxes must be a positive whole number';
    }
    const trimmedQuantity = currentDraft.quantity.trim();
    if (!trimmedQuantity) {
      nextErrors.quantity = 'Units are required';
    } else if (!Number.isFinite(Number(trimmedQuantity)) || Number(trimmedQuantity) <= 0) {
      nextErrors.quantity = 'Units must be a positive number';
    }
    const trimmedCost = currentDraft.wholesaleCost.trim();
    if (!trimmedCost) {
      nextErrors.wholesaleCost = 'Cost is required';
    } else if (!Number.isFinite(Number(trimmedCost)) || Number(trimmedCost) < 0) {
      nextErrors.wholesaleCost = 'Cost must be a non-negative number';
    }
    if (!currentDraft.date.trim()) {
      nextErrors.date = 'Date is required';
    }

    setErrorState(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return null;
    }

    const normalizedTypeValue = normalizedType;
    const trimmedNameValue = trimmedName;
    return {
      flowerType: normalizedTypeValue,
      name: trimmedNameValue,
      supplierId: currentDraft.supplierId,
      boxes: Number(trimmedBoxes),
      quantity: Number(trimmedQuantity),
      wholesaleCost: Number(trimmedCost),
      date: currentDraft.date
    };
  }

  const handleDraftSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validated = validateDraftState(draft, addingNewType, setErrors);
    if (!validated) {
      return;
    }
    const pendingFlower: PendingFlower = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      ...validated
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
    setStandingOrderMessage(null);
    setStandingOrderError(null);
    if (editingFlower?.id === id) {
      setEditingFlower(null);
    }
  };

  const handleEditPending = (id: string) => {
    const entry = pending.find((flower) => flower.id === id);
    if (!entry) {
      return;
    }
    setEditingFlower(entry);
    setStandingOrderMessage(null);
    setStandingOrderError(null);
    setEditDraft({
      flowerTypeOption: entry.flowerType,
      customFlowerType: '',
      name: entry.name,
      supplierId: entry.supplierId ?? selectedSupplier?.id ?? '',
      boxes: String(entry.boxes ?? ''),
      quantity: String(entry.quantity ?? ''),
      wholesaleCost: String(entry.wholesaleCost ?? ''),
      date: entry.date ?? defaultDate
    });
    setEditErrors({});
    setEditAddingNewType(false);
  };

  const handleSaveEdit = () => {
    if (!editingFlower) {
      return;
    }
    const validated = validateDraftState(editDraft, editAddingNewType, setEditErrors);
    if (!validated) {
      return;
    }
    setPending((prev) => prev.map((flower) => (flower.id === editingFlower.id ? { ...flower, ...validated } : flower)));
    setEditingFlower(null);
  };

  const handleCancelEdit = () => {
    setEditingFlower(null);
    setEditErrors({});
  };

  const handleLoadStandingOrder = () => {
    if (!selectedStandingOrderId) {
      return;
    }
    const order = supplierStandingOrders.find((standingOrder) => standingOrder.id === selectedStandingOrderId);
    if (!order) {
      return;
    }
    const defaultDateForLoad = draft.date || defaultDate;
    const nextPending = order.lines.map((line) => ({
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      flowerType: line.flowerType,
      name: line.name,
      supplierId: order.supplierId,
      boxes: line.boxes,
      quantity: line.quantity,
      wholesaleCost: line.wholesaleCost,
      date: defaultDateForLoad
    }));
    setPending(nextPending);
    setLoadedStandingOrderId(order.id);
    setStandingOrderMessage(`Loaded standing order "${order.name}"`);
    setStandingOrderName(order.name);
    setStandingOrderError(null);
  };

  const handleClearStandingOrder = () => {
    setLoadedStandingOrderId(null);
    setSelectedStandingOrderId('');
    setStandingOrderName('');
    setStandingOrderMessage(null);
    setStandingOrderError(null);
    setIsNamingStandingOrder(false);
  };

  const buildStandingOrderPayload = (name: string): StandingOrderPayload => {
    if (!selectedSupplier?.id) {
      throw new Error('Supplier is required for standing orders.');
    }
    return {
      name: name.trim(),
      supplierId: selectedSupplier.id,
      lines: pending.map((flower) => ({
        flowerType: flower.flowerType,
        name: flower.name,
        boxes: flower.boxes ?? 0,
        quantity: flower.quantity,
        wholesaleCost: flower.wholesaleCost
      }))
    };
  };

  const ensureStandingOrderReady = () => {
    if (!pending.length) {
      setStandingOrderError('Add at least one flower before saving it as a standing order.');
      return false;
    }
    if (!selectedSupplier?.id) {
      setStandingOrderError('Select a supplier before saving a standing order.');
      return false;
    }
    return true;
  };

  const handleSaveStandingOrderTemplate = async () => {
    if (!ensureStandingOrderReady()) {
      return;
    }
    const trimmedName = standingOrderName.trim();
    if (!trimmedName) {
      setStandingOrderError('Standing order name is required.');
      return;
    }
    const currentTemplate = loadedStandingOrderId ? supplierStandingOrders.find((order) => order.id === loadedStandingOrderId) : null;

    setIsSavingStandingOrder(true);
    setStandingOrderError(null);
    setStandingOrderMessage(null);
    try {
      const payload = buildStandingOrderPayload(trimmedName);
      const shouldUpdateExisting = currentTemplate && trimmedName === currentTemplate.name.trim();
      const saved = shouldUpdateExisting
        ? await updateStandingOrder(currentTemplate.id, payload)
        : await createStandingOrder(payload);
      setLoadedStandingOrderId(saved.id);
      setSelectedStandingOrderId(saved.id);
      setStandingOrderName(saved.name);
      setStandingOrderMessage(`Standing order "${saved.name}" saved.`);
      setIsNamingStandingOrder(false);
    } catch (error) {
      console.error('Failed to save standing order', error);
      setStandingOrderError(error instanceof Error ? error.message : 'Unable to save standing order right now');
    } finally {
      setIsSavingStandingOrder(false);
    }
  };

  const handleStartStandingOrderSave = () => {
    setStandingOrderError(null);
    setStandingOrderMessage(null);
    if (loadedStandingOrderId) {
      const currentTemplate = supplierStandingOrders.find((order) => order.id === loadedStandingOrderId);
      setStandingOrderName(currentTemplate?.name ?? standingOrderName ?? '');
    } else {
      setStandingOrderName('');
    }
    setIsNamingStandingOrder(true);
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
    <>
      <div className="space-y-6">
        <form onSubmit={handleDraftSubmit} className="space-y-6 rounded-card border border-stone bg-white p-6 shadow-card">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-moss">Flower type</span>
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
              className={`rounded-md border border-stone bg-white px-3 py-2 text-base text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60 ${
                errors.flowerType ? 'border-[#C7563D] focus:ring-[#F2B8A4]' : ''
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
            {errors.flowerType && <span className="text-xs font-medium text-[#B42318]">{errors.flowerType}</span>}
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
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-moss">Supplier</span>
              <select
                value={draft.supplierId}
                onChange={(event) => setDraft((prev) => ({ ...prev, supplierId: event.target.value }))}
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
            className="inline-flex items-center rounded-md bg-harvest px-4 py-2 text-sm font-semibold text-warm-white transition hover:bg-harvest-hover active:bg-harvest-active"
          >
            Add to list
          </button>
        </div>
      </form>

      <section className="rounded-card border border-stone bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="flex flex-1 flex-col gap-2 text-sm text-moss">
            Standing order template
            <select
              value={selectedStandingOrderId}
              onChange={(event) => {
                setSelectedStandingOrderId(event.target.value);
                setStandingOrderMessage(null);
                setStandingOrderError(null);
              }}
              disabled={!supplierStandingOrders.length}
              className="rounded-md border border-stone bg-white px-3 py-2 text-base text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60 disabled:cursor-not-allowed disabled:bg-olive-tint/30"
            >
              <option value="">{supplierStandingOrders.length ? 'Select a standing order' : 'No standing orders saved yet'}</option>
              {supplierStandingOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleLoadStandingOrder}
              disabled={!selectedStandingOrderId}
              className="rounded-md border border-evergreen px-4 py-2 text-sm font-semibold text-evergreen transition hover:bg-sage/20 disabled:cursor-not-allowed disabled:border-stone disabled:text-sage"
            >
              Load template
            </button>
            <button
              type="button"
              onClick={handleClearStandingOrder}
              disabled={!selectedStandingOrderId && !loadedStandingOrderId}
              className="rounded-md border border-stone px-4 py-2 text-sm font-medium text-sage transition hover:bg-warm-white disabled:cursor-not-allowed disabled:text-sage/60"
            >
              Clear
            </button>
          </div>
        </div>
        {standingOrderMessage && !standingOrderError && <p className="mt-3 text-sm text-moss">{standingOrderMessage}</p>}
        {standingOrderError && <p className="mt-3 text-sm font-medium text-[#B42318]">{standingOrderError}</p>}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-evergreen">Pending flowers</h3>
            <p className="text-sm text-sage">Review entries before saving them to Baserow (table 765394).</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!pending.length || isSubmitting}
              onClick={handleSubmitAll}
              className="inline-flex items-center rounded-md bg-harvest px-4 py-2 text-sm font-semibold text-warm-white transition hover:bg-harvest-hover active:bg-harvest-active disabled:cursor-not-allowed disabled:bg-harvest/60"
            >
              {isSubmitting ? 'Saving...' : `Save ${pending.length || ''} flowers`}
            </button>
            <button
              type="button"
              disabled={!pending.length || !selectedSupplier?.id}
              onClick={handleStartStandingOrderSave}
              className="inline-flex items-center rounded-md border border-evergreen px-4 py-2 text-sm font-semibold text-evergreen transition hover:bg-sage/20 disabled:cursor-not-allowed disabled:border-stone disabled:text-sage"
            >
              Save as standing order
            </button>
          </div>
        </div>
        {isNamingStandingOrder && (
          <div className="rounded-card border border-stone bg-warm-white p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end">
              <label className="flex flex-1 flex-col gap-2 text-sm text-moss">
                Standing order name
                <input
                  type="text"
                  value={standingOrderName}
                  onChange={(event) => setStandingOrderName(event.target.value)}
                  placeholder="Weekly wedding order"
                  className="rounded-md border border-stone bg-white px-3 py-2 text-base text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveStandingOrderTemplate}
                  disabled={isSavingStandingOrder}
                  className="inline-flex items-center rounded-md bg-harvest px-4 py-2 text-sm font-semibold text-warm-white transition hover:bg-harvest-hover active:bg-harvest-active disabled:cursor-not-allowed disabled:bg-harvest/60"
                >
                  {isSavingStandingOrder ? 'Saving…' : 'Save template'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNamingStandingOrder(false);
                    setStandingOrderError(null);
                  }}
                  className="inline-flex items-center rounded-md border border-stone px-4 py-2 text-sm font-semibold text-sage transition hover:bg-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {formError && <p className="text-sm font-medium text-[#B42318]">{formError}</p>}
        {pending.length === 0 ? (
          <p className="rounded-card border border-dashed border-stone bg-white p-6 text-sm text-sage">
            Nothing queued yet. Use the form above to add flowers before saving.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-stone bg-white shadow-card">
            <table className="min-w-full divide-y divide-stone text-sm text-sage">
              <thead className="bg-warm-white text-left text-xs font-semibold uppercase tracking-wide text-moss">
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
              <tbody className="divide-y divide-stone bg-white text-sage">
                {pending.map((flower) => {
                  const supplierLabel = supplierOptions.find((s) => s.id === flower.supplierId)?.label ?? 'Unassigned';
                  return (
                    <tr key={flower.id}>
                      <td className="px-4 py-3 font-medium text-evergreen">{flower.flowerType}</td>
                      <td className="px-4 py-3">{flower.name}</td>
                      <td className="px-4 py-3">{supplierLabel}</td>
                      <td className="px-4 py-3 text-right">{flower.boxes ?? '—'}</td>
                      <td className="px-4 py-3 text-right">{flower.quantity}</td>
                      <td className="px-4 py-3 text-right">${flower.wholesaleCost.toFixed(2)}</td>
                      <td className="px-4 py-3">{flower.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleEditPending(flower.id)}
                            className="text-sm font-medium text-evergreen transition hover:text-moss"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePending(flower.id)}
                            className="text-sm font-medium text-sage transition hover:text-[#B42318]"
                          >
                            Remove
                          </button>
                        </div>
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
      {editingFlower && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-charcoal/70 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-card border border-stone bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-sage">Edit pending flower</p>
                <h3 className="text-xl font-semibold text-evergreen">{editingFlower.name}</h3>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-md border border-stone px-3 py-1 text-sm text-sage transition hover:bg-warm-white"
              >
                Close
              </button>
            </div>
            <form
              className="mt-6 space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                handleSaveEdit();
              }}
            >
              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-moss">Flower type</span>
                  <select
                    value={editAddingNewType ? '__new__' : editDraft.flowerTypeOption}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === '__new__') {
                        setEditAddingNewType(true);
                        setEditDraft((prev) => ({ ...prev, flowerTypeOption: '' }));
                      } else {
                        setEditAddingNewType(false);
                        setEditDraft((prev) => ({ ...prev, flowerTypeOption: value }));
                      }
                    }}
                    className={`rounded-md border border-stone bg-white px-3 py-2 text-base text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60 ${
                      editErrors.flowerType ? 'border-[#C7563D] focus:ring-[#F2B8A4]' : ''
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
                  {editErrors.flowerType && <span className="text-xs font-medium text-[#B42318]">{editErrors.flowerType}</span>}
                </label>
                {editAddingNewType && (
                  <InputField
                    label="New flower type"
                    name="editCustomFlowerType"
                    placeholder="Garden rose"
                    value={editDraft.customFlowerType}
                    onChange={(event) => setEditDraft((prev) => ({ ...prev, customFlowerType: event.target.value }))}
                    error={editErrors.flowerType}
                  />
                )}
                <InputField
                  label="Flower name"
                  name="editFlowerName"
                  placeholder="Juliet"
                  value={editDraft.name}
                  onChange={(event) => setEditDraft((prev) => ({ ...prev, name: event.target.value }))}
                  error={editErrors.name}
                />
                {selectedSupplier ? null : (
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium text-moss">Supplier</span>
                    <select
                      value={editDraft.supplierId}
                      onChange={(event) => setEditDraft((prev) => ({ ...prev, supplierId: event.target.value }))}
                      className={`rounded-md border border-stone bg-white px-3 py-2 text-base text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60 ${
                        editErrors.supplierId ? 'border-[#C7563D] focus:ring-[#F2B8A4]' : ''
                      }`}
                    >
                      <option value="">Select a supplier</option>
                      {supplierOptions.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.label}
                        </option>
                      ))}
                    </select>
                    {editErrors.supplierId && <span className="text-xs font-medium text-[#B42318]">{editErrors.supplierId}</span>}
                  </label>
                )}
                <InputField
                  label="Boxes"
                  name="editBoxes"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="5"
                  value={editDraft.boxes}
                  onChange={(event) => setEditDraft((prev) => ({ ...prev, boxes: event.target.value }))}
                  error={editErrors.boxes}
                />
                <InputField
                  label="Units"
                  name="editQuantity"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="120"
                  value={editDraft.quantity}
                  onChange={(event) => setEditDraft((prev) => ({ ...prev, quantity: event.target.value }))}
                  error={editErrors.quantity}
                />
                <InputField
                  label="Cost (USD)"
                  name="editWholesaleCost"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="120"
                  value={editDraft.wholesaleCost}
                  onChange={(event) => setEditDraft((prev) => ({ ...prev, wholesaleCost: event.target.value }))}
                  error={editErrors.wholesaleCost}
                />
                <InputField
                  label="Date"
                  name="editDate"
                  type="date"
                  value={editDraft.date}
                  onChange={(event) => setEditDraft((prev) => ({ ...prev, date: event.target.value }))}
                  error={editErrors.date}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-md border border-stone px-4 py-2 text-sm font-semibold text-sage transition hover:bg-warm-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-harvest px-4 py-2 text-sm font-semibold text-warm-white transition hover:bg-harvest-hover active:bg-harvest-active"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
