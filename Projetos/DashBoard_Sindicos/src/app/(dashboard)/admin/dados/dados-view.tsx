"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate, formatDateLong } from "@/lib/formatters";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Condominio {
  id: string;
  nome: string;
}

interface VendaRow {
  id: string;
  data: string;
  unidade: string;
  valorVenda: number;
  importadoEm: string;
  condominioId: string;
  condominioNome: string;
}

interface ApiResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  vendas: VendaRow[];
}

interface DadosViewProps {
  condominios: Condominio[];
}

export function DadosView({ condominios }: DadosViewProps) {
  const [condominioId, setCondominioId] = useState<string>("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (condominioId !== "todos") params.set("condominioId", condominioId);
    if (dataInicio) params.set("dataInicio", dataInicio);
    if (dataFim) params.set("dataFim", dataFim);

    const res = await fetch(`/api/vendas?${params}`);
    const json: ApiResponse = await res.json();
    setData(json);
    setSelected(new Set());
    setLoading(false);
  }, [condominioId, dataInicio, dataFim, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleFilterChange() {
    setPage(1);
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!data) return;
    const allIds = data.vendas.map((v) => v.id);
    const allSelected = allIds.every((id) => selected.has(id));
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        allIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        allIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch("/api/vendas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setDeleting(false);
    setConfirmOpen(false);
    setPage(1);
    fetchData();
  }

  const allPageSelected =
    data && data.vendas.length > 0 && data.vendas.every((v) => selected.has(v.id));

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-minimerx-navy">Dados Importados</h1>
          <p className="mt-1 text-sm text-minimerx-gray">
            Visualize e exclua registros de vendas importados via planilha.
          </p>
        </div>
        <Button
          variant="destructive"
          disabled={selected.size === 0}
          onClick={() => setConfirmOpen(true)}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Excluir selecionados ({selected.size})
        </Button>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-minimerx-gray">Condomínio</Label>
          <Select
            value={condominioId}
            onValueChange={(v) => { setCondominioId(v); handleFilterChange(); }}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {condominios.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-minimerx-gray">Data início</Label>
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => { setDataInicio(e.target.value); handleFilterChange(); }}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-minimerx-gray">Data fim</Label>
          <Input
            type="date"
            value={dataFim}
            onChange={(e) => { setDataFim(e.target.value); handleFilterChange(); }}
            className="w-40"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={!!allPageSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 accent-minimerx-green"
                  />
                </TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Condomínio</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Importado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.vendas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-minimerx-gray">
                    Nenhum registro encontrado com os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                data?.vendas.map((v) => (
                  <TableRow
                    key={v.id}
                    className={selected.has(v.id) ? "bg-red-50" : undefined}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(v.id)}
                        onChange={() => toggleRow(v.id)}
                        className="h-4 w-4 rounded border-slate-300 accent-minimerx-green"
                      />
                    </TableCell>
                    <TableCell>{formatDate(v.data)}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {v.condominioNome}
                    </TableCell>
                    <TableCell className="text-sm">{v.unidade}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(v.valorVenda)}
                    </TableCell>
                    <TableCell className="text-xs text-minimerx-gray">
                      {formatDateLong(v.importadoEm)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* Paginação */}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <p className="text-xs text-minimerx-gray">
            {data
              ? `${data.total} registros — página ${data.page} de ${data.totalPages}`
              : "Carregando…"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data || page >= data.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog de confirmação */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar exclusão
            </DialogTitle>
            <DialogDescription>
              Você está prestes a excluir <strong>{selected.size}</strong>{" "}
              {selected.size === 1 ? "registro" : "registros"} de forma permanente.
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Excluindo…" : "Confirmar exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
