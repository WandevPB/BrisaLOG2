#!/bin/bash

# Script de inicialização para Railway
echo "🚀 Iniciando BrisaLOG em produção..."

# Gerar cliente Prisma
echo "📦 Gerando cliente Prisma..."
npx prisma generate

# Aplicar migrações do banco
echo "🗄️ Aplicando migrações do banco..."
npx prisma db push

# Executar seed se necessário
echo "🌱 Populando banco de dados..."
npm run db:seed

# Iniciar servidor
echo "🌟 Iniciando servidor..."
npm start