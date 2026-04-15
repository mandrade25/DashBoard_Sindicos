# Frontend Redesign — MiniMerX Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the MiniMerX dashboard frontend to a SaaS premium style (Stripe/Vercel) with real logos from PDFs, mobile-first responsiveness, and refined MetricCard layout.

**Architecture:** Surgical refinement — modify 8 existing files plus extract logos. No new dependencies for UI. Logo extraction uses `mupdf` (pure WASM, no native modules). All changes are visual only; APIs and business logic are untouched.

**Tech Stack:** Next.js 14, Tailwind CSS, shadcn/ui, Lucide React, Recharts, mupdf (new, dev-only script)

---

## File Map

| File | Change |
|------|--------|
| `public/logo-modelo1.svg` | Replace with real logo extracted from PDF |
| `public/logo-modelo2.svg` | Replace with real logo extracted from PDF |
| `scripts/extract-logos.mjs` | New — one-time extraction script (not shipped) |
| `src/components/MetricCard.tsx` | Full redesign — Stripe-style icon box + text-4xl value |
| `src/app/(auth)/login/page.tsx` | Dark gradient bg, card rounded-2xl shadow-2xl |
| `src/app/(auth)/login/login-form.tsx` | Inputs h-12, button h-12 font-semibold |
| `src/components/Topbar.tsx` | Mobile: logo centered + hamburger, height 56px |
| `src/app/(dashboard)/dashboard/dashboard-view.tsx` | Mobile-first grid breakpoints |
| `src/app/(dashboard)/admin/upload/upload-view.tsx` | Larger drop zone, file badge with remove |
| `src/app/(dashboard)/admin/consolidado/consolidado-view.tsx` | h1 text-3xl, top-3 rank badges |

---

## Task 1: Extract real logos from PDFs

**Files:**
- Create: `scripts/extract-logos.mjs`
- Modify: `public/logo-modelo1.svg`
- Modify: `public/logo-modelo2.svg`

- [ ] **Step 1: Install mupdf**

```bash
npm install mupdf
```

Expected: `added 1 package` (pure WASM, no native modules)

- [ ] **Step 2: Create extraction script**

Create file `scripts/extract-logos.mjs`:

```javascript
import { readFileSync, writeFileSync } from "fs";
import mupdf from "mupdf";

function extractLogoSVG(pdfPath, outputPath) {
  const data = readFileSync(pdfPath);
  const doc = new mupdf.Document(data);
  const page = doc.loadPage(0);
  const svg = page.toSVG();
  writeFileSync(outputPath, svg);
  console.log(`OK: ${outputPath}`);
}

try {
  extractLogoSVG(
    "C:/Users/mandr/Downloads/MiniMerX - Logo modelo 1 (2).pdf",
    "public/logo-modelo1.svg"
  );
  extractLogoSVG(
    "C:/Users/mandr/Downloads/MiniMerX - Logo modelo 2 (2).pdf",
    "public/logo-modelo2.svg"
  );
  console.log("Logos extraídos com sucesso.");
} catch (err) {
  console.error("Erro na extração:", err.message);
  console.error("Os logos placeholder existentes serão mantidos.");
}
```

- [ ] **Step 3: Run the extraction script**

```bash
node scripts/extract-logos.mjs
```

Expected output:
```
OK: public/logo-modelo1.svg
OK: public/logo-modelo2.svg
Logos extraídos com sucesso.
```

If output shows `Erro na extração`, skip to Step 4 (fallback). If successful, skip Step 4.

- [ ] **Step 4 (fallback — só se Step 3 falhar): Criar logos SVG aprimorados**

