# Arquitetura MiniMerX

## Objetivo

Este documento registra a arquitetura atual da aplicacao, os limites do desenho existente e a direcao de evolucao para a plataforma SaaS da MiniMerX. O objetivo e permitir crescimento incremental sem quebrar o que ja funciona hoje em producao.

## Visao Geral

Hoje o repositorio entrega uma aplicacao Next.js com App Router que concentra tres responsabilidades no mesmo projeto:

1. autenticacao e sessao dos usuarios
2. portal operacional e relatorio para sindicos
3. backoffice administrativo da MiniMerX

Na pratica, a aplicacao atual ainda se comporta como um dashboard operacional com modulos adicionais de prestacao de contas. A base, porem, ja contem varios elementos que favorecem a transicao para SaaS:

- segregacao de acesso por perfil
- isolamento por condominio no backend
- tabela de acesso multi-condominio (`UsuarioCondominio`)
- trilha de auditoria
- comprovantes, envios e notificacoes

## Camadas Atuais

### 1. Interface

- Rotas publicas em `src/app/(auth)`
- Rotas autenticadas em `src/app/(dashboard)`
- Componentes compartilhados em `src/components`

O layout autenticado usa um shell unico para sindicos e administradores. Isso ajuda na manutencao hoje, mas mistura dois contextos de produto diferentes:

- portal do cliente/condominio
- operacao global MiniMerX

### 2. API

As APIs ficam em `src/app/api` e hoje acumulam:

- validacao de acesso
- leitura e escrita no banco
- regras de negocio
- montagem de payloads para a UI

Esse desenho e funcional, mas dificulta a evolucao para modulos SaaS mais claros porque as regras ficam espalhadas por endpoints.

### 3. Regras de negocio

As regras compartilhadas estao majoritariamente em `src/lib`, com destaque para:

- `auth.ts`
- `dashboard-queries.ts`
- `excel-parser.ts`
- `notification-emails.ts`
- `audit.ts`
- `storage.ts`

O repositorio ja usa essa pasta como camada de servicos/utilitarios, mas ainda sem uma divisao explicita por dominios.

### 4. Persistencia

O banco e modelado com Prisma em `prisma/schema.prisma`.

Entidades principais atuais:

- `Usuario`
- `Condominio`
- `UsuarioCondominio`
- `Venda`
- `Comprovante`
- `EnvioEmail`
- `EnvioDestinatario`
- `EmailNotificacao`
- `AuditLog`

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

## Fluxo de Autenticacao Atual

1. O usuario acessa `/login`.
2. O login usa `NextAuth` com `Credentials` e comparacao de senha com `bcrypt`.
3. A sessao e emitida em JWT.
4. O payload da sessao inclui `id`, `role`, `condominioId` e `condominioIds`.
5. O middleware protege rotas autenticadas e restringe `/admin` e `/api/admin` para `ADMIN`.
6. O isolamento por condominio e reforcado nas pages e API routes.

### Observacao importante

O auth ja entende multiacesso por `UsuarioCondominio`, mas ainda preserva compatibilidade com o modelo legado `Usuario.condominioId`. Isso reduz risco de regressao no curto prazo, mas mantem duas fontes de verdade ao mesmo tempo.

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

As rotas autenticadas recebem headers `no-store` no middleware para reduzir risco de cache indevido em CDN/proxy intermediario, especialmente para payloads dinamicos do dashboard.

Essa decisao existe para evitar:

- respostas autenticadas cacheadas por engano
- payload RSC antigo servido apos rebuild
- inconsistencias de navegacao apos deploy

## Fluxo Principal de Dados

### Vendas

1. O admin importa planilhas via upload.
2. O parser normaliza unidades e insere `Venda`.
3. As rotas de dashboard agregam vendas por periodo.
4. O repasse e calculado dinamicamente com base em `percentualRepasse`.

### Prestacao de contas

1. O admin cria e versiona `Comprovante`.
2. O sistema registra `EnvioEmail` e destinatarios.
3. O sindico consulta historico, comprovantes e notificacoes.
4. Confirmacoes e eventos relevantes alimentam `AuditLog`.

## O Que Esta Bom Hoje

- App unica, simples de subir e operar
- Isolamento de dados ja levado a serio no backend
- Base de auth suficiente para continuar evoluindo
- Dominio ja mais rico do que um dashboard simples
- Backoffice MiniMerX ja diferenciado do portal do sindico

## Limites do Desenho Atual

### 1. Modelo ainda centrado em `Usuario -> Condominio`

Mesmo com `UsuarioCondominio`, muita logica ainda assume:

- um condominio principal por usuario
- escolha de condominio como estado local de tela
- ausencia de uma conta assinante acima do condominio

Isso torna a evolucao para SaaS mais custosa do que precisa ser.

### 2. Papeis ainda insuficientes

Hoje o enum de role tem apenas:

- `ADMIN`
- `SINDICO`

Para o modelo futuro, isso e pouco. Falta distinguir:

- administracao global MiniMerX
- conta cliente
- gestor operacional do cliente
- usuario financeiro
- usuarios com visao parcial

### 3. Falta de fronteira entre produto e operacao

O mesmo projeto entrega, com forte acoplamento:

- portal do cliente
- backoffice MiniMerX
- inicio de funcionalidades que poderiam virar modulos SaaS independentes

### 4. Regras espalhadas

Validacoes de acesso e selecao de condominio aparecem em varios arquivos. Isso aumenta risco de inconsistencias e dificulta migracoes graduais.

### 5. Documentacao de entrada desatualizada

