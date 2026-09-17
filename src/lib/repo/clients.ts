import { nowIso, queryAll, queryOne } from "@/lib/db";
import type { Client } from "@/lib/types";

export async function listClients(opts: { includeInactive?: boolean } = {}): Promise<Client[]> {
  const sql = opts.includeInactive
    ? "SELECT * FROM clients ORDER BY lower(name) ASC"
    : "SELECT * FROM clients WHERE active = 1 ORDER BY lower(name) ASC";
  return queryAll<Client>(sql);
}

export async function getClientById(id: number): Promise<Client | undefined> {
  return queryOne<Client>("SELECT * FROM clients WHERE id = ?", [id]);
}

export async function findClientByRif(rif: string): Promise<Client | undefined> {
  return queryOne<Client>("SELECT * FROM clients WHERE rif = ?", [rif]);
}

export interface ClientInput {
  name: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
}

export async function createClient(input: ClientInput): Promise<Client> {
  const row = await queryOne<{ id: number }>(
    `INSERT INTO clients (name, rif, address, phone, email, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?) RETURNING id`,
    [input.name, input.rif, input.address, input.phone, input.email, nowIso()],
  );
  return (await getClientById(row!.id))!;
}

export async function updateClient(id: number, input: ClientInput): Promise<Client> {
  await queryAll(
    `UPDATE clients SET name = ?, rif = ?, address = ?, phone = ?, email = ? WHERE id = ?`,
    [input.name, input.rif, input.address, input.phone, input.email, id],
  );
  return (await getClientById(id))!;
}

export async function setClientActive(id: number, active: boolean): Promise<void> {
  await queryAll("UPDATE clients SET active = ? WHERE id = ?", [active ? 1 : 0, id]);
}