Substituir `public/logo-modelo1.svg` por logo horizontal de alta qualidade:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 90" role="img" aria-label="MiniMerX MARKET by Mini 24h">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
  </defs>
  <rect width="340" height="90" fill="url(#bg)" rx="4"/>
  <!-- M verde em caixa arredondada -->
  <rect x="10" y="12" width="60" height="60" rx="12" fill="#3DAE3C"/>
  <text x="40" y="60" font-family="Montserrat,Arial,sans-serif" font-size="42" font-weight="700" fill="#FFFFFF" text-anchor="middle">M</text>
  <!-- ARKET -->
  <text x="82" y="52" font-family="Montserrat,Arial,sans-serif" font-size="30" font-weight="700" fill="#1E2A5A" letter-spacing="2">ARKET</text>
  <!-- by Mini · 24h -->
  <text x="82" y="70" font-family="Montserrat,Arial,sans-serif" font-size="12" font-weight="500" fill="#2E8BC0">by Mini · 24h</text>
  <!-- grupo LAVAX -->
  <text x="82" y="84" font-family="Montserrat,Arial,sans-serif" font-size="9" fill="#8A94A6">grupo LAVAX</text>
</svg>
```

Substituir `public/logo-modelo2.svg` por logo compacto para sidebar:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 64" role="img" aria-label="MiniMerX">
  <rect width="200" height="64" fill="none"/>
  <!-- M verde -->
  <rect x="4" y="6" width="52" height="52" rx="10" fill="#3DAE3C"/>
  <text x="30" y="48" font-family="Montserrat,Arial,sans-serif" font-size="38" font-weight="700" fill="#FFFFFF" text-anchor="middle">M</text>
  <!-- ARKET -->
  <text x="66" y="38" font-family="Montserrat,Arial,sans-serif" font-size="22" font-weight="700" fill="#FFFFFF" letter-spacing="1">ARKET</text>
  <text x="66" y="54" font-family="Montserrat,Arial,sans-serif" font-size="10" font-weight="500" fill="#93A8D4">by Mini · 24h</text>
</svg>
```

- [ ] **Step 5: Verificar logos no browser**

Abrir `http://localhost:3005` no browser. Verificar:
- Logo aparece na sidebar (modelo2) sem distorção
- Página de login mostra logo (modelo1) com tamanho correto

- [ ] **Step 6: Commit**

```bash
git add public/logo-modelo1.svg public/logo-modelo2.svg scripts/extract-logos.mjs
git commit -m "feat: replace logo SVG placeholders with real brand logos"
```

---

## Task 2: Redesign MetricCard (Stripe-style)

**Files:**
- Modify: `src/components/MetricCard.tsx`

- [ ] **Step 1: Verificar TypeScript atual passa**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: sem erros (baseline)

- [ ] **Step 2: Reescrever MetricCard.tsx**

Substituir o conteúdo completo de `src/components/MetricCard.tsx`:

```tsx
import { type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  badge?: string;
  icon?: LucideIcon;
  tone?: "default" | "accent";
  loading?: boolean;
}

export function MetricCard({
  label,
  value,
  sublabel,
  badge,
  icon: Icon,
  tone = "default",
  loading = false,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-md max-sm:p-5">
      {Icon ? (
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            tone === "accent" ? "bg-green-50" : "bg-slate-100",
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              tone === "accent" ? "text-minimerx-green" : "text-minimerx-blue",
            )}
          />
        </div>
      ) : null}
      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-2 h-10 w-36" />
      ) : (
        <p
          className={cn(
            "mt-1 truncate text-4xl font-bold",
            tone === "accent" ? "text-minimerx-green" : "text-minimerx-navy",
          )}
          title={value}
        >
          {value}
        </p>
      )}
      <div className="mt-2 flex items-center gap-2">
        {sublabel ? (
          <p className="text-xs text-minimerx-gray">{sublabel}</p>
        ) : null}
        {badge ? <Badge variant="default">{badge}</Badge> : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Checar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: sem erros

- [ ] **Step 4: Verificar no browser**

Abrir `http://localhost:3005/dashboard`. Verificar:
- Cards têm ícone em caixa arredondada no topo
- Valor monetário em fonte grande (4xl)
- Cards de repasse com ícone e valor em verde
- Em mobile (375px via DevTools): cards empilhados, padding menor

