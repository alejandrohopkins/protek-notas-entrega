import type { Runner } from "@/lib/db";
import { nowIso, queryAll, runInTransaction } from "@/lib/db";
import { getProductById } from "@/lib/repo/products";
import type { InventoryMovement, MovementType } from "@/lib/types";

export async function listMovements(opts: {
  productId?: number;
  from?: string;
  to?: string;
}): Promise<InventoryMovement[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (opts.productId) {
    clauses.push("product_id = ?");
    params.push(opts.productId);
  }
  if (opts.from) {
    clauses.push("date::date >= ?::date");
    params.push(opts.from);
  }
  if (opts.to) {
    clauses.push("date::date <= ?::date");
    params.push(opts.to);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return queryAll<InventoryMovement>(
    `SELECT * FROM inventory_movements ${where} ORDER BY date DESC, id DESC`,
    params,
  );
}

function computeBalance(currentStock: number, type: MovementType, quantity: number): number {
  if (type === "ENTRADA") return currentStock + quantity;
  if (type === "SALIDA") return currentStock - quantity;
  return quantity; // AJUSTE: quantity is the new absolute balance
}

/** Inserts a movement row and updates the product's stock inside an existing transaction. */
export async function applyMovement(
  tx: Runner,
  params: {
    productId: number;
    type: MovementType;
    quantity: number;
    reference?: string;
    note?: string;
  },
): Promise<number> {
  const product = await getProductById(params.productId);
  if (!product) throw new Error("Producto no encontrado.");

  const newBalance = computeBalance(product.stock, params.type, params.quantity);
  if (newBalance < 0) {
    throw new Error(`Stock insuficiente para "${product.name}" (disponible: ${product.stock}).`);
  }

  const magnitude =
    params.type === "AJUSTE" ? Math.abs(newBalance - product.stock) : params.quantity;

  await queryAll("UPDATE products SET stock = ? WHERE id = ?", [newBalance, params.productId], tx);
  await queryAll(
    `INSERT INTO inventory_movements (product_id, date, type, quantity, balance_after, reference, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.productId,
      nowIso(),
      params.type,
      magnitude,
      newBalance,
      params.reference ?? "",
      params.note ?? "",
      nowIso(),
    ],
    tx,
  );

  return newBalance;
}

const MANUAL_REFERENCE: Record<MovementType, string> = {
  ENTRADA: "Entrada manual",
  SALIDA: "Salida manual",
  AJUSTE: "Ajuste por conteo",
};

export async function registerMovement(params: {
  productId: number;
  type: MovementType;
  quantity: number;
  note?: string;
}): Promise<number> {
  return runInTransaction((tx) =>
    applyMovement(tx, { ...params, reference: MANUAL_REFERENCE[params.type] }),
  );
}
