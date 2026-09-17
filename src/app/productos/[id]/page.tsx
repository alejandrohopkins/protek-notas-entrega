import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/repo/products";
import { listMovements } from "@/lib/repo/inventory";
import { updateProductAction, setProductActiveAction } from "@/lib/actions/products";
import { formatDateTime } from "@/lib/format";
import ProductoForm from "../ProductoForm";
import MovimientoForm from "./MovimientoForm";
import ConfirmForm from "@/app/components/ConfirmForm";

const TYPE_LABEL: Record<string, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  AJUSTE: "Ajuste",
};

export default async function ProductoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(Number(id));
  if (!product) notFound();

  const movements = listMovements({ productId: product.id }).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {product.photo_data_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.photo_data_url}
              alt={product.name}
              className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
            />
          )}
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{product.name}</h1>
            <p className="text-sm text-slate-500">
              Stock actual: <span className="font-semibold text-slate-700">{product.stock} {product.unit}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!product.active && <span className="badge bg-slate-200 text-slate-600">Archivado</span>}
          <ConfirmForm
            action={setProductActiveAction}
            hiddenFields={{ id: product.id, active: product.active ? 0 : 1 }}
            confirmMessage={
              product.active
                ? "¿Archivar este producto? No aparecerá al crear nuevas notas de entrega."
                : "¿Reactivar este producto?"
            }
            label={product.active ? "Archivar" : "Reactivar"}
          />
          <Link href="/productos" className="text-sm text-slate-500 hover:underline">
            ← Productos
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ProductoForm action={updateProductAction} product={product} submitLabel="Guardar cambios" />
          <MovimientoForm productId={product.id} unit={product.unit} />
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Movimientos recientes</h2>
            <Link
              href={`/kardex?productId=${product.id}`}
              className="text-sm text-slate-500 hover:underline"
            >
              Ver kardex completo →
            </Link>
          </div>
          {movements.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay movimientos de inventario.</p>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th className="text-right">Cantidad</th>
                  <th className="text-right">Saldo</th>
                  <th>Referencia</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap">{formatDateTime(m.date)}</td>
                    <td>{TYPE_LABEL[m.type]}</td>
                    <td className="text-right">{m.quantity}</td>
                    <td className="text-right">{m.balance_after}</td>
                    <td className="max-w-[160px] truncate" title={m.reference}>
                      {m.reference}
                    </td>
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
