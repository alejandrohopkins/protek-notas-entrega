import type { SQLInputValue } from "node:sqlite";
import { queryAll, queryOne } from "@/lib/db";

export interface BilledByClient {
  client_id: number;
  name: string;
  rif: string;
  notes_count: number;
  total: number;
}

function dateRangeClauses(
  opts: { from?: string; to?: string },
  dateColumn: string,
): { clause: string; params: SQLInputValue[] } {
  const clauses = ["status = 'EMITIDA'"];
  const params: SQLInputValue[] = [];
  if (opts.from) {
    clauses.push(`date(${dateColumn}) >= date(?)`);
    params.push(opts.from);
  }
  if (opts.to) {
    clauses.push(`date(${dateColumn}) <= date(?)`);
    params.push(opts.to);
  }
  return { clause: clauses.join(" AND "), params };
}

export function billedByClient(opts: { from?: string; to?: string } = {}): BilledByClient[] {
  const { clause, params } = dateRangeClauses(opts, "dn.date");

  return queryAll<BilledByClient>(
    `SELECT c.id AS client_id, c.name AS name, c.rif AS rif,
            COUNT(dn.id) AS notes_count, COALESCE(SUM(dn.total), 0) AS total
     FROM clients c
     JOIN delivery_notes dn ON dn.client_id = c.id AND ${clause}
     GROUP BY c.id
     HAVING notes_count > 0
     ORDER BY total DESC`,
    params,
  );
}

export function countNotesEmitted(opts: { from?: string; to?: string } = {}): number {
  const { clause, params } = dateRangeClauses(opts, "date");
  const row = queryOne<{ count: number }>(
    `SELECT COUNT(*) AS count FROM delivery_notes WHERE ${clause}`,
    params,
  )!;
  return row.count;
}

export function totalBilled(opts: { from?: string; to?: string } = {}): number {
  const { clause, params } = dateRangeClauses(opts, "date");
  const row = queryOne<{ total: number }>(
    `SELECT COALESCE(SUM(total), 0) AS total FROM delivery_notes WHERE ${clause}`,
    params,
  )!;
  return row.total;
}
