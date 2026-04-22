"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  BellRing,
  Building2,
  CalendarDays,
  Database,
  FileCheck,
  History,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MessageSquareText,
  Shield,
  Upload,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/actions/logout";
import { cn } from "@/lib/utils";
import { APP_VERSION } from "@/lib/version";

export interface AppSidebarProps {
  role: "ADMIN" | "SINDICO";
  usuarioNome: string;
  condominioNome?: string | null;
  pendenciasCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({
  role,
  usuarioNome,
  condominioNome,
  pendenciasCount = 0,
  isOpen,
  onClose,
}: AppSidebarProps) {
  const pathname = usePathname();

  const items: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> =
    role === "ADMIN"
      ? [
          { href: "/admin/consolidado", label: "Visao Geral", icon: LayoutGrid },
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/admin/condominios", label: "Condominios", icon: Building2 },
          { href: "/admin/comprovantes", label: "Comprovantes", icon: FileCheck },
          { href: "/admin/observacoes", label: "Observacoes", icon: MessageSquareText },
          {
            href: "/admin/pendencias",
            label: "Pendencias",
            icon: AlertCircle,
            badge: pendenciasCount > 0 ? pendenciasCount : undefined,
          },
          { href: "/admin/calendario", label: "Calendario", icon: CalendarDays },
          { href: "/admin/auditoria", label: "Auditoria", icon: Shield },
          { href: "/admin/upload", label: "Upload Excel", icon: Upload },
          { href: "/admin/dados", label: "Dados Importados", icon: Database },
        ]
      : [
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/historico", label: "Historico", icon: History },
          { href: "/notificacoes", label: "Notificacoes", icon: BellRing },
          { href: "/perfil", label: "Alterar Senha", icon: KeyRound },
        ];

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-minimerx-navy text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
          <Image
            src="/logo-modelo2.svg"
            alt="MiniMerX"
            width={140}
            height={42}
            priority
            style={{ width: "140px", height: "auto" }}
          />
        </div>
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
          <p className="text-[10px] uppercase tracking-wide text-white/50">Condominio</p>
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
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 px-2">
          <p className="text-[10px] uppercase tracking-wide text-white/50">Usuario</p>
          <p className="mt-0.5 break-words text-sm font-semibold">{usuarioNome}</p>
          <p className="text-[10px] text-white/50">
            {role === "ADMIN" ? "Administrador" : "Sindico"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => logoutAction()}
          className="flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
        <p className="mt-3 text-center text-[10px] text-white/30">by LAVAX · v{APP_VERSION}</p>
      </div>
    </aside>
  );

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:flex">{sidebar}</div>

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
