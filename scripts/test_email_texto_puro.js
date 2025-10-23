const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'wanderson.goncalves@grupobrisanet.com.br',
        pass: process.env.SMTP_PASS || 'onyhpgolzrunvppt'
    },
    tls: { rejectUnauthorized: false }
});

const mailOptions = {
    from: 'BrisaLOG Portal <wanderson.goncalves@grupobrisanet.com.br>',
    to: 'sdgcza743@gmail.com',
    subject: '[BrisaLOG] Solicitação Recebida - TEST-EMAIL-002',
    text: `Solicitação Recebida\n\nFornecedor: Fornecedor Teste\nCódigo do Agendamento: TEST-EMAIL-002\nData Solicitada: ${new Date().toLocaleString('pt-BR')}\n\nRecebemos sua solicitação. Aguarde o CD responder em até 48h.`
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.error('Erro ao enviar e-mail:', error);
    }
    console.log('E-mail enviado:', info.messageId);
});
