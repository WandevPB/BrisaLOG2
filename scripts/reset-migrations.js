const { execSync } = require('child_process');

async function resetMigrations() {
    console.log('🔧 Verificando estado das migrações...');
    
    // Se estamos no Railway (produção), resetar o estado das migrações
    if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
        console.log('🏭 Ambiente de produção detectado - resetando migrações antigas...');
        
        try {
            // Tentar limpar migrações problemáticas
            console.log('🗑️ Limpando migrações antigas...');
            execSync(`npx prisma db execute --sql "DELETE FROM _prisma_migrations WHERE migration_name LIKE '20250904%' OR migration_name LIKE '20250909%';"`, { 
                stdio: 'inherit',
                cwd: process.cwd()
            });
            console.log('✅ Migrações antigas removidas!');
            
        } catch (error) {
            console.log('⚠️ Tabela _prisma_migrations não existe ainda ou erro esperado:', error.message);
        }
        
        try {
            // Verificar se as tabelas já existem
            console.log('🔍 Verificando se as tabelas já existem...');
            execSync(`npx prisma db execute --sql "SELECT 1 FROM cds LIMIT 1;"`, { 
                stdio: 'pipe',
                cwd: process.cwd()
            });
            
            console.log('✅ Tabelas existem - marcando migração como aplicada...');
            execSync(`npx prisma db execute --sql "INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('20241006000000_init', '0', NOW(), '20241006000000_init', NULL, NULL, NOW(), 1) ON CONFLICT (id) DO NOTHING;"`, { 
                stdio: 'inherit',
                cwd: process.cwd()
            });
            
        } catch (error) {
            console.log('📝 Tabelas não existem ainda ou migração já marcada');
        }
        
        console.log('✅ Reset de migrações concluído!');
    } else {
        console.log('🏠 Ambiente de desenvolvimento - pulando reset de migrações');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    resetMigrations().catch(console.error);
}

module.exports = { resetMigrations };