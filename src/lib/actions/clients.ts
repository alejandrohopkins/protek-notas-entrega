"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, updateClient, setClientActive } from "@/lib/repo/clients";
import { normalizeRif, isValidRif } from "@/lib/format";
import { requireString, optionalString, ValidationError, isUniqueConstraintError } from "@/lib/validate";
import type { ActionState } from "@/lib/types";

function readClientInput(formData: FormData) {
  const name = requireString(formData.get("name"), "El nombre");
  const rifRaw = requireString(formData.get("rif"), "El RIF");
  if (!isValidRif(rifRaw)) {
    throw new ValidationError("El RIF debe tener el formato Letra-Números, por ejemplo J-12345678-9.");
  }
  const rif = normalizeRif(rifRaw);
  const address = optionalString(formData.get("address"));
  const phone = optionalString(formData.get("phone"));
  const email = optionalString(formData.get("email"));
  return { name, rif, address, phone, email };
}

export async function createClientAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let clientId: number;
  try {
    const input = readClientInput(formData);
    clientId = createClient(input).id;
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    if (isUniqueConstraintError(err)) return { error: "Ya existe un cliente registrado con ese RIF." };
    console.error(err);
    return { error: "No se pudo guardar el cliente." };
  }
  revalidatePath("/clientes");
  redirect(`/clientes/${clientId}`);
}

export async function updateClientAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const id = Number(formData.get("id"));
    if (!id) return { error: "Cliente inválido." };
    const input = readClientInput(formData);
    updateClient(id, input);
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    return { success: "Cliente actualizado." };
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    if (isUniqueConstraintError(err)) return { error: "Ya existe un cliente registrado con ese RIF." };
    console.error(err);
    return { error: "No se pudo actualizar el cliente." };
  }
}

export async function setClientActiveAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "1";
  if (id) setClientActive(id, active);
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
}
