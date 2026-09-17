import { DatabaseSync } from "node:sqlite";
import type { SQLInputValue } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "app.db");

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS company (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT 'Mi Empresa',
  rif TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'USD',
  logo_data_url TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO company (id, name, rif, address, phone, email, currency)
VALUES (
  1,
  'PROTEK GROUP, C.A.',
  'J-50818801-2',
  'Av 4 Bella Vista, Local N° 86-70, Sector Santa Lucia, Maracaibo - Estado Zulia, Venezuela. Cód. Postal 4001',
  '+58-414-6361373',
  'info@grupoprotek.com',
  'USD'
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rif TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  model TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'unidad',
  description TEXT NOT NULL DEFAULT '',
  photo_data_url TEXT,
  price REAL NOT NULL DEFAULT 0,
  stock REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS delivery_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'EMITIDA',
  notes TEXT NOT NULL DEFAULT '',
  total REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS delivery_note_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_note_id INTEGER NOT NULL REFERENCES delivery_notes(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  unit_price REAL NOT NULL,
  quantity REAL NOT NULL,
  subtotal REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  date TEXT NOT NULL DEFAULT (datetime('now')),
  type TEXT NOT NULL,
  quantity REAL NOT NULL,
  balance_after REAL NOT NULL,
  reference TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_delivery_notes_client ON delivery_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_delivery_note_items_note ON delivery_note_items(delivery_note_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(date);
`;

declare global {
  var __appDb: DatabaseSync | undefined;
}

// Catálogo inicial de PROTEK GROUP, tomado del packing list del contenedor.
// La venta es por par, especificado por modelo, color y talla; el precio
// queda en 0 (pendiente) hasta que se cargue la lista de precios real —
// el campo precio siempre se puede editar por producto en la app.
const SIZES = ["38", "39", "40", "41", "42", "43", "44", "45", "46"];
const PACKING_LIST: { model: string; color: string; qtyBySize: number[] }[] = [
  { model: "FZ003", color: "Negro", qtyBySize: [50, 50, 150, 250, 360, 350, 250, 50, 20] },
  { model: "FZ003", color: "Marrón Oscuro", qtyBySize: [20, 20, 50, 60, 70, 70, 50, 20, 10] },
  { model: "FZ004", color: "Negro", qtyBySize: [50, 50, 140, 190, 270, 270, 220, 50, 20] },
  { model: "FZ005", color: "Marrón Rojizo", qtyBySize: [40, 40, 50, 100, 200, 200, 120, 50, 20] },
  { model: "FZ006", color: "Negro", qtyBySize: [40, 40, 50, 100, 200, 200, 120, 50, 20] },
  { model: "FZ007", color: "Marrón Oscuro", qtyBySize: [0, 10, 10, 50, 40, 40, 70, 0, 0] },
  { model: "FZ008", color: "Marrón Oscuro", qtyBySize: [40, 40, 50, 100, 200, 200, 120, 50, 20] },
  { model: "FZ009", color: "Marrón Rojizo", qtyBySize: [0, 0, 40, 60, 60, 60, 40, 20, 0] },
  { model: "FZ010", color: "Negro", qtyBySize: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { model: "FZ011", color: "Negro/Gris", qtyBySize: [30, 30, 50, 90, 160, 160, 130, 50, 20] },
];

function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function seedProtekCatalog(db: DatabaseSync): void {
  const exists = db.prepare("SELECT 1 FROM products WHERE sku = ?");
  const insertProduct = db.prepare(
    `INSERT INTO products (name, sku, model, color, size, unit, description, price, stock, active, created_at)
     VALUES (?, ?, ?, ?, ?, 'par', '', 0, ?, 1, ?)`,
  );
  const insertMovement = db.prepare(
    `INSERT INTO inventory_movements (product_id, date, type, quantity, balance_after, reference, note, created_at)
     VALUES (?, ?, 'ENTRADA', ?, ?, 'Carga inicial', 'Carga inicial de inventario (packing list del contenedor)', ?)`,
  );

  for (const item of PACKING_LIST) {
    for (let i = 0; i < SIZES.length; i++) {
      const size = SIZES[i];
      const stock = item.qtyBySize[i];
      const sku = `${item.model}-${slug(item.color)}-${size}`;
      if (exists.get(sku)) continue;

      const now = new Date().toISOString();
      const name = `${item.model} ${item.color} Talla ${size}`;
      const info = insertProduct.run(name, sku, item.model, item.color, size, stock, now);
      if (stock > 0) {
        insertMovement.run(Number(info.lastInsertRowid), now, stock, stock, now);
      }
    }
  }
}

function createConnection(): DatabaseSync {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(SCHEMA_SQL);
  seedProtekCatalog(db);
  return db;
}

export function getDb(): DatabaseSync {
  if (!global.__appDb) {
    global.__appDb = createConnection();
  }
  return global.__appDb;
}

export function runInTransaction<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = fn(db);
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * node:sqlite returns rows as null-prototype objects, which React rejects when
 * passing Server Component data down to Client Components. Spreading into a
 * plain object fixes that while keeping the same shape.
 */
export function queryOne<T>(sql: string, params: SQLInputValue[] = []): T | undefined {
  const row = getDb().prepare(sql).get(...params);
  return row === undefined ? undefined : ({ ...row } as T);
}

export function queryAll<T>(sql: string, params: SQLInputValue[] = []): T[] {
  const rows = getDb().prepare(sql).all(...params);
  return rows.map((row) => ({ ...row })) as T[];
}
