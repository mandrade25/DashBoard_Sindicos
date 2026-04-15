"use client";

import { useMemo, useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

export interface SalesRow {
  date: string;
  value: number;
  accumulated: number;
}

export function SalesTable({ rows, loading }: { rows: SalesRow[]; loading?: boolean }) {
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => { setPage(1); }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginated = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page],
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-6 w-full last:mb-0" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-12 text-center">
        <Inbox className="h-12 w-12 text-minimerx-gray" />
        <p className="text-lg font-semibold text-minimerx-navy">Sem vendas no período</p>
        <p className="text-sm text-minimerx-gray">
          As vendas aparecerão aqui após o upload da próxima planilha.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Valor do dia</TableHead>
            <TableHead className="text-right">Acumulado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((row) => (
            <TableRow key={row.date}>
              <TableCell>{formatDate(row.date)}</TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(row.value)}
              </TableCell>
              <TableCell className="text-right text-minimerx-gray">
                {formatCurrency(row.accumulated)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
        <p className="text-xs text-minimerx-gray">
          Página {page} de {totalPages} — {rows.length} registros
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
