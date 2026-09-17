import Link from "next/link";
import ClienteForm from "../ClienteForm";
import { createClientAction } from "@/lib/actions/clients";

export default function NuevoClientePage() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Nuevo cliente</h1>
        <Link href="/clientes" className="text-sm text-slate-500 hover:underline">
          ← Volver a clientes
        </Link>
      </div>
      <ClienteForm action={createClientAction} submitLabel="Crear cliente" />
    </div>
  );
}
