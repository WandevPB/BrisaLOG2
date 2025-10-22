// Script para remover migration travada do banco PostgreSQL via Prisma
// Uso: node scripts/fix_failed_migration.js

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://base_brisalog_user:4ZCNfYklhEGxoWbQUcCoNNF8JUP1E3Tm@dpg-d3rre1be5dus73bs0hpg-a.oregon-postgres.render.com/base_brisalog';
const MIGRATION_NAME = '20250904123907_add_recovery_fields';

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Conectado ao banco PostgreSQL!');
    const res = await client.query(
      `DELETE FROM _prisma_migrations WHERE migration_name = $1`,
      [MIGRATION_NAME]
    );
    console.log(`Migration removida: ${MIGRATION_NAME}`);
    console.log(`Linhas afetadas: ${res.rowCount}`);
  } catch (err) {
    console.error('Erro ao remover migration:', err);
  } finally {
    await client.end();
    console.log('Conexão encerrada.');
  }
}

main();
