const jwt           = require("jsonwebtoken");

module.exports = class TeamsApiEndpoints {

    constructor(database, jwt_key) {

        this.#db = database;
        this.#jwt_key = jwt_key;
    }

    async team_create_endpoint(req, res) {
        
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

        /*const query = await this.#db.query("INSERT INTO applications (application_status, application_progress, mymlh_uid, reimbusment, diet, tshirt, job_looking, skills) VALUES (\"open\", 1," + verification.uid + ", 0, \"none\", \
        \"xl\", 1, \"c/c++\");");*/

        const user = await this.#db.query("SELECT * FROM applications;");
        console.log(user);

    }

    async team_update_endpoint(req, res) {

    }

    #db = null;
    #jwt_key = null;

}