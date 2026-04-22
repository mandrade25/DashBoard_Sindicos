"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AuditItem {
  id: string;
  tipo: string;
  entidade: string;
  entidadeId: string;
  usuarioId: string | null;
  usuarioRole: string | null;
  descricao: string;
  payload: Record<string, unknown> | null;
  ip: string | null;
  criadoEm: string;
}

interface Filters {
  tipo: string | null;
  entidade: string | null;
  from: string | null;
  to: string | null;
}

const TIPO_COLORS: Record<string, string> = {
  COMPROVANTE_CRIADO: "bg-blue-100 text-blue-700",
  COMPROVANTE_SUBSTITUIDO: "bg-yellow-100 text-yellow-700",
  COMPROVANTE_CANCELADO: "bg-red-100 text-red-700",
  COMPROVANTE_ATUALIZADO: "bg-slate-100 text-slate-600",
  COMPROVANTE_BAIXADO: "bg-purple-100 text-purple-700",
  ENVIO_CRIADO: "bg-green-100 text-green-700",
  ENVIO_REENVIADO: "bg-teal-100 text-teal-700",
  ENVIO_FALHOU: "bg-red-100 text-red-700",
  DESTINATARIO_CADASTRADO: "bg-emerald-100 text-emerald-700",
  DESTINATARIO_REMOVIDO: "bg-orange-100 text-orange-700",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export function AuditoriaView({ items, total, page, pageSize, tiposDisponiveis, filters }: {
  items: AuditItem[];
  total: number;
  page: number;
  pageSize: number;
  tiposDisponiveis: string[];
  filters: Filters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== "__all__") next.set(key, value); else next.delete(key);
    next.delete("page");
    startTransition(() => router.replace(`${pathname}?${next.toString()}`));
  }

  function goToPage(p: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(p));
    startTransition(() => router.replace(`${pathname}?${next.toString()}`));
  }

  return (
    <>
      <Topbar role="ADMIN" condominioNome="Trilha de Auditoria" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-minimerx-navy">Trilha de Auditoria</h1>
          <p className="mt-1 text-sm text-minimerx-gray">
            Registro imutável de todas as ações relevantes do sistema. {total} evento(s) encontrado(s).
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 rounded-xl border bg-white p-4">
          <Select value={filters.tipo ?? "__all__"} onValueChange={(v) => updateParam("tipo", v)}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os tipos</SelectItem>
              {tiposDisponiveis.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.entidade ?? "__all__"} onValueChange={(v) => updateParam("entidade", v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas</SelectItem>
              {["Comprovante", "EnvioEmail", "Usuario", "Condominio"].map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            className="w-40"
            value={filters.from ?? ""}
            onChange={(e) => updateParam("from", e.target.value || null)}
            placeholder="De"
          />
          <Input
            type="date"
            className="w-40"
            value={filters.to ?? ""}
            onChange={(e) => updateParam("to", e.target.value || null)}
            placeholder="Até"
          />

          {(filters.tipo || filters.entidade || filters.from || filters.to) && (
            <Button variant="outline" size="sm" onClick={() => {
              startTransition(() => router.replace(pathname));
            }}>
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Tabela */}
        <div className="rounded-xl border bg-white">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Shield className="h-10 w-10 text-minimerx-gray" />
              <p className="text-lg font-semibold text-minimerx-navy">Nenhum evento encontrado</p>
              <p className="text-sm text-minimerx-gray">Tente ajustar os filtros.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Data / Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap text-xs text-minimerx-gray font-mono">
                      {formatDateTime(item.criadoEm)}
                    </TableCell>
                    <TableCell>
                      <Badge className={TIPO_COLORS[item.tipo] ?? "bg-slate-100 text-slate-600"}>
                        {item.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium">{item.entidade}</span>
                      <span className="ml-1 text-xs text-minimerx-gray font-mono">{item.entidadeId.slice(0, 8)}…</span>
                    </TableCell>
                    <TableCell className="max-w-xs text-sm text-minimerx-gray truncate" title={item.descricao}>
                      {item.descricao}
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.usuarioRole ? (
                        <Badge className="bg-slate-100 text-slate-600">{item.usuarioRole}</Badge>
                      ) : (
                        <span className="text-minimerx-gray">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-minimerx-gray">
                      {item.ip ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-minimerx-gray">
            <span>Página {page} de {totalPages} · {total} registros</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
