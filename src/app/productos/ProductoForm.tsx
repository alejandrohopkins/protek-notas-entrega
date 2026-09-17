"use client";

import { useActionState, useState } from "react";
import type { Product, ActionState } from "@/lib/types";

type ActionFn = (state: ActionState, formData: FormData) => Promise<ActionState>;

export default function ProductoForm({
  action,
  product,
  submitLabel,
}: {
  action: ActionFn;
  product?: Product;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [preview, setPreview] = useState<string | null>(product?.photo_data_url ?? null);
  const [removePhoto, setRemovePhoto] = useState(false);

  return (
    <form action={formAction} className="card max-w-xl space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      {state.error && <p className="alert-error">{state.error}</p>}
      {state.success && <p className="alert-success">{state.success}</p>}

      <div>
        <label className="label" htmlFor="name">
          Nombre del producto
        </label>
        <input id="name" name="name" defaultValue={product?.name} className="input" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="model">
            Modelo
          </label>
          <input id="model" name="model" defaultValue={product?.model ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="color">
            Color
          </label>
          <input id="color" name="color" defaultValue={product?.color ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="size">
            Talla
          </label>
          <input id="size" name="size" defaultValue={product?.size ?? ""} className="input" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="sku">
            SKU / código (opcional)
          </label>
          <input id="sku" name="sku" defaultValue={product?.sku ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="unit">
            Unidad de venta
          </label>
          <input
            id="unit"
            name="unit"
            defaultValue={product?.unit ?? "par"}
            placeholder="par, unidad, caja…"
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="description">
          Descripción (opcional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={product?.description ?? ""}
          className="input"
          placeholder="Detalles del producto para mostrar en el catálogo…"
        />
      </div>

      <div>
        <label className="label" htmlFor="price">
          Precio de venta
        </label>
        <input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={product?.price}
          className="input"
          required
        />
        <p className="mt-1 text-xs text-slate-400">Puede editarse en cualquier momento.</p>
      </div>

      <div>
        <label className="label" htmlFor="photo">
          Foto (opcional)
        </label>
        <div className="flex items-center gap-4">
          {preview && !removePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={product?.name ?? "Producto"}
              className="h-16 w-16 rounded border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-400">
              Sin foto
            </div>
          )}
          <div className="flex-1 space-y-2">
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              className="block w-full text-sm text-slate-600"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setRemovePhoto(false);
                  const reader = new FileReader();
                  reader.onload = () => setPreview(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
            {product?.photo_data_url && (
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  name="removePhoto"
                  checked={removePhoto}
                  onChange={(e) => setRemovePhoto(e.target.checked)}
                />
                Quitar la foto actual
              </label>
            )}
            <p className="text-xs text-slate-400">PNG o JPG, máximo 2 MB.</p>
          </div>
        </div>
      </div>

      {!product && (
        <div>
          <label className="label" htmlFor="initialStock">
            Inventario inicial (opcional)
          </label>
          <input
            id="initialStock"
            name="initialStock"
            type="number"
            step="0.01"
            min="0"
            defaultValue={0}
            className="input"
          />
          <p className="mt-1 text-xs text-slate-400">
            Se registrará como una entrada de inventario &quot;Carga inicial&quot;.
          </p>
        </div>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
