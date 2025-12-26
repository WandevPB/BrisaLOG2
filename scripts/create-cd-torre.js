const bcrypt = require('bcryptjs');

async function gerarSQLCDTorre() {
  const senha = 'BrisaLOG2025'; // Senha padrão inicial
  const saltRounds = 10;
  const senhaHash = await bcrypt.hash(senha, saltRounds);

  console.log('-- ============================================');
  console.log('-- SQL para criar CD Lagoa Nova (Torre)');
  console.log('-- Tipo: torre (apenas 1 agendamento por turno)');
  console.log(`-- Senha inicial: ${senha}`);
  console.log('-- ============================================\n');

  console.log(`INSERT INTO cds (nome, usuario, senha, "tipoPerfil", "tipoCD", "emailRecuperacao", "primeiroLogin", ativo, "createdAt", "updatedAt")`);
  console.log(`VALUES ('Lagoa Nova (Torre)', 'lagoanova-torre', '${senhaHash}', 'cd', 'torre', NULL, true, true, NOW(), NOW())`);
  console.log(`ON CONFLICT (usuario) DO NOTHING;\n`);

  console.log('-- Verificar CD criado:');
  console.log(`SELECT id, nome, usuario, "tipoPerfil", "tipoCD", "primeiroLogin", ativo FROM cds WHERE usuario = 'lagoanova-torre';`);
  
  console.log('\n-- ============================================');
  console.log('📋 Informações do CD:');
  console.log('-- ============================================');
  console.log('Nome: Lagoa Nova (Torre)');
  console.log('Usuário: lagoanova-torre');
  console.log(`Senha: ${senha}`);
  console.log('Tipo: torre');
  console.log('Perfil: cd');
  console.log('\n⚙️ Comportamento:');
  console.log('- Apenas 1 agendamento por turno');
  console.log('- Horários disponíveis: 08:00 (manhã) e 13:00 (tarde)');
  console.log('- Se já houver agendamento em um turno, o outro horário fica bloqueado');
}

gerarSQLCDTorre().catch(console.error);
