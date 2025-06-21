const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail', // You can use other services like 'SendGrid', 'Mailgun', etc.
        auth: {
            user: process.env.EMAIL_USER, // Your email address from .env
            pass: process.env.EMAIL_PASSWORD, // Your email password or app password from .env
        },
        // For development, if you have issues with self-signed certs (e.g., using localhost)
        // You might need to add:
        // tls: {
        //     rejectUnauthorized: false
        // }
    });

    // 2. Define the email options
    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Event Platform Support'}" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: options.html // Use this if you want to send HTML emails
    };

    // 3. Send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
