-- AddTipoCDColumn
-- Adiciona coluna tipoCD para diferenciar CDs normais de CDs tipo torre

-- Adicionar coluna tipoCD
ALTER TABLE cds ADD COLUMN "tipoCD" VARCHAR(50) DEFAULT 'normal';

-- Comentário da coluna
COMMENT ON COLUMN cds."tipoCD" IS 'Tipo do CD: normal (permite múltiplos agendamentos por turno) ou torre (apenas 1 agendamento por turno às 08:00 e 13:00)';
