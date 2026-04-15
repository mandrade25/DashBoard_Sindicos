"use client";

import { useEffect, useState } from "react";
import { Building2, Menu } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface CondominioOption {
  id: string;
  nome: string;
}

export interface TopbarProps {
  role: "ADMIN" | "SINDICO";
  condominioNome?: string | null;
  condominioIdSelecionado?: string | null;
  onSelecionarCondominio?: (id: string) => void;
  condominios?: CondominioOption[];
}

export function Topbar({
  role,
  condominioNome,
  condominioIdSelecionado,
  onSelecionarCondominio,
  condominios,
}: TopbarProps) {
  const [selected, setSelected] = useState<string | undefined>(
    condominioIdSelecionado ?? undefined,
  );

  useEffect(() => {
    setSelected(condominioIdSelecionado ?? undefined);
  }, [condominioIdSelecionado]);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Hambúrguer mobile */}
        <button
          type="button"
          data-menu-toggle="true"
          className="rounded-md p-1.5 text-minimerx-navy hover:bg-slate-100 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Building2 className="h-5 w-5 text-minimerx-blue" />
        {role === "ADMIN" && condominios ? (
          <Select
            value={selected}
            onValueChange={(v) => {
              setSelected(v);
              onSelecionarCondominio?.(v);
            }}
          >
            <SelectTrigger className="min-w-[200px] md:min-w-[280px]">
              <SelectValue placeholder="Selecione um condomínio" />
            </SelectTrigger>
            <SelectContent>
              {condominios.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm font-semibold text-minimerx-navy">{condominioNome}</span>
        )}
      </div>
    </header>
  );
}
