import { nowIso, queryAll, queryOne } from "@/lib/db";
import type { Product } from "@/lib/types";

export async function listProducts(opts: { includeInactive?: boolean } = {}): Promise<Product[]> {
  const sql = opts.includeInactive
    ? "SELECT * FROM products ORDER BY lower(name) ASC"
    : "SELECT * FROM products WHERE active = 1 ORDER BY lower(name) ASC";
  return queryAll<Product>(sql);
}

export async function getProductById(id: number): Promise<Product | undefined> {
  return queryOne<Product>("SELECT * FROM products WHERE id = ?", [id]);
}

export interface ReferenceSize {
  productId: number;
  size: string;
  stock: number;
  price: number;
}

export interface ProductReference {
  key: string;
  label: string;
  model: string;
  color: string;
  unit: string;
  price: number;
  sizes: ReferenceSize[];
}

/** Agrupa los productos (una fila por talla) en referencias por modelo + color, para la pantalla de notas de entrega. */
export async function listProductReferences(
  opts: { includeInactive?: boolean } = {},
): Promise<ProductReference[]> {
  const products = await listProducts(opts);
  const map = new Map<string, ProductReference>();

  for (const p of products) {
    const key = p.model || p.color ? `${p.model}|||${p.color}` : `solo-${p.id}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: p.model || p.color ? `${p.model} ${p.color}`.trim() : p.name,
        model: p.model,
        color: p.color,
        unit: p.unit,
        price: p.price,
        sizes: [],
      });
    }
    map.get(key)!.sizes.push({ productId: p.id, size: p.size, stock: p.stock, price: p.price });
  }

  const references = Array.from(map.values());
  for (const ref of references) {
    ref.sizes.sort((a, b) => Number(a.size) - Number(b.size) || a.size.localeCompare(b.size));
  }
  references.sort((a, b) => a.label.localeCompare(b.label));
  return references;
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

export async function createProduct(input: ProductInput): Promise<Product> {
  const row = await queryOne<{ id: number }>(
    `INSERT INTO products (name, sku, model, color, size, unit, description, photo_data_url, price, stock, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?) RETURNING id`,
    [
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
    ],
  );
  return (await getProductById(row!.id))!;
}

export async function updateProduct(id: number, input: ProductInput): Promise<Product> {
  const current = (await getProductById(id))!;
  const nextPhoto = input.removePhoto ? null : (input.photoDataUrl ?? current.photo_data_url);

  await queryAll(
    `UPDATE products SET name = ?, sku = ?, model = ?, color = ?, size = ?, unit = ?, description = ?, photo_data_url = ?, price = ? WHERE id = ?`,
    [
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
    ],
  );
  return (await getProductById(id))!;
}

export async function setProductActive(id: number, active: boolean): Promise<void> {
  await queryAll("UPDATE products SET active = ? WHERE id = ?", [active ? 1 : 0, id]);
}

export async function totalInventoryValue(): Promise<number> {
  const row = (await queryOne<{ total: number }>(
    "SELECT COALESCE(SUM(stock * price), 0) AS total FROM products WHERE active = 1",
  ))!;
  return row.total;
}
