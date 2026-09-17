"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Panel" },
  { href: "/notas-entrega", label: "Notas de entrega" },
  { href: "/clientes", label: "Clientes" },
  { href: "/productos", label: "Productos" },
  { href: "/reportes/inventario", label: "Inventario" },
  { href: "/reportes/facturado", label: "Facturado" },
  { href: "/kardex", label: "Kardex" },
];

export default function Nav({
  companyName,
  logoDataUrl,
}: {
  companyName: string;
  logoDataUrl: string | null;
}) {
  const pathname = usePathname();

  return (
    <header className="no-print border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          {logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoDataUrl} alt={companyName} className="h-8 w-8 rounded object-contain" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 text-sm font-bold text-white">
              {companyName.slice(0, 1).toUpperCase() || "E"}
            </span>
          )}
          <span className="truncate max-w-[14rem]">{companyName}</span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1 text-sm">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/empresa"
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            pathname === "/empresa" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Empresa
        </Link>
      </div>
    </header>
  );
}
