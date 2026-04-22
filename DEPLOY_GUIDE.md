# Guia de Deploy — MiniMerX Dashboard

## Diagnóstico da divergência local × produção (20/04/2026)

### Causa raiz identificada

A divergência (chunk `layout-61b1...` antigo sendo servido no dashboard autenticado enquanto a
build nova tinha `layout-d8fe...`) tinha **três causas combinadas**:

**1. Processo órfão na porta 3000 (causa principal)**

O erro `EADDRINUSE: address already in use :::3000` nos logs do PM2 indicava que existia um
processo Node/Next.js rodando na porta 3000 **fora do controle do PM2**. Quando `pm2 delete`
era executado, esse processo órfão continuava vivo e atendia as requisições com o código da
build antiga. O PM2 subia o processo novo mas o sistema operacional roteava as conexões para
o processo mais antigo (ou havia race condition).

**2. Cloudflare cacheando RSC payloads das rotas autenticadas**

Os headers de resposta capturados mostravam:
```
cf-cache-status: HIT
cache-control: public, max-age=31536000, immutable
age: 1357
```

O Cloudflare estava cacheando o payload RSC (React Server Component) da rota
`/admin/comprovantes`. Esse payload contém a referência ao chunk do layout. Mesmo após o
servidor ter a build nova, o Cloudflare servia o payload antigo que ainda referenciava
`layout-61b1...`. O navegador solicitava esse chunk antigo, que o Cloudflare também tinha em
cache (por 1 ano, com `immutable`).

**3. nginx.conf desatualizado no repositório**

O arquivo `nginx.conf` no repo usava `server_name dashboard.minimerx.com.br` mas o domínio
real em produção é `minimerx.com.br`. O nginx do servidor usava uma configuração diferente da
que estava versionada. Além disso, não havia `Cache-Control: no-store` para rotas dinâmicas.

---

## Correções aplicadas no código (já commitadas)

| Arquivo | O que mudou |
|---|---|
| `src/app/(dashboard)/layout.tsx` | Adicionado `export const dynamic = "force-dynamic"` |
| `src/middleware.ts` | Adicionado `Cache-Control: no-store, private` em todas as respostas autenticadas |
| `nginx.conf` | Corrigido `server_name` para `minimerx.com.br`; separadas diretivas de cache para static vs dinâmico |
| `scripts/deploy.sh` | Script de deploy limpo com `fuser -k` na porta 3000 |

---

## Sequência de deploy na VPS (executar via SSH)

```bash
# 1. Acessar a pasta correta do app
cd /var/www/DashBoard_Sindicos/Projetos/DashBoard_Sindicos

# 2. Executar o script de deploy limpo (faz tudo automaticamente)
bash scripts/deploy.sh
```

O script cuida de:
- Parar PM2
- Matar processos órfãos na porta 3000 com `lsof + kill -9`
- `git reset --hard origin/main`
- `npm ci`
- `prisma migrate deploy`
- `rm -rf .next && npm run build`
- Reiniciar PM2 limpo

---

## Atualizar o Nginx no servidor

O `nginx.conf` do repositório agora é a fonte da verdade. Após o deploy:

```bash
# Copiar o nginx.conf atualizado
sudo cp /var/www/DashBoard_Sindicos/Projetos/DashBoard_Sindicos/nginx.conf \
        /etc/nginx/sites-available/minimerx

# Garantir que o symlink existe
sudo ln -sf /etc/nginx/sites-available/minimerx \
            /etc/nginx/sites-enabled/minimerx

# Testar configuração e recarregar
sudo nginx -t && sudo systemctl reload nginx
```

---

## Purge de cache no Cloudflare (obrigatório após deploy)

1. Acessar: https://dash.cloudflare.com → `minimerx.com.br`
2. Menu **Caching** → **Configuration**
3. Clicar em **Purge Everything**
4. Confirmar

### Page Rule recomendada (previne recorrência)

Configurar uma Cache Rule para nunca cachear HTML/RSC dinâmico:

```
Regra: minimerx.com.br/* (quando NÃO for /_next/static/*)
Ação: Cache Level = Bypass
      OU: Cache-Control override = No-store
```

No painel Cloudflare:
- **Rules** → **Cache Rules** → **Create Rule**
- Condição: `URI Path does not start with /_next/static/`
- Configuração: **Cache Status** = `Bypass`

---

## Verificação pós-deploy (executar na VPS)

```bash
cd /var/www/DashBoard_Sindicos/Projetos/DashBoard_Sindicos

# 1. Confirmar BUILD_ID
cat .next/BUILD_ID

# 2. Confirmar que o chunk novo do layout existe e contém v1.1.0
ls .next/static/chunks/app/\(dashboard\)/layout-*.js
grep -o "v1\.[0-9]\+\.[0-9]\+" .next/static/chunks/app/\(dashboard\)/layout-*.js

# 3. Confirmar que NÃO existe mais o chunk antigo (layout-61b1...)
ls .next/static/chunks/app/\(dashboard\)/layout-61b1*.js 2>/dev/null \
  && echo "⚠️ CHUNK ANTIGO AINDA EXISTE" \
  || echo "✅ Chunk antigo não encontrado"

# 4. Testar que o app responde
curl -I http://localhost:3000
# Esperado: HTTP/1.1 307 com redirect para /login

# 5. Confirmar PM2 rodando
pm2 list
pm2 logs minimerx-dashboard --lines 20 --nostream
```

---

## Verificação no navegador (após deploy + purge Cloudflare)

1. Abrir aba anônima em `https://minimerx.com.br`
2. Logar com `admin@minimerx.com.br` / `MiniMerX@2026`
3. Navegar para `/admin/comprovantes`
4. Abrir DevTools → Network → recarregar
5. Procurar o arquivo `layout-*.js` carregado
6. Verificar que o nome do chunk **bate com o que está no servidor** (saída do passo 2 acima)
7. No DevTools → Elements → buscar `v1.1.0` → deve aparecer no rodapé da sidebar

---

## Se o problema persistir após tudo isso

```bash
# Verificar se ainda há processo órfão na porta 3000
lsof -i :3000

# Se aparecer mais de um processo, matar todos e reiniciar PM2:
fuser -k 3000/tcp
sleep 2
pm2 start ecosystem.config.js --env production
pm2 save
```

Se o Cloudflare continuar servindo conteúdo antigo mesmo após Purge Everything:
- Testar com `curl -H "CF-Cache-Status: BYPASS" https://minimerx.com.br/dashboard`
- Ou acessar diretamente pelo IP da VPS (bypassando Cloudflare) para confirmar que o servidor serve a versão correta
