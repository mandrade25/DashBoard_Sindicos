#!/bin/bash
# =============================================================================
# deploy.sh — Deploy limpo do MiniMerX Dashboard na Hostinger VPS
# =============================================================================
# Uso: bash scripts/deploy.sh
# Deve ser executado em: /var/www/DashBoard_Sindicos/Projetos/DashBoard_Sindicos
#
# O que este script faz diferente dos deploys anteriores:
#   1. Para e apaga o processo PM2 *antes* de qualquer outra coisa
#   2. Mata TODOS os processos na porta 3000 (não apenas o gerenciado pelo PM2)
#      → Isso resolve o "EADDRINUSE" causado por processos órfãos
#   3. Remove completamente o diretório .next antes de rebuild
#   4. Recria o PM2 com --env production de forma limpa

set -e  # Para imediatamente em qualquer erro

APP_DIR="/var/www/DashBoard_Sindicos/Projetos/DashBoard_Sindicos"
APP_NAME="minimerx-dashboard"
PORT=3000

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║         MiniMerX — Deploy Limpo de Produção          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Garante que estamos na pasta correta
cd "$APP_DIR" || { echo "❌ Pasta não encontrada: $APP_DIR"; exit 1; }
echo "📂 Diretório: $(pwd)"

# ─── 1. Parar e remover processo PM2 ─────────────────────────────────────────
echo ""
echo "⏹  Parando processo PM2..."
pm2 delete "$APP_NAME" 2>/dev/null || echo "   (processo PM2 não existia — ok)"
pm2 save --force 2>/dev/null || true

# ─── 2. Matar TODOS processos na porta 3000 (inclusive órfãos) ───────────────
echo ""
echo "🔍 Verificando processos na porta $PORT..."
PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  echo "   Matando PIDs: $PIDS"
  kill -9 $PIDS 2>/dev/null || true
  sleep 2
  echo "   ✅ Porta $PORT liberada"
else
  echo "   ✅ Porta $PORT já estava livre"
fi

# ─── 3. Atualizar código do repositório ──────────────────────────────────────
echo ""
echo "📥 Atualizando repositório..."
git fetch origin
git reset --hard origin/main
echo "   Commit atual: $(git rev-parse --short HEAD) — $(git log -1 --format='%s')"

# ─── 4. Instalar dependências ────────────────────────────────────────────────
echo ""
echo "📦 Instalando dependências (npm ci)..."
npm ci --omit=dev

# ─── 5. Migrations do banco ──────────────────────────────────────────────────
echo ""
echo "🗄️  Aplicando migrations do Prisma..."
npx prisma migrate deploy
echo "   ✅ Migrations OK"

# ─── 6. Build limpa ──────────────────────────────────────────────────────────
echo ""
echo "🏗️  Removendo build anterior e reconstruindo..."
rm -rf .next
npm run build
echo "   ✅ Build concluída"

# ─── 7. Verificar integridade da build ───────────────────────────────────────
echo ""
echo "🔎 Verificando build..."
BUILD_ID=$(cat .next/BUILD_ID 2>/dev/null || echo "ERRO")
echo "   BUILD_ID: $BUILD_ID"

VERSION_CHECK=$(grep -r "v1\." .next/static/chunks 2>/dev/null | head -1 | cut -c1-120 || echo "")
if [ -n "$VERSION_CHECK" ]; then
  echo "   ✅ Versão encontrada nos chunks estáticos"
else
  echo "   ⚠️  Atenção: versão não localizada nos chunks (verifique src/lib/version.ts)"
fi

LAYOUT_CHUNK=$(ls .next/static/chunks/app/\(dashboard\)/layout-*.js 2>/dev/null | head -1 || echo "")
if [ -n "$LAYOUT_CHUNK" ]; then
  CHUNK_NAME=$(basename "$LAYOUT_CHUNK")
  echo "   Layout chunk: $CHUNK_NAME"
  echo "   Salve este nome para comparar com o que o navegador carrega em produção."
fi

# ─── 8. Iniciar PM2 ──────────────────────────────────────────────────────────
echo ""
echo "🚀 Iniciando PM2..."
pm2 start ecosystem.config.js --env production
pm2 save
echo "   ✅ PM2 iniciado"

# ─── 9. Verificação final ────────────────────────────────────────────────────
echo ""
echo "🌐 Aguardando aplicação iniciar (5s)..."
sleep 5

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT 2>/dev/null || echo "000")
if [[ "$HTTP_STATUS" == "200" || "$HTTP_STATUS" == "307" || "$HTTP_STATUS" == "302" ]]; then
  echo "   ✅ Aplicação respondendo na porta $PORT (HTTP $HTTP_STATUS)"
else
  echo "   ❌ Aplicação não respondeu como esperado (HTTP $HTTP_STATUS)"
  echo "   Verifique os logs: pm2 logs $APP_NAME --lines 50"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║              Deploy concluído com sucesso!           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Próximos passos obrigatórios:"
echo "  1. Copiar nginx.conf para /etc/nginx/sites-available/minimerx"
echo "     sudo cp nginx.conf /etc/nginx/sites-available/minimerx"
echo "     sudo ln -sf /etc/nginx/sites-available/minimerx /etc/nginx/sites-enabled/minimerx"
echo "     sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "  2. Fazer Purge Everything no Cloudflare:"
echo "     Painel → minimerx.com.br → Caching → Cache Rules → Purge Everything"
echo ""
echo "  3. Limpar cache do navegador e testar em aba anônima."
echo ""
