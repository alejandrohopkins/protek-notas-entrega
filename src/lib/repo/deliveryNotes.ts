import { nowIso, queryAll, queryOne, runInTransaction } from "@/lib/db";
import { applyMovement } from "@/lib/repo/inventory";
import { getProductById } from "@/lib/repo/products";
import { getClientById } from "@/lib/repo/clients";
import type { DeliveryNote, DeliveryNoteItem } from "@/lib/types";

export interface DeliveryNoteLine {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface DeliveryNoteListItem extends DeliveryNote {
  client_name: string;
  client_rif: string;
}

export async function listDeliveryNotes(
  opts: { clientId?: number } = {},
): Promise<DeliveryNoteListItem[]> {
  const where = opts.clientId ? "WHERE dn.client_id = ?" : "";
  const params = opts.clientId ? [opts.clientId] : [];
  return queryAll<DeliveryNoteListItem>(
    `SELECT dn.*, c.name AS client_name, c.rif AS client_rif
     FROM delivery_notes dn
     JOIN clients c ON c.id = dn.client_id
     ${where}
     ORDER BY dn.date DESC, dn.id DESC`,
    params,
  );
}

export async function getDeliveryNoteById(id: number): Promise<DeliveryNote | undefined> {
  return queryOne<DeliveryNote>("SELECT * FROM delivery_notes WHERE id = ?", [id]);
}

export async function getDeliveryNoteItems(deliveryNoteId: number): Promise<DeliveryNoteItem[]> {
  return queryAll<DeliveryNoteItem>(
    "SELECT * FROM delivery_note_items WHERE delivery_note_id = ? ORDER BY id ASC",
    [deliveryNoteId],
  );
}

export async function createDeliveryNote(params: {
  clientId: number;
  date: string;
  notes: string;
  lines: DeliveryNoteLine[];
}): Promise<DeliveryNote> {
  const client = await getClientById(params.clientId);
  if (!client || !client.active) {
    throw new Error("Selecciona un cliente válido.");
  }
  if (params.lines.length === 0) {
    throw new Error("Agrega al menos un producto a la nota.");
  }

  // Consolidate repeated products so the stock check considers the total requested.
  const consolidated = new Map<number, DeliveryNoteLine>();
  for (const line of params.lines) {
    const existing = consolidated.get(line.productId);
    if (existing) {
      existing.quantity += line.quantity;
    } else {
      consolidated.set(line.productId, { ...line });
    }
  }

  for (const line of consolidated.values()) {
    const product = await getProductById(line.productId);
    if (!product || !product.active) {
      throw new Error("Uno de los productos seleccionados ya no está disponible.");
    }
    if (line.quantity > product.stock) {
      throw new Error(
        `Stock insuficiente para "${product.name}": disponible ${product.stock} ${product.unit}, solicitado ${line.quantity}.`,
      );
    }
  }

  return runInTransaction(async (tx) => {
    const total = params.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
    const inserted = await queryOne<{ id: number }>(
      `INSERT INTO delivery_notes (client_id, date, status, notes, total, created_at)
       VALUES (?, ?, 'EMITIDA', ?, ?, ?) RETURNING id`,
      [params.clientId, params.date, params.notes, total, nowIso()],
      tx,
    );
    const noteId = inserted!.id;

    for (const line of params.lines) {
      const product = (await getProductById(line.productId))!;
      const subtotal = line.quantity * line.unitPrice;
      await queryAll(
        `INSERT INTO delivery_note_items (delivery_note_id, product_id, product_name, unit_price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [noteId, line.productId, product.name, line.unitPrice, line.quantity, subtotal],
        tx,
      );
    }

    for (const line of consolidated.values()) {
      await applyMovement(tx, {
        productId: line.productId,
        type: "SALIDA",
        quantity: line.quantity,
        reference: `Nota de entrega N.º ${String(noteId).padStart(6, "0")}`,
      });
    }

    return (await queryOne<DeliveryNote>(
      "SELECT * FROM delivery_notes WHERE id = ?",
      [noteId],
      tx,
    ))!;
  });
}

export async function voidDeliveryNote(id: number): Promise<DeliveryNote> {
  const note = await getDeliveryNoteById(id);
  if (!note) throw new Error("Nota de entrega no encontrada.");
  if (note.status === "ANULADA") throw new Error("Esta nota ya está anulada.");

  return runInTransaction(async (tx) => {
    const items = await getDeliveryNoteItems(id);
    for (const item of items) {
      await applyMovement(tx, {
        productId: item.product_id,
        type: "ENTRADA",
        quantity: item.quantity,
        reference: `Anulación nota N.º ${String(id).padStart(6, "0")}`,
      });
    }
    await queryAll("UPDATE delivery_notes SET status = 'ANULADA' WHERE id = ?", [id], tx);
    return (await queryOne<DeliveryNote>("SELECT * FROM delivery_notes WHERE id = ?", [id], tx))!;
  });
}
