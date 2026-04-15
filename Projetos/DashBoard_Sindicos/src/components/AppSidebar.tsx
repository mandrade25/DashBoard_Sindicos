"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Building2, Database, LayoutDashboard, LayoutGrid, LogOut, Upload, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export interface AppSidebarProps {
  role: "ADMIN" | "SINDICO";
  usuarioNome: string;
  condominioNome?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ role, usuarioNome, condominioNome, isOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  const items =
    role === "ADMIN"
      ? [
          { href: "/admin/consolidado", label: "Visão Geral", icon: LayoutGrid },
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/admin/condominios", label: "Condomínios", icon: Building2 },
          { href: "/admin/upload", label: "Upload Excel", icon: Upload },
          { href: "/admin/dados", label: "Dados Importados", icon: Database },
        ]
      : [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }];

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-minimerx-navy text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <Image
          src="/logo-modelo2.svg"
          alt="MiniMerX"
          width={140}
          height={42}
          priority
          style={{ width: "140px", height: "auto" }}
        />
        {/* Botão fechar no mobile */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-2 rounded p-1 text-white/60 hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {condominioNome ? (
        <div className="border-b border-white/10 px-6 py-3">
          <p className="text-[10px] uppercase tracking-wide text-white/50">Condomínio</p>
          <p className="mt-0.5 truncate text-sm font-semibold" title={condominioNome}>
            {condominioNome}
          </p>
        </div>
      ) : null}

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-minimerx-green text-white"
                  : "text-white/80 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 px-2">
          <p className="text-[10px] uppercase tracking-wide text-white/50">Usuário</p>
          <p className="mt-0.5 truncate text-sm font-semibold" title={usuarioNome}>
            {usuarioNome}
          </p>
          <p className="text-[10px] text-white/50">{role === "ADMIN" ? "Administrador" : "Síndico"}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
        <p className="mt-3 text-center text-[10px] text-white/30">by LAVAX</p>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: fixo */}
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:flex">{sidebar}</div>

      {/* Mobile: overlay + drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">{sidebar}</div>
        </>
      )}
    </>
  );
}
