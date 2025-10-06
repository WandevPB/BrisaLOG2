const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Verificar se DATABASE_URL está configurada
const databaseUrl = process.env.DATABASE_URL;

console.log('🔍 Verificando configuração do banco de dados...');
console.log('DATABASE_URL:', databaseUrl ? 'CONFIGURADA' : 'NÃO CONFIGURADA');

// Se não há DATABASE_URL ou é um arquivo SQLite, usar SQLite
if (!databaseUrl || databaseUrl.startsWith('file:')) {
  console.log('📁 Usando SQLite para desenvolvimento...');
  
  // Usar schema SQLite
  const sqliteSchemaPath = path.join(__dirname, 'prisma', 'schema-sqlite.prisma');
  const mainSchemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  
  if (fs.existsSync(sqliteSchemaPath)) {
    fs.copyFileSync(sqliteSchemaPath, mainSchemaPath);
    console.log('✅ Schema SQLite ativado');
  }
  
} else if (databaseUrl.startsWith('postgres')) {
  console.log('🐘 Usando PostgreSQL para produção...');
  
  // Verificar se podemos conectar
  try {
    execSync('npx prisma validate', { stdio: 'inherit' });
    console.log('✅ Schema PostgreSQL válido');
  } catch (error) {
    console.error('❌ Erro na validação do schema PostgreSQL:', error.message);
    process.exit(1);
  }
  
} else {
  console.log('⚠️ URL de banco não reconhecida, usando configuração padrão...');
}

console.log('🎯 Configuração do banco finalizada!');