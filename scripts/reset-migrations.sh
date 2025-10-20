#!/bin/bash
# Script para resetar migrações no Railway

echo "🔧 Resetando estado das migrações no Railway..."

# Se estamos no Railway (produção), resetar o estado das migrações
if [ "$NODE_ENV" = "production" ] && [ ! -z "$DATABASE_URL" ]; then
    echo "🏭 Ambiente de produção detectado - resetando migrações..."
    
    # Remover estado de migrações problemáticas
    echo "🗑️ Limpando tabela _prisma_migrations..."
    npx prisma db execute --sql "DELETE FROM _prisma_migrations WHERE migration_name LIKE '20250904%' OR migration_name LIKE '20250909%';" || echo "⚠️ Tabela _prisma_migrations não existe ainda"
    
    # Marcar nossa migração como aplicada se as tabelas já existem
    echo "🔍 Verificando se as tabelas já existem..."
    if npx prisma db execute --sql "SELECT 1 FROM cds LIMIT 1;" > /dev/null 2>&1; then
        echo "✅ Tabelas existem - marcando migração como aplicada..."
        npx prisma db execute --sql "INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('20241006000000_init', '0', NOW(), '20241006000000_init', NULL, NULL, NOW(), 1) ON CONFLICT (id) DO NOTHING;" || echo "📝 Migração já marcada"
    fi
    
    echo "✅ Reset de migrações concluído!"
else
    echo "🏠 Ambiente de desenvolvimento - pulando reset de migrações"
fi