-- Criar usuário admin
-- Usuário: admin
-- Senha: Brisanet123

INSERT INTO cds (nome, usuario, senha, "tipoPerfil", "primeiroLogin", ativo, "createdAt", "updatedAt")
VALUES 
  ('Administrador', 'admin', '$2a$10$5vG8WqgKXJ3PqN1VZPGzCO.rnqJxJ9YPqN1VZPGzCO.rnqJxJ9YPqu', 'admin', true, true, NOW(), NOW())
ON CONFLICT (usuario) DO NOTHING;

-- Verificar resultado
SELECT id, nome, usuario, "tipoPerfil", ativo FROM cds WHERE "tipoPerfil" = 'admin';
