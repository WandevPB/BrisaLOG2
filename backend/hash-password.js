const bcrypt = require('bcrypt');

async function hashPassword() {
  const password = '123456';
  const hash = await bcrypt.hash(password, 10);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  
  // Testar se bate
  const isValid = await bcrypt.compare(password, hash);
  console.log(`Valid: ${isValid}`);
}

hashPassword();
