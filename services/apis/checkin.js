const jwt           = require("jsonwebtoken");
const mlhUserData = require("../caching/mlh-user-data")

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


        const user = await mlhUserData(req.verification.uid);
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
        } catch (err) {
            return error(res, 400, "QR code is invalid!");
        }

        try {
            const checked = await this.#db.get("SELECT * FROM checkins WHERE `mlh_uid`=?;", [user_uid.uid]);

            if (typeof checked[0] !== 'undefined')
                return error(res, 403, "User already checked in!");
        } catch (err) {
            return error(res, 500, "Error fetching user data!");
        }

        const user = await mlhUserData(user_uid.uid);

        let size = null;
        try {
            size = await this.#db.get("SELECT `tshirt` FROM applications WHERE `mymlh_uid`=?;", [user_uid.uid]);
            if (typeof size[0] === 'undefined')
                return error(res, 403, "User not found!");
        } catch(err) {
            return error(res, 500, "Error fetching user data!");
        }

        res.status(200).send({
            name: `${user.first_name} ${user.last_name}`,
            uid: user_uid.uid,
            age: user.date_of_birth,
            tshirt: size[0].tshirt
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
            await this.#db.insert("INSERT INTO checkins (`mlh_uid`, `checker_uid`) VALUES (?, ?);", [req.body.uid, req.verification.voter_uid]);
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

    async get_manual_checkin_data(req, res) {

        let all_users;
        let checked_users;
        try {
            all_users = await this.#db.get("SELECT `mymlh_uid` FROM applications WHERE `application_status`=?;", ["accepted"]);
            checked_users = await this.#db.get("SELECT `mlh_uid` FROM checkins;", []);
        } catch (err) {
            return error(res, 500, "Error fetching user data!");
        }

        for (let i = 0; i < all_users.length; i++) {

            const query = await mlhUserData(all_users[i].mymlh_uid);
            all_users[i].name = `${query.first_name} ${query.last_name}`;
            for (const user of checked_users) {
                if (all_users[i].mymlh_uid === user.mlh_uid) {
                    all_users.splice(i, 1);
                    break;
                }
            }
        }

        return res.status(200).send({
            status: 'OK',
            users: all_users
        });
    }

    async get_table_code_from_team(req, res) {

        if (typeof req.body.team === 'undefined')
            return error(res, 400, 'No teamid provided!');

        const table = await this.#db.get("SELECT `table_code` FROM team_tables WHERE `team_id`=?;", [req.body.team]);
        if (typeof table[0] === 'undefined')
            return error(res, 403, "Team does not exist!");
        return res.status(200).send({ status: 'OK', table: table[0].table_code });

        return res.status(200).send({ status: 'OK', table: 'A1' });
    }

    async get_table_code_from_uid(req, res) {

        let user_uid = null;
        //if user requests it, take it directly from his verification token
        if (typeof req.verification.uid !== 'undefined')
            user_uid = req.verification.uid;
        else {
            if (typeof req.body.uid === 'undefined')
                return error(res, 400, 'No userid provided!');
            user_uid = req.body.uid;
        }

        const table = await this.#db.get("SELECT `table_code` FROM user_tables WHERE `mymlh_uid`=?;", [user_uid]);
        if (typeof table[0] === 'undefined')
            return error(res, 403, "User does not exist!");
        return res.status(200).send({ status: 'OK', table: table[0].table_code });
    }

    #db = null;
    #jwt_key = null;
    #cache = null;
    #log = [];
}
