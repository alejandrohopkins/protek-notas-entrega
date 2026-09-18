import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeliveryNoteById, getDeliveryNoteItems } from "@/lib/repo/deliveryNotes";
import { getClientById } from "@/lib/repo/clients";
import { getCompany } from "@/lib/repo/company";
import { formatDate, formatMoney, noteNumber } from "@/lib/format";
import PrintButton from "./PrintButton";
import VoidNoteButton from "./VoidNoteButton";

export default async function NotaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getDeliveryNoteById(Number(id));
  if (!note) notFound();

  const items = await getDeliveryNoteItems(note.id);
  const client = await getClientById(note.client_id);
  const company = await getCompany();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/notas-entrega" className="text-sm text-slate-500 hover:underline">
          ← Notas de entrega
        </Link>
        <div className="flex items-center gap-2">
          {note.status === "EMITIDA" && <VoidNoteButton noteId={note.id} />}
          <PrintButton />
        </div>
      </div>

      <div className="print-area card">
        {note.status === "ANULADA" && (
          <div className="no-print mb-4">
            <span className="badge bg-red-100 text-red-700">Esta nota está anulada</span>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            {company.logo_data_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo_data_url} alt={company.name} className="h-14 w-14 object-contain" />
            )}
            <div>
              <p className="text-lg font-semibold text-slate-900">{company.name}</p>
              {company.rif && <p className="text-sm text-slate-500">RIF: {company.rif}</p>}
              {company.address && <p className="text-sm text-slate-500">{company.address}</p>}
              {company.phone && <p className="text-sm text-slate-500">Tel: {company.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold uppercase tracking-wide text-slate-900">Nota de entrega</p>
            <p className="text-base font-bold text-blue-600">{noteNumber(note.id)}</p>
            <p className="text-sm text-slate-600">Fecha: {formatDate(note.date)}</p>
            {note.status === "ANULADA" && <p className="font-semibold text-red-600">ANULADA</p>}
          </div>
        </div>

        <div className="mb-6 grid gap-1 text-sm">
          <p>
            <span className="font-semibold text-slate-700">Cliente:</span> {client?.name}
          </p>
          <p>
            <span className="font-semibold text-slate-700">RIF:</span> {client?.rif}
          </p>
          {client?.address && (
            <p>
              <span className="font-semibold text-slate-700">Dirección:</span> {client.address}
            </p>
          )}
        </div>

        <table className="table-base mb-4">
          <thead>
            <tr className="hidden print:table-row">
              <th colSpan={5} className="border-0 py-1 text-left text-[9px] font-normal text-slate-400">
                {company.name} · {noteNumber(note.id)}
              </th>
            </tr>
            <tr>
              <th className="w-10">#</th>
              <th>Producto</th>
              <th className="text-right">Cantidad</th>
              <th className="text-right">Precio unit.</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id}>
                <td>{i + 1}</td>
                <td>{item.product_name}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">{formatMoney(item.unit_price, company.currency)}</td>
                <td className="text-right">{formatMoney(item.subtotal, company.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="print-total mb-6 flex justify-end">
          <div className="w-56">
            <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-bold text-slate-900">
              <span>Total</span>
              <span>{formatMoney(note.total, company.currency)}</span>
            </div>
          </div>
        </div>

        {note.notes && (
          <div className="mb-6 text-sm">
            <p className="font-semibold text-slate-700">Notas:</p>
            <p className="whitespace-pre-wrap text-slate-600">{note.notes}</p>
          </div>
        )}

        <div className="print-signatures mt-12 grid grid-cols-2 gap-8 text-center text-sm">
          <div>
            <div className="border-t border-slate-400 pt-2">Entregado por</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-2">Recibido por (nombre, cédula y firma)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
