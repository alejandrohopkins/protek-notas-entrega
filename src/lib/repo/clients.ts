import { getDb, nowIso, queryAll, queryOne } from "@/lib/db";
import type { Client } from "@/lib/types";

export function listClients(opts: { includeInactive?: boolean } = {}): Client[] {
  const sql = opts.includeInactive
    ? "SELECT * FROM clients ORDER BY name COLLATE NOCASE ASC"
    : "SELECT * FROM clients WHERE active = 1 ORDER BY name COLLATE NOCASE ASC";
  return queryAll<Client>(sql);
}

export function getClientById(id: number): Client | undefined {
  return queryOne<Client>("SELECT * FROM clients WHERE id = ?", [id]);
}

export function findClientByRif(rif: string): Client | undefined {
  return queryOne<Client>("SELECT * FROM clients WHERE rif = ?", [rif]);
}

export interface ClientInput {
  name: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
}

export function createClient(input: ClientInput): Client {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO clients (name, rif, address, phone, email, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)`,
    )
    .run(input.name, input.rif, input.address, input.phone, input.email, nowIso());
  return getClientById(Number(info.lastInsertRowid))!;
}

export function updateClient(id: number, input: ClientInput): Client {
  const db = getDb();
  db.prepare(
    `UPDATE clients SET name = ?, rif = ?, address = ?, phone = ?, email = ? WHERE id = ?`,
  ).run(input.name, input.rif, input.address, input.phone, input.email, id);
  return getClientById(id)!;
}

export function setClientActive(id: number, active: boolean): void {
  const db = getDb();
  db.prepare("UPDATE clients SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
}
