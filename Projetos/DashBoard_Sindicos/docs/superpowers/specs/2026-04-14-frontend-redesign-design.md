# Frontend Redesign — MiniMerX Dashboard
**Data:** 2026-04-14  
**Abordagem aprovada:** A — Refinamento Cirúrgico  
**Estilo alvo:** SaaS premium (Vercel / Linear / Stripe)

---

## 1. Logos

### Problema
Os arquivos `public/logo-modelo1.svg` e `public/logo-modelo2.svg` são placeholders SVG genéricos criados manualmente. Os logos reais estão nos PDFs:
- `C:/Users/mandr/Downloads/MiniMerX - Logo modelo 1 (2).pdf`
- `C:/Users/mandr/Downloads/MiniMerX - Logo modelo 2 (2).pdf`

### Solução
Extrair os vetores reais dos PDFs usando `pdf2svg` via script Node.js (pacote `pdf-lib` + renderização) ou, como fallback, converter para PNG de alta resolução com `sharp`. Substituir os SVG placeholders pelos arquivos resultantes.

- `logo-modelo1.svg` → logo horizontal completo (login page, 200px width)
- `logo-modelo2.svg` → logo compacto com M destacado (sidebar, 140px width)

---

## 2. Layout & Responsividade Mobile First

### Breakpoints
| Breakpoint | Uso |
|------------|-----|
| 375px (base) | Mobile padrão — 1 coluna, padding `px-4` |
| 640px (sm) | 2 colunas nos cards |
| 768px (md) | Tablet — layout misto |
| 1024px (lg) | Desktop — sidebar fixa, 4 colunas |

### Sidebar
- Desktop (lg+): fixa à esquerda, 256px, fundo `#1E2A5A`
- Mobile (< lg): oculta; drawer deslizante ativado pelo hambúrguer
- Sem alteração na estrutura do componente `AppSidebar`

### Topbar
- Mobile: altura 56px, logo MiniMerX centralizado, hambúrguer à esquerda, nome do condomínio truncado à direita (max 120px)
- Desktop: altura 64px, seletor de condomínio + ícone Building2, sem logo (está na sidebar)
- Arquivo: `src/components/Topbar.tsx`

### Grid de métricas (dashboard-view.tsx)
```
Mobile  (base): grid-cols-1
Small   (sm):   grid-cols-2
Desktop (lg):   grid-cols-4  (linha 1 — hoje/semana/mês/ano)
                grid-cols-2  (linha 2 — repasse mês/ano)
```

### Gráficos
- Mobile: altura 220px (`h-[220px]`)
- Desktop: altura 280px (mantida)
- 1 coluna em mobile, 2 colunas em lg+

---

## 3. MetricCard — Redesign (estilo Stripe)

### Layout interno
```
┌─────────────────────────────────────┐
│  [Ícone 40×40 bg-suave]             │
│                                      │
│  LABEL UPPERCASE SMALL               │
│  R$ 12.450,00  (text-4xl bold)       │
│                                      │
│  sublabel opcional    [Badge %]      │
└─────────────────────────────────────┘
```

### Especificações
- **Container:** `rounded-2xl border border-slate-100 bg-white shadow-md p-7` (desktop) / `p-5` (mobile)
- **Ícone:** `w-10 h-10 rounded-xl flex items-center justify-center` com fundo `bg-slate-100` (default) ou `bg-green-50` (accent)
- **Ícone cor:** `text-minimerx-blue` (default) / `text-minimerx-green` (accent)
- **Label:** `text-xs font-semibold uppercase tracking-widest text-slate-400 mt-4`
- **Valor:** `text-4xl font-bold mt-1 truncate` — `text-minimerx-navy` (default) / `text-minimerx-green` (accent)
- **Skeleton:** `h-10 w-36` (era `h-8 w-32`)
- Arquivo: `src/components/MetricCard.tsx`

---

## 4. Tela de Login

### Mudanças
- **Fundo:** `bg-gradient-to-br from-slate-900 to-[#1E2A5A]` (era `bg-minimerx-light`)
- **Card:** `rounded-2xl shadow-2xl p-10` mobile → `p-6`, largura `max-w-[420px]`
- **Logo:** modelo 1, `width={200}`, centralizado no topo do card
- **Inputs:** `h-12` com `text-base`
- **Botão:** `h-12 font-semibold w-full`
- Arquivo: `src/app/(auth)/login/page.tsx` + `login-form.tsx`

---

## 5. Páginas Admin

### Upload (`admin/upload/upload-view.tsx`)
- Área drag & drop: `py-16` (era `py-12`), ícone `h-12 w-12`
- Arquivo selecionado: badge verde com nome + botão "×" limpar inline
- Botão "Importar vendas": `w-full` no mobile, alinhado à direita no desktop

### Consolidado (`admin/consolidado/consolidado-view.tsx`)
- Header `h1`: `text-3xl` (era `text-2xl`)
- Período tabs: pills no canto superior direito do header (layout flex justify-between)
- Ranking top 3: badges circulares ouro/prata/bronze em vez de número simples

### Padrão geral de páginas admin
- `h1`: `text-3xl font-bold`
- Subtítulo: `text-slate-500` (era `text-minimerx-gray`)
- Espaçamento entre seções: `space-y-8` (era `space-y-6`)

---

## 6. Tokens de design (sem alteração)

Os tokens CSS já definidos em `tailwind.config.ts` / `globals.css` são mantidos:
```
--minimerx-green:      #3DAE3C
--minimerx-green-dark: #2E8B2D
--minimerx-navy:       #1E2A5A
--minimerx-blue:       #2E8BC0
--minimerx-light:      #F5F7FA
--minimerx-gray:       #8A94A6
```

---

## 7. Arquivos modificados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `public/logo-modelo1.svg` | Substituição pelo logo real |
| `public/logo-modelo2.svg` | Substituição pelo logo real |
| `src/components/MetricCard.tsx` | Redesign completo |
| `src/components/Topbar.tsx` | Mobile: logo + layout ajustado |
| `src/app/(auth)/login/page.tsx` | Fundo gradiente, card redesenhado |
| `src/app/(auth)/login/login-form.tsx` | Inputs h-12, botão h-12 |
| `src/app/(dashboard)/dashboard/dashboard-view.tsx` | Grid mobile first |
| `src/app/(dashboard)/admin/upload/upload-view.tsx` | Drop zone maior, badge arquivo |
| `src/app/(dashboard)/admin/consolidado/consolidado-view.tsx` | h1 maior, badges ranking |

---

## 8. Fora do escopo

- Nenhuma alteração nas APIs ou lógica de negócio
- Nenhuma nova dependência de UI (apenas uso do que já está instalado)
- Componentes `ui/` (shadcn) não são modificados
- Páginas `dados` e `condominios` não recebem alterações estruturais
