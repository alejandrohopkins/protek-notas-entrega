"use client";

import { useActionState } from "react";
import type { Client, ActionState } from "@/lib/types";

type ActionFn = (state: ActionState, formData: FormData) => Promise<ActionState>;

export default function ClienteForm({
  action,
  client,
  submitLabel,
}: {
  action: ActionFn;
  client?: Client;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="card max-w-xl space-y-4">
      {client && <input type="hidden" name="id" value={client.id} />}
      {state.error && <p className="alert-error">{state.error}</p>}
      {state.success && <p className="alert-success">{state.success}</p>}

      <div>
        <label className="label" htmlFor="name">
          Nombre o razón social
        </label>
        <input id="name" name="name" defaultValue={client?.name} className="input" required />
      </div>

      <div>
        <label className="label" htmlFor="rif">
          RIF
        </label>
        <input
          id="rif"
          name="rif"
          defaultValue={client?.rif}
          placeholder="J-12345678-9"
          className="input"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="address">
          Dirección
        </label>
        <input id="address" name="address" defaultValue={client?.address} className="input" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="phone">
            Teléfono
          </label>
          <input id="phone" name="phone" defaultValue={client?.phone} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Correo
          </label>
          <input id="email" name="email" type="email" defaultValue={client?.email} className="input" />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