O `README.md` ficou atras da aplicacao real e nao explicita a estrategia de evolucao SaaS.

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

## Direcao Futura Obrigatoria

O desenho alvo deve preparar o ecossistema MiniMerX para tres superficies distintas:

### 1. Institucional

Dominios:

- `minimerx.com.br`
- `www.minimerx.com.br`

Responsabilidade:

- marketing
- proposta comercial
- captura de leads
- posicionamento da marca

### 2. App SaaS

Dominio:

- `app.minimerx.com.br`

Responsabilidade:

- autenticacao
- area do cliente
- operacao diaria
- prestacao de contas
- gestao de usuarios
- modulos contratados

### 3. Backoffice MiniMerX

Preferencialmente dentro do app, mas com fronteira explicita de autorizacao e navegacao.

Responsabilidade:

- administracao global
- suporte
- auditoria
- onboarding de contas
- configuracoes da plataforma

## Arquitetura-Alvo SaaS

### Modelo conceitual

O modelo futuro recomendado para o dominio e:

- `PlatformUser`
- `Tenant`
- `TenantMembership`
- `Subscription`
- `Condominio`
- `CondominioMembership`

Na pratica, a evolucao pode aproveitar a base atual com os seguintes nomes de transicao:

- `Usuario` -> usuario de plataforma
- `Tenant` ou `Conta` -> cliente assinante
- `TenantUser` -> vinculo usuario/conta com papel
- `Subscription` -> plano, status, billing e ciclo comercial
- `Condominio` -> unidade operacional pertencente a uma conta
- `UsuarioCondominio` -> vinculo adicional de escopo

### Papeis recomendados

- `SUPER_ADMIN`: administracao global MiniMerX
- `ACCOUNT_OWNER`: dono da conta assinante
- `CLIENT_ADMIN`: administrador da conta
- `GESTOR`: operador/gestor do cliente
- `SINDICO`: representante do condominio
- `FINANCEIRO`: acesso financeiro e documental

Observacao:

`ACCOUNT_OWNER` e `CLIENT_ADMIN` podem comecar como um unico papel no inicio para reduzir complexidade.

## Dominios Internos Recomendados

A organizacao do codigo deve evoluir gradualmente para dominios mais claros:

- `auth`
- `users`
- `tenants`
- `subscriptions`
- `condominios`
- `sales`
- `prestacao-contas`
- `comprovantes`
- `envios`
- `billing`
- `auditoria`

Uma estrutura possivel para o medio prazo:

```text
src/
  modules/
    auth/
    users/
    tenants/
    subscriptions/
    condominios/
    sales/
    prestacao-contas/
    notifications/
    audit/
```

No curto prazo, isso nao precisa significar mover tudo. Basta comecar a criar novas regras e helpers nesses limites em vez de continuar espalhando a logica nas rotas.

## Estrategia de Migracao Sem Reescrever Tudo

### Etapa 1. Consolidar fronteiras e nomenclatura

- atualizar documentacao
- explicitar branch strategy
- centralizar helpers de acesso
- padronizar resolucao de condominio selecionado

### Etapa 2. Tratar multi-condominio como canonico

- `UsuarioCondominio` passa a ser a fonte principal de acesso
- `Usuario.condominioId` fica apenas como compatibilidade temporaria
- remocao so depois de todas as rotas convergirem

### Etapa 3. Introduzir conta assinante

- criar `Tenant` ou `Conta`
- vincular `Condominio` a `Tenant`
- introduzir memberships por conta

### Etapa 4. Separar autorizacao por contexto

- contexto global MiniMerX
- contexto da conta cliente
- contexto do condominio

### Etapa 5. Introduzir assinatura e billing

- plano
- status da assinatura
- ciclo
- recursos habilitados

## Quick Wins

- corrigir e modernizar o `README.md`
- criar este documento de arquitetura
- documentar branching
- unificar helper de acesso a condominio
- reduzir checks duplicados e legados em pages e APIs

## Mudancas Estruturais Posteriores

- adicionar `Tenant`
- revisar enum de roles
- separar modulos por dominio
- preparar billing/subscription
- separar institucional e app em superficies distintas

## Roadmap Tecnico Incremental

### Fase A. Base arquitetural

- documentacao de arquitetura
- documentacao de branching
- alinhamento do README
- centralizacao de helpers de acesso

### Fase B. Convergencia do modelo atual

- remover checks espalhados de `condominioId`
- unificar selecao de contexto nas telas de sindico
- tornar `UsuarioCondominio` o acesso canonico

### Fase C. Introducao da camada SaaS

- criar `Tenant`
- ligar condominios a tenants
- adicionar memberships por tenant
- preparar papeis ampliados

### Fase D. Produto comercializavel

- assinatura
- billing
- onboarding self-service assistido
- governanca por conta

## Decisoes em Aberto

### Opcao 1. `Tenant` como empresa/cliente

Vantagem:

- linguagem padrao de SaaS

Trade-off:

- menos familiar para o negocio no inicio

### Opcao 2. `Conta` como cliente assinante

Vantagem:

- mais clara para times nao tecnicos

Trade-off:

- pode exigir traducao futura para conceitos tecnicos ou multiplas contas por cliente

Recomendacao:

usar `Conta` no discurso de produto e `Tenant` no desenho tecnico, se isso ajudar o alinhamento entre negocio e engenharia.

## Principios de manutencao

- preservar producao atual antes de grandes mudancas estruturais
- preferir refactors pequenos e reversiveis
- validar autenticacao e autorizacao no backend, nao apenas no frontend
- manter documentacao de decisao tecnica junto do repositorio
