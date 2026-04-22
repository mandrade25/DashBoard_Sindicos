# MiniMerX — Dashboard de Vendas por Condomínio
## Prompt Otimizado para Codex

---

## Contexto do Projeto

Sistema web de dashboard de vendas para a **MiniMerX** (rede de minimercados autônomos 24h
instalados em condomínios residenciais). O sistema será hospedado na **Hostinger** sob o
domínio da MiniMerX, possivelmente em plano VPS.

---

## Stack Tecnológica (não negociável)

| Camada | Tecnologia | Justificativa |
|--------|-----------|--------------|
| Framework | **Next.js 14** (App Router) | SSR + API Routes em um projeto, deploy via `npm run build` no VPS Hostinger |
| Banco | **PostgreSQL** (VPS) | Robusto, suporte a queries complexas, melhor para crescer |
| ORM | **Prisma** | Migrations automáticas, type-safe, suporte a PostgreSQL e MySQL |
| Auth | **NextAuth.js v5** (Auth.js) | JWT + Credentials provider, integrado nativamente ao Next.js |
| UI | **Tailwind CSS + shadcn/ui** | Componentes acessíveis, customizáveis pela identidade MiniMerX |
| Gráficos | **Recharts** | Leve, nativo React, SSR-friendly |
| Upload Excel | **SheetJS (xlsx)** | Suporte ao formato .xls legado |
| Deploy | **PM2 + Nginx** no VPS Hostinger | Padrão de produção para Node.js em VPS Linux |

> **Se o plano Hostinger for hospedagem compartilhada (não VPS):** substituir PostgreSQL por
> MySQL e ajustar o `schema.prisma` (`provider = "mysql"`). O restante da stack permanece igual.

---

## Identidade Visual — MiniMerX

A aplicação deve seguir rigorosamente a identidade da marca MiniMerX:

### Paleta de Cores

> **Fonte:** cores extraídas do logo oficial (`logo-modelo1.svg`). A marca MiniMerX é
> **verde + azul-marinho**, pertence ao grupo **LAVAX**.

```css
:root {
  --minimerx-green:      #3DAE3C;   /* verde principal — CTAs, destaques, badge 24h, gráficos */
  --minimerx-green-dark: #2E8B2D;   /* hover do verde */
  --minimerx-navy:       #1E2A5A;   /* azul-marinho — sidebar, títulos, texto principal */
  --minimerx-blue:       #2E8BC0;   /* azul médio — links, ícones, detalhes */
  --minimerx-light:      #F5F7FA;   /* fundo claro do conteúdo */
  --minimerx-white:      #FFFFFF;
  --minimerx-gray:       #8A94A6;   /* textos secundários */
  --danger:              #D32F2F;   /* vermelho APENAS para feedback de erro */
}
```

### Logos Disponíveis
O projeto possui **dois arquivos de logo** que devem ser incluídos no diretório `public/`:

- `public/logo-modelo1.svg` — Logo horizontal: "MARKET by Mini 24h" (texto em bloco único)
- `public/logo-modelo2.svg` — Logo alternativo: "M ARKET by Mini 24h" (M destacado)

**Uso dos logos:**
- Sidebar / navbar: usar `logo-modelo2.svg` (M destacado, compacto para menu lateral)
- Página de login: usar `logo-modelo1.svg` (logo completo, centralizado)
- Favicon: derivar do "M" do logo-modelo2

> Os arquivos PDF dos logos foram fornecidos pelo cliente. Converter para SVG com Inkscape
> (`inkscape --export-type=svg logo.pdf`) ou incorporar como `<img src="/logo-modelo1.svg">`.

### Tipografia
```css
/* Fonte principal: Montserrat (geométrica, moderna — alinha com o "M" da marca) */
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');

body { font-family: 'Montserrat', sans-serif; }
```

### Design System (aplicar em todo o frontend)
- **Tema**: sidebar azul-marinho com conteúdo principal claro (padrão SaaS profissional)
- **Sidebar**: fundo `#1E2A5A` (navy), texto branco, logo no topo, item ativo com fundo verde
- **Cards de métricas**: fundo branco, borda sutil, número grande em negrito, label muted
- **Botões primários**: `background: #3DAE3C`, hover: `#2E8B2D`, texto branco
- **Bordas**: `border-radius: 8px` padrão, `12px` para cards
- **Gráficos**: barras verdes (`#3DAE3C`), linha de tendência azul-marinho, fundo branco, grid cinza claro

---

## Frontend Skill — Instrução para Codex

> **IMPORTANTE para o Codex:** Antes de escrever qualquer componente de UI, leia e
> aplique o guia de design disponível em `docs/FRONTEND_SKILL.md` (criado abaixo). Este guia
> garante qualidade de produção no frontend.

Criar o arquivo `docs/FRONTEND_SKILL.md` com o seguinte conteúdo:

```markdown
# Frontend Design Guidelines — MiniMerX Dashboard

## Filosofia
Interface SaaS profissional. Cada tela deve parecer produto comercial, não template genérico.
Clareza de dados acima de decoração. Hierarquia visual clara.

## Regras Obrigatórias
- Sidebar azul-marinho (#1E2A5A) + conteúdo principal claro (#F5F7FA)
- Fonte Montserrat em todos os textos
- Cor de destaque primária: #3DAE3C (verde MiniMerX). Vermelho proibido em elementos decorativos — usar somente como `--danger` em feedback de erro.
- Ícones: Lucide React (já incluso no shadcn/ui)
- Animações: apenas transitions CSS (200ms ease). Sem animações desnecessárias.
- Todos os valores monetários: Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' })
- Todas as datas: format dd/MM/yyyy (date-fns com locale ptBR)
- Loading states: Skeleton (shadcn/ui <Skeleton />) em TODOS os cards e tabelas
- Responsivo: funcional em tablet (768px+) e desktop. Mobile é secundário.

## Componentes Padrão
- Cards de métrica: <MetricCard label="" value="" sublabel="" icon="" />
- Gráfico: <SalesChart data={[]} period="month|week|year" />
- Tabela: <DataTable columns={[]} data={[]} />
- Sidebar: <AppSidebar role="admin|sindico" condominioNome="" />
```

---

## Modelo de Dados (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Condominio {
  id                 String   @id @default(cuid())
  nome               String   @unique
  percentualRepasse  Decimal  @db.Decimal(5, 2)
  criadoEm          DateTime @default(now())

  usuarios  Usuario[]
  vendas    Venda[]
}

model Usuario {
  id           String     @id @default(cuid())
  nome         String
  email        String     @unique
  senhaHash    String
  role         Role       @default(SINDICO)
  condominioId String?
  criadoEm    DateTime   @default(now())

  condominio Condominio? @relation(fields: [condominioId], references: [id])
}

model Venda {
  id           String     @id @default(cuid())
  condominioId String
  unidade      String
  data         DateTime   @db.Date
  valorVenda   Decimal    @db.Decimal(10, 2)
  importadoEm DateTime   @default(now())

  condominio Condominio @relation(fields: [condominioId], references: [id])

  @@index([condominioId, data])
}

enum Role {
  ADMIN
  SINDICO
}
```

---

## Estrutura de Arquivos

```
minimerx-dashboard/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts               # Seed: cria admin inicial
├── public/
│   ├── logo-modelo1.svg
│   └── logo-modelo2.svg
├── docs/
│   └── FRONTEND_SKILL.md     # Design guidelines (ver acima)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx  # Página de login com logo-modelo1
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx    # Layout com sidebar (logo-modelo2)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx  # Dashboard principal
│   │   │   └── admin/
│   │   │       ├── condominios/
│   │   │       │   └── page.tsx  # CRUD condominios (só admin)
│   │   │       └── upload/
│   │   │           └── page.tsx  # Upload Excel (só admin)
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/route.ts
│   │       ├── dashboard/
│   │       │   ├── resumo/route.ts    # GET métricas
│   │       │   └── vendas/route.ts    # GET tabela/gráfico
│   │       ├── condominios/route.ts   # GET/POST/PUT/DELETE
│   │       └── upload/route.ts        # POST upload Excel
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── MetricCard.tsx
│   │   ├── SalesChart.tsx
│   │   ├── DataTable.tsx
│   │   └── AppSidebar.tsx
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── auth.ts           # NextAuth config
│   │   ├── excel-parser.ts   # SheetJS parser para .xls
│   │   └── formatters.ts     # Formatação BRL, datas pt-BR
│   └── middleware.ts         # Proteção de rotas por role
├── .env.example
├── ecosystem.config.js       # PM2 config para deploy Hostinger VPS
├── nginx.conf                # Config Nginx para proxy reverso
└── README.md
```

---

## Funcionalidades Detalhadas

### Autenticação (`/login`)
- Formulário: email + senha com logo MiniMerX centralizado
- NextAuth Credentials provider com bcrypt para verificar senha
- Sessão JWT (não database sessions — mais simples para VPS)
- Redirect pós-login: `/dashboard`
- Roles: `ADMIN` (acesso total) e `SINDICO` (acesso isolado ao próprio condomínio)
- Middleware Next.js protegendo todas as rotas autenticadas

### Middleware de Segurança (`src/middleware.ts`)
```typescript
// Lógica de proteção:
// - /login → público
// - /api/auth/* → público
// - /admin/* → apenas ADMIN
// - demais rotas → qualquer autenticado
// CRÍTICO: nas API Routes, SEMPRE validar que condominioId da query == condominioId do token
```

### Dashboard Principal (`/dashboard`)

#### Cards de Métricas (topo)
Calcular via SQL com `condominioId` do usuário logado (NUNCA expor outros condomínios):

| Card | Cálculo SQL |
|------|-------------|
| Vendas Hoje | `SUM(valor_venda) WHERE data = CURRENT_DATE` |
| Semana Atual | `SUM WHERE data >= date_trunc('week', NOW())` |
| Mês Atual | `SUM WHERE data >= date_trunc('month', NOW())` |
| Ano Atual | `SUM WHERE data >= date_trunc('year', NOW())` |
| Repasse do Mês | `Acumulado Mês × (percentual_repasse / 100)` |
| Repasse do Ano | `Acumulado Ano × (percentual_repasse / 100)` |

Cards de Repasse exibem: valor em R$ + badge com percentual (ex: `12%`).

#### Gráfico de Barras (Recharts)
- Dados: vendas diárias do período selecionado
- Filtros: `Semana` | `Mês` | `Ano` (tabs acima do gráfico)
- Cor das barras: `#3DAE3C` (verde MiniMerX)
- Tooltip: data em pt-BR + valor em R$
- Responsive container 100% largura

