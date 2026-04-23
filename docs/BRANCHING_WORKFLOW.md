# Branching Workflow

## Objetivo

Este workflow existe para proteger a producao atual e permitir evolucao incremental da plataforma MiniMerX sem misturar manutencao operacional com reorganizacao estrutural.

## Branches Principais

### `main`

- branch de producao
- recebe apenas hotfixes, correcoes validadas e entregas prontas para release
- deve permanecer estavel

### `codex/arquitetura-saas`

- branch de evolucao estrutural e preparacao SaaS
- usada para documentacao arquitetural, organizacao de codigo, refactors seguros e mudancas incrementais de base
- nao deve ser usada para hotfixes urgentes de producao sem alinhamento explicito

## Regras Operacionais

1. Nunca trabalhar direto em `main` para iniciativas de reorganizacao.
2. Hotfixes de producao devem nascer de `main`.
3. Evolucao SaaS deve continuar em `codex/arquitetura-saas`.
4. Refactors grandes devem ser quebrados em entregas pequenas e revisaveis.
5. Antes de alterar estrutura, revisar impacto na producao atual.
6. Nao misturar correcoes urgentes de operacao com mudancas amplas de arquitetura na mesma entrega.

## Tipos de Trabalho

### Hotfix

- origem: `main`
- destino: `main`
- escopo: correcao urgente e isolada

### Evolucao incremental

- origem: `codex/arquitetura-saas`
- destino: `codex/arquitetura-saas` ate consolidacao
- escopo: documentacao, preparacao SaaS, refactors seguros, modularizacao

### Feature futura de produto

Preferencia:

- sair de `codex/arquitetura-saas` quando a feature depender da nova organizacao
- sair de `main` apenas se for independente da trilha SaaS e precisar ir rapido para producao

## Estrategia Recomendada para Esta Fase

Ordem de prioridade:

1. diagnostico e documentacao
2. helpers compartilhados e naming
3. consolidacao de acesso e autorizacao
4. modularizacao por dominio
5. novas entidades SaaS

## O Que Evitar

- megarefactor de schema e codigo na mesma entrega
- remocao imediata de compatibilidade legada sem checklist
- alterar contratos de auth e acesso sem revisar todas as rotas
- mudar navegacao de produto e persistencia ao mesmo tempo

## Criterio de Merge Futuro

Uma entrega de `codex/arquitetura-saas` so deve ser promovida para `main` quando:

- estiver funcionalmente segura
- tiver escopo claro
- nao depender de migracao estrutural ainda nao aplicada
- estiver documentada

## Convencao de Branches Auxiliares

Quando necessario abrir branches auxiliares a partir de `codex/arquitetura-saas`, usar prefixos como:

- `codex/docs-*`
- `codex/refactor-*`
- `codex/saas-*`

Isso facilita revisao e mantem o contexto da trilha.
