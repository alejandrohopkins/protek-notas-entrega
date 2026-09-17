"use server";

import { revalidatePath } from "next/cache";
import { updateCompany } from "@/lib/repo/company";
import { requireString, optionalString, ValidationError } from "@/lib/validate";
import { CURRENCIES, normalizeRif } from "@/lib/format";
import type { ActionState } from "@/lib/types";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export async function updateCompanyAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const name = requireString(formData.get("name"), "El nombre de la empresa");
    const rifRaw = optionalString(formData.get("rif"));
    const rif = rifRaw ? normalizeRif(rifRaw) : "";
    const address = optionalString(formData.get("address"));
    const phone = optionalString(formData.get("phone"));
    const email = optionalString(formData.get("email"));
    const currencyRaw = optionalString(formData.get("currency")) || "USD";
    const currency = (CURRENCIES as readonly string[]).includes(currencyRaw) ? currencyRaw : "USD";
    const removeLogo = formData.get("removeLogo") === "on";

    let logoDataUrl: string | undefined;
    const file = formData.get("logo");
    if (file instanceof File && file.size > 0) {
      if (!file.type.startsWith("image/")) {
        return { error: "El logo debe ser un archivo de imagen." };
      }
      if (file.size > MAX_LOGO_BYTES) {
        return { error: "El logo no debe superar 2 MB." };
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      logoDataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    }

    await updateCompany({ name, rif, address, phone, email, currency, logoDataUrl, removeLogo });
    revalidatePath("/", "layout");
    return { success: "Datos de la empresa actualizados." };
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    console.error(err);
    return { error: "No se pudo actualizar la empresa." };
  }
}
