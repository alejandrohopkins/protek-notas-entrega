export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: currency || "USD",
      currencyDisplay: "narrowSymbol",
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr.length <= 10 ? `${dateStr}T00:00:00` : dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function noteNumber(id: number): string {
  return `N.º ${String(id).padStart(6, "0")}`;
}

export function normalizeRif(input: string): string {
  const cleaned = input.trim().toUpperCase().replace(/\s+/g, "");
  const match = cleaned.match(/^([VEJPG])-?(\d{6,8})-?(\d)?$/);
  if (match) {
    const [, letter, digits, check] = match;
    return check ? `${letter}-${digits}-${check}` : `${letter}-${digits}`;
  }
  return cleaned;
}

export function isValidRif(input: string): boolean {
  return /^[VEJPG]-?\d{6,9}-?\d?$/.test(input.trim().toUpperCase());
}

export const CURRENCIES = ["USD", "VES", "EUR", "COP"] as const;
