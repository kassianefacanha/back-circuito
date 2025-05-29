const nodemailer = require('nodemailer');
const ErrorResponse = require('./errorResponse');

// Configuração do transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true', 
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false 
  }
});

// Verificação da conexão (opcional)
transporter.verify((error) => {
  if (error) {
    console.error('Erro na configuração do email:', error);
  } else {
    console.log('Servidor de email configurado com sucesso');
  }
});

// Função para enviar email
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"Sistema Esportivo" <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message // Usa HTML se fornecido, caso contrário usa text
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email enviado para: ${options.email}`);
    return true;
  } catch (err) {
    console.error('Erro ao enviar email:', err);
    throw new ErrorResponse('Falha ao enviar email', 500);
  }
};

module.exports = sendEmail;