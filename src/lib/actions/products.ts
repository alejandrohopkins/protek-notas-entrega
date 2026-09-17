"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProduct, updateProduct, setProductActive } from "@/lib/repo/products";
import { registerMovement } from "@/lib/repo/inventory";
import {
  requireString,
  optionalString,
  requireNonNegativeNumber,
  ValidationError,
  isUniqueConstraintError,
} from "@/lib/validate";
import type { ActionState, MovementType } from "@/lib/types";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

async function readProductInput(formData: FormData) {
  const name = requireString(formData.get("name"), "El nombre");
  const skuRaw = optionalString(formData.get("sku"));
  const model = optionalString(formData.get("model"));
  const color = optionalString(formData.get("color"));
  const size = optionalString(formData.get("size"));
  const unit = optionalString(formData.get("unit")) || "unidad";
  const description = optionalString(formData.get("description"));
  const price = requireNonNegativeNumber(formData.get("price"), "El precio");
  const removePhoto = formData.get("removePhoto") === "on";

  let photoDataUrl: string | undefined;
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      throw new ValidationError("La foto debe ser un archivo de imagen.");
    }
    if (file.size > MAX_PHOTO_BYTES) {
      throw new ValidationError("La foto no debe superar 2 MB.");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    photoDataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
  }

  return { name, sku: skuRaw || null, model, color, size, unit, description, price, photoDataUrl, removePhoto };
}

export async function createProductAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let productId: number;
  try {
    const input = await readProductInput(formData);
    const initialStock = requireNonNegativeNumber(
      formData.get("initialStock") || "0",
      "El inventario inicial",
    );
    const product = await createProduct(input);
    productId = product.id;
    if (initialStock > 0) {
      await registerMovement({
        productId,
        type: "ENTRADA",
        quantity: initialStock,
        note: "Carga inicial de inventario",
      });
    }
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    if (isUniqueConstraintError(err)) return { error: "Ya existe un producto con ese SKU." };
    console.error(err);
    return { error: "No se pudo guardar el producto." };
  }
  revalidatePath("/productos");
  redirect(`/productos/${productId}`);
}

export async function updateProductAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const id = Number(formData.get("id"));
    if (!id) return { error: "Producto inválido." };
    const input = await readProductInput(formData);
    await updateProduct(id, input);
    revalidatePath("/productos");
    revalidatePath(`/productos/${id}`);
    return { success: "Producto actualizado." };
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    if (isUniqueConstraintError(err)) return { error: "Ya existe un producto con ese SKU." };
    console.error(err);
    return { error: "No se pudo actualizar el producto." };
  }
}

export async function setProductActiveAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "1";
  if (id) await setProductActive(id, active);
  revalidatePath("/productos");
  revalidatePath(`/productos/${id}`);
}

export async function registerMovementAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const productId = Number(formData.get("productId"));
    if (!productId) return { error: "Producto inválido." };
    const type = String(formData.get("type")) as MovementType;
    if (!["ENTRADA", "SALIDA", "AJUSTE"].includes(type)) {
      return { error: "Tipo de movimiento inválido." };
    }
    const quantity = requireNonNegativeNumber(formData.get("quantity"), "La cantidad");
    const note = optionalString(formData.get("note"));
    const newBalance = await registerMovement({ productId, type, quantity, note });
    revalidatePath(`/productos/${productId}`);
    revalidatePath("/productos");
    revalidatePath("/kardex");
    revalidatePath("/reportes/inventario");
    return { success: `Movimiento registrado. Nuevo saldo: ${newBalance}.` };
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    if (err instanceof Error) return { error: err.message };
    console.error(err);
    return { error: "No se pudo registrar el movimiento." };
  }
}
