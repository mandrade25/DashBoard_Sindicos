import * as XLSX from "xlsx";
import { parse as parseDate, isValid } from "date-fns";
import { normalizeUnidade } from "@/lib/formatters";

export interface VendaImportada {
  unidadeRaw: string;
  unidadeNorm: string;
  data: Date;
  valorVenda: number;
  linha: number;
}

export interface ParseResult {
  vendas: VendaImportada[];
  erros: string[];
}

const MAX_IMPORT_ROWS = 10000;

/**
 * Parser de planilha .xls/.xlsx no formato MiniMerX:
 *   Coluna A: Unidade (nome do condomínio)
 *   Coluna B: Data (dd/MM/yyyy ou serial Excel)
 *   Coluna C: Nº Vendas (quantidade — ignorado)
 *   Coluna D: Vl Venda (decimal)
 */
export function parseExcel(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    header: "A",
    raw: true,
    defval: null,
  });

  if (rows.length > MAX_IMPORT_ROWS) {
    return {
      vendas: [],
      erros: [
        `Planilha excede o limite de ${MAX_IMPORT_ROWS} linhas permitidas para importacao.`,
      ],
    };
  }

  const vendas: VendaImportada[] = [];
  const erros: string[] = [];

  rows.forEach((row, idx) => {
    const linha = idx + 1;

    const unidadeRaw = row["A"];
    const dataRaw = row["B"];
    // Coluna C = número de vendas (quantidade), Coluna D = valor monetário
    const valorRaw = row["D"];

    if (unidadeRaw == null && dataRaw == null && row["C"] == null && valorRaw == null) return;

    if (
      typeof unidadeRaw === "string" &&
      (unidadeRaw.toLowerCase().includes("unidade") ||
        unidadeRaw.toLowerCase().includes("condom"))
    ) {
      return;
    }

    if (!unidadeRaw || !dataRaw || valorRaw == null) {
      erros.push(`Linha ${linha}: campos obrigatórios ausentes.`);
      return;
    }

    const unidadeStr = String(unidadeRaw);
    const data = parseExcelDate(dataRaw);
    if (!data) {
      erros.push(`Linha ${linha}: data inválida (${String(dataRaw)}).`);
      return;
    }

    const valor = parseDecimal(valorRaw);
    if (valor == null) {
      erros.push(`Linha ${linha}: valor inválido (${String(valorRaw)}).`);
      return;
    }

    vendas.push({
      unidadeRaw: unidadeStr,
      unidadeNorm: normalizeUnidade(unidadeStr),
      data,
      valorVenda: valor,
      linha,
    });
  });

  return { vendas, erros };
}

function parseExcelDate(raw: unknown): Date | null {
  if (typeof raw === "number") {
    const parsed = XLSX.SSF.parse_date_code(raw);
    if (!parsed) return null;
    const d = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    return isValid(d) ? d : null;
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    const formats = ["dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd", "dd-MM-yyyy"];
    for (const fmt of formats) {
      const d = parseDate(trimmed, fmt, new Date());
      if (isValid(d)) return d;
    }
  }
  return null;
}

function parseDecimal(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "string") {
    const cleaned = raw
      .replace(/R\$\s*/gi, "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
