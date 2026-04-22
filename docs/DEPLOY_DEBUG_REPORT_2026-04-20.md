# Relatório de Debug — Divergência entre `localhost` e produção

Data de referência: 20/04/2026  
Projeto: MiniMerX Dashboard  
Workspace: `C:\Dev\Claude\Projetos\DashBoard_Sindicos`

## Resumo executivo

O problema investigado foi: a interface em produção (`minimerx.com.br`) não refletia exatamente a mesma versão exibida no `localhost`.

Ao longo dos testes, foi confirmado que:

- o repositório local foi atualizado e enviado para o GitHub
- a VPS Hostinger inicialmente estava em commit antigo
- a build de produção foi refeita corretamente na pasta certa
- o PM2 foi realinhado para a pasta correta
- o domínio `minimerx.com.br` está apontando para a aplicação correta
- o subdomínio `dashboard.minimerx.com.br` não existe no DNS/Nginx atual
- a página pública de login em produção já usa a build nova
- a rota autenticada `/admin/comprovantes` ainda estava carregando um chunk antigo do dashboard

Conclusão atual:

- o servidor tem a build nova
- a rota autenticada do dashboard ainda está referenciando um chunk antigo: `layout-61b1d14e577a24d3.js`
- portanto, a divergência entre `localhost` e produção é real e reproduzível

## Contexto inicial

O usuário relatou que:

- a versão rodando no `localhost` não era a mesma da Hostinger
- depois do deploy, a produção ainda não parecia refletir a versão atual
- houve comparação visual entre `localhost` e `minimerx.com.br`

## Estado local inicialmente verificado

Foi verificado no repositório local:

- branch atual: `main`
- remoto: `origin https://github.com/mandrade25/DashBoard_Sindicos.git`
- commit local inicialmente publicado antes da correção: `a409c3e`
- commit local final depois da integração: `9051039cfcff52ecdf7a05dc0617188b8db4d7e9`

Também foi confirmado localmente:

- `src/lib/version.ts` contém `APP_VERSION = "1.1.0"`
- `src/components/AppSidebar.tsx` renderiza `by LAVAX · v{APP_VERSION}`

## Descoberta importante no Git

Foi encontrado que:

- `origin/main` estava alinhado com `a409c3e`
- existia uma branch remota mais nova: `origin/feat/frontend-redesign`
- essa branch continha commits de correção do login/Auth.js v5/proxy que não estavam no `main`

Commits relevantes encontrados na branch remota:

- `2a5a7c8` Create .nixpacks.toml
- `077cf26` fix: mover autoprefixer, postcss, tailwindcss para dependencies
- `de531ba` fix: simplificar route handler do NextAuth
- `0d5f92f` fix: adicionar trustHost para resolver MissingCSRF no proxy
- `83cf630` fix: converter login para Server Action (corrige MissingCSRF)
- `2982bf0` feat: criar Server Action para login (bypass MissingCSRF proxy)
- `839d3b1` fix: criar actions.ts com Server Action para login
- `0bf16d0` fix: converter login-form para usar useActionState
- `00fea11` fix: corrigir import de @/auth para @/lib/auth
- `04edfe7` fix: corrigir JSX corrompido em login-form.tsx
- `3d8c83a` fix: usar redirectTo em vez de redirect:false no loginAction (Auth.js v5)
- `029ef50` fix: interceptar NEXT_REDIRECT do Auth.js v5 no loginAction via error.digest

## Ações feitas no repositório local

Foi feita integração dos commits faltantes no `main`, preservando as features mais novas já existentes no branch principal.

Também foi adicionado ao `.gitignore`:

- `.claude/`
- `.codex-cookie-s.txt`
- `.cookie-*.txt`

Novo commit criado localmente:

- `9051039` `chore: ignore local Codex session artifacts`

Push realizado:

- `main -> origin/main`

## Verificação local de build

Comando executado:

```bash
npm run build
```

Resultado:

- build local passou com sucesso
- rotas de dashboard/admin/api foram geradas
- warnings sobre `bcryptjs` em Edge Runtime foram observados, mas não bloquearam a build

## Problema inicial encontrado na Hostinger

No servidor, foi identificado que o deploy estava sendo feito na pasta errada.

Estrutura observada:

```text
/var/www/DashBoard_Sindicos
└── Projetos
    └── DashBoard_Sindicos
```

Ou seja:

- a raiz Git no servidor era `/var/www/DashBoard_Sindicos`
- o app Next/Prisma real estava em `/var/www/DashBoard_Sindicos/Projetos/DashBoard_Sindicos`

Erros vistos quando comandos foram executados no diretório pai:

- `ENOENT: no such file or directory, open '/var/www/DashBoard_Sindicos/package.json'`
- `Prisma schema file not found`

## Estado do Git na VPS antes da correção

Comandos relevantes:

