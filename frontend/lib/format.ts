// Vietnamese display formatting. Three screens each had their own
// `toLocaleDateString("vi-VN", …)` call with slightly different options.

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

/** "28/07/2026", or "—" when there is no date. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN", DATE_OPTIONS);
}

/** "28/07/2026 14:05", or "—" when there is no date. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    ...DATE_OPTIONS,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "thứ ba, 28 tháng 7" — for prose, e.g. the weekly report header. */
export function formatLongDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" });
}

/** "1.234₫" — the balance arrives from the API as a decimal string. */
export function formatBalance(raw: string | number | null | undefined): string {
  const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
  return isNaN(n) ? "0₫" : `${n.toLocaleString("vi-VN")}₫`;
}
