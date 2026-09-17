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
interface Line {
  productId: number | "";
  quantity: string;
  unitPrice: string;
}

function emptyLine(): Line {
  return { productId: "", quantity: "1", unitPrice: "" };
}

export default function NuevaNotaForm({
  clients,
  products,
}: {
  clients: ClientOption[];
  products: ProductOption[];
}) {
  const [state, formAction, pending] = useActionState(createDeliveryNoteAction, {});
  const [lines, setLines] = useState<Line[]>([emptyLine()]);

  function productById(id: number | "") {
    return id === "" ? undefined : products.find((p) => p.id === id);
  }

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function handleProductChange(index: number, value: string) {
    const id = value ? Number(value) : "";
    const product = productById(id);
    updateLine(index, { productId: id, unitPrice: product ? String(product.price) : "" });
  }

  const total = lines.reduce((sum, l) => {
    const qty = Number(l.quantity) || 0;
    const price = Number(l.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <p className="alert-error">{state.error}</p>}

      <div className="card grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="clientId">
            Cliente
          </label>
          <select id="clientId" name="clientId" className="select" required defaultValue="">
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

      <div className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold text-slate-900">Productos</h2>
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
                <tr key={index}>
                  <td>
                    <select
                      name="productId"
                      className="select"
                      value={line.productId}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Selecciona…
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (stock: {p.stock} {p.unit})
                        </option>
                      ))}
                    </select>
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

        <button
          type="button"
          className="btn-secondary btn-sm mt-3"
          onClick={() => setLines((prev) => [...prev, emptyLine()])}
        >
          + Agregar producto
        </button>

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
        />
      </div>

      <button type="submit" disabled={pending || lines.length === 0} className="btn-primary">
        {pending ? "Guardando…" : "Emitir nota de entrega"}
      </button>
    </form>
  );
}
