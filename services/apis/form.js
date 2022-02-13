const jwt           = require("jsonwebtoken"); 

module.exports = class FormApiEndpoints {

    constructor(database, jwt_key) {

        this.#db = database;
        this.#jwt_key = jwt_key;
    }

    async form_data_endpoint(req, res) {
        var verification = null;
        try {
            verification = await jwt.verify(req.cookies['verification'], this.#jwt_key);
        } catch (err) {
            return res.status(401).send({
                status: 'error',
                error: {
                    code: 401,
                    message: "Authentification needed! Error: " + err
                }
            });
        }

        try {
            const data = await this.#db.get("SELECT * FROM applications WHERE `mymlh_uid`=?;", [verification.uid]);
            res.status(200).send(typeof data[0] === 'undefined' ? {} : data[0]); //If record doesn't exist, send an empty object
        } catch(err) {
            res.status(500).send({
                status: 'error',
                error: {
                    code: 500,
                    message: "Database lookup failed! Error: " + err
                }
            });
        }
    }

    async form_delta_endpoint(req, res) {
        var verification = null;
        try {
            verification = await jwt.verify(req.cookies['verification'], this.#jwt_key);
        } catch (err) {
            return res.status(401).send({
                status: 'error',
                error: {
                    code: 401,
                    message: "Authentification needed! Error: " + err
                }
            });
        }

        try {

            if (req.body.application_progress === 1) {
                const user = await this.#db.get("SELECT `application_id` FROM applications WHERE `mymlh_uid`=?;", [verification.uid]);
                
                if (typeof user[0] !== 'undefined')             
                    return res.status(200).send({ status: 'OK' });

                await this.#db.insert("INSERT INTO applications(`application_progress`, `application_status`, `mymlh_uid`) VALUES (?, ?, ?)", 
                                                [1, "open", verification.uid]);
                return res.status(200).send({ status: 'OKi' });
            }

            for (const key in req.body) {
                
            }

        } catch (err) {
            console.log(err);
        }
    }

    async form_close_endpoint(req, res) {
        var verification = null;
        try {
            verification = await jwt.verify(req.cookies['verification'], this.#jwt_key);
        } catch (err) {
            return res.status(401).send({
                status: 'error',
                error: {
                    code: 401,
                    message: "Authentification needed! Error: " + err
                }
            });
        }

        try {
            const status = await this.#db.get("SELECT `application_progress`, `application_status` FROM applications WHERE `mymlh_uid`=?;", verification.uid);
            
            //If application isn't finnished, you shouldn't be able to close it
            if (typeof status[0].application_progress === 'undefined' || status[0].application_progress < 5)
                return res.status(409).send({
                    status: 'error',
                    error: {
                        code: 409,
                        message: "Server is unable to close the application! Error: Application non-existant or not yet finnished!"
                    }
                });
            
            //If application has already been closed, you shouldn't be able to close it
            if (typeof status[0].application_status === 'undefined' || status[0].application_status !== "open")
                return res.status(409).send({
                    status: 'error',
                    error: {
                        code: 409,
                        message: "Server is unable to close the application! Error: Application already closed!"
                    }
                });
            
            //We do not need the return value of this, since if we got here, this query will always succeed (failing is caught by try/catch)
            await this.#db.insert("UPDATE applications SET `application_status`=? WHERE `mymlh_uid`=?;", ["closed", verification.uid]);
            res.status(200).send({
                status: 'OK'
            });
        } catch (err) {
            res.status(500).send({
                status: 'error',
                error: {
                    code: 500,
                    message: "Database lookup failed! Error: " + err
                }
            });
        }
    }

    #db = null;
    #jwt_key = null;
}