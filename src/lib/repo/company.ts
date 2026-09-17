import { getDb, nowIso, queryOne } from "@/lib/db";
import type { Company } from "@/lib/types";

export function getCompany(): Company {
  return queryOne<Company>("SELECT * FROM company WHERE id = 1")!;
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

export function updateCompany(input: UpdateCompanyInput): Company {
  const db = getDb();
  const current = getCompany();
  const nextLogo = input.removeLogo
    ? null
    : input.logoDataUrl !== undefined && input.logoDataUrl !== null
      ? input.logoDataUrl
      : current.logo_data_url;

  db.prepare(
    `UPDATE company SET name = ?, rif = ?, address = ?, phone = ?, email = ?, currency = ?, logo_data_url = ?, updated_at = ? WHERE id = 1`,
  ).run(
    input.name,
    input.rif,
    input.address,
    input.phone,
    input.email,
    input.currency,
    nextLogo,
    nowIso(),
  );
  return getCompany();
}
