const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('📋 Verificando usuários no banco...\n');
    
    const usuarios = await prisma.cd.findMany({
      select: {
        id: true,
        nome: true,
        usuario: true,
        tipoPerfil: true,
        ativo: true
      },
      orderBy: { nome: 'asc' }
    });
    
    console.log(`Total de usuários: ${usuarios.length}\n`);
    
    const cds = usuarios.filter(u => u.tipoPerfil === 'cd' || !u.tipoPerfil);
    const consultivos = usuarios.filter(u => u.tipoPerfil === 'consultivo');
    const admins = usuarios.filter(u => u.tipoPerfil === 'admin');
    
    console.log('👥 USUÁRIOS CD:');
    if (cds.length === 0) {
      console.log('  Nenhum usuário CD encontrado');
    } else {
      cds.forEach(u => {
        console.log(`  - ${u.nome} (${u.usuario}) - Ativo: ${u.ativo} - Perfil: ${u.tipoPerfil || 'NAO DEFINIDO'}`);
      });
    }
    
    console.log('\n👥 USUÁRIOS CONSULTIVOS:');
    if (consultivos.length === 0) {
      console.log('  Nenhum usuário consultivo encontrado');
    } else {
      consultivos.forEach(u => {
        console.log(`  - ${u.nome} (${u.usuario}) - Ativo: ${u.ativo}`);
      });
    }
    
    console.log('\n👥 USUÁRIOS ADMIN:');
    if (admins.length === 0) {
      console.log('  Nenhum usuário admin encontrado');
    } else {
      admins.forEach(u => {
        console.log(`  - ${u.nome} (${u.usuario}) - Ativo: ${u.ativo}`);
      });
    }
    
    console.log('\n✅ Verificação concluída');
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
