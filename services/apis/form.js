const jwt           = require("jsonwebtoken"); 
const crypto        = require("crypto");

//For code pretification
function error(res, status, msg) {
    return res.status(status).send({
        status: 'error',
        error: {
            code: status,
            message: msg
        }
    });
}


module.exports = class FormApiEndpoints {

    constructor(database, jwt_key, mailer, mymlh) {

        this.#db = database;
        this.#jwt_key = jwt_key;
        this.#mailer = mailer;
        this.#mymlh = mymlh;
    }

    async form_auth_middleware(req, res, next) {
        let verification = null;
        try {
            verification = await jwt.verify(req.cookies['verification'], this.#jwt_key);
        } catch (err) {
            return error(res, 401, "Authentification needed! Error: " + err);
        }

        req.verification = verification;
        next();
    }

    async form_data_endpoint(req, res) {

        let verification = req.verification;

        try {
            //Send user the whole DB entry
            const data = await this.#db.get("SELECT A.*, F.file_name AS cv_file_name FROM applications AS A LEFT JOIN files AS F ON A.cv_file_id = F.file_id WHERE `mymlh_uid`=?;", [verification.uid]);
            res.status(200).send(typeof data[0] === 'undefined' ? {} : data[0]);
        } catch(err) {
            return error(res, 500, "Database lookup failed! Error: " + err);
        }
    }

    async form_delta_endpoint(req, res) {

        let verification = req.verification;

        try {

            //Handle application creation
            if (req.body.application_progress === 1) {
                const user = await this.#db.get("SELECT `application_id` FROM applications WHERE `mymlh_uid`=?;", [verification.uid]);
                
                if (typeof user[0] !== 'undefined')             
                    return res.status(200).send({ status: 'OK' });

                await this.#db.insert("INSERT INTO applications(`application_progress`, `application_status`, `mymlh_uid`, `reimbursement_progress`) VALUES (?, ?, ?, ?)", 
                                                [1, "open", verification.uid, "none"]);
                return res.status(200).send({ status: 'OK' });
            }

            const user = await this.#db.get("SELECT `application_id`, `application_progress` FROM applications WHERE `mymlh_uid`=?;", [verification.uid]);
                
                //Check if application exists
                if (typeof user[0] === 'undefined')             
                    return error(res, 400, "Application update failed! Error: Application does not exist!");


                //Check if applicaton progress is within bounds
                if (typeof req.body.application_progress === 'number' && req.body.application_progress > 5)
                    return error(res, 400, "Application update failed! Error: applicaton_progress invalid or out of bounds!"); 
                
                //A bit of a hack, but only write the application progress, if it's greater than the one already in the db
                if (req.body.application_progress <= user[0].application_progress)
                    delete req.body.application_progress;

            // If there's no file coming from frontend don't do update in database (it may override the old file ID)
            if (req.body["cv_file_id"] == 0) {
                delete req.body["cv_file_id"]
            }

            for (const key in req.body) {
                if (key === "reimbursement" && req.body.reimbursement === "yes")
                    await this.#db.insert("UPDATE applications SET `reimbursement_progress`=? WHERE `mymlh_uid`=?;", ["requested", verification.uid]);
             
                const result = await this.#db.insert("UPDATE applications SET " + whitelist[key] + "=? WHERE `mymlh_uid`=?;", [req.body[key], verification.uid]);
            }

            return res.status(200).send({ status: 'OK' });
        //Todo: add calbacks
        } catch (err) {
            return error(res, 500, "Database lookup failed! Error: " + err);
        }
    }

    async form_close_endpoint(req, res) {

        let verification = req.verification;

        try {
            const status = await this.#db.get("SELECT `application_progress`, `application_status` FROM applications WHERE `mymlh_uid`=?;", verification.uid);
            
            //If application isn't finnished, you shouldn't be able to close it
            if (typeof status[0].application_progress === 'undefined' || status[0].application_progress < 5)
                return error(res, 400, "Server is unable to close the application! Error: Application non-existant or not yet finnished!");
            
            //If application has already been closed, you shouldn't be able to close it
            if (typeof status[0].application_status === 'undefined' || status[0].application_status !== "open")
                return error(res, 400, "Server is unable to close the application! Error: Application already closed!");
            
            
            //We do not need the return value of this, since if we got here, this query will always succeed (failing is caught by try/catch)
            await this.#db.insert("UPDATE applications SET `application_status`=? WHERE `mymlh_uid`=?;", ["closed", verification.uid]);

            // Send confirmation email to user's address
            const user = await this.#mymlh.get_user_info(verification.token);
            this.#mailer.sendMailTemplate(
                user.data.email,
                "Hack Kosice 2022 - Your application",
                "applicationCloseConfirmation",
                {
                    name: `${user.data.first_name}`
                });

            return res.status(200).send({ status: 'OK' });

        } catch (err) {
            return error(res, 500, "Database lookup failed! Error: " + err);
        }
    }

    async form_upload_file(req, res) {
        const verification = req.verification;

        const file = req.files.cv
        const fileSplit = file.name.split(".")
        const fileExtension = fileSplit[fileSplit.length - 1]

        const randomString = Math.random().toString(36).substring(2);

        const fileCode = `${verification.uid}${randomString}.${fileExtension}`
        file.mv(`./uploads/cvs/${fileCode}`)

        const resdb = await this.#db.insert("INSERT INTO files(`file_name`, `file_code`) VALUES (?, ?);", [file.name, fileCode])
        const fileId = resdb.lastInsertRowid

        return res.status(200).send({ 
            fileId: fileId
        })
    }

    #db = null;
    #jwt_key = null;
    #mailer = null;
    #mymlh = null;
}

//So no SQL injections are possible
//All of the keys are not here
//only those that could be written by the application
const whitelist = {
	"application_progress": "application_progress",
	"team_id": "team_id",
	"mymlh_uid": "mymlh_uid",
	"reimbursement": "reimbursement",
	"travel_from": "travel_from",
	"visa": "visa", 
	"diet": "diet",
	"tshirt": "tshirt",
	"job_looking": "job_looking",
	"job_preference": "job_preference",
	"cv_file_id": "cv_file_id",
	"skills": "skills",
	"excited_hk22": "excited_hk22",
	"hear_hk22": "hear_hk22",
	"first_hack_hk22": "first_hack_hk22",
	"spirit_animal": "spirit_animal",
	"pizza": "pizza",
	"site": "site",
	"github": "github",
	"devpost": "devpost",
	"linkedin": "linkedin"
}