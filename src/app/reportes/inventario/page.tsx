import Link from "next/link";
import { connection } from "next/server";
import { listProducts, totalInventoryValue } from "@/lib/repo/products";
import { getCompany } from "@/lib/repo/company";
import { formatMoney } from "@/lib/format";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";

export default async function InventarioReportPage() {
  await connection();
  const products = await listProducts();
  const company = await getCompany();
  const total = await totalInventoryValue();

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Inventario actual</h1>
      <p className="mb-4 text-sm text-slate-500">Existencias y valor de cada producto activo.</p>

      <div className="card overflow-x-auto">
        {products.length === 0 ? (
          <p className="text-sm text-slate-500">No hay productos registrados todavía.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="text-right">Precio</th>
                <th className="text-right">Stock</th>
                <th className="text-right">Valor en inventario</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/productos/${p.id}`} className="font-medium text-slate-900 hover:underline">
                      {p.name}
                    </Link>
                    {p.stock <= LOW_STOCK_THRESHOLD && (
                      <span className="badge ml-2 bg-amber-100 text-amber-700">Stock bajo</span>
                    )}
                  </td>
                  <td className="text-right">{formatMoney(p.price, company.currency)}</td>
                  <td className="text-right">
                    {p.stock} {p.unit}
                  </td>
                  <td className="text-right">{formatMoney(p.stock * p.price, company.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-right font-semibold text-slate-900">
                  Valor total del inventario
                </td>
                <td className="text-right font-semibold text-slate-900">
                  {formatMoney(total, company.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