- [ ] **Step 5: Commit**

```bash
git add src/components/MetricCard.tsx
git commit -m "feat: redesign MetricCard with Stripe-style icon box and larger value"
```

---

## Task 3: Redesign Login page

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/login/login-form.tsx`

- [ ] **Step 1: Atualizar page.tsx**

Substituir conteúdo completo de `src/app/(auth)/login/page.tsx`:

```tsx
import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-[#1E2A5A] px-4">
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-10 shadow-2xl max-sm:p-6">
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo-modelo1.svg"
            alt="MiniMerX Market by LAVAX"
            width={200}
            height={80}
            priority
            style={{ height: "auto" }}
          />
        </div>
        <h1 className="mb-1 text-center text-2xl font-bold text-minimerx-navy">
          Acessar Dashboard
        </h1>
        <p className="mb-6 text-center text-sm text-minimerx-gray">
          Entre com suas credenciais MiniMerX
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Atualizar login-form.tsx**

Substituir conteúdo completo de `src/app/(auth)/login/login-form.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("E-mail ou senha inválidos.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-minimerx-navy">
          E-mail
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-minimerx-navy">
          Senha
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 text-base"
        />
      </div>
      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      <Button
        type="submit"
        className="h-12 w-full text-base font-semibold"
        disabled={pending}
      >
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Checar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: sem erros

- [ ] **Step 4: Verificar no browser**

Abrir `http://localhost:3005/login`. Verificar:
- Fundo: gradiente escuro de slate-900 para navy
- Card: branco, cantos arredondados, sombra forte
- Logo aparece no topo do card
- Inputs e botão com altura 48px
- Em mobile (375px): card ocupa quase toda a tela com padding menor

- [ ] **Step 5: Commit**

```bash
git add src/app/\(auth\)/login/page.tsx src/app/\(auth\)/login/login-form.tsx
git commit -m "feat: redesign login page with dark gradient and premium card style"
```

---

## Task 4: Topbar mobile-first

**Files:**
- Modify: `src/components/Topbar.tsx`

- [ ] **Step 1: Substituir conteúdo de Topbar.tsx**

A topbar tem 2 linhas no mobile quando o usuário é ADMIN (para manter o seletor de condomínio acessível). Para SINDICO, 1 linha.

```tsx
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
```

- [ ] **Step 2: Checar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: sem erros

- [ ] **Step 3: Verificar no browser**

- Desktop: topbar (1 linha) com seletor de condomínio e ícone Building2
- Mobile ADMIN (DevTools 375px): linha 1 = hambúrguer + logo; linha 2 = seletor de condomínio full-width
- Mobile SINDICO: linha única = hambúrguer + logo + nome do condomínio truncado
- Clicar no hambúrguer abre o drawer da sidebar

- [ ] **Step 4: Commit**

```bash
git add src/components/Topbar.tsx
git commit -m "feat: update Topbar with mobile logo and responsive layout"
```

---

## Task 5: Dashboard grid mobile-first

**Files:**
- Modify: `src/app/(dashboard)/dashboard/dashboard-view.tsx`

- [ ] **Step 1: Atualizar os grids no dashboard-view.tsx**

No arquivo `src/app/(dashboard)/dashboard/dashboard-view.tsx`, localizar e aplicar as 3 mudanças de grid abaixo:

**Mudança 1** — grid de 4 cards (linha ~150):
```tsx
// ANTES:
<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

// DEPOIS:
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
```

**Mudança 2** — grid de repasse (linha ~177):
```tsx
// ANTES:
<div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">

// DEPOIS:
<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
```

**Mudança 3** — grid de gráficos (linha ~210):
```tsx
// ANTES:
<div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">

// DEPOIS:
<div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
```

- [ ] **Step 2: Checar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: sem erros

- [ ] **Step 3: Verificar no browser**

- Mobile (375px): 1 coluna em tudo — cards empilhados, gráficos empilhados
- Small (640px): cards de métricas em 2 colunas, repasse em 2 colunas, gráficos em 1 coluna
- Desktop (1024px+): 4 + 2 + 2 colunas conforme spec

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/dashboard-view.tsx
git commit -m "feat: update dashboard grid to mobile-first breakpoints"
```

---

## Task 6: Upload — Drop zone maior e file badge

**Files:**
- Modify: `src/app/(dashboard)/admin/upload/upload-view.tsx`

- [ ] **Step 1: Substituir conteúdo completo de upload-view.tsx**

```tsx
"use client";

import { useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload as UploadIcon, X } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";

interface UploadResponse {
  importados: number;
  ignorados: number;
  erros: string[];
  condominiosNaoEncontrados: string[];
}

export function UploadView() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function clearFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setResult(null);
    setError(null);
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError(null);
    }
  }

  function onSubmit() {
    if (!file) return;
    setError(null);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);

    startTransition(async () => {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Falha no upload.");
        return;
      }
      const data: UploadResponse = await res.json();
      setResult(data);
      clearFile();
    });
  }

  return (
    <>
      <Topbar role="ADMIN" condominioNome="Upload de Vendas" />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
        <h1 className="text-3xl font-bold text-minimerx-navy">Upload de planilha de vendas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Formato aceito: .xls ou .xlsx com colunas <strong>Unidade</strong>,{" "}
          <strong>Data</strong> (dd/mm/aaaa) e <strong>Vl Venda</strong>.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <label
            htmlFor="file"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 py-16 text-center transition-colors hover:border-minimerx-green hover:bg-slate-50"
          >
            <UploadIcon className="h-12 w-12 text-minimerx-blue" />
            <div>
              <p className="text-base font-semibold text-minimerx-navy">
                Clique ou arraste o arquivo .xls aqui
              </p>
              <p className="mt-1 text-sm text-minimerx-gray">Apenas uma planilha por vez</p>
            </div>
            <input
              ref={inputRef}
              id="file"
              type="file"
              accept=".xls,.xlsx"
              className="hidden"
              onChange={onFileChange}
            />
          </label>

          {/* Badge do arquivo selecionado */}
          {file ? (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <FileSpreadsheet className="h-5 w-5 flex-shrink-0 text-minimerx-green" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-green-800">{file.name}</p>
                <p className="text-xs text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="rounded-full p-1 text-green-600 hover:bg-green-200"
                aria-label="Remover arquivo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="sm:w-auto"
              onClick={() => {
                clearFile();
                setResult(null);
                setError(null);
              }}
            >
              Limpar
            </Button>
            <Button
              disabled={!file || pending}
              onClick={onSubmit}
              className="w-full sm:w-auto"
            >
              {pending ? "Processando..." : "Importar vendas"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {result ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-minimerx-green" />
              <div>
                <p className="text-base font-semibold">
                  {result.importados} venda(s) importada(s) com sucesso
                </p>
                {result.ignorados > 0 ? (
                  <p className="mt-1">{result.ignorados} linha(s) ignorada(s).</p>
                ) : null}
              </div>
            </div>

            {result.condominiosNaoEncontrados.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                <p className="font-semibold">Condomínios não encontrados no cadastro:</p>
                <ul className="mt-2 list-disc pl-5">
                  {result.condominiosNaoEncontrados.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  Cadastre esses condomínios (com nome idêntico ao da planilha) e refaça o
                  upload.
                </p>
              </div>
            ) : null}

            {result.erros.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
                <p className="mb-2 font-semibold text-minimerx-navy">
                  Erros ({result.erros.length})
                </p>
                <ul className="max-h-64 space-y-1 overflow-auto text-minimerx-gray">
                  {result.erros.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </main>
    </>
  );
}
```

- [ ] **Step 2: Checar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: sem erros

- [ ] **Step 3: Verificar no browser**

Abrir `http://localhost:3005/admin/upload`. Verificar:
- Área de drop maior com ícone maior (h-12)
- Após selecionar arquivo: badge verde com nome + tamanho + botão X
- Botão "Importar vendas": largura total no mobile, alinhado à direita no desktop

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/admin/upload/upload-view.tsx
git commit -m "feat: improve upload page with larger drop zone and file badge"
```

---

## Task 7: Consolidado — heading e rank badges

**Files:**
- Modify: `src/app/(dashboard)/admin/consolidado/consolidado-view.tsx`

- [ ] **Step 1: Aplicar mudanças em consolidado-view.tsx**

**Mudança 1** — h1 de `text-2xl` para `text-3xl` (linha ~56):
```tsx
// ANTES:
<h1 className="text-2xl font-bold text-minimerx-navy">Visão Geral</h1>
<p className="mt-1 text-sm text-minimerx-gray">

// DEPOIS:
<h1 className="text-3xl font-bold text-minimerx-navy">Visão Geral</h1>
<p className="mt-1 text-sm text-slate-500">
```

**Mudança 2** — importar `cn` no topo do arquivo (adicionar junto aos outros imports):
```tsx
import { cn } from "@/lib/utils";
```

**Mudança 3** — badges de ranking (substitui o `<TableCell>` com `idx + 1` simples, linha ~131):
```tsx
// ANTES:
<TableCell className="text-center text-sm font-medium text-minimerx-gray">
  {idx + 1}
</TableCell>

// DEPOIS:
<TableCell className="text-center">
  <span
    className={cn(
      "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
      idx === 0 && "bg-yellow-100 text-yellow-700",
      idx === 1 && "bg-slate-200 text-slate-600",
      idx === 2 && "bg-orange-100 text-orange-700",
      idx > 2 && "bg-slate-100 text-slate-400",
    )}
  >
    {idx + 1}
  </span>
</TableCell>
```

- [ ] **Step 2: Checar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: sem erros

- [ ] **Step 3: Verificar no browser**

Abrir `http://localhost:3005/admin/consolidado`. Verificar:
- Título "Visão Geral" em fonte maior
- Subtítulo em slate-500 (cinza mais neutro)
- Top 3 condomínios com badges coloridos: ouro, prata, bronze
- Demais condomínios com badge cinza claro

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/admin/consolidado/consolidado-view.tsx
git commit -m "feat: update consolidado with larger heading and rank badges"
```

---

## Task 8: Verificação final

**Files:** nenhum (somente verificação)

- [ ] **Step 1: TypeScript limpo**

```bash
npx tsc --noEmit
```

Expected: zero erros, zero warnings

- [ ] **Step 2: Checar todas as telas no browser**

Abrir cada tela e verificar visualmente:

| Tela | URL | O que verificar |
|------|-----|----------------|
| Login | `/login` | Gradiente escuro, card branco, logo, inputs altos |
| Dashboard | `/dashboard` | MetricCards com ícone box, grid responsivo |
| Consolidado | `/admin/consolidado` | h1 maior, rank badges coloridos |
| Upload | `/admin/upload` | Drop zone grande, badge de arquivo |
| Dados | `/admin/dados` | Não alterado — deve continuar funcionando |
| Condomínios | `/admin/condominios` | Não alterado — deve continuar funcionando |

- [ ] **Step 3: Checar mobile (DevTools)**

No Chrome DevTools, ativar device emulation em 375×812 (iPhone SE). Verificar em cada tela:
- Topbar: hambúrguer + logo + nome condomínio
- Dashboard: cards em 1 coluna, gráficos em 1 coluna
- Upload: botão "Importar vendas" largura total

- [ ] **Step 4: Remover mupdf das dependências de produção (mover para dev)**

```bash
npm install --save-dev mupdf
```

Expected: `mupdf` movido de `dependencies` para `devDependencies` no package.json

- [ ] **Step 5: Commit final**

```bash
git add package.json package-lock.json
git commit -m "chore: move mupdf to devDependencies (used only for logo extraction script)"
```
