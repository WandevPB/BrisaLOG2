const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCD13Password() {
  try {
    // Hash que funciona dos outros CDs
    const workingHash = '$2a$10$Mv/.RpC4RfwPpfGfwtnMl.5tX6mrdtGyNYADGsQdV9HMqWA2of5V.';
    
    // Atualizar CD 13
    const updated = await prisma.cd.update({
      where: { id: 13 },
      data: { 
        senha: workingHash,
        primeiroLogin: false
      }
    });
    
    console.log('✅ Senha do CD 13 atualizada para hash funcionando:', updated.usuario);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCD13Password();
