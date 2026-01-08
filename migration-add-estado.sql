-- Migration: Adicionar campo estado aos CDs
-- Execute este script no VPS

-- 1. Adicionar coluna estado
ALTER TABLE cds ADD COLUMN IF NOT EXISTS estado VARCHAR(2);

-- 2. Atualizar CDs existentes com seus estados
-- Ceará
UPDATE cds SET estado = 'CE' WHERE nome LIKE '%LAGOA NOVA%' OR nome LIKE '%PEREIRO%';

-- Bahia (se houver)
UPDATE cds SET estado = 'BA' WHERE nome LIKE '%BAHIA%' OR nome LIKE '%SALVADOR%' OR nome LIKE '%BA%';

-- Pernambuco (se houver)
UPDATE cds SET estado = 'PE' WHERE nome LIKE '%PERNAMBUCO%' OR nome LIKE '%RECIFE%' OR nome LIKE '%PE%';

-- 3. Verificar resultado
SELECT id, nome, estado FROM cds ORDER BY estado, nome;
