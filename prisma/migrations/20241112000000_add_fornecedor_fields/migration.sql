-- Adicionar campos do fornecedor diretamente na tabela agendamentos
ALTER TABLE "agendamentos" 
ADD COLUMN "fornecedorNome" TEXT,
ADD COLUMN "fornecedorEmail" TEXT,
ADD COLUMN "fornecedorTelefone" TEXT,
ADD COLUMN "fornecedorDocumento" TEXT;

-- Copiar dados dos fornecedores existentes para os agendamentos
UPDATE "agendamentos" a
SET 
  "fornecedorNome" = f.nome,
  "fornecedorEmail" = f.email,
  "fornecedorTelefone" = f.telefone,
  "fornecedorDocumento" = f.documento
FROM "fornecedores" f
WHERE a."fornecedorId" = f.id;

-- Tornar os novos campos NOT NULL (após popular os dados)
ALTER TABLE "agendamentos" 
ALTER COLUMN "fornecedorNome" SET NOT NULL,
ALTER COLUMN "fornecedorEmail" SET NOT NULL,
ALTER COLUMN "fornecedorTelefone" SET NOT NULL,
ALTER COLUMN "fornecedorDocumento" SET NOT NULL;

-- Tornar fornecedorId opcional (remover NOT NULL constraint)
ALTER TABLE "agendamentos" 
ALTER COLUMN "fornecedorId" DROP NOT NULL;

-- Nota: A tabela fornecedores e a foreign key são mantidas por compatibilidade
-- Podem ser removidas em uma migration futura após confirmar que tudo funciona
