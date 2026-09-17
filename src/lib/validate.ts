export class ValidationError extends Error {}

export function isUniqueConstraintError(err: unknown): boolean {
  // '23505' es el código SQLSTATE de Postgres para unique_violation.
  return err instanceof Error && (err as { code?: string }).code === "23505";
}

export function requireString(value: FormDataEntryValue | null, label: string): string {
  const str = typeof value === "string" ? value.trim() : "";
  if (!str) throw new ValidationError(`${label} es obligatorio.`);
  return str;
}

export function optionalString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function requireNumber(value: FormDataEntryValue | null, label: string): number {
  const num = Number(value);
  if (typeof value !== "string" || value.trim() === "" || Number.isNaN(num)) {
    throw new ValidationError(`${label} debe ser un número válido.`);
  }
  return num;
}

export function requirePositiveNumber(value: FormDataEntryValue | null, label: string): number {
  const num = requireNumber(value, label);
  if (num <= 0) throw new ValidationError(`${label} debe ser mayor que cero.`);
  return num;
}

export function requireNonNegativeNumber(value: FormDataEntryValue | null, label: string): number {
  const num = requireNumber(value, label);
  if (num < 0) throw new ValidationError(`${label} no puede ser negativo.`);
  return num;
}

export function requireInt(value: FormDataEntryValue | null, label: string): number {
  const num = requireNumber(value, label);
  if (!Number.isInteger(num)) throw new ValidationError(`${label} debe ser un número entero.`);
  return num;
}
