const jwt           = require("jsonwebtoken");
const mlhUserData = require("../caching/mlh-user-data")

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



module.exports = class SponsorsApiEndpoints {

    constructor(database, jwt_key, mlh_cache) {
        this.#db = database;
        this.#jwt_key = jwt_key;
        this.#cache = mlh_cache;
    }

    async sponsors_auth_middleware(req, res, next) {
        let verification = null;
        try {
            verification = await jwt.verify(req.cookies['sponsor_verification'], this.#jwt_key);
        } catch (err) {
            return res.status(401).send("Authentication needed! Error: " + err);
        }

        req.verification = verification;

        next();
    }

    async get_application_detail_endpoint(req, res) {

        if (typeof req.body.uid === 'undefined')
            return error(res, 400, "UID not provided!");

        const form = await this.#db.get("SELECT * FROM applications WHERE `mymlh_uid`=?;", [req.body.uid]);

        if (typeof form[0] === 'undefined')
            return error(res, 400, "Requested application not found!");

        if (form[0].cv_file_id === null) {
            const user = await mlhUserData(form[0].mymlh_uid);
            return res.status(200).send({
                user: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: `${user.email}`,
                    school: `${user.school?.name || ""}`,
                    level: `${user.level_of_study}`,
                    major: `${user.major}`,
                    birth: `${user.date_of_birth}`
                },
                form: form[0]
            });
        }

        const cv_filename = await this.#db.get("SELECT `file_code` FROM files WHERE `file_id`=?;", [form[0].cv_file_id]);

        if (typeof cv_filename[0] === 'undefined')
            return error(res, 403, "Requested CV code not found!");

        const user = await mlhUserData(form[0].mymlh_uid);
        return res.status(200).send({
            user: {
                name: `${user.first_name} ${user.last_name}`,
                email: `${user.email}`,
                school: `${user.school?.name || ""}`,
                level: `${user.level_of_study}`,
                major: `${user.major}`,
                birth: `${user.date_of_birth}`
            },
            form: form[0],
            cv: cv_filename[0].file_code
        });
    }

    //Probably the most expensive call
    async get_applications_endpoint(req, res) {

        let results = [];
        const applications = await this.#db.get("SELECT * FROM applications WHERE `application_status` = 'accepted';", []);
        let myMlhUser;

        //Normalize average out the score
        for (const application of applications) {
            myMlhUser = await mlhUserData(application.mymlh_uid)
            results.push({
                mymlh_uid: application.mymlh_uid,
                birth: `${myMlhUser.date_of_birth}`,
                travel_from: application.travel_from,
                job_preference: application.job_preference,
                name: myMlhUser.first_name + " " + myMlhUser.last_name,
                school: `${myMlhUser.school?.name || ""}`,
                level: `${myMlhUser.level_of_study}`,
                major: `${myMlhUser.major}`,
                skills: application.skills
            });
        }

        res.status(200).send(results);
    }

    #cache = null;
    #db = null;
    #jwt_key = null;
}
