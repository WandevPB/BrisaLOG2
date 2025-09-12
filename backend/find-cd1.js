const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findUserCD1() {
  try {
    const cd = await prisma.cd.findFirst({
      where: { usuario: 'cd1' }
    });
    
    if (cd) {
      console.log('✅ CD encontrado:');
      console.log(`ID: ${cd.id}, Nome: ${cd.nome}, Usuario: ${cd.usuario}`);
      
      const count = await prisma.agendamento.count({ where: { cdId: cd.id } });
      console.log(`Agendamentos: ${count}`);
    } else {
      console.log('❌ CD com usuario "cd1" não encontrado');
      
      // Criar o CD se não existir
      const newCD = await prisma.cd.create({
        data: {
          nome: 'CD Principal',
          usuario: 'cd1',
          senha: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // senha: password
          primeiroLogin: false,
          ativo: true
        }
      });
      
      console.log('✅ CD criado:');
      console.log(`ID: ${newCD.id}, Nome: ${newCD.nome}, Usuario: ${newCD.usuario}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findUserCD1();
