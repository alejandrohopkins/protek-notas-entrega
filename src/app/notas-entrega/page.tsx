import Link from "next/link";
import { connection } from "next/server";
import { listDeliveryNotes } from "@/lib/repo/deliveryNotes";
import { getCompany } from "@/lib/repo/company";
import { formatDate, formatMoney, noteNumber } from "@/lib/format";

export default async function NotasEntregaPage() {
  await connection();
  const notes = listDeliveryNotes();
  const company = getCompany();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Notas de entrega</h1>
        <Link href="/notas-entrega/nueva" className="btn-primary">
          + Nueva nota de entrega
        </Link>
      </div>

      <div className="card overflow-x-auto">
        {notes.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no has emitido ninguna nota de entrega.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Nota</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => (
                <tr key={n.id}>
                  <td>
                    <Link href={`/notas-entrega/${n.id}`} className="font-medium text-slate-900 hover:underline">
                      {noteNumber(n.id)}
                    </Link>
                  </td>
                  <td>{formatDate(n.date)}</td>
                  <td>
                    <Link href={`/clientes/${n.client_id}`} className="hover:underline">
                      {n.client_name}
                    </Link>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        n.status === "ANULADA"
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {n.status === "ANULADA" ? "Anulada" : "Emitida"}
                    </span>
                  </td>
                  <td className="text-right">{formatMoney(n.total, company.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
