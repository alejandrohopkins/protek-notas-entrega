import Link from "next/link";
import { connection } from "next/server";
import { listClients } from "@/lib/repo/clients";
import { listProducts } from "@/lib/repo/products";
import NuevaNotaForm from "./NuevaNotaForm";

export default async function NuevaNotaPage() {
  await connection();
  const clients = await listClients();
  const products = await listProducts();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Nueva nota de entrega</h1>

      {clients.length === 0 ? (
        <p className="card text-sm text-slate-600">
          Primero registra un{" "}
          <Link href="/clientes/nuevo" className="font-medium underline">
            cliente
          </Link>{" "}
          para poder emitir una nota de entrega.
        </p>
      ) : products.length === 0 ? (
        <p className="card text-sm text-slate-600">
          Primero registra un{" "}
          <Link href="/productos/nuevo" className="font-medium underline">
            producto
          </Link>{" "}
          para poder emitir una nota de entrega.
        </p>
      ) : (
        <NuevaNotaForm clients={clients} products={products} />
      )}
    </div>
  );
}
