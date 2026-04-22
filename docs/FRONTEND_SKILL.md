# Frontend Design Skill — MiniMerX Dashboard

> **Para o Claude Code:** Este documento é obrigatório. Leia-o **antes de escrever qualquer
> componente de UI** e consulte-o sempre que criar ou alterar uma tela. As regras aqui não são
> sugestões — são o contrato visual do produto MiniMerX.

---

## 1. Filosofia

Interface **SaaS profissional** orientada a dados. Cada tela deve parecer produto comercial
maduro, não template genérico do shadcn.

Princípios, em ordem de prioridade:

1. **Clareza de dados** acima de decoração.
2. **Hierarquia visual explícita** — o usuário deve saber em 2 segundos o que é mais importante.
3. **Consistência** — mesmo padrão de card, mesma métrica, mesma posição, em todas as telas.
4. **Performance percebida** — Skeleton em tudo que carrega. Nunca tela em branco.
5. **Densidade controlada** — espaço em branco é recurso, não desperdício.

**Anti-padrões proibidos:**

- Gradientes decorativos, sombras coloridas, "glass morphism", neon.
- Emojis em UI (usar apenas ícones Lucide).
- Vermelho como cor primária — a marca MiniMerX é **verde + azul-marinho**. Vermelho só
  aparece como feedback de erro (`--danger`), nunca em botões primários ou destaques.
- Múltiplos tons de verde — só `--minimerx-green` e `--minimerx-green-dark` (hover).
- Animações de entrada em cards/listas.
- Tooltips com HTML rico ou imagens.

---

## 2. Design Tokens

### 2.1 Cores (registrar em `globals.css`)

> **Paleta extraída diretamente do logo oficial MiniMerX.** Verde vibrante (wordmark "Mini"
> e "X", badge 24h, produtos nas prateleiras) + azul-marinho (wordmark "MER", "MARKET", corpo
> do minimercado) + azul médio (linhas decorativas). A marca pertence ao grupo **LAVAX**.

```css
:root {
  /* Marca — cores do logo */
  --minimerx-green:      #3DAE3C;   /* verde primário: botões, CTAs, destaques */
  --minimerx-green-dark: #2E8B2D;   /* hover de botões verdes */
  --minimerx-navy:       #1E2A5A;   /* azul-marinho: sidebar, títulos, textos principais */
  --minimerx-blue:       #2E8BC0;   /* azul médio: links, ícones secundários, detalhes */
  --minimerx-light:      #F5F7FA;   /* fundo principal do conteúdo (levemente azulado) */
  --minimerx-white:      #FFFFFF;   /* cards, modais, inputs */
  --minimerx-gray:       #8A94A6;   /* textos muted, placeholders */

  /* Feedback */
  --success: #3DAE3C;               /* mesmo verde da marca */
  --warning: #ED6C02;
  --danger:  #D32F2F;               /* vermelho APENAS para erros, nunca decorativo */

  /* Bordas e superfícies */
  --border-subtle:  #E5E8EE;
  --border-default: #D4D9E0;
}
```

**Uso obrigatório:**

| Elemento                    | Cor                        |
|-----------------------------|----------------------------|
| Botão primário              | `--minimerx-green`         |
| Botão primário hover        | `--minimerx-green-dark`    |
| Botão secundário            | `--minimerx-navy` (outline)|
| Sidebar background          | `--minimerx-navy`          |
| Sidebar texto               | `--minimerx-white`         |
| Sidebar item ativo (fundo)  | `--minimerx-green`         |
| Sidebar item hover          | `rgba(255,255,255,0.06)`   |
| Topbar background           | `--minimerx-white`         |
| Conteúdo principal (fundo)  | `--minimerx-light`         |
| Card background             | `--minimerx-white`         |
| Card borda                  | `--border-subtle`          |
| Título / texto primário     | `--minimerx-navy`          |
| Texto muted                 | `--minimerx-gray`          |
| Link / ícone decorativo     | `--minimerx-blue`          |
| Gráfico Recharts (barras)   | `--minimerx-green`         |
| Gráfico Recharts (linha)    | `--minimerx-navy`          |
| Gráfico Recharts (grid)     | `--border-subtle`          |
| Badge de repasse (%)        | `--minimerx-green` fundo + texto branco |

