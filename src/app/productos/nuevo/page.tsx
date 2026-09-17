import Link from "next/link";
import ProductoForm from "../ProductoForm";
import { createProductAction } from "@/lib/actions/products";

export default function NuevoProductoPage() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Nuevo producto</h1>
        <Link href="/productos" className="text-sm text-slate-500 hover:underline">
          ← Volver a productos
        </Link>
      </div>
      <ProductoForm action={createProductAction} submitLabel="Crear producto" />
    </div>
  );
}
