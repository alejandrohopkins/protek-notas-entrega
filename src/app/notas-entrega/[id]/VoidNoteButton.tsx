"use client";

import { useActionState, useRef } from "react";
import { voidDeliveryNoteAction } from "@/lib/actions/deliveryNotes";

export default function VoidNoteButton({ noteId }: { noteId: number }) {
  const [state, formAction, pending] = useActionState(voidDeliveryNoteAction, {});
  const pinRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={formAction}
      className="inline-flex items-center gap-2"
      onSubmit={(e) => {
        const value = window.prompt(
          "Escribe la clave para anular esta nota de entrega. El inventario entregado se devolverá al stock.",
        );
        if (!value) {
          e.preventDefault();
          return;
        }
        if (pinRef.current) pinRef.current.value = value;
      }}
    >
      <input type="hidden" name="id" value={noteId} />
      <input type="hidden" name="pin" ref={pinRef} />
      {state.error && <span className="text-xs font-medium text-red-600">{state.error}</span>}
      <button type="submit" disabled={pending} className="btn-secondary btn-sm text-red-600">
        {pending ? "Anulando…" : "Anular nota"}
      </button>
    </form>
  );
}
