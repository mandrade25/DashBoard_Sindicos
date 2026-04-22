"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";

interface LayoutShellProps {
  role: "ADMIN" | "SINDICO";
  usuarioNome: string;
  condominioNome?: string | null;
  pendenciasCount?: number;
  children: React.ReactNode;
}

export function LayoutShell({ role, usuarioNome, condominioNome, pendenciasCount = 0, children }: LayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-minimerx-light">
      <AppSidebar
        role={role}
        usuarioNome={usuarioNome}
        condominioNome={condominioNome}
        pendenciasCount={pendenciasCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {/* Conteúdo: margem apenas no desktop (sidebar fixa) */}
      <div className="flex min-h-screen flex-col lg:ml-64">
        {/* Injetar onMenuToggle nos filhos via contexto não é possível diretamente,
            mas o Topbar em cada page recebe a prop. Como workaround, passamos
            o toggle via um portal de evento customizado. */}
        <div
          onClickCapture={(e) => {
            const el = e.target as HTMLElement;
            if (el.closest("[data-menu-toggle]")) setSidebarOpen((o) => !o);
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
