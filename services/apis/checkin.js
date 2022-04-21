const jwt           = require("jsonwebtoken");

function error(res, status, msg) {
    return res.status(status).send({
        status: 'error',
        error: {
            code: status,
            message: msg
        }
    });
}


module.exports = class CheckinApiEndpoints {

    constructor(db, jwt_key, mlh_cache) {
        this.#db = db;
        this.#jwt_key = jwt_key;
        this.#cache = mlh_cache;
    }

    //Both auths needed, as user will use some of these calls
    async judge_auth_middleware(req, res, next) {
        let verification = null;
        try {
            verification = await jwt.verify(req.cookies['voter_verification'], this.#jwt_key);
        } catch (err) {
            return error(res, 401, "Authentication needed! Error: " + err);
        }

        req.verification = verification;

        next();
    }

    async user_auth_middleware(req, res, next) {
        let verification = null;
        try {
            verification = await jwt.verify(req.cookies['verification'], this.#jwt_key);
        } catch (err) {
            return error(res, 401, "Authentication needed! Error: " + err);
        }

        req.verification = verification;
        next();
    }

    async create_checkin_info_endpoint(req, res) {

        //Query user info
        const status = await this.#db.get("SELECT `application_status` FROM applications WHERE `mymlh_uid`=?;", [req.verification.uid]);

        if (typeof status[0] === 'undefined')
            return error(res, 400, "Requested user does not exist.");

        //Check, if user requesting it is accepted
        if (status[0].application_status !== 'accepted')
            return error(res, 400, "Requested user has not accepted invitation.");


        const user = await this.#cache.get(req.verification.uid);
        const invite_token = jwt.sign({
            uid: req.verification.uid
        }, this.#jwt_key, { expiresIn: 1650751200000}); //Should be unix time for 24/4/2022 - 00:00:00

        const token = {
            uid: req.verification.uid,
            name: `${user.first_name} ${user.last_name}`,
            invite_token: invite_token
        };

        res.status(200).send(token);
    }


    async get_checkin_user(req, res) {

        let user_uid;
        try {
            user_uid = await jwt.verify(req.body.token, this.#jwt_key);
            console.log(user_uid);
        } catch (err) {
            return error(res, 400, "QR code is invalid!");
        }

        const user = await this.#cache.get(user_uid.uid);

        res.status(200).send({
            name: `${user.first_name} ${user.last_name}`,
            uid: user_uid.uid,
            below18: false //TODO: Replace
        });
    }

    async check_in_user(req, res) {

        let checkin_type = null;

        if (typeof req.body.uid === 'undefined')
            return error(res, 400, "User UID not provided!");


        if (typeof req.body.type === 'undefined')
            checkin_type = "manual";
        else checkin_type = req.body.checkin_type;

        try {
            this.#db.insert("INSERT INTO checkins (`mlh_uid`, `checker_uid`) VALUES (?, ?);", [req.body.uid, req.verification.voter_uid]);
        } catch (err) {
            return error(res, 403, "User already checked in!");
        }
        this.#log.push({
           voter_id: req.verification.voter_uid,
           checkin_type: checkin_type,
           user_id: req.body.uid
        });
        return res.status(200).send({});
    }

    #db = null;
    #jwt_key = null;
    #cache = null;
    #log = [];
}