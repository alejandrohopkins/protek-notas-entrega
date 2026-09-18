/** Genera un CSV separado por `;` (el que Excel en español abre bien con doble clic), con BOM UTF-8. */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  function escape(value: string | number): string {
    const str = String(value);
    if (/[";\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const lines = [headers, ...rows].map((row) => row.map(escape).join(";"));
  return "﻿" + lines.join("\r\n");
}

export function csvResponse(csv: string, filename: string): Response {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}"`,
    },
  });
}
