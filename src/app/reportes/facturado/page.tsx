import Link from "next/link";
import { billedByClient, totalBilled } from "@/lib/repo/reports";
import { getCompany } from "@/lib/repo/company";
import { formatMoney } from "@/lib/format";

export default async function FacturadoPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const from = sp.from || undefined;
  const to = sp.to || undefined;
  const company = getCompany();
  const rows = billedByClient({ from, to });
  const total = totalBilled({ from, to });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Facturado por cliente</h1>
      <p className="mb-4 text-sm text-slate-500">
        Suma de las notas de entrega emitidas (no anuladas) por cliente.
      </p>

      <form className="card mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="from">
            Desde
          </label>
          <input id="from" name="from" type="date" defaultValue={sp.from} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="to">
            Hasta
          </label>
          <input id="to" name="to" type="date" defaultValue={sp.to} className="input" />
        </div>
        <button type="submit" className="btn-secondary">
          Filtrar
        </button>
        {(sp.from || sp.to) && (
          <Link href="/reportes/facturado" className="text-sm text-slate-500 hover:underline">
            Limpiar filtro
          </Link>
        )}
      </form>

      <div className="card overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No hay notas de entrega emitidas en este período.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>RIF</th>
                <th className="text-right">Notas</th>
                <th className="text-right">Total facturado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.client_id}>
                  <td>
                    <Link href={`/clientes/${r.client_id}`} className="font-medium text-slate-900 hover:underline">
                      {r.name}
                    </Link>
                  </td>
                  <td>{r.rif}</td>
                  <td className="text-right">{r.notes_count}</td>
                  <td className="text-right">{formatMoney(r.total, company.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-right font-semibold text-slate-900">
                  Total general
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
