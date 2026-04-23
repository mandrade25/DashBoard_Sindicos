# Roadmap SaaS

## Objetivo

Preparar a MiniMerX para evoluir de dashboard operacional para plataforma SaaS vendavel, preservando a estabilidade da aplicacao atual.

## Quick Wins

- atualizar `README.md`
- criar `docs/ARQUITETURA.md`
- registrar `docs/BRANCHING_WORKFLOW.md`
- centralizar helpers de acesso a condominio
- mapear nomenclatura alvo de papeis e dominios

## Etapa 1. Organizar a base atual

Objetivo:

reduzir acoplamento e risco antes de mexer no banco

Entregas:

- consolidacao de helpers de auth/autorizacao
- convergencia do uso de `condominioIds`
- documentacao tecnica atualizada
- padronizacao de selecao de contexto do condominio

## Etapa 2. Fechar o modelo atual

Objetivo:

fazer o sistema atual parar de depender do 1:1 entre usuario e condominio

Entregas:

- `UsuarioCondominio` como acesso principal
- `Usuario.condominioId` apenas temporario
- validacoes unificadas em APIs e pages

## Etapa 3. Introduzir SaaS de verdade

Objetivo:

criar a camada acima do condominio

Entregas:

- entidade `Tenant` ou `Conta`
- vinculo `Condominio -> Tenant`
- memberships por tenant

## Etapa 4. Governanca comercial

Objetivo:

permitir venda e operacao por assinatura

Entregas:

- `Subscription`
- status comercial
- billing
- limites e recursos por plano

## Etapa 5. Produto separado por superficies

Objetivo:

clarificar a experiencia de cada publico

Entregas:

- institucional em `minimerx.com.br`
- app em `app.minimerx.com.br`
- backoffice MiniMerX com fronteira explicita de permissao

## Mudancas Estruturais Por Ordem

### Primeiro

- docs
- helpers
- nomenclatura
- autorizacao

### Depois

- modularizacao por dominio
- novos papeis
- camada tenant

### Por ultimo

- subscription e billing
- remocao de compatibilidade legada
- separacoes mais profundas de superficie e deployment
