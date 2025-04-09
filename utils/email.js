const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    },
    debug: true,
    logger: true
  });

  const mailOptions = {
    from: `Support Team <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.message || '',
    html: options.html || '',
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;