import { connection } from "next/server";
import type { NextRequest } from "next/server";
import { billedByClient } from "@/lib/repo/reports";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET(request: NextRequest) {
  await connection();
  const from = request.nextUrl.searchParams.get("from") || undefined;
  const to = request.nextUrl.searchParams.get("to") || undefined;
  const rows = await billedByClient({ from, to });
  const csv = toCsv(
    ["Cliente", "RIF", "Notas", "Total facturado"],
    rows.map((r) => [r.name, r.rif, r.notes_count, r.total.toFixed(2)]),
  );
  return csvResponse(csv, "facturado.csv");
}
