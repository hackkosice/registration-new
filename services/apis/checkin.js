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

        let team_name = null

        try {
            const team = await this.#db.get("SELECT t.team_name FROM applications AS a LEFT JOIN teams AS t ON t.team_ID = a.team_id WHERE a.mymlh_uid=?", [user_uid.uid])
            team_name = team[0].team_name
        } catch (err) {

        }

        res.status(200).send({
            name: `${user.first_name} ${user.last_name}`,
            uid: user_uid.uid,
            birth: user.date_of_birth,
            tshirt: size[0].tshirt,
            team_name: team_name
        });
    }

    async get_checkin_data(req, res) {

        if (typeof req.body.uid === 'undefined')
            return error(res, 400, "No uid provided");
        const user = await mlhUserData(req.body.uid);

        let size = null;
        try {
            size = await this.#db.get("SELECT `tshirt` FROM applications WHERE `mymlh_uid`=?;", [req.body.uid]);
            if (typeof size[0] === 'undefined')
                return error(res, 403, "User not found!");
        } catch(err) {
            return error(res, 500, "Error fetching user data!");
        }

        let team_name = null

        try {
            const team = await this.#db.get("SELECT t.team_name FROM applications AS a LEFT JOIN teams AS t ON t.team_ID = a.team_id WHERE a.mymlh_uid=?", [req.body.uid])
            team_name = team[0].team_name
        } catch (err) {

        }


        res.status(200).send({
            name: `${user.first_name} ${user.last_name}`,
            uid: req.body.uid,
            birth: user.date_of_birth,
            tshirt: size[0].tshirt,
            team_name: team_name
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

    async get_checked_data(req, res) {

        let checked_users;
        try {
            checked_users = await this.#db.get("SELECT `mlh_uid` as mymlh_uid FROM checkins;", []);
        } catch (err) {
            return error(res, 500, "Error fetching user data!");
        }


        for (let i = 0; i < checked_users.length; i++) {
            const table_code = await this.#db.get("SELECT `table_code` from user_tables where `mymlh_uid`=?",[checked_users[i].mymlh_uid])
            const query = await mlhUserData(checked_users[i].mymlh_uid);
            checked_users[i].name = `${query.first_name} ${query.last_name}`;
            if (table_code.length > 0) {
                checked_users[i].table_code = table_code[0].table_code;
            } else {
                checked_users[i].table_code = "NONE";
            }
        }

        return res.status(200).send({
            status: 'OK',
            users: checked_users
        });
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

        let result = []

        for (let i = 0; i < all_users.length; i++) {

            const query = await mlhUserData(all_users[i].mymlh_uid);
            all_users[i].name = `${query.first_name} ${query.last_name}`;
            if (checked_users.filter(user => user.mlh_uid === all_users[i].mymlh_uid).length > 0) { // Is already checked in
                continue;
            }

            result.push(all_users[i])
        }

        return res.status(200).send({
            status: 'OK',
            users: result
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
