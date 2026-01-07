-- =============================================
-- SCRIPT: Criar Tabela relatorios_publicos (NOME CORRETO!)
-- EXECUTAR NO VPS (PostgreSQL)
-- =============================================

-- 1. Dropar tabela antiga com nome errado (se existir)
DROP TABLE IF EXISTS "RelatorioPublico" CASCADE;

-- 2. Criar a tabela com o nome correto que o Prisma espera
CREATE TABLE IF NOT EXISTS relatorios_publicos (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    filtros TEXT NOT NULL,
    "criadoPor" VARCHAR(255) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3),
    acessos INTEGER NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS relatorios_publicos_token_idx ON relatorios_publicos(token);
CREATE INDEX IF NOT EXISTS relatorios_publicos_criadoPor_idx ON relatorios_publicos("criadoPor");
CREATE INDEX IF NOT EXISTS relatorios_publicos_ativo_idx ON relatorios_publicos(ativo);

-- 4. Dar permissões ao usuário postgres
GRANT ALL PRIVILEGES ON TABLE relatorios_publicos TO postgres;
GRANT ALL PRIVILEGES ON SEQUENCE relatorios_publicos_id_seq TO postgres;

-- 3. Verificar se a tabela foi criada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'RelatorioPublico'
ORDER BY ordinal_position;

-- =============================================
-- COMO EXECUTAR NO VPS:
-- =============================================
-- 1. Conectar ao PostgreSQL:
--    psql -U postgres -d base_brisalog
--
-- 2. Copiar e colar todo este arquivo
--
-- 3. Verificar criação:
--    \dt RelatorioPublico
--
-- 4. Reiniciar servidor:
--    pm2 restart all
-- =============================================
