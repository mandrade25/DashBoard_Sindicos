"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MessageSquareText, Search } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/formatters";

interface ObservacaoItem {
  id: string;
  condominioNome: string;
  competencia: string;
  competenciaLabel: string;
  texto: string;
  escopo: "PUBLICA" | "INTERNA";
  status: string;
  atualizadoEm: string;
}

export function ObservacoesView({ items }: { items: ObservacaoItem[] }) {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all");

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (scope !== "all" && item.escopo !== scope) return false;
      if (!term) return true;
      return [item.condominioNome, item.competenciaLabel, item.texto]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [items, search, scope]);

  return (
    <>
      <Topbar role="ADMIN" condominioNome="Observacoes administrativas" />
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-minimerx-navy">Observacoes administrativas</h1>
            <p className="mt-1 text-sm text-minimerx-gray">
              Painel editorial das observacoes ja registradas nos comprovantes, com escopo interno
              ou publico para o condominio.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/comprovantes">Gerenciar nos comprovantes</Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-minimerx-gray" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por condominio, competencia ou texto"
                className="pl-9"
              />
            </div>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger>
                <SelectValue placeholder="Escopo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os escopos</SelectItem>
                <SelectItem value="PUBLICA">Publicas</SelectItem>
                <SelectItem value="INTERNA">Internas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-minimerx-gray">
              Observacoes listadas
            </p>
            <p className="mt-2 text-3xl font-bold text-minimerx-navy">{filteredItems.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-minimerx-gray">
              Publicadas ao condominio
            </p>
            <p className="mt-2 text-3xl font-bold text-minimerx-green">
              {filteredItems.filter((item) => item.escopo === "PUBLICA").length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-minimerx-gray">
              Uso interno
            </p>
            <p className="mt-2 text-3xl font-bold text-minimerx-blue">
              {filteredItems.filter((item) => item.escopo === "INTERNA").length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-minimerx-light">
                <MessageSquareText className="h-8 w-8 text-minimerx-gray" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-minimerx-navy">
                Nenhuma observacao encontrada
              </h2>
              <p className="mt-2 text-sm text-minimerx-gray">
                Ajuste os filtros ou registre observacoes na tela de comprovantes.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-minimerx-navy">
                      {item.condominioNome} — {item.competenciaLabel}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-minimerx-gray">
                      {item.status} • Atualizada em {formatDateTime(item.atualizadoEm)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      item.escopo === "PUBLICA"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.escopo === "PUBLICA" ? "Visivel ao condominio" : "Uso interno"}
                  </span>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-minimerx-gray">{item.texto}</p>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
