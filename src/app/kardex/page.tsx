import { listProducts, getProductById } from "@/lib/repo/products";
import { listMovements } from "@/lib/repo/inventory";
import { formatDateTime } from "@/lib/format";

const TYPE_LABEL: Record<string, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  AJUSTE: "Ajuste",
};

export default async function KardexPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const products = listProducts({ includeInactive: true });
  const productId = sp.productId ? Number(sp.productId) : undefined;
  const product = productId ? getProductById(productId) : undefined;
  const movements = productId
    ? listMovements({ productId, from: sp.from || undefined, to: sp.to || undefined })
    : [];

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Kardex de inventario</h1>
      <p className="mb-4 text-sm text-slate-500">
        Movimientos de entradas, salidas y ajustes de cada producto.
      </p>

      <form className="card mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="label" htmlFor="productId">
            Producto
          </label>
          <select id="productId" name="productId" defaultValue={sp.productId ?? ""} className="select" required>
            <option value="" disabled>
              Selecciona un producto…
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.active ? "" : " (archivado)"}
              </option>
            ))}
          </select>
        </div>
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
          Ver movimientos
        </button>
      </form>

      {product && (
        <div className="card overflow-x-auto">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold text-slate-900">{product.name}</h2>
            <span className="text-sm text-slate-500">
              Saldo actual: <span className="font-semibold text-slate-800">{product.stock} {product.unit}</span>
            </span>
          </div>
          {movements.length === 0 ? (
            <p className="text-sm text-slate-500">No hay movimientos en este período.</p>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th className="text-right">Cantidad</th>
                  <th className="text-right">Saldo</th>
                  <th>Referencia</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap">{formatDateTime(m.date)}</td>
                    <td>{TYPE_LABEL[m.type]}</td>
                    <td className="text-right">{m.quantity}</td>
                    <td className="text-right">{m.balance_after}</td>
                    <td>{m.reference}</td>
                    <td className="max-w-[200px] truncate" title={m.note}>
                      {m.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
