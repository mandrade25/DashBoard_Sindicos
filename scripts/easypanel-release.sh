#!/usr/bin/env sh

set -eu

echo "[easypanel-release] generating Prisma client"
npx prisma generate

echo "[easypanel-release] applying Prisma migrations"
npx prisma migrate deploy

echo "[easypanel-release] release step completed"
