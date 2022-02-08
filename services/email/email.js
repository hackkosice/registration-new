const ejs           = require("ejs");
const mail          = require('nodemailer');
const path          = require("path");


module.exports = class Mailer {

    constructor(transporterOptions) {
        this.#transporter = mail.createTransport(transporterOptions);
    }

    //email: one of the html templates from email/static/
    //resipients: array of recipient info with recipient-specific 
    send_one = async function(email, subject, recipient) {
        const body = await ejs.renderFile(path.join("email/static/", email), recipient);

        const mail = {
            from: "Hack Kosice testmail@zoho.com",
            to: recipient.to,
            subject: subject,
            html: body
        };

        this.#transporter.sendMail(mail, (err, info) => {
            if (err) 
                return console.log(err);
        });

    }

    //If there is a way to do it more fancily...
    //I don't know it!
    send_multiple = async function(email, subject, recipients) {
        for (let i = 0; i < recipients.length; i++)
            send_one(email, subject, recipients[i]);
    }

    #transporter = null;
}