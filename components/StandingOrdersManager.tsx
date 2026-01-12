'use client';

import { useMemo, useState } from 'react';
import { usePricing } from '@/contexts/PricingContext';
import { StandingOrderPayload } from '@/types/standingOrders';

interface EditableLineDraft {
  key: string;
  flowerType: string;
  name: string;
  quantity: string;
  boxes: string;
  wholesaleCost: string;
}

interface EditableOrderDraft {
  id: string;
  name: string;
  supplierId: string;
  lines: EditableLineDraft[];
}

const createEmptyLine = (): EditableLineDraft => ({
  key: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
  flowerType: '',
  name: '',
  quantity: '0',
  boxes: '0',
  wholesaleCost: '0'
});

export default function StandingOrdersManager() {
  const { standingOrders, suppliers, updateStandingOrder, deleteStandingOrder, refreshStandingOrders } = usePricing();
  const [supplierFilter, setSupplierFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOrder, setEditingOrder] = useState<EditableOrderDraft | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    return standingOrders
      .filter((order) => {
        if (supplierFilter && order.supplierId !== supplierFilter) {
          return false;
        }
        if (normalizedTerm && !order.name.toLowerCase().includes(normalizedTerm)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const supplierCompare = (a.supplierName || '').localeCompare(b.supplierName || '');
        if (supplierCompare !== 0) {
          return supplierCompare;
        }
        return a.name.localeCompare(b.name);
      });
  }, [standingOrders, supplierFilter, searchTerm]);

  const startEditing = (orderId: string) => {
    const order = standingOrders.find((entry) => entry.id === orderId);
    if (!order) {
      return;
    }
    setStatusMessage(null);
    setEditError(null);
    const lines = order.lines.length
      ? order.lines.map((line) => ({
          key: line.id || (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
          flowerType: line.flowerType,
          name: line.name,
          quantity: line.quantity?.toString() ?? '0',
          boxes: line.boxes?.toString() ?? '0',
          wholesaleCost: line.wholesaleCost?.toString() ?? '0'
        }))
      : [createEmptyLine()];
    setEditingOrder({
      id: order.id,
      name: order.name,
      supplierId: order.supplierId,
      lines
    });
  };

  const cancelEditing = () => {
    setEditingOrder(null);
    setEditError(null);
  };

  const handleEditFieldChange = (key: string, field: keyof EditableLineDraft, value: string) => {
    setEditingOrder((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        lines: prev.lines.map((line) => (line.key === key ? { ...line, [field]: value } : line))
      };
    });
  };

  const handleAddLine = () => {
    setEditingOrder((prev) => {
      if (!prev) {
        return prev;
      }
      return { ...prev, lines: [...prev.lines, createEmptyLine()] };
    });
  };

  const handleRemoveLine = (key: string) => {
    setEditingOrder((prev) => {
      if (!prev) {
        return prev;
      }
      const filtered = prev.lines.filter((line) => line.key !== key);
      return { ...prev, lines: filtered.length ? filtered : [createEmptyLine()] };
    });
  };

  const parseNumber = (value: string) => {
    if (!value.trim()) {
      return 0;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const handleSave = async () => {
    if (!editingOrder) {
      return;
    }
    const trimmedName = editingOrder.name.trim();
    if (!trimmedName) {
      setEditError('Standing order name is required.');
      return;
    }
    if (!editingOrder.supplierId) {
      setEditError('Select a supplier for this standing order.');
      return;
    }
    const normalizedLines = editingOrder.lines
      .map((line) => ({
        flowerType: line.flowerType.trim(),
        name: line.name.trim(),
        quantity: parseNumber(line.quantity),
        boxes: parseNumber(line.boxes),
        wholesaleCost: parseNumber(line.wholesaleCost)
      }))
      .filter((line) => line.name.length > 0);
    if (!normalizedLines.length) {
      setEditError('Add at least one line item with a flower name.');
      return;
    }
    const payload: StandingOrderPayload = {
      name: trimmedName,
      supplierId: editingOrder.supplierId,
      lines: normalizedLines
    };
    setIsSaving(true);
    setEditError(null);
    setStatusMessage(null);
    try {
      await updateStandingOrder(editingOrder.id, payload);
      setStatusMessage(`Standing order "${trimmedName}" updated.`);
      setEditingOrder(null);
    } catch (error) {
      console.error('Failed to update standing order', error);
      setEditError(error instanceof Error ? error.message : 'Unable to update standing order right now');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    const order = standingOrders.find((entry) => entry.id === orderId);
    if (!order) {
      return;
    }
    const confirmed = window.confirm(`Delete standing order "${order.name}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }
    setDeletingOrderId(orderId);
    setStatusMessage(null);
    setEditError(null);
    try {
      await deleteStandingOrder(orderId);
      if (editingOrder?.id === orderId) {
        setEditingOrder(null);
      }
      setStatusMessage(`Standing order "${order.name}" deleted.`);
    } catch (error) {
      console.error('Failed to delete standing order', error);
      setEditError(error instanceof Error ? error.message : 'Unable to delete standing order right now');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setStatusMessage(null);
    setEditError(null);
    try {
      await refreshStandingOrders();
      setStatusMessage('Standing orders refreshed.');
    } catch (error) {
      console.error('Failed to refresh standing orders', error);
      setEditError(error instanceof Error ? error.message : 'Unable to refresh standing orders');
    } finally {
      setIsRefreshing(false);
    }
  };

  const supplierOptions = useMemo(() => suppliers.filter((supplier) => supplier.id), [suppliers]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold text-evergreen sm:text-5xl">Standing orders</h1>
        <p className="text-base text-sage">
          View every template, filter by supplier, and edit or delete line items without leaving the pricing workflow.
        </p>
      </div>

      <section className="space-y-4 rounded-card border border-stone bg-white p-6 shadow-card">
        <div className="grid gap-4 text-sm text-moss md:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="font-semibold uppercase tracking-wide text-[11px] text-sage">Supplier</span>
            <select
              value={supplierFilter}
              onChange={(event) => setSupplierFilter(event.target.value)}
              className="rounded-md border border-stone bg-white px-3 py-2 text-sm text-charcoal focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
            >
              <option value="">All suppliers</option>
              {supplierOptions.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 md:col-span-2">
            <span className="font-semibold uppercase tracking-wide text-[11px] text-sage">Standing order name</span>
            <input
              type="search"
              placeholder="Search by name"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="rounded-md border border-stone bg-white px-3 py-2 text-sm text-charcoal focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-sage">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center rounded-md border border-evergreen px-4 py-2 text-sm font-semibold text-evergreen transition hover:bg-sage/20 disabled:cursor-not-allowed disabled:border-stone disabled:text-sage"
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh list'}
          </button>
          <p className="text-sm text-sage">
            Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'standing order' : 'standing orders'}
          </p>
        </div>
        {statusMessage && <p className="text-sm font-medium text-moss">{statusMessage}</p>}
        {editError && <p className="text-sm font-medium text-[#B42318]">{editError}</p>}
      </section>

      <section className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-card border border-dusty bg-white p-6 text-sm text-sage shadow-card">
            No standing orders match your filters.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isEditing = editingOrder?.id === order.id;
            const currentEditing = isEditing && editingOrder ? editingOrder : null;
            return (
              <article key={order.id} className="space-y-4 rounded-card border border-stone bg-white p-6 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">Standing order</p>
                    <h2 className="text-2xl font-semibold text-evergreen">{currentEditing ? currentEditing.name : order.name}</h2>
                    <p className="text-sm text-sage">
                      Supplier: {currentEditing
                        ? suppliers.find((s) => s.id === currentEditing.supplierId)?.name || 'Unknown'
                        : order.supplierName || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={isSaving}
                          className="rounded-md bg-evergreen px-4 py-2 font-semibold text-warm-white transition hover:bg-evergreen/90 disabled:cursor-not-allowed disabled:bg-sage"
                        >
                          {isSaving ? 'Saving…' : 'Save changes'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="rounded-md border border-stone px-4 py-2 font-semibold text-evergreen transition hover:bg-sage/20"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditing(order.id)}
                          className="rounded-md border border-evergreen px-4 py-2 font-semibold text-evergreen transition hover:bg-sage/20"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(order.id)}
                          disabled={deletingOrderId === order.id}
                          className="rounded-md border border-soft-clay px-4 py-2 font-semibold text-soft-clay transition hover:bg-soft-clay/10 disabled:cursor-not-allowed disabled:border-stone disabled:text-sage"
                        >
                          {deletingOrderId === order.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {isEditing && currentEditing ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="flex flex-col gap-2 text-sm text-moss">
                        <span className="font-medium text-moss">Standing order name</span>
                        <input
                          type="text"
                          value={currentEditing.name}
                          onChange={(event) => setEditingOrder((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                          className="rounded-md border border-stone bg-white px-3 py-2 text-base text-charcoal focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-moss">
                        <span className="font-medium text-moss">Supplier</span>
                        <select
                          value={currentEditing.supplierId}
                          onChange={(event) =>
                            setEditingOrder((prev) => (prev ? { ...prev, supplierId: event.target.value } : prev))
                          }
                          className="rounded-md border border-stone bg-white px-3 py-2 text-base text-charcoal focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
                        >
                          <option value="">Select a supplier</option>
                          {supplierOptions.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-sage">
                            <th className="px-3 py-2">Flower type</th>
                            <th className="px-3 py-2">Flower name</th>
                            <th className="px-3 py-2">Units</th>
                            <th className="px-3 py-2">Boxes</th>
                            <th className="px-3 py-2">Wholesale cost</th>
                            <th className="px-3 py-2" aria-hidden="true" />
                          </tr>
                        </thead>
                        <tbody>
                          {currentEditing.lines.map((line) => (
                            <tr key={line.key} className="border-t border-stone/50">
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={line.flowerType}
                                  onChange={(event) => handleEditFieldChange(line.key, 'flowerType', event.target.value)}
                                  className="w-full rounded-md border border-stone bg-white px-3 py-2 text-sm text-charcoal focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={line.name}
                                  onChange={(event) => handleEditFieldChange(line.key, 'name', event.target.value)}
                                  className="w-full rounded-md border border-stone bg-white px-3 py-2 text-sm text-charcoal focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={line.quantity}
                                  onChange={(event) => handleEditFieldChange(line.key, 'quantity', event.target.value)}
                                  className="w-24 rounded-md border border-stone bg-white px-3 py-2 text-right text-sm text-charcoal focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={line.boxes}
                                  onChange={(event) => handleEditFieldChange(line.key, 'boxes', event.target.value)}
                                  className="w-24 rounded-md border border-stone bg-white px-3 py-2 text-right text-sm text-charcoal focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={line.wholesaleCost}
                                  onChange={(event) => handleEditFieldChange(line.key, 'wholesaleCost', event.target.value)}
                                  className="w-28 rounded-md border border-stone bg-white px-3 py-2 text-right text-sm text-charcoal focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60"
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLine(line.key)}
                                  className="text-sm font-semibold text-soft-clay hover:text-soft-clay/80"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="rounded-md border border-evergreen px-4 py-2 text-sm font-semibold text-evergreen transition hover:bg-sage/20"
                    >
                      + Add line item
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-sage">
                          <th className="px-3 py-2">Flower type</th>
                          <th className="px-3 py-2">Flower name</th>
                          <th className="px-3 py-2">Units</th>
                          <th className="px-3 py-2">Boxes</th>
                          <th className="px-3 py-2">Wholesale cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.lines.map((line) => (
                          <tr key={line.id} className="border-t border-stone/50">
                            <td className="px-3 py-2 text-charcoal">{line.flowerType || '—'}</td>
                            <td className="px-3 py-2 text-charcoal">{line.name || '—'}</td>
                            <td className="px-3 py-2 text-right text-charcoal">{line.quantity ?? 0}</td>
                            <td className="px-3 py-2 text-right text-charcoal">{line.boxes ?? 0}</td>
                            <td className="px-3 py-2 text-right text-charcoal">
                              {typeof line.wholesaleCost === 'number' ? `$${line.wholesaleCost.toFixed(2)}` : '$0.00'}
                            </td>
                          </tr>
                        ))}
                        {order.lines.length === 0 && (
                          <tr>
                            <td className="px-3 py-4 text-sm text-sage" colSpan={5}>
                              No line items saved for this standing order yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
