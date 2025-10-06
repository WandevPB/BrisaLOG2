#!/bin/bash

echo "🚀 Iniciando BrisaLOG em produção..."

# Verificar se Prisma está instalado
echo "� Verificando Prisma..."
if ! command -v prisma &> /dev/null; then
    echo "📥 Instalando Prisma globalmente..."
    npm install -g prisma
fi

# Gerar cliente Prisma
echo "� Gerando cliente Prisma..."
npx prisma generate

# Aplicar migrações do banco (criar tabelas)
echo "🗄️ Criando tabelas no banco de dados..."
npx prisma db push --force-reset

# Executar seed (dados iniciais)
echo "🌱 Populando banco de dados com dados iniciais..."
node prisma/seed.js

# Verificar se as tabelas foram criadas
echo "✅ Verificando estrutura do banco..."
npx prisma db seed --preview-feature || echo "Seed já executado"

# Iniciar servidor
echo "🌟 Iniciando servidor BrisaLOG..."
node backend/server.js