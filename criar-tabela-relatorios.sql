-- =============================================
-- SCRIPT: Criar Tabela RelatorioPublico
-- EXECUTAR NO VPS (PostgreSQL)
-- =============================================

-- 1. Criar a tabela RelatorioPublico
CREATE TABLE IF NOT EXISTS "RelatorioPublico" (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    filtros TEXT NOT NULL,
    "criadoPor" VARCHAR(255) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3),
    acessos INTEGER NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS "RelatorioPublico_token_idx" ON "RelatorioPublico"(token);
CREATE INDEX IF NOT EXISTS "RelatorioPublico_criadoPor_idx" ON "RelatorioPublico"("criadoPor");
CREATE INDEX IF NOT EXISTS "RelatorioPublico_ativo_idx" ON "RelatorioPublico"(ativo);

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
