import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Converte string "YYYY-MM-DD" para Date local (sem deslocamento de fuso) */
function parseDateString(d: string): Date {
  return parse(d, "yyyy-MM-dd", new Date());
}

export const formatCurrency = (value: number | string | null | undefined): string => {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(n) ? n : 0);
};

export const formatCurrencyCompact = (value: number | string | null | undefined): string => {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(n) ? n : 0);
};

export const formatPercent = (value: number | string | null | undefined): string => {
  const n = Number(value ?? 0);
  return `${n.toFixed(2).replace(".", ",")}%`;
};

export const formatDate = (d: Date | string): string => {
  const date = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)
    ? parseDateString(d)
    : new Date(d);
  return format(date, "dd/MM/yyyy", { locale: ptBR });
};

export const formatDateTime = (d: Date | string): string => {
  const date = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)
    ? parseDateString(d)
    : new Date(d);
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

export const formatDateShort = (d: Date | string): string => {
  const date = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)
    ? parseDateString(d)
    : new Date(d);
  return format(date, "dd/MM", { locale: ptBR });
};

export const formatDateLong = (d: Date | string): string =>
  format(new Date(d), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

export const formatWeekLabel = (d: string): string => {
  const day = parseInt(d.substring(8, 10), 10);
  const weekNum = Math.floor((day - 1) / 7) + 1;
  return `Sem ${weekNum}`;
};

export const formatWeekTooltip = (d: string): string => {
  const year = parseInt(d.substring(0, 4), 10);
  const month = parseInt(d.substring(5, 7), 10) - 1;
  const day = parseInt(d.substring(8, 10), 10);
  const weekNum = Math.floor((day - 1) / 7) + 1;
  const startDay = (weekNum - 1) * 7 + 1;
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const endDay = Math.min(startDay + 6, lastDayOfMonth);
  const monthName = format(new Date(year, month, 1), "MMM", { locale: ptBR })
    .replace(".", "");
  const monthCap = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `Sem ${weekNum} (${String(startDay).padStart(2, "0")}–${String(endDay).padStart(2, "0")}/${monthCap})`;
};

export const formatMonth = (d: string): string => {
  const year = parseInt(d.substring(0, 4), 10);
  const month = parseInt(d.substring(5, 7), 10) - 1;
  const name = format(new Date(year, month, 1), "MMM", { locale: ptBR }).replace(".", "");
  return name.charAt(0).toUpperCase() + name.slice(1);
};

export const formatMonthLong = (d: string): string => {
  const year = parseInt(d.substring(0, 4), 10);
  const month = parseInt(d.substring(5, 7), 10) - 1;
  const name = format(new Date(year, month, 1), "MMMM", { locale: ptBR });
  return name.charAt(0).toUpperCase() + name.slice(1) + `/${year}`;
};

export const normalizeUnidade = (raw: string): string =>
  raw
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
