const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');


// new Email(user, url).sendWelcome();
// new Email(user, url).sendPasswordRest();
// new Email(user, url).sendAccConfirm();

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Amr Mustafa <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // BREVO
      return nodemailer.createTransport({
        host: process.env.BREVO_EMAIL_HOST,
        port: process.env.BREVO_EMAIL_PORT,
        auth: {
          user: process.env.BREVO_EMAIL_USERNAME,
          pass: process.env.BREVO_EMAIL_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      // service:'RESEND',
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  async send(template, subject) {
    // Send the actual email
    // 1) Render HTML base on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2) Define email Options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    };
    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordRest() {
    await this.send(
      'passwordReset',
      'Your password rest token (valid for only 10 mins)'
    );
  }
  async sendAccountConfirmation() {
    await this.send(
      'accountConfirm',
      'Your Confirmation token (valid for only 10 mins)'
    );
  }
};

// const sendEmail = async options => {
// 1) Create a transporter
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   auth: {
//     user: process.env.EMAIL_USERNAME,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });
// 2) Define the email options
// const mailOptions = {
//   from: 'Amr Mustafa <amr@me.com>',
//   to: options.email,
//   subject: options.subject,
//   text: options.message,
//   // html:
// };

// 3) Actually send the email

// }
