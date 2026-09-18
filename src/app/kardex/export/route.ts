import { connection } from "next/server";
import type { NextRequest } from "next/server";
import { listMovements } from "@/lib/repo/inventory";
import { getProductById } from "@/lib/repo/products";
import { formatDateTime } from "@/lib/format";
import { toCsv, csvResponse } from "@/lib/csv";

const TYPE_LABEL: Record<string, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  AJUSTE: "Ajuste",
};

export async function GET(request: NextRequest) {
  await connection();
  const productId = Number(request.nextUrl.searchParams.get("productId"));
  if (!productId) {
    return new Response("Falta seleccionar un producto.", { status: 400 });
  }
  const from = request.nextUrl.searchParams.get("from") || undefined;
  const to = request.nextUrl.searchParams.get("to") || undefined;

  const [movements, product] = await Promise.all([
    listMovements({ productId, from, to }),
    getProductById(productId),
  ]);

  const rows = movements.map((m) => [
    formatDateTime(m.date),
    TYPE_LABEL[m.type] ?? m.type,
    m.quantity,
    m.balance_after,
    m.reference,
    m.note,
  ]);
  const csv = toCsv(["Fecha", "Tipo", "Cantidad", "Saldo", "Referencia", "Nota"], rows);
  return csvResponse(csv, `kardex-${product?.name ?? productId}.csv`);
}
