// India-day range [from, to] as UTC instants (IST = UTC+5:30).
export function istRange(from: string, to: string) {
  const start = new Date(`${from}T00:00:00+05:30`);
  const end = new Date(`${to}T00:00:00+05:30`);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

// RFC 4180 CSV. Text starting with = + - @ gets a ' prefix so spreadsheets don't run it as a formula.
export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const cell = (v: unknown) => {
    let s = v instanceof Date ? v.toISOString() : v == null ? "" : String(v);
    if (/^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((r) => headers.map((h) => cell(r[h])).join(","))].join("\r\n");
}
