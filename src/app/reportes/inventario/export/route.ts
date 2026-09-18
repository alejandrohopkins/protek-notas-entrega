import { connection } from "next/server";
import { listProducts } from "@/lib/repo/products";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  await connection();
  const products = await listProducts();
  const rows = products.map((p) => [
    p.name,
    p.model,
    p.color,
    p.size,
    p.unit,
    p.price,
    p.stock,
    (p.stock * p.price).toFixed(2),
  ]);
  const csv = toCsv(
    ["Producto", "Modelo", "Color", "Talla", "Unidad", "Precio", "Stock", "Valor en inventario"],
    rows,
  );
  return csvResponse(csv, "inventario.csv");
}
