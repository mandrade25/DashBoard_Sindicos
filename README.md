# MiniMerX Dashboard

Aplicacao web da MiniMerX para operacao, prestacao de contas e acompanhamento de condominios parceiros. A base atual roda em Next.js 14 com Prisma, PostgreSQL e Auth.js, e esta sendo preparada na branch `codex/arquitetura-saas` para evoluir de dashboard operacional para plataforma SaaS.

## Estado atual do produto

Hoje o repositorio concentra:

- login e sessao de usuarios
- dashboard financeiro por condominio
- historico de comprovantes e comunicacoes
- upload de vendas por planilha
- backoffice administrativo MiniMerX

A direcao estrategica de medio prazo e separar:

- `minimerx.com.br` e `www.minimerx.com.br` para institucional
- `app.minimerx.com.br` para a plataforma SaaS

Documentos principais:

- [docs/ARQUITETURA.md](docs/ARQUITETURA.md)
- [docs/ROADMAP_SAAS.md](docs/ROADMAP_SAAS.md)
- [docs/BRANCHING_WORKFLOW.md](docs/BRANCHING_WORKFLOW.md)
- [docs/ESPECIFICACAO_FUNCIONAL_EVOLUCAO.md](docs/ESPECIFICACAO_FUNCIONAL_EVOLUCAO.md)
- [docs/FRONTEND_SKILL.md](docs/FRONTEND_SKILL.md)

## Stack

- Next.js 14 (App Router) + TypeScript
- PostgreSQL + Prisma ORM
- Auth.js / NextAuth v5 beta com JWT e Credentials
- Tailwind CSS + shadcn/ui + Recharts
- SheetJS (`xlsx`) para importacao de planilhas
- PM2 + Nginx ou EasyPanel para deploy

## Pre-requisitos

- Node.js 20+
- npm 10+
- PostgreSQL 14+

## Setup local

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Credenciais iniciais do seed:

- Email: `admin@minimerx.com.br`
- Senha: `MiniMerX@2026`

## Scripts

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Sobe o ambiente de desenvolvimento |
| `npm run build` | Gera build de producao |
| `npm start` | Inicia a aplicacao em modo producao |
| `npm run db:generate` | Gera Prisma Client |
| `npm run db:migrate` | Cria e aplica migration de desenvolvimento |
| `npm run db:deploy` | Aplica migrations em producao |
| `npm run db:seed` | Executa `prisma/seed.ts` |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run db:reset` | Reseta o banco local |
| `npm run deploy:release` | Release command para EasyPanel |
| `npm run deploy:verify` | Gera client e valida o build |

## Estrutura resumida

```text
prisma/
  schema.prisma
  seed.ts
docs/
  ARQUITETURA.md
  BRANCHING_WORKFLOW.md
  ROADMAP_SAAS.md
src/
  app/
    (auth)/
    (dashboard)/
    api/
  components/
  lib/
```

## Principais modulos atuais

### Portal autenticado

- `/dashboard`
- `/historico`
- `/notificacoes`
- `/perfil`

### Backoffice MiniMerX

- `/admin/consolidado`
- `/admin/condominios`
- `/admin/comprovantes`
- `/admin/pendencias`
- `/admin/calendario`
- `/admin/auditoria`
- `/admin/upload`
- `/admin/dados`

## Modelo atual de acesso

Perfis implementados hoje:

- `ADMIN`
- `SINDICO`

O sistema ja suporta acessos multi-condominio por `UsuarioCondominio`, mas ainda preserva compatibilidade com o campo legado `Usuario.condominioId`. A arquitetura alvo desta trilha SaaS e mover o sistema para um modelo com conta assinante, memberships e papeis mais granulares.

## Upload de vendas

Formato esperado da planilha:

| Coluna | Conteudo | Exemplo |
|--------|----------|---------|
| A | Unidade | `MINIMERX - MORATA DOS PASSAROS` |
| B | Data | `15/03/2026` |
| C | Vl Venda | `1234.56` |

O parser normaliza o nome da unidade e faz o match com `Condominio.nome`.

## Variaveis de ambiente

| Variavel | Descricao |
|----------|-----------|
| `DATABASE_URL` | String de conexao com PostgreSQL |
| `AUTH_SECRET` | Segredo do Auth.js |
| `AUTH_TRUST_HOST` | `true` quando atras de proxy |
| `NEXTAUTH_URL` | URL publica da aplicacao |
| `NODE_ENV` | `development` ou `production` |

Veja tambem `.env.example`.

## Deploy VPS

```bash
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart minimerx-dashboard
```

O `nginx.conf` e o `ecosystem.config.js` na raiz servem como base para o deploy em VPS Hostinger.

## EasyPanel

O repositorio ja possui `.nixpacks.toml` para build com Nixpacks.

Configuracao esperada:

- Start Command: `npm run start`
- Release Command: `npm run deploy:release`
- Port: `3000`

## Branching

Regras desta fase:

- `main` continua sendo a branch de producao
- `codex/arquitetura-saas` concentra organizacao e preparacao SaaS

Detalhes em [docs/BRANCHING_WORKFLOW.md](docs/BRANCHING_WORKFLOW.md).
