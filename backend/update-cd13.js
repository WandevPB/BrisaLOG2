const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCD13Password() {
  try {
    // Hash que já funciona para senha 123456 (visto nos outros CDs)
    const hashFrom = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    
    // Atualizar CD 13
    const updated = await prisma.cd.update({
      where: { id: 13 },
      data: { 
        senha: hashFrom,
        primeiroLogin: false
      }
    });
    
    console.log('✅ Senha do CD 13 atualizada:', updated.usuario);
    
    // Verificar se funciona consultando um dos CDs existentes com hash conhecido
    const cd10 = await prisma.cd.findUnique({ where: { id: 10 } });
    console.log('CD 10 hash:', cd10.senha);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCD13Password();
