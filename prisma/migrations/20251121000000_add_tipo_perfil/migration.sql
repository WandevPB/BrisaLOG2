-- AlterTable
ALTER TABLE "cds" ADD COLUMN "tipoPerfil" TEXT NOT NULL DEFAULT 'cd';

-- Comentário: Adiciona campo tipoPerfil para diferenciar perfis de usuário
-- Valores possíveis: 'cd', 'consultivo', 'admin'
