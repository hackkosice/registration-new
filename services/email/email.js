module.exports = class MailchimpMailer {

    constructor(mailChimpTx) {
        this.#mailChimpTx = mailChimpTx
    }

    #send_template = async function(
        templateName,
        subject,
        recipients,
        global_merge_vars,
        marge_vars
    ) {   
          this.#mailChimpTx.messages.sendTemplate({
            template_name: templateName,
            template_content: [{}],
            message: {
                from_email: "noreply@hackkosice.com",
                subject: subject,
                to: recipients,
                global_merge_vars: global_merge_vars,
                merge_vars: marge_vars
            },
          });
    }

    // Example call:
    // mailer.send_test_email_multiple(["mtarca@hackkosice.com"], [
    //     {
    //         rcpt: "mtarca@hackkosice.com",
    //         vars: [
    //             {
    //                 name: "RECP_NAME",
    //                 content: "Matej Tarca"
    //             }
    //         ]
    //     }
    // ])

    send_test_email_multiple(recipientMails, recipientVars) {
        const recipients = recipientMails.map((mail) => { 
            return {
                email: mail,
                type: "to"
            }
        })

        this.#send_template(
            "hack-kosice-template-1",
            "Test email",
            recipients,
            [
                {
                    name: "TITLE",
                    content: "Vitaj v HK!"
                }
            ],
            recipientVars
        )
    }

    #mailChimpTx = null;
}