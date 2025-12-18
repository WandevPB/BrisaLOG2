const bcrypt = require('bcryptjs');

async function generateHash() {
    const defaultPassword = 'Brisanet123';
    const hash = await bcrypt.hash(defaultPassword, 10);
    
    console.log('\n===========================================');
    console.log('Senha padrão: Brisanet123');
    console.log('Hash bcrypt:');
    console.log(hash);
    console.log('===========================================');
    console.log('\nComando SQL para resetar TODOS os usuários:');
    console.log(`UPDATE cds SET senha = '${hash}', "primeiroLogin" = true;`);
    console.log('===========================================');
    console.log('\nComando para verificar:');
    console.log('SELECT id, nome, usuario, "primeiroLogin" FROM cds;');
    console.log('===========================================\n');
}

generateHash();
