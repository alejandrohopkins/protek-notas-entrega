"use client";

import { useActionState, useState } from "react";
import { registerMovementAction } from "@/lib/actions/products";
import type { MovementType } from "@/lib/types";

const LABELS: Record<MovementType, { quantity: string; help: string }> = {
  ENTRADA: { quantity: "Cantidad que entra", help: "Suma al inventario actual." },
  SALIDA: { quantity: "Cantidad que sale", help: "Resta del inventario actual." },
  AJUSTE: {
    quantity: "Nuevo saldo (conteo físico)",
    help: "Reemplaza el inventario actual por este valor.",
  },
};

export default function MovimientoForm({ productId, unit }: { productId: number; unit: string }) {
  const [state, formAction, pending] = useActionState(registerMovementAction, {});
  const [type, setType] = useState<MovementType>("ENTRADA");

  return (
    <form action={formAction} className="card space-y-3">
      <input type="hidden" name="productId" value={productId} />
      <h2 className="font-semibold text-slate-900">Registrar movimiento de inventario</h2>
      {state.error && <p className="alert-error">{state.error}</p>}
      {state.success && <p className="alert-success">{state.success}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="type">
            Tipo de movimiento
          </label>
          <select
            id="type"
            name="type"
            className="select"
            value={type}
            onChange={(e) => setType(e.target.value as MovementType)}
          >
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="AJUSTE">Ajuste por conteo físico</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="quantity">
            {LABELS[type].quantity} ({unit})
          </label>
          <input id="quantity" name="quantity" type="number" step="0.01" min="0" className="input" required />
        </div>
      </div>
      <p className="text-xs text-slate-400">{LABELS[type].help}</p>

      <div>
        <label className="label" htmlFor="note">
          Nota (opcional)
        </label>
        <input id="note" name="note" className="input" placeholder="Motivo, proveedor, referencia…" />
      </div>

      <button type="submit" disabled={pending} className="btn-secondary">
        {pending ? "Guardando…" : "Registrar movimiento"}
      </button>
    </form>
  );
}
