# MiniMerX Dashboard

Aplicacao web da MiniMerX para operacao, prestacao de contas e acompanhamento de condominios parceiros. A base atual roda em Next.js com Prisma, PostgreSQL e Auth.js, e esta sendo preparada na branch `codex/arquitetura-saas` para evoluir de dashboard operacional para plataforma SaaS.

Documentacao principal:

- [docs/ARQUITETURA.md](docs/ARQUITETURA.md)
- [docs/ROADMAP_SAAS.md](docs/ROADMAP_SAAS.md)
- [docs/BRANCHING_WORKFLOW.md](docs/BRANCHING_WORKFLOW.md)
- [docs/ESPECIFICACAO_FUNCIONAL_EVOLUCAO.md](docs/ESPECIFICACAO_FUNCIONAL_EVOLUCAO.md)
- [docs/FRONTEND_SKILL.md](docs/FRONTEND_SKILL.md)

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

## Stack

- Next.js 15 (App Router) + TypeScript
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
```

Antes do seed, defina uma senha inicial segura para o admin bootstrap.

Exemplo em PowerShell:

```powershell
$env:ADMIN_INITIAL_PASSWORD="defina-uma-senha-forte-aqui"
npm run db:seed
```

Exemplo em bash:

```bash
ADMIN_INITIAL_PASSWORD="defina-uma-senha-forte-aqui" npm run db:seed
```

Depois:

```bash
npm run dev
```

## Bootstrap do admin

O seed nao usa mais senha padrao fixa.

Variaveis relevantes:

- `ADMIN_INITIAL_EMAIL`
- `ADMIN_INITIAL_PASSWORD`

Regras:

- `ADMIN_INITIAL_PASSWORD` e obrigatoria para rodar o seed
- use pelo menos 12 caracteres
- nao reutilize senha entre ambientes

## Invalidação global de sessão

Para forcar logout global de todos os usuarios, altere:

- `AUTH_SECRET`, ou
- `AUTH_SESSION_VERSION`

`AUTH_SESSION_VERSION` existe para invalidar sessao sem trocar imediatamente o segredo principal.

Exemplo:

```env
AUTH_SESSION_VERSION="2"
```

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

Hardening atual do upload:

- apenas `.xls` e `.xlsx`
- limite de 5 MB por arquivo
- limite de 10.000 linhas por importacao

## Variaveis de ambiente

| Variavel | Descricao |
|----------|-----------|
| `DATABASE_URL` | Conexao com PostgreSQL |
| `AUTH_SECRET` | Segredo principal do Auth.js |
| `AUTH_SESSION_VERSION` | Versao para invalidacao global de sessao |
| `AUTH_TRUST_HOST` | `true` quando atras de proxy |
| `NEXTAUTH_URL` | URL publica da aplicacao |
| `NODE_ENV` | `development` ou `production` |
| `UPLOADS_DIR` | Diretorio de uploads |
| `SMTP_HOST` | Host SMTP |
| `SMTP_PORT` | Porta SMTP |
| `SMTP_SECURE` | TLS/SSL SMTP |
| `SMTP_USER` | Usuario SMTP |
| `SMTP_PASS` | Senha SMTP |
| `SMTP_FROM` | Remetente padrao |
| `ADMIN_INITIAL_EMAIL` | Email do admin bootstrap |
| `ADMIN_INITIAL_PASSWORD` | Senha do admin bootstrap |

Veja tambem `.env.example`.

## Deploy VPS

```bash
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart minimerx-dashboard
```

O `nginx.conf` versionado agora assume HTTPS obrigatorio:

- `80` redireciona para `443`
- `443` usa certificado Let's Encrypt
- HSTS habilitado

Antes de aplicar em servidor, confirme que estes caminhos existem:

- `/etc/letsencrypt/live/minimerx.com.br/fullchain.pem`
- `/etc/letsencrypt/live/minimerx.com.br/privkey.pem`

## Deploy EasyPanel / Nixpacks

Para EasyPanel e outras plataformas baseadas em Nixpacks:

- o `install` usa `npm ci --include=dev`, porque o build precisa de `prisma`, `next` e outras dependencias de desenvolvimento
- mantenha `AUTH_SECRET`, `NEXTAUTH_SECRET`, `AUTH_URL` e similares como variaveis de runtime, nao como build args
- warnings de `SecretsUsedInArgOrEnv` normalmente indicam configuracao da plataforma, nao do codigo da aplicacao

Se `NODE_ENV=production` for definido cedo demais na fase de build, o `npm ci` pode omitir `devDependencies` e quebrar o `postinstall` do Prisma.

## Seguranca operacional

Checklist minimo antes de publicar:

1. Gerar novo `AUTH_SECRET`.
2. Definir `AUTH_SESSION_VERSION`.
3. Definir senha segura para `ADMIN_INITIAL_PASSWORD`.
4. Girar `SMTP_PASS` e credenciais de banco se ja tiverem sido expostas.
5. Garantir deploy com HTTPS ativo.
6. Nunca versionar `.env`, cookies ou dumps de sessao.
