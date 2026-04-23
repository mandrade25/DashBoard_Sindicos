# Branching Workflow

## Objetivo

Este projeto passa a operar com duas trilhas principais:

- `main`: produção, hotfixes, ajustes rápidos e pequenas evoluções
- `codex/arquitetura-saas`: reorganização estrutural, documentação, refactors e preparação para SaaS multi-tenant

Isso permite seguir entregando correções com baixo risco enquanto a arquitetura evolui em paralelo.

## Regras

1. Toda correção urgente vai primeiro para `main`.
2. Toda mudança estrutural ou de médio prazo vai para `codex/arquitetura-saas`.
3. A branch `codex/arquitetura-saas` deve ser atualizada com frequência a partir da `main`.
4. Evitar PRs gigantes de volta para `main`; preferir blocos pequenos e revisáveis.

## Sincronização da branch paralela

Sempre que `main` receber hotfixes relevantes de autenticação, deploy, domínio, banco ou permissões:

```bash
git checkout codex/arquitetura-saas
git fetch origin
git merge origin/main
```

Se houver conflito, resolver imediatamente para não acumular divergência.

## Fluxo recomendado

### Hotfix / produção

```bash
git checkout main
git pull
# implementar ajuste
git add .
git commit -m "fix(...): ..."
git push
```

Depois do push em `main`, atualizar a branch de arquitetura:

```bash
git checkout codex/arquitetura-saas
git fetch origin
git merge origin/main
git push
```

### Trabalho estrutural

```bash
git checkout codex/arquitetura-saas
git pull
# implementar mudança estrutural
git add .
git commit -m "refactor(...): ..."
git push
```

## Convenção de commits

- `fix(...)`: correção funcional
- `chore(...)`: manutenção técnica ou infraestrutura
- `docs(...)`: documentação
- `refactor(...)`: reorganização sem alterar comportamento esperado
- `feat(...)`: nova funcionalidade

## Próximas frentes previstas para `codex/arquitetura-saas`

1. Revisar README e documentação com encoding e instruções atualizadas
2. Criar `docs/ARQUITETURA.md`
3. Mapear evolução para `app.minimerx.com.br`
4. Preparar modelo para conta/tenant/assinatura/novos papéis
5. Separar melhor camadas de domínio, serviços e rotas