### 2.2 Tipografia

**Fonte única:** Montserrat (400, 500, 600, 700). Importar via `next/font/google` para
otimização automática:

```tsx
// src/app/layout.tsx
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
});
```

**Escala:**

| Token        | Tamanho | Peso | Uso                               |
|--------------|---------|------|-----------------------------------|
| `text-xs`    | 12px    | 500  | Labels, sublabels, badges         |
| `text-sm`    | 14px    | 400  | Texto corrido, tabelas            |
| `text-base`  | 16px    | 400  | Texto padrão                      |
| `text-lg`    | 18px    | 600  | Títulos de card                   |
| `text-2xl`   | 24px    | 700  | Títulos de seção                  |
| `text-3xl`   | 30px    | 700  | Valor principal do MetricCard     |
| `text-4xl`   | 36px    | 700  | H1 de página (uso raro)           |

### 2.3 Espaçamento, bordas, sombras

- **Grid base:** múltiplos de 4px. Use tokens Tailwind (`p-4` = 16px, `gap-6` = 24px).
- **Border radius:** `rounded-lg` (8px) padrão; `rounded-xl` (12px) em cards de métrica.
- **Sombras:** **não usar** sombras coloridas. Apenas `shadow-sm` em cards quando necessário.
- **Padding interno de card:** `p-6` (24px).
- **Gap entre cards:** `gap-4` (16px) em grids de métrica.

### 2.4 Transições

Única regra: `transition-colors duration-200 ease-in-out`. Aplicar em botões, links de
sidebar e badges. **Não animar** entrada, posição, tamanho.

---

## 3. Layout Global

### 3.1 Estrutura da tela autenticada

```
┌────────────────────────────────────────────────────────────┐
│ Sidebar (dark)    │  Topbar (condomínio/usuário)          │
│ w-64              ├────────────────────────────────────────┤
│ fixed             │                                        │
│ h-screen          │  Conteúdo (bg-[--minimerx-light])     │
│                   │  max-w-7xl mx-auto px-6 py-6           │
│                   │                                        │
│                   │                                        │
└───────────────────┴────────────────────────────────────────┘
```

- **Sidebar** fixa à esquerda, largura `w-64` (256px), fundo `--minimerx-navy`.
- **Topbar** altura `h-16`, borda inferior `--border-subtle`, contém seletor de condomínio
  (admin) e dropdown do usuário.
- **Conteúdo** com `max-w-7xl` para evitar linhas excessivamente longas em monitores largos.

### 3.2 Sidebar

- Logo `/logo-modelo2.svg` no topo, altura 40px, padding `p-6`. Como a sidebar é azul-marinho
  (fundo do próprio wordmark no logo), usar a versão colorida padrão do SVG.
- Itens de menu: `flex gap-3 items-center px-4 py-2.5 text-sm rounded-md`.
- Ícone Lucide à esquerda de cada item, tamanho `w-5 h-5`.
- Item ativo: fundo `--minimerx-green`, texto branco, ícone branco.
- Item hover (não ativo): fundo `rgba(255,255,255,0.06)`.
- Separador visual entre seções: `border-t border-white/10 my-4`.
- Rodapé da sidebar (opcional): micro-texto `text-xs text-white/40` com "by LAVAX".

### 3.3 Tela de login

- Tela única, centralizada, fundo `--minimerx-light`.
- Card branco `max-w-md`, `rounded-xl`, `shadow-sm`, `p-8`.
- Logo `/logo-modelo1.svg` centralizado no topo, altura 60px, `mb-8`.
- Formulário: email + senha, botão primário full-width.
- Mensagens de erro: `text-sm text-[--danger] mt-2`.

