const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const expressHbs = require("express-handlebars");

module.exports = class GSuiteMailer {
    constructor(key) {
        this.#transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              type: 'OAuth2',
              user: this.#USER_ADDRESS,
              serviceClient: key.client_id,
              privateKey: key.private_key,
            },
        });

        const options = {
            viewEngine : {
                extname: '.hbs',
                layoutsDir: 'services/email/templates',
                defaultLayout: false,
                partialsDir: 'services/email/templates',
            },
            viewPath: 'services/email/templates',
            extName: '.hbs'
        };

        this.#transporter.use('compile', hbs(options));
    }

    /**
     * Sends email using template
     * Example usage: sendMailTemplate("test@gmail.com", "HackKosice email", "testEmail", {name: "Matej Tarca"})
     * @param  {String} addressTo  Address to send email to.
     * @param  {String} subject   Subject of the email.
     * @param  {String} template Name of the template to use (not file path and without extension)
     * @param  {String} context  Context to pass to the template
     */
    sendMailTemplate(addressTo, subject, template, context) {
        this.#transporter.sendMail({
            from: {
                name: "Hack Kosice", 
                address: this.#USER_ADDRESS
            },
            to: addressTo,
            subject: subject,
            template: template,
            context: context
        })
        .then(() => {
            console.log("Email sent")
        })
        .catch(error => {
            console.error(error);
        });
    }

    #transporter = null
    #USER_ADDRESS = process.env.GSUITE_USER_ADDRESS;
}