```bash
git rev-parse HEAD
git log --oneline --decorate -3
git log --oneline --decorate -3 origin/main
```

Resultado:

- `HEAD` na VPS estava em `a409c3e703c6defb7d22c2975a1f6c247a206521`
- `origin/main` já estava em `9051039`

Conclusão:

- a VPS estava em commit antigo

## Correção do deploy na VPS

Pasta correta usada:

```bash
cd /var/www/DashBoard_Sindicos/Projetos/DashBoard_Sindicos
```

Comandos executados:

```bash
npm install
npx prisma migrate deploy
npm run build
```

Resultados:

- `npm install` concluiu com warnings de peer dependency, sem falha
- `npx prisma migrate deploy` informou: `No pending migrations to apply`
- `npm run build` concluiu com sucesso

## Verificação do PM2

Foi verificado:

```bash
pm2 show minimerx-dashboard
```

Resultado importante:

- `exec cwd` estava correto:

```text
/var/www/DashBoard_Sindicos/Projetos/DashBoard_Sindicos
```

## Problema encontrado no PM2

Logs mostraram erro:

```text
Error: listen EADDRINUSE: address already in use :::3000
```

Isso indicou conflito de porta durante reinicializações.

Depois:

- a porta `3000` foi verificada
- foi observado que em um momento ficou livre
- o processo PM2 foi removido e recriado

Comandos usados em momentos diferentes:

```bash
pm2 delete minimerx-dashboard
pm2 start ecosystem.config.js --env production
pm2 save
pm2 restart minimerx-dashboard --update-env
pm2 flush
```

## Estado final do PM2 e servidor

Foi confirmado:

- `pm2 list` mostrava `minimerx-dashboard` online
- `curl -I http://localhost:3000` retornou:

```text
HTTP/1.1 307 Temporary Redirect
location: https://minimerx.com.br/login?callbackUrl=%2F
```

Conclusão:

- aplicação Next estava servindo corretamente na porta 3000

## Verificação do Nginx e domínio

Comandos executados:

```bash
grep -R "server_name" /etc/nginx/sites-enabled /etc/nginx/sites-available
grep -R "proxy_pass" /etc/nginx/sites-enabled /etc/nginx/sites-available
curl -I https://dashboard.minimerx.com.br
curl -I https://minimerx.com.br
```

Resultado:

- `server_name` configurado apenas para:
  - `minimerx.com.br`
  - `www.minimerx.com.br`
- `proxy_pass http://localhost:3000;`
- `dashboard.minimerx.com.br` não resolvia DNS
- `minimerx.com.br` respondia corretamente

Conclusão:

- o domínio válido e publicado é `minimerx.com.br`
- `dashboard.minimerx.com.br` não está configurado

## Primeira confirmação visual de produção

Foi obtida captura de produção mostrando:

- layout novo com sidebar azul
- páginas administrativas novas
- cards e gráficos modernos

Isso indicava que ao menos parte da build nova já estava em uso.

## Diferença real encontrada depois

O usuário comparou `localhost` e produção na rota:

```text
/admin/comprovantes
```

Diferença observada:

- em `localhost`, o rodapé da sidebar mostrava `by LAVAX · v1.1.0`
- em produção, o rodapé mostrava apenas `by LAVAX`

Importante:

- diferenças de dados de tabela foram consideradas normais, pois o banco de produção é diferente do local
- o foco passou a ser apenas na divergência de frontend/versionamento

## Provas coletadas no navegador

### 1. DevTools Elements

Na produção:

- busca por `v1.1.0` no DOM retornou `0 of 0`
- busca por `by LAVAX` encontrou o elemento do rodapé

Conclusão:

- o DOM carregado no navegador da produção não continha `v1.1.0`

### 2. Network — chunk do layout

Foi aberto no DevTools o JS:

```text
/_next/static/chunks/app/(dashboard)/layout-61b1d14e577a24d3.js
```

No `Response`, foi observado:

- aparece `by LAVAX`
- não aparece `v1.1.0`

Conclusão:

- a página autenticada do dashboard estava usando um chunk antigo de layout

### 3. Response headers no DevTools

Em uma captura anterior, foram observados headers:

- `cf-cache-status: HIT`
- `cache-control: public, max-age=31536000, immutable`
- `age: 1357`

Interpretação:

- Cloudflare estava servindo JS antigo em cache

### 4. Payload Flight/RSC da rota autenticada

O usuário copiou do HTML/script da página autenticada:

```html
static/chunks/app/(dashboard)/layout-61b1d14e577a24d3.js
```

E também:

```html
static/chunks/app/(dashboard)/admin/comprovantes/page-93beee5ab27941d2.js
```

Conclusão:

- a própria resposta da rota autenticada estava mandando o navegador usar o chunk antigo `layout-61b1...`

## Provas coletadas no servidor sobre a build nova

