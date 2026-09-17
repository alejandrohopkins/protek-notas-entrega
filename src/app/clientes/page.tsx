import Link from "next/link";
import { listClients } from "@/lib/repo/clients";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; all?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const showAll = sp.all === "1";
  const clients = listClients({ includeInactive: showAll });
  const filtered = q
    ? clients.filter(
        (c) => c.name.toLowerCase().includes(q) || c.rif.toLowerCase().includes(q),
      )
    : clients;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Clientes</h1>
        <Link href="/clientes/nuevo" className="btn-primary">
          + Nuevo cliente
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form className="flex-1 min-w-[200px]">
          {showAll && <input type="hidden" name="all" value="1" />}
          <input
            type="text"
            name="q"
            defaultValue={sp.q}
            placeholder="Buscar por nombre o RIF…"
            className="input"
          />
        </form>
        <Link
          href={showAll ? "/clientes" : "/clientes?all=1"}
          className="text-sm text-slate-500 hover:underline"
        >
          {showAll ? "Ver solo activos" : "Ver archivados también"}
        </Link>
      </div>

      <div className="card overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500">No hay clientes que coincidan.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>RIF</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className={c.active ? "" : "opacity-50"}>
                  <td>
                    <Link href={`/clientes/${c.id}`} className="font-medium text-slate-900 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td>{c.rif}</td>
                  <td className="max-w-[220px] truncate">{c.address}</td>
                  <td>{c.phone}</td>
                  <td className="text-right">
                    <Link href={`/clientes/${c.id}`} className="text-sm text-slate-500 hover:underline">
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