---

## 4. Componentes Padrão (API obrigatória)

Todos os componentes abaixo devem existir em `src/components/`. Se faltar algum, criá-lo
antes de usá-lo.

### 4.1 `<MetricCard />`

```tsx
interface MetricCardProps {
  label: string;                       // "Vendas de Hoje"
  value: string;                       // já formatado em BRL
  sublabel?: string;                   // "vs ontem", "Repasse 12%"
  icon?: LucideIcon;                   // ex: TrendingUp
  tone?: 'default' | 'accent';         // accent = destaque vermelho no valor
  loading?: boolean;                   // renderiza Skeleton
}
```

Layout:
- `bg-white rounded-xl border border-[--border-subtle] p-6`
- Label em `text-xs uppercase tracking-wide text-[--minimerx-gray]`
- Valor em `text-3xl font-bold text-[--minimerx-navy] mt-2`
- Valor quando `tone='accent'`: `text-[--minimerx-green]` (ex: cards de repasse)
- Sublabel em `text-xs text-[--minimerx-gray] mt-1`
- Ícone no canto superior direito, `w-5 h-5 text-[--minimerx-blue]`

Quando `loading=true`: renderizar `<Skeleton className="h-8 w-32" />` no valor.

### 4.2 `<SalesChart />`

```tsx
interface SalesChartProps {
  data: Array<{ date: string; value: number }>;   // date ISO
  period: 'week' | 'month' | 'year';
  onPeriodChange: (p: 'week' | 'month' | 'year') => void;
  loading?: boolean;
}
```

- Tabs de período alinhadas à direita (shadcn `<Tabs>`).
- Recharts `<BarChart>` com `<ResponsiveContainer width="100%" height={320}>`.
- Barras: `fill="var(--minimerx-green)"`, `radius={[4, 4, 0, 0]}`.
- Se existir linha de média/tendência: `stroke="var(--minimerx-navy)"`, `strokeWidth={2}`.
- Grid: `<CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />`.
- XAxis label formatado com `date-fns/format` em `dd/MM`.
- YAxis com formatter BRL compacto (`R$ 1,2k`).
- Tooltip custom: data completa `dd/MM/yyyy` + valor BRL.

### 4.3 `<DataTable />`

```tsx
interface Column<T> {
  key: keyof T;
  label: string;
  align?: 'left' | 'right' | 'center';
  formatter?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pageSize?: number;                   // default 15
}
```

- Base: shadcn `<Table>`.
- Header: `text-xs uppercase tracking-wide text-[--minimerx-gray] bg-[--minimerx-light]`.
- Linhas: `border-b border-[--border-subtle]`, hover `bg-[--minimerx-light]/60`.
- Valores monetários: sempre `text-right font-medium`.
- Paginação shadcn `<Pagination>` abaixo da tabela.
- Loading: 5 linhas de `<Skeleton className="h-4 w-full" />`.

### 4.4 `<AppSidebar />`

```tsx
interface AppSidebarProps {
  role: 'ADMIN' | 'SINDICO';
  condominioNome?: string;             // exibido abaixo do logo quando SINDICO
  usuarioNome: string;
}
```

Itens de menu por role:

- **SINDICO:** Dashboard, Vendas, Sair.
- **ADMIN:** Dashboard, Condomínios, Upload Excel, Sair.

Sempre usar `usePathname()` do Next.js para marcar item ativo.

---

## 5. Formatação de Dados (obrigatório)

Todos os formatters vivem em `src/lib/formatters.ts`:

