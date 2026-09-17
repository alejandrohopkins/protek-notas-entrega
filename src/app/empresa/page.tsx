import { connection } from "next/server";
import { getCompany } from "@/lib/repo/company";
import EmpresaForm from "./EmpresaForm";

export default async function EmpresaPage() {
  await connection();
  const company = await getCompany();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Datos de la empresa</h1>
      <p className="mb-6 text-sm text-slate-500">
        Esta información aparece en el encabezado de tus notas de entrega y en el logo del sistema.
      </p>
      <EmpresaForm company={company} />
    </div>
  );
}
