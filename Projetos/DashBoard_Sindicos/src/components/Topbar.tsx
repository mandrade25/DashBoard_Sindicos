"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Building2, Menu } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      {/* Linha principal */}
      <div className="flex h-14 items-center px-4 lg:h-16 lg:px-6">
        {/* Hambúrguer — só mobile */}
        <button
          type="button"
          data-menu-toggle="true"
          className="mr-3 rounded-md p-1.5 text-minimerx-navy hover:bg-slate-100 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo — só mobile (no desktop está na sidebar) */}
        <div className="flex flex-1 items-center justify-center lg:hidden">
          <Image
            src="/logo-modelo2.svg"
            alt="MiniMerX"
            width={110}
            height={36}
            priority
            style={{ height: "auto" }}
          />
        </div>

        {/* Nome do condomínio mobile — só SINDICO */}
        {role === "SINDICO" ? (
          <div className="ml-3 flex-shrink-0 lg:hidden">
            <span className="max-w-[110px] truncate text-xs font-medium text-minimerx-gray">
              {condominioNome ?? ""}
            </span>
          </div>
        ) : null}

        {/* Seletor de condomínio — só desktop */}
        <div className="hidden items-center gap-3 lg:flex">
          <Building2 className="h-5 w-5 text-minimerx-blue" />
          {role === "ADMIN" && condominios ? (
            <Select
              value={selected}
              onValueChange={(v) => {
                setSelected(v);
                onSelecionarCondominio?.(v);
              }}
            >
              <SelectTrigger className="min-w-[280px]">
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
            <span className="text-sm font-semibold text-minimerx-navy">
              {condominioNome}
            </span>
          )}
        </div>
      </div>

      {/* Segunda linha — seletor de condomínio para ADMIN no mobile */}
      {role === "ADMIN" && condominios ? (
        <div className="border-t border-slate-100 px-4 py-2 lg:hidden">
          <Select
            value={selected}
            onValueChange={(v) => {
              setSelected(v);
              onSelecionarCondominio?.(v);
            }}
          >
            <SelectTrigger className="w-full">
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
        </div>
      ) : null}
    </header>
  );
}
