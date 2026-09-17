import Link from "next/link";
import { connection } from "next/server";
import { listClients } from "@/lib/repo/clients";
import { listProducts, totalInventoryValue } from "@/lib/repo/products";
import { listDeliveryNotes } from "@/lib/repo/deliveryNotes";
import { totalBilled, countNotesEmitted } from "@/lib/repo/reports";
import { getCompany } from "@/lib/repo/company";
import { formatMoney, formatDate, noteNumber } from "@/lib/format";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";

function monthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function DashboardPage() {
  await connection();
  const company = await getCompany();
  const clients = await listClients();
  const products = await listProducts();
  const recentNotes = (await listDeliveryNotes()).slice(0, 5);

  const from = monthStart();
  const billedThisMonth = await totalBilled({ from });
  const notesThisMonth = await countNotesEmitted({ from });
  const inventoryValue = await totalInventoryValue();
  const lowStock = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Panel</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/notas-entrega/nueva" className="btn-primary">
            + Nueva nota de entrega
          </Link>
          <Link href="/clientes/nuevo" className="btn-secondary">
            + Cliente
          </Link>
          <Link href="/productos/nuevo" className="btn-secondary">
            + Producto
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm text-slate-500">Clientes activos</p>
          <p className="text-2xl font-semibold text-slate-900">{clients.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Productos activos</p>
          <p className="text-2xl font-semibold text-slate-900">{products.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Notas este mes</p>
          <p className="text-2xl font-semibold text-slate-900">{notesThisMonth}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Facturado este mes</p>
          <p className="text-2xl font-semibold text-slate-900">
            {formatMoney(billedThisMonth, company.currency)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Notas de entrega recientes</h2>
            <Link href="/notas-entrega" className="text-sm text-slate-500 hover:underline">
              Ver todas →
            </Link>
          </div>
          {recentNotes.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no has emitido notas de entrega.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentNotes.map((n) => (
                <li key={n.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <Link href={`/notas-entrega/${n.id}`} className="font-medium text-slate-900 hover:underline">
                      {noteNumber(n.id)}
                    </Link>
                    <p className="text-slate-500">
                      {n.client_name} · {formatDate(n.date)}
                    </p>
                  </div>
                  <span className="font-medium text-slate-800">{formatMoney(n.total, company.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Productos con stock bajo</h2>
            <Link href="/reportes/inventario" className="text-sm text-slate-500 hover:underline">
              Ver inventario →
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-slate-500">
              Ningún producto está por debajo de {LOW_STOCK_THRESHOLD} unidades.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/productos/${p.id}`} className="font-medium text-slate-900 hover:underline">
                    {p.name}
                  </Link>
                  <span className="font-semibold text-amber-600">
                    {p.stock} {p.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-500">
            Valor total del inventario:{" "}
            <span className="font-semibold text-slate-800">
              {formatMoney(inventoryValue, company.currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
