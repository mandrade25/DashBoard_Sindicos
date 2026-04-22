import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function toCompetencia(date: Date): string {
  return format(date, "yyyy-MM");
}

export function competenciaLabel(competencia: string): string {
  const [year, month] = competencia.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  const name = format(d, "MMMM", { locale: ptBR });
  return name.charAt(0).toUpperCase() + name.slice(1) + `/${year}`;
}

export function isValidPastCompetencia(competencia: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(competencia)) return false;
  const [year, month] = competencia.split("-").map(Number);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const nowYM = now.getFullYear() * 100 + (now.getMonth() + 1);
  const cYM = year * 100 + month;
  return cYM <= nowYM;
}

export function competenciasRange(from: string, to: string): string[] {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  const result: string[] = [];
  let y = fy, m = fm;
  while (y * 100 + m <= ty * 100 + tm) {
    result.push(`${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return result;
}

export function nextMonthStart(competencia: string): Date {
  const [y, m] = competencia.split("-").map(Number);
  if (m === 12) return new Date(y + 1, 0, 1);
  return new Date(y, m, 1);
}
