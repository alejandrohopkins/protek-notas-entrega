"use client";

import { useActionState, useState } from "react";
import { createDeliveryNoteAction } from "@/lib/actions/deliveryNotes";
import { todayInputValue } from "@/lib/format";

interface ClientOption {
  id: number;
  name: string;
  rif: string;
}
interface ProductOption {
  id: number;
  name: string;
  unit: string;
  price: number;
  stock: number;
}
interface ReferenceSizeOption {
  productId: number;
  size: string;
  stock: number;
  price: number;
}
interface ReferenceOption {
  key: string;
  label: string;
  unit: string;
  price: number;
  sizes: ReferenceSizeOption[];
}
interface Line {
  productId: number;
  quantity: string;
  unitPrice: string;
}

export default function NuevaNotaForm({
  clients,
  products,
  references,
  initialClientId,
  initialLines,
  initialNotes,
  duplicatedFromLabel,
}: {
  clients: ClientOption[];
  products: ProductOption[];
  references: ReferenceOption[];
  initialClientId?: number;
  initialLines?: Line[];
  initialNotes?: string;
  duplicatedFromLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(createDeliveryNoteAction, {});
  const [lines, setLines] = useState<Line[]>(initialLines ?? []);
  const [selectedRefKey, setSelectedRefKey] = useState("");
  const [batchPrice, setBatchPrice] = useState("");
  const [sizeQty, setSizeQty] = useState<Record<string, string>>({});

  const selectedRef = references.find((r) => r.key === selectedRefKey);

  function productById(id: number) {
    return products.find((p) => p.id === id);
  }

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function handleSelectReference(key: string) {
    setSelectedRefKey(key);
    const ref = references.find((r) => r.key === key);
    setBatchPrice(ref ? String(ref.price) : "");
    setSizeQty({});
  }

  function handleAddReference() {
    if (!selectedRef) return;
    const price = Number(batchPrice) || 0;
    let addedAny = false;
    setLines((prev) => {
      const next = [...prev];
      for (const sz of selectedRef.sizes) {
        const qty = Number(sizeQty[sz.size]) || 0;
        if (qty <= 0) continue;
        addedAny = true;
        const existingIndex = next.findIndex((l) => l.productId === sz.productId);
        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: String((Number(next[existingIndex].quantity) || 0) + qty),
          };
        } else {
          next.push({ productId: sz.productId, quantity: String(qty), unitPrice: String(price) });
        }
      }
      return next;
    });
    if (addedAny) setSizeQty({});
  }

  const total = lines.reduce((sum, l) => {
    const qty = Number(l.quantity) || 0;
    const price = Number(l.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  return (
    <form action={formAction} className="space-y-4">
      {duplicatedFromLabel && (
        <p className="alert-success">
          Duplicando la nota {duplicatedFromLabel}. Ajusta lo que haga falta antes de emitirla — se creará
          como una nota nueva con su propio número.
        </p>
      )}
      {state.error && <p className="alert-error">{state.error}</p>}

      <div className="card grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="clientId">
            Cliente
          </label>
          <select
            id="clientId"
            name="clientId"
            className="select"
            required
            defaultValue={initialClientId ?? ""}
          >
            <option value="" disabled>
              Selecciona un cliente…
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.rif}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="date">
            Fecha
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={todayInputValue()}
            className="input"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold text-slate-900">Agregar referencia</h2>
          <label className="label" htmlFor="referenceKey">
            Producto (modelo y color)
          </label>
          <select
            id="referenceKey"
            className="select"
            value={selectedRefKey}
            onChange={(e) => handleSelectReference(e.target.value)}
          >
            <option value="">Selecciona un producto…</option>
            {references.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label} ({r.sizes.length} {r.sizes.length === 1 ? "talla" : "tallas"})
              </option>
            ))}
          </select>

          {selectedRef && (
            <div className="mt-4">
              <label className="label" htmlFor="batchPrice">
                Precio unitario ({selectedRef.unit})
              </label>
              <input
                id="batchPrice"
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={batchPrice}
                onChange={(e) => setBatchPrice(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-400">
                Se aplica a las cantidades que ingreses a la derecha. Puedes editarlo también línea por línea
                después de agregarlo.
              </p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold text-slate-900">
            {selectedRef ? `Tallas — ${selectedRef.label}` : "Tallas"}
          </h2>
          {!selectedRef ? (
            <p className="text-sm text-slate-500">
              Selecciona un producto a la izquierda para ingresar cuántos pares de cada talla vas a entregar.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {selectedRef.sizes.map((sz) => {
                  const qty = Number(sizeQty[sz.size]) || 0;
                  const overStock = qty > sz.stock;
                  return (
                    <div key={sz.productId}>
                      <label className="label text-center" htmlFor={`size-${sz.productId}`}>
                        Talla {sz.size}
                      </label>
                      <input
                        id={`size-${sz.productId}`}
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        className={`input text-center ${overStock ? "border-red-400" : ""}`}
                        value={sizeQty[sz.size] ?? ""}
                        onChange={(e) =>
                          setSizeQty((prev) => ({ ...prev, [sz.size]: e.target.value }))
                        }
                      />
                      <p className="mt-1 text-center text-[11px] text-slate-400">stock: {sz.stock}</p>
                      {overStock && (
                        <p className="text-center text-[11px] text-red-500">supera stock</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                className="btn-secondary btn-sm mt-4"
                onClick={handleAddReference}
              >
                + Agregar a la nota
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold text-slate-900">Productos en la nota</h2>
        {lines.length === 0 ? (
          <p className="text-sm text-slate-500">
            Todavía no has agregado productos. Usa el panel de arriba para elegir un producto y sus tallas.
          </p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="w-28">Cantidad</th>
                <th className="w-32">Precio unit.</th>
                <th className="w-32 text-right">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => {
                const product = productById(line.productId);
                const qty = Number(line.quantity) || 0;
                const price = Number(line.unitPrice) || 0;
                const overStock = product ? qty > product.stock : false;
                return (
                  <tr key={`${line.productId}-${index}`}>
                    <td>
                      <input type="hidden" name="productId" value={line.productId} />
                      {product?.name ?? "—"}
                    </td>
                    <td>
                      <input
                        name="quantity"
                        type="number"
                        min="0.01"
                        step="0.01"
                        className={`input ${overStock ? "border-red-400" : ""}`}
                        value={line.quantity}
                        onChange={(e) => updateLine(index, { quantity: e.target.value })}
                        required
                      />
                      {overStock && <p className="mt-1 text-xs text-red-500">Supera el stock</p>}
                    </td>
                    <td>
                      <input
                        name="unitPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        className="input"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(index, { unitPrice: e.target.value })}
                        required
                      />
                    </td>
                    <td className="text-right font-medium text-slate-800">{(qty * price).toFixed(2)}</td>
                    <td>
                      <button
                        type="button"
                        className="text-sm text-red-500 hover:underline"
                        onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="mt-4 flex justify-end border-t border-slate-200 pt-3">
          <span className="text-lg font-semibold text-slate-900">Total: {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="card">
        <label className="label" htmlFor="notes">
          Notas (opcional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="input"
          placeholder="Observaciones de la entrega…"
          defaultValue={initialNotes}
        />
      </div>

      <button type="submit" disabled={pending || lines.length === 0} className="btn-primary">
        {pending ? "Guardando…" : "Emitir nota de entrega"}
      </button>
    </form>
  );
}
