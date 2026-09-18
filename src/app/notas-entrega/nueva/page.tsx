import Link from "next/link";
import { connection } from "next/server";
import { listClients } from "@/lib/repo/clients";
import { listProducts, listProductReferences } from "@/lib/repo/products";
import { getDeliveryNoteById, getDeliveryNoteItems } from "@/lib/repo/deliveryNotes";
import { noteNumber } from "@/lib/format";
import NuevaNotaForm from "./NuevaNotaForm";

export default async function NuevaNotaPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicateFrom?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const clients = await listClients();
  const products = await listProducts();
  const references = await listProductReferences();

  let initialClientId: number | undefined;
  let initialLines: { productId: number; quantity: string; unitPrice: string }[] | undefined;
  let initialNotes: string | undefined;
  let duplicatedFromLabel: string | undefined;

  const duplicateFromId = sp.duplicateFrom ? Number(sp.duplicateFrom) : undefined;
  if (duplicateFromId) {
    const original = await getDeliveryNoteById(duplicateFromId);
    if (original) {
      const originalItems = await getDeliveryNoteItems(duplicateFromId);
      initialClientId = original.client_id;
      initialNotes = original.notes;
      initialLines = originalItems.map((item) => ({
        productId: item.product_id,
        quantity: String(item.quantity),
        unitPrice: String(item.unit_price),
      }));
      duplicatedFromLabel = noteNumber(original.id);
    }
  }

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
        <NuevaNotaForm
          clients={clients}
          products={products}
          references={references}
          initialClientId={initialClientId}
          initialLines={initialLines}
          initialNotes={initialNotes}
          duplicatedFromLabel={duplicatedFromLabel}
        />
      )}
    </div>
  );
}
