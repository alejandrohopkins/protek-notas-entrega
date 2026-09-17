import { nowIso, queryAll, queryOne } from "@/lib/db";
import type { Company } from "@/lib/types";

export async function getCompany(): Promise<Company> {
  return (await queryOne<Company>("SELECT * FROM company WHERE id = 1"))!;
}

export interface UpdateCompanyInput {
  name: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  logoDataUrl?: string | null;
  removeLogo?: boolean;
}

export async function updateCompany(input: UpdateCompanyInput): Promise<Company> {
  const current = await getCompany();
  const nextLogo = input.removeLogo
    ? null
    : input.logoDataUrl !== undefined && input.logoDataUrl !== null
      ? input.logoDataUrl
      : current.logo_data_url;

  await queryAll(
    `UPDATE company SET name = ?, rif = ?, address = ?, phone = ?, email = ?, currency = ?, logo_data_url = ?, updated_at = ? WHERE id = 1`,
    [
      input.name,
      input.rif,
      input.address,
      input.phone,
      input.email,
      input.currency,
      nextLogo,
      nowIso(),
    ],
  );
  return getCompany();
}
