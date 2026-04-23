# MiniMerX Dashboard

Aplicacao web da MiniMerX para operacao, prestacao de contas e acompanhamento de condominios parceiros.

Documentacao complementar:

- `docs/ARQUITETURA.md`
- `docs/BRANCHING_WORKFLOW.md`

## Stack

- Next.js 14
- PostgreSQL + Prisma ORM
- Auth.js / NextAuth v5 com Credentials
- Tailwind CSS + shadcn/ui + Recharts
- `xlsx` para importacao de planilhas legadas `.xls/.xlsx`
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

## Importacao de vendas

Formato esperado:

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

Veja `.env.example` para referencia.

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

## Seguranca operacional

Checklist minimo antes de publicar:

1. Gerar novo `AUTH_SECRET`.
2. Definir `AUTH_SESSION_VERSION`.
3. Definir senha segura para `ADMIN_INITIAL_PASSWORD`.
4. Girar `SMTP_PASS` e credenciais de banco se ja tiverem sido expostas.
5. Garantir deploy com HTTPS ativo.
6. Nunca versionar `.env`, cookies ou dumps de sessao.
