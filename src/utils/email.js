const nodemailer = require('nodemailer');
const { email: { SERVICE } } = require('../constants');

const { EMAIL_ADDRESS, EMAIL_PASSWORD } = process.env;

const getTransporter = () => {
    console.log('getTransporter', SERVICE, EMAIL_ADDRESS);
    return nodemailer.createTransport({
        service: SERVICE,
        auth: {
            user: EMAIL_ADDRESS,
            pass: EMAIL_PASSWORD
        }
    });
};

const Email = {
    send: details => {
        const { to: [to, ...bcc] = [], subject = '', html = '', ...rest } = details;
        return getTransporter().sendMail({
            from: EMAIL_ADDRESS,
            to,
            bcc,
            subject,
            html,
            ...rest
        });
    }
}

module.exports = Email