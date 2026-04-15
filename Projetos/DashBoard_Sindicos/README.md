# MiniMerX — Dashboard de Vendas por Condomínio

Dashboard web (Next.js 14 + PostgreSQL + Prisma + NextAuth v5) para a MiniMerX exibir vendas
por condomínio, calcular repasses e permitir upload mensal de planilhas `.xls`.

## Stack
- Next.js 14 (App Router) + TypeScript
- PostgreSQL + Prisma ORM
- NextAuth.js v5 (JWT, Credentials provider, bcrypt)
- Tailwind CSS + shadcn/ui + Recharts
- SheetJS (xlsx) para import de planilhas legadas
- Deploy: PM2 + Nginx em VPS Hostinger

## Pré-requisitos
- Node.js 20+
- PostgreSQL 14+ (local ou VPS)
- npm 10+

## Setup local

```bash
# 1. Instalar dependências
npm install

# 2. Copiar e ajustar variáveis de ambiente
cp .env.example .env
# Edite DATABASE_URL e gere AUTH_SECRET com:
#   openssl rand -base64 32

# 3. Criar banco e rodar migration
npm run db:migrate

# 4. Seed do usuário admin inicial
npm run db:seed

# 5. Iniciar em dev
npm run dev
```

Acesse http://localhost:3000 e faça login com:
- **Email:** `admin@minimerx.com.br`
- **Senha:** `MiniMerX@2026`

> Troque a senha do admin após o primeiro login em produção.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server com hot reload |
| `npm run build` | Build de produção |
| `npm start` | Inicia build de produção |
| `npm run db:generate` | Gera Prisma Client |
| `npm run db:migrate` | Cria e aplica migration de dev |
| `npm run db:deploy` | Aplica migrations em produção |
| `npm run db:seed` | Roda `prisma/seed.ts` |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run db:reset` | Reseta banco (⚠️ apaga dados) |

## Estrutura

```
src/
├── app/
│   ├── (auth)/login/              # Login com logo-modelo1
│   ├── (dashboard)/
│   │   ├── dashboard/             # Dashboard principal (cards + gráfico + tabela)
│   │   └── admin/
│   │       ├── condominios/       # CRUD condomínios (ADMIN)
│   │       └── upload/            # Upload Excel (ADMIN)
│   └── api/
│       ├── auth/[...nextauth]/    # NextAuth handlers
│       ├── dashboard/             # /resumo e /vendas
│       ├── condominios/           # CRUD
│       └── upload/                # Import Excel
├── components/                    # MetricCard, SalesChart, AppSidebar, etc.
├── lib/                           # prisma, auth, excel-parser, formatters
└── middleware.ts                  # Proteção de rotas por role
```

## Roles
- **ADMIN** — acesso total. Gerencia condomínios, importa planilhas, vê qualquer condomínio.
- **SINDICO** — acesso restrito ao próprio condomínio (isolamento de dados no backend).

## Formato da Planilha de Vendas

Colunas aceitas pelo upload (`.xls` legado ou `.xlsx`):

| Coluna | Conteúdo | Exemplo |
|--------|----------|---------|
| A | Unidade | `MINIMERX - MORATA DOS PASSAROS` |
| B | Data | `15/03/2026` |
| C | Vl Venda | `1234.56` |

O parser normaliza o nome da unidade (trim, uppercase, sem acentos) e faz match com
`Condominio.nome`. Linhas sem match são ignoradas e reportadas.

## Deploy — Hostinger VPS

```bash
# No servidor
cd /var/www/minimerx-dashboard
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart minimerx-dashboard  # ou pm2 start ecosystem.config.js --env production
```

Nginx: copiar `nginx.conf` para `/etc/nginx/sites-available/minimerx`, habilitar via symlink em
`sites-enabled`, testar (`sudo nginx -t`) e recarregar (`sudo systemctl reload nginx`).

SSL (Let's Encrypt):
```bash
sudo certbot --nginx -d dashboard.minimerx.com.br
```

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | String de conexão PostgreSQL |
| `AUTH_SECRET` | Segredo NextAuth (`openssl rand -base64 32`) |
| `AUTH_TRUST_HOST` | `true` atrás de proxy reverso |
| `NEXTAUTH_URL` | URL pública (ex: `https://dashboard.minimerx.com.br`) |
| `NODE_ENV` | `development` ou `production` |

## Identidade visual
Definida em `docs/FRONTEND_SKILL.md` e `tailwind.config.ts`. Paleta MiniMerX:
verde `#3DAE3C`, navy `#1E2A5A`, azul `#2E8BC0`.
