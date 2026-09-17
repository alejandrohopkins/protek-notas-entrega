import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientById } from "@/lib/repo/clients";
import { listDeliveryNotes } from "@/lib/repo/deliveryNotes";
import { getCompany } from "@/lib/repo/company";
import { updateClientAction, setClientActiveAction } from "@/lib/actions/clients";
import { formatMoney, formatDate, noteNumber } from "@/lib/format";
import ClienteForm from "../ClienteForm";
import ConfirmForm from "@/app/components/ConfirmForm";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(Number(id));
  if (!client) notFound();

  const notes = await listDeliveryNotes({ clientId: client.id });
  const company = await getCompany();
  const totalInvoiced = notes
    .filter((n) => n.status === "EMITIDA")
    .reduce((sum, n) => sum + n.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{client.name}</h1>
          <p className="text-sm text-slate-500">{client.rif}</p>
        </div>
        <div className="flex items-center gap-2">
          {!client.active && <span className="badge bg-slate-200 text-slate-600">Archivado</span>}
          <ConfirmForm
            action={setClientActiveAction}
            hiddenFields={{ id: client.id, active: client.active ? 0 : 1 }}
            confirmMessage={
              client.active
                ? "¿Archivar este cliente? No aparecerá al crear nuevas notas de entrega."
                : "¿Reactivar este cliente?"
            }
            label={client.active ? "Archivar" : "Reactivar"}
          />
          <Link href="/clientes" className="text-sm text-slate-500 hover:underline">
            ← Clientes
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ClienteForm action={updateClientAction} client={client} submitLabel="Guardar cambios" />

        <div className="card">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold text-slate-900">Facturado a este cliente</h2>
            <span className="text-lg font-semibold text-slate-900">
              {formatMoney(totalInvoiced, company.currency)}
            </span>
          </div>
          {notes.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no tiene notas de entrega.</p>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Nota</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <Link href={`/notas-entrega/${n.id}`} className="text-slate-700 hover:underline">
                        {noteNumber(n.id)}
                      </Link>
                    </td>
                    <td>{formatDate(n.date)}</td>
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
    </div>
  );
}