```ts
// Moeda BRL
export const formatCurrency = (value: number | string): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));

// Moeda compacta (para eixos de gráfico)
export const formatCurrencyCompact = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

// Percentual
export const formatPercent = (value: number | string): string =>
  `${Number(value).toFixed(2).replace('.', ',')}%`;

// Data curta
export const formatDate = (d: Date | string): string =>
  format(new Date(d), 'dd/MM/yyyy', { locale: ptBR });

// Data longa
export const formatDateLong = (d: Date | string): string =>
  format(new Date(d), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
```

**Nunca concatenar `R$` manualmente.** Nunca usar `toLocaleString` direto em componentes —
sempre via helper.

---

## 6. Estados (Loading, Empty, Error)

### Loading
- Sempre via `<Skeleton />` do shadcn/ui.
- Manter dimensões idênticas ao componente final (evitar layout shift).

### Empty
- Ícone Lucide relevante (ex: `Inbox`), `w-12 h-12 text-[--minimerx-gray]`.
- Título `text-lg font-semibold`, mensagem `text-sm text-[--minimerx-gray]`.
- Opcionalmente, botão primário de ação ("Fazer upload de planilha").

### Error
- Card com borda `border-[--danger]`, fundo `bg-red-50`.
- Ícone `AlertCircle`, mensagem clara, botão "Tentar novamente" quando fizer sentido.

---

## 7. Ícones

**Biblioteca única:** [Lucide React](https://lucide.dev). Já vem com shadcn/ui.

Mapeamento padrão:

| Contexto                | Ícone                |
|-------------------------|----------------------|
| Dashboard               | `LayoutDashboard`    |
| Vendas / métricas       | `TrendingUp`         |
| Condomínios             | `Building2`          |
| Upload                  | `Upload`             |
| Download                | `Download`           |
| Usuário / síndico       | `User`               |
| Logout                  | `LogOut`             |
| Calendário / data       | `Calendar`           |
| Dinheiro / repasse      | `Wallet`             |
| Filtros                 | `Filter`             |
| Busca                   | `Search`             |
| Empty state padrão      | `Inbox`              |
| Erro                    | `AlertCircle`        |

Tamanho padrão: `w-5 h-5`. Em sidebar: `w-5 h-5`. Em botões pequenos: `w-4 h-4`.

---

## 8. Responsividade

- **Desktop (lg: 1024px+)** — layout principal, sidebar fixa visível.
- **Tablet (md: 768px–1023px)** — sidebar recolhível via botão hambúrguer. Grid de
  MetricCards passa de 4 colunas para 2.
- **Mobile (<768px)** — secundário. Funcional mas não prioritário. Sidebar vira drawer.

Grid padrão dos MetricCards:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

---

## 9. Acessibilidade

- Todos os inputs precisam de `<Label htmlFor="...">` (shadcn já cobre isso).
- Botões de ícone precisam de `aria-label`.
- Contraste mínimo AA: texto sobre sidebar dark usa branco; texto sobre vermelho usa branco.
- Foco visível: nunca remover `outline` sem substituir por `ring-2 ring-[--minimerx-green]`.
- Tabelas com `<caption className="sr-only">` descrevendo o conteúdo.

---

## 10. Checklist antes de commitar uma tela

- [ ] Usa fonte Montserrat (via `next/font`).
- [ ] Nenhuma cor vermelha em elementos decorativos (vermelho **só** em `--danger` para erros).
- [ ] Verde (`--minimerx-green`) usado em CTAs e destaques positivos.
- [ ] Azul-marinho (`--minimerx-navy`) na sidebar, títulos e texto principal.
- [ ] Todos os valores monetários via `formatCurrency`.
- [ ] Todas as datas via `formatDate` com locale ptBR.
- [ ] Skeleton presente em todos os estados de loading.
- [ ] Empty state desenhado (não "Nenhum resultado" cru).
- [ ] Ícones só do Lucide.
- [ ] Sem emojis, sem gradientes decorativos, sem sombras coloridas.
- [ ] Testado em 1280px e 768px de largura.
- [ ] Nenhum erro/aviso no console do navegador.