No servidor, após rebuild limpa, foi executado:

```bash
grep -R "v1.1.0" .next -n | head
grep -R "by LAVAX" .next -n | head
```

Evidências encontradas:

- `.next/static/chunks/app/(dashboard)/layout-d8fe72359d84a145.js` contém `by LAVAX · v1.1.0`
- `.next/server/chunks/863.js` contém `by LAVAX · v1.1.0`
- `.next/server/app/login.html` corresponde ao login novo

Conclusão:

- a build nova no servidor existe
- o chunk novo do layout no servidor é `layout-d8fe72359d84a145.js`

## Contradição central observada

Servidor:

- possui chunk novo `layout-d8fe72359d84a145.js`
- chunk novo contém `v1.1.0`

Navegador na rota autenticada:

- carrega chunk antigo `layout-61b1d14e577a24d3.js`
- chunk antigo contém apenas `by LAVAX`

Conclusão central:

- o servidor já produziu a versão nova
- mas a rota autenticada ainda está sendo entregue com referência ao chunk antigo

## Testes HTTP feitos a partir da máquina local

Comandos executados com `curl`:

```bash
curl.exe -L https://minimerx.com.br/admin/comprovantes
curl.exe -I https://minimerx.com.br/admin/comprovantes
curl.exe -L https://minimerx.com.br/login
```

Resultados:

- sem sessão autenticada, `/admin/comprovantes` redireciona para `/login`
- o HTML de `/login` já usa build nova com `buildId`:

```text
_S5OvbVOXr6YirSRlGA1S
```

Conclusão:

- página pública de login já é da build nova
- o problema permanece restrito à navegação autenticada/dashboard

## Tentativa de login automatizado

Foi tentado reproduzir o login via `curl` com credenciais:

- usuário: `admin@minimerx.com.br`
- senha: `MiniMerX@2026`

Resultado:

- resposta `500 Internal Server Error`

Importante:

- essa tentativa não reproduz fielmente o fluxo real do navegador, pois a tela usa Server Actions do Next.js com campos ocultos e cookies dinâmicos
- portanto, esse `500` não foi tratado como prova de credencial inválida

## Ações de cache já sugeridas/executadas

Cloudflare:

- painel aberto em `Caching > Configuration`
- ação sugerida: `Purge Everything`

Navegador:

- usar aba anônima
- `Ctrl+F5` / `Ctrl+Shift+R`
- DevTools com `Disable cache`
- limpar `Application > Storage > Clear site data`

Servidor:

- `rm -rf .next`
- rebuild completa
- restart/recreate do PM2

## Hipótese atual mais forte

A hipótese mais forte, com base em todas as evidências, é:

- o HTML/payload da rota autenticada ainda está apontando para um chunk antigo do dashboard (`layout-61b1...`)
- enquanto a build mais recente já gerou um novo chunk (`layout-d8fe...`)

Em outras palavras:

- a rota pública de login já foi atualizada
- a rota autenticada do dashboard ainda está sendo servida com referência antiga

## Próximos passos sugeridos para nova análise

1. No servidor, repetir um ciclo totalmente limpo:

```bash
cd /var/www/DashBoard_Sindicos/Projetos/DashBoard_Sindicos
pm2 delete minimerx-dashboard
rm -rf .next
npm run build
pm2 start ecosystem.config.js --env production
pm2 save
```

2. Validar no servidor:

```bash
grep -R "layout-" .next/server .next/static -n | head -20
grep -R "v1.1.0" .next -n | head -20
```

3. Fazer `Purge Everything` no Cloudflare.

4. Limpar dados do site no navegador.

5. Reabrir em aba anônima.

6. Logar e abrir `/admin/comprovantes`.

7. Verificar no DevTools se a rota autenticada continua apontando para:

```text
layout-61b1d14e577a24d3.js
```

ou se passa a apontar para um chunk novo.

## Pergunta principal para o Claude coworker investigar

Mesmo com:

- repositório atualizado
- build nova presente em `.next`
- PM2 alinhado à pasta correta
- Cloudflare limpo
- domínio correto em `minimerx.com.br`

por que a rota autenticada `/admin/comprovantes` ainda referencia o chunk antigo:

```text
/_next/static/chunks/app/(dashboard)/layout-61b1d14e577a24d3.js
```

em vez do chunk novo presente no servidor?

## Artefatos/evidências úteis citadas nesta investigação

- commit antigo na VPS: `a409c3e703c6defb7d22c2975a1f6c247a206521`
- commit novo no remoto/local: `9051039cfcff52ecdf7a05dc0617188b8db4d7e9`
- buildId visto no login publicado: `_S5OvbVOXr6YirSRlGA1S`
- chunk novo visto no servidor: `layout-d8fe72359d84a145.js`
- chunk antigo visto na rota autenticada do navegador: `layout-61b1d14e577a24d3.js`

