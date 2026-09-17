import Link from "next/link";
import { listProducts } from "@/lib/repo/products";
import { getCompany } from "@/lib/repo/company";
import { formatMoney } from "@/lib/format";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; all?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const showAll = sp.all === "1";
  const company = await getCompany();
  const products = await listProducts({ includeInactive: showAll });
  const filtered = q
    ? products.filter((p) =>
        [p.name, p.sku ?? "", p.model, p.color, p.size]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : products;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Productos</h1>
        <Link href="/productos/nuevo" className="btn-primary">
          + Nuevo producto
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form className="flex-1 min-w-[200px]">
          {showAll && <input type="hidden" name="all" value="1" />}
          <input
            type="text"
            name="q"
            defaultValue={sp.q}
            placeholder="Buscar por nombre, SKU, modelo, color o talla…"
            className="input"
          />
        </form>
        <Link
          href={showAll ? "/productos" : "/productos?all=1"}
          className="text-sm text-slate-500 hover:underline"
        >
          {showAll ? "Ver solo activos" : "Ver archivados también"}
        </Link>
        <span className="text-sm text-slate-400">{filtered.length} productos</span>
      </div>

      <div className="card overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500">No hay productos que coincidan.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th></th>
                <th>Producto</th>
                <th>Modelo</th>
                <th>Color</th>
                <th>Talla</th>
                <th className="text-right">Precio</th>
                <th className="text-right">Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                  <td>
                    {p.photo_data_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photo_data_url}
                        alt={p.name}
                        className="h-9 w-9 rounded object-cover"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded bg-slate-100" />
                    )}
                  </td>
                  <td>
                    <Link href={`/productos/${p.id}`} className="font-medium text-slate-900 hover:underline">
                      {p.name}
                    </Link>
                    {p.sku && <div className="text-xs text-slate-400">{p.sku}</div>}
                  </td>
                  <td>{p.model || "—"}</td>
                  <td>{p.color || "—"}</td>
                  <td>{p.size || "—"}</td>
                  <td className="text-right">{formatMoney(p.price, company.currency)}</td>
                  <td className="text-right">
                    <span
                      className={
                        p.stock <= LOW_STOCK_THRESHOLD ? "font-semibold text-amber-600" : ""
                      }
                    >
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td className="text-right">
                    <Link href={`/productos/${p.id}`} className="text-sm text-slate-500 hover:underline">
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
