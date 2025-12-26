const bcrypt = require('bcryptjs');

// Senha inicial para os admins (será obrigatório trocar no primeiro login)
const senhaInicial = 'Brisanet123';

const usuarios = [
  { nome: 'Wanderson Admin', usuario: 'wanderson' },
  { nome: 'Andrey Admin', usuario: 'andrey' },
  { nome: 'Galhardo Admin', usuario: 'galhardo' },
  { nome: 'Leonarde Admin', usuario: 'leonarde' }
];

async function gerarSQL() {
  console.log('-- ============================================');
  console.log('-- Comandos SQL para criar usuários ADMIN');
  console.log(`-- Senha inicial para todos: ${senhaInicial}`);
  console.log('-- primeiroLogin = true (obriga troca de senha)');
  console.log('-- ============================================\n');

  const saltRounds = 10;
  const senhaHash = await bcrypt.hash(senhaInicial, saltRounds);

  console.log('INSERT INTO cds (nome, usuario, senha, "tipoPerfil", "emailRecuperacao", "primeiroLogin", ativo, "createdAt", "updatedAt")');
  console.log('VALUES');

  const values = [];
  for (const user of usuarios) {
    values.push(`  ('${user.nome}', '${user.usuario}', '${senhaHash}', 'admin', NULL, true, true, NOW(), NOW())`);
  }

  console.log(values.join(',\n'));
  console.log('ON CONFLICT (usuario) DO NOTHING;');
  console.log('\n-- Verificar usuários criados:');
  console.log("SELECT id, nome, usuario, \"tipoPerfil\", \"primeiroLogin\", ativo FROM cds WHERE \"tipoPerfil\" = 'admin';");
}

gerarSQL().catch(console.error);
