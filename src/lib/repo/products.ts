import { getDb, nowIso, queryAll, queryOne } from "@/lib/db";
import type { Product } from "@/lib/types";

export function listProducts(opts: { includeInactive?: boolean } = {}): Product[] {
  const sql = opts.includeInactive
    ? "SELECT * FROM products ORDER BY name COLLATE NOCASE ASC"
    : "SELECT * FROM products WHERE active = 1 ORDER BY name COLLATE NOCASE ASC";
  return queryAll<Product>(sql);
}

export function getProductById(id: number): Product | undefined {
  return queryOne<Product>("SELECT * FROM products WHERE id = ?", [id]);
}

export interface ProductInput {
  name: string;
  sku: string | null;
  model: string;
  color: string;
  size: string;
  unit: string;
  description: string;
  price: number;
  photoDataUrl?: string | null;
  removePhoto?: boolean;
}

export function createProduct(input: ProductInput): Product {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO products (name, sku, model, color, size, unit, description, photo_data_url, price, stock, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?)`,
    )
    .run(
      input.name,
      input.sku,
      input.model,
      input.color,
      input.size,
      input.unit,
      input.description,
      input.photoDataUrl ?? null,
      input.price,
      nowIso(),
    );
  return getProductById(Number(info.lastInsertRowid))!;
}

export function updateProduct(id: number, input: ProductInput): Product {
  const db = getDb();
  const current = getProductById(id)!;
  const nextPhoto = input.removePhoto
    ? null
    : (input.photoDataUrl ?? current.photo_data_url);

  db.prepare(
    `UPDATE products SET name = ?, sku = ?, model = ?, color = ?, size = ?, unit = ?, description = ?, photo_data_url = ?, price = ? WHERE id = ?`,
  ).run(
    input.name,
    input.sku,
    input.model,
    input.color,
    input.size,
    input.unit,
    input.description,
    nextPhoto,
    input.price,
    id,
  );
  return getProductById(id)!;
}

export function setProductActive(id: number, active: boolean): void {
  const db = getDb();
  db.prepare("UPDATE products SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
}

export function totalInventoryValue(): number {
  const row = queryOne<{ total: number }>(
    "SELECT COALESCE(SUM(stock * price), 0) AS total FROM products WHERE active = 1",
  )!;
  return row.total;
}