#### Tabela de Vendas
- Colunas: `Data` | `Valor do Dia` | `Acumulado`
- Ordenação: data decrescente
- Paginação: 15 registros por página
- Skeleton loading enquanto carrega

### Admin — Condomínios (`/admin/condominios`) — apenas ADMIN
- Listagem em tabela: Nome | % Repasse | Síndico | Ações
- Modal "Novo Condomínio": campos nome, percentual de repasse (%), nome do síndico, email, senha
- Ao criar condomínio → criar automaticamente o `Usuario` com role SINDICO vinculado
- Editar: permite alterar percentual de repasse e dados do síndico (senha opcional no edit)
- Sem exclusão de condomínio (apenas inativação futura)

### Admin — Upload de Dados (`/admin/upload`) — apenas ADMIN

**Formato do Excel recebido (sempre igual):**
```
Coluna A: Unidade   → nome do condomínio (ex: "MINIMERX - MORATA DOS PASSAROS")
Coluna B: Data      → dd/MM/yyyy
Coluna C: Vl Venda  → número decimal
```

**Lógica de processamento (`src/lib/excel-parser.ts`):**
```typescript
// 1. Receber arquivo .xls via FormData
// 2. SheetJS: XLSX.read(buffer, { type: 'buffer', cellDates: false })
// 3. Para cada linha:
//    a. Normalizar nome da Unidade (trim, uppercase, remover acentos)
//    b. Buscar condomínio pelo nome normalizado
//    c. Parsear data: aceitar dd/MM/yyyy e serial Excel
//    d. Inserir em Venda se condomínio encontrado
// 4. Usar prisma.$transaction para atomicidade
// 5. Retornar: { importados: N, ignorados: M, erros: [...] }
```

**UI de upload:**
- Drag & drop de arquivo + botão de seleção
- Seletor de condomínio (dropdown) para associar manualmente se necessário
- Progress bar durante processamento
- Resultado: card com totais (importados / ignorados) + lista de erros se houver

---

## Configuração de Deploy — Hostinger VPS

### Variáveis de Ambiente (`.env`)
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/minimerx_db"
NEXTAUTH_SECRET="gerar-com-openssl-rand-base64-32"
NEXTAUTH_URL="https://dashboard.minimerx.com.br"
NODE_ENV="production"
```

### PM2 (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [{
    name: 'minimerx-dashboard',
    script: 'node_modules/.bin/next',
    args: 'start',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### Nginx (`nginx.conf`)
```nginx
server {
  listen 80;
  server_name dashboard.minimerx.com.br;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### Comandos de Deploy
```bash
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart minimerx-dashboard
```

---

## Seed Inicial (`prisma/seed.ts`)
```typescript
// Criar usuário admin master
// email: admin@minimerx.com.br
// senha: MiniMerX@2026 (forçar troca no primeiro login)
// role: ADMIN
// condominioId: null (admin vê tudo)
```

---

## Regras de Negócio — Resumo Crítico

1. **Isolamento de dados**: toda query ao banco DEVE incluir `WHERE condominio_id = $condominioId`
   quando o usuário for SINDICO. Validar no backend, nunca confiar apenas no frontend.
2. **Admin não tem condomínio**: `condominioId = null`. Ao acessar o dashboard, admin escolhe
   qual condomínio visualizar via dropdown no topo da tela.
3. **Repasse**: calculado dinamicamente (não armazenado). Fórmula: acumulado × (percentual/100).
4. **Formato de data no Excel**: `dd/MM/yyyy`. Usar `date-fns/parse` com locale `pt-BR`.
5. **Unidade no Excel**: pode ter variações de espaço/case. Normalizar antes de fazer match.
6. **Senha do síndico**: armazenar sempre com `bcrypt` (saltRounds: 12). Nunca em plaintext.

---

## Entregável Final

Aplicação funcionando com `npm run dev` (desenvolvimento) e `npm run build && npm start` (produção), com:

- [ ] Usuário admin seed criado automaticamente (`prisma db seed`)
- [ ] Banco PostgreSQL inicializado via `prisma migrate dev`
- [ ] Todas as rotas protegidas por autenticação
- [ ] Isolamento de dados por condomínio funcionando
- [ ] Upload de arquivo .xls do formato especificado funcionando
- [ ] Dashboard com cards, gráfico e tabela
- [ ] CRUD de condomínios para admin
- [ ] Logos MiniMerX aplicados nas telas de login e sidebar
- [ ] README com: pré-requisitos, variáveis de ambiente, comandos de setup e deploy
