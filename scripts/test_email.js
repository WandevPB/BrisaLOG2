// Teste de envio de e-mail usando as credenciais do .env
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    await transporter.verify();
    console.log('✅ Conexão SMTP OK');
    const info = await transporter.sendMail({
      from: `"Teste BrisaLOG" <${process.env.SMTP_USER}>`,
      to: 'wandevpb@gmail.com',
      subject: 'Teste de envio de e-mail BrisaLOG',
      text: 'Este é um teste automático de envio de e-mail usando as credenciais do .env.'
    });
    console.log('✅ E-mail enviado:', info.messageId);
  } catch (err) {
    console.error('❌ Erro ao enviar e-mail:', err);
  }
}

main();
