const bcrypt = require('bcryptjs');

async function generateHash() {
  const senha = 'Brisanet123';
  const hash = await bcrypt.hash(senha, 10);
  
  console.log('\n=== HASH PARA SENHA "Brisanet123" ===\n');
  console.log('Hash gerado:');
  console.log(hash);
  console.log('\n=== SQL PARA ATUALIZAR USUÁRIOS ===\n');
  
  console.log('-- Atualizar usuários consultivos existentes com o hash correto:');
  console.log(`UPDATE cds SET senha = '${hash}' WHERE usuario IN ('PCM', 'TRANSPORTE', 'COMPRAS');`);
  
  console.log('\n-- Criar usuário admin:');
  console.log(`INSERT INTO cds (nome, usuario, senha, "tipoPerfil", "primeiroLogin", ativo, "createdAt", "updatedAt")`);
  console.log(`VALUES ('Administrador', 'admin', '${hash}', 'admin', true, true, NOW(), NOW())`);
  console.log(`ON CONFLICT (usuario) DO UPDATE SET senha = '${hash}';`);
  
  console.log('\n=== VERIFICAR HASH ===\n');
  const isValid = await bcrypt.compare('Brisanet123', hash);
  console.log('Hash válido:', isValid ? 'SIM ✅' : 'NÃO ❌');
}

generateHash().catch(console.error);
