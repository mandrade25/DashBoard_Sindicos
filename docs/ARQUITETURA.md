# Arquitetura

## Visao geral

O MiniMerX Dashboard e uma aplicacao `Next.js` com App Router, `Prisma` e `PostgreSQL`, usada para operacao interna, acompanhamento de condominios e prestacao de contas.

Camadas principais:

- `src/app`
  Telas, layouts e rotas HTTP do App Router.
- `src/lib`
  Autenticacao, acesso a banco, queries de dashboard, versionamento e utilitarios compartilhados.
- `prisma`
  Schema, migrations e seed do banco.
- `docs`
  Decisoes arquiteturais, fluxo de branches e guias operacionais.

## Auth e sessao

A autenticacao usa `Auth.js / NextAuth v5` com `Credentials Provider` e estrategia de sessao em `JWT`.

Decisoes atuais:

- sessao sem tabela dedicada de session no banco
- claims minimas no token para role e contexto de condominio
- `AUTH_SESSION_VERSION` para invalidacao global de sessoes sem depender apenas de troca de segredo
- revalidacao adicional de contexto no backend para rotas sensiveis

Arquivos principais:

- [auth.ts](/C:/Dev/Claude/Projetos/DashBoard_Sindicos/src/lib/auth.ts)
- [session-version.ts](/C:/Dev/Claude/Projetos/DashBoard_Sindicos/src/lib/session-version.ts)
- [middleware.ts](/C:/Dev/Claude/Projetos/DashBoard_Sindicos/src/middleware.ts)

## Decisao: middleware em Node.js

O middleware roda explicitamente com `runtime: "nodejs"` e nao em Edge.

Motivacao:

- o projeto usa `next-auth/jwt` no middleware
- com `Next.js 15.5` houve warnings de build ligados a `jose` no Edge Runtime
- a execucao em `nodejs` elimina esse atrito e deixa o comportamento consistente com a stack real da aplicacao
- o projeto nao depende de latencia de edge para esse ponto; aqui a prioridade e previsibilidade operacional e compatibilidade

Implementacao:

- [middleware.ts](/C:/Dev/Claude/Projetos/DashBoard_Sindicos/src/middleware.ts)

Regra arquitetural:

- nao mover autenticacao de middleware de volta para Edge sem revalidar compatibilidade de `Auth.js`, `jose`, estrategia de sessao e dependencias usadas no fluxo

## Cache e protecao de rotas autenticadas

As rotas autenticadas recebem headers `no-store` no middleware para reduzir risco de cache indevido em CDN/proxy intermediario, especialmente para payloads dinâmicos do dashboard.

Essa decisao existe para evitar:

- respostas autenticadas cacheadas por engano
- payload RSC antigo servido apos rebuild
- inconsistencias de navegacao apos deploy

## Versionamento da aplicacao

A versao oficial da aplicacao tem fonte unica de verdade:

- [package.json](/C:/Dev/Claude/Projetos/DashBoard_Sindicos/package.json)

O frontend nao deve manter numero de versao hardcoded em componente ou helper.

Fluxo atual:

1. `package.json` define `version`
2. [next.config.mjs](/C:/Dev/Claude/Projetos/DashBoard_Sindicos/next.config.mjs) expoe essa versao como `NEXT_PUBLIC_APP_VERSION`
3. [version.ts](/C:/Dev/Claude/Projetos/DashBoard_Sindicos/src/lib/version.ts) centraliza o consumo no app
4. o sidebar/rodape exibe a versao a partir dessa camada

Arquivos relacionados:

- [next.config.mjs](/C:/Dev/Claude/Projetos/DashBoard_Sindicos/next.config.mjs)
- [version.ts](/C:/Dev/Claude/Projetos/DashBoard_Sindicos/src/lib/version.ts)
- [AppSidebar.tsx](/C:/Dev/Claude/Projetos/DashBoard_Sindicos/src/components/AppSidebar.tsx)

Regra arquitetural:

- ao publicar nova versao, atualizar somente `package.json` e `package-lock.json`
- o app deve refletir automaticamente esse valor no build
- evitar duplicacao manual de versao em `src/`

Convencao recomendada:

- `npm version patch` para correcao
- `npm version minor` para evolucao compativel
- `npm version major` para mudanca com quebra

## Evolucao SaaS

O estado atual ainda carrega forte heranca de dashboard operacional, mas a base esta sendo preparada para uma arquitetura SaaS com separacao progressiva entre:

- institucional
- plataforma autenticada
- backoffice MiniMerX

Direcao futura:

- conta/tenant como nivel acima de condominio
- multiplos usuarios por cliente
- multiplos condominios por conta
- assinatura e billing desacoplados do dominio operacional atual

## Principios de manutencao

- preservar producao atual antes de grandes mudancas estruturais
- preferir refactors pequenos e reversiveis
- validar autenticacao e autorizacao no backend, nao apenas no frontend
- manter documentacao de decisao tecnica junto do repositorio
