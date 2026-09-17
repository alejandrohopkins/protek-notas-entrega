"use client";

import { useActionState, useState } from "react";
import { updateCompanyAction } from "@/lib/actions/company";
import { CURRENCIES } from "@/lib/format";
import type { Company } from "@/lib/types";

export default function EmpresaForm({ company }: { company: Company }) {
  const [state, formAction, pending] = useActionState(updateCompanyAction, {});
  const [preview, setPreview] = useState<string | null>(company.logo_data_url);
  const [removeLogo, setRemoveLogo] = useState(false);

  return (
    <form action={formAction} className="card space-y-4">
      {state.error && <p className="alert-error">{state.error}</p>}
      {state.success && <p className="alert-success">{state.success}</p>}

      <div>
        <label className="label" htmlFor="name">
          Nombre de la empresa
        </label>
        <input id="name" name="name" defaultValue={company.name} className="input" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="rif">
            RIF
          </label>
          <input
            id="rif"
            name="rif"
            defaultValue={company.rif}
            placeholder="J-12345678-9"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Teléfono
          </label>
          <input id="phone" name="phone" defaultValue={company.phone} className="input" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="address">
          Dirección
        </label>
        <input id="address" name="address" defaultValue={company.address} className="input" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="email">
            Correo
          </label>
          <input id="email" name="email" type="email" defaultValue={company.email} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="currency">
            Moneda para mostrar montos
          </label>
          <select id="currency" name="currency" defaultValue={company.currency} className="select">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="logo">
          Logo
        </label>
        <div className="flex items-center gap-4">
          {preview && !removeLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Logo" className="h-16 w-16 rounded border border-slate-200 object-contain" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-400">
              Sin logo
            </div>
          )}
          <div className="flex-1 space-y-2">
            <input
              id="logo"
              name="logo"
              type="file"
              accept="image/*"
              className="block w-full text-sm text-slate-600"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setRemoveLogo(false);
                  const reader = new FileReader();
                  reader.onload = () => setPreview(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
            {company.logo_data_url && (
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  name="removeLogo"
                  checked={removeLogo}
                  onChange={(e) => setRemoveLogo(e.target.checked)}
                />
                Quitar el logo actual
              </label>
            )}
            <p className="text-xs text-slate-400">PNG o JPG, máximo 2 MB.</p>
          </div>
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
