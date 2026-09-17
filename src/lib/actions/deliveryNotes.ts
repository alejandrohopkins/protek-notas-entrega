"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDeliveryNote, voidDeliveryNote, type DeliveryNoteLine } from "@/lib/repo/deliveryNotes";
import { optionalString, ValidationError } from "@/lib/validate";
import type { ActionState } from "@/lib/types";

export async function createDeliveryNoteAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let noteId: number;
  try {
    const clientId = Number(formData.get("clientId"));
    if (!clientId) throw new ValidationError("Selecciona un cliente.");
    const date = optionalString(formData.get("date")) || new Date().toISOString().slice(0, 10);
    const notes = optionalString(formData.get("notes"));

    const productIds = formData.getAll("productId");
    const quantities = formData.getAll("quantity");
    const unitPrices = formData.getAll("unitPrice");

    const lines: DeliveryNoteLine[] = [];
    for (let i = 0; i < productIds.length; i++) {
      const productId = Number(productIds[i]);
      const quantity = Number(quantities[i]);
      const unitPrice = Number(unitPrices[i]);
      if (!productId) continue; // fila vacía (línea añadida pero sin producto elegido)
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new ValidationError("Cada línea debe tener una cantidad mayor que cero.");
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new ValidationError("Cada línea debe tener un precio válido.");
      }
      lines.push({ productId, quantity, unitPrice });
    }

    const note = await createDeliveryNote({ clientId, date, notes, lines });
    noteId = note.id;
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    if (err instanceof Error) return { error: err.message };
    console.error(err);
    return { error: "No se pudo crear la nota de entrega." };
  }
  revalidatePath("/notas-entrega");
  revalidatePath("/productos");
  revalidatePath("/reportes/inventario");
  revalidatePath("/reportes/facturado");
  redirect(`/notas-entrega/${noteId}`);
}

export async function voidDeliveryNoteAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (id) {
    try {
      await voidDeliveryNote(id);
    } catch (err) {
      console.error(err);
    }
  }
  revalidatePath("/notas-entrega");
  revalidatePath(`/notas-entrega/${id}`);
  revalidatePath("/productos");
  revalidatePath("/reportes/inventario");
  revalidatePath("/reportes/facturado");
  revalidatePath("/kardex");
}
