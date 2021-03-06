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



module.exports = class VotingApiEndpoints {

    constructor(database, jwt_key, mlh_cache) {
        this.#db = database;
        this.#jwt_key = jwt_key;
        this.#cache = mlh_cache;
    }

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

    async get_application_endpoint(req, res) {
        const not_rated_uids = await this.#db.get("SELECT mymlh_uid FROM applications WHERE application_status = 'closed' EXCEPT SELECT mymlh_uid FROM votes WHERE voter_uid = ?;", [req.verification.voter_uid])
        if (not_rated_uids.length === 0) {
            return res.status(200).send({
                info: "All Done! There is nothing more to vote on!"
            });
        }

        const picked_uid = not_rated_uids[Math.floor(Math.random() * not_rated_uids.length)].mymlh_uid;
        const pickedQuery = await this.#db.get("SELECT * FROM applications WHERE mymlh_uid=?", [picked_uid])
        const picked = pickedQuery[0];

        if (picked.cv_file_id === null) {
            const user = await mlhUserData(picked.mymlh_uid);
            return res.status(200).send({
                user: {
                    name: `${user.first_name} ${user.last_name}`,
                    school: `${user.school?.name || ""}`,
                    level: `${user.level_of_study}`,
                    major: `${user.major}`,
                    birth: `${user.date_of_birth}`
                },
                form: picked
            });
        }

        const cv_filename = await this.#db.get("SELECT `file_code` FROM files WHERE `file_id`=?;", [picked.cv_file_id]);
        if (typeof cv_filename[0] === 'undefined')
            return error(res, 403, "Requested CV code not found!");

        const user = await mlhUserData(picked.mymlh_uid);
        return res.status(200).send({
            user: {
                name: `${user.first_name} ${user.last_name}`,
                school: `${user.school?.name || ""}`,
                level: `${user.level_of_study}`,
                major: `${user.major}`,
                birth: `${user.date_of_birth}`
            },
            form: picked,
            cv: cv_filename[0].file_code
        });
    }

    async get_application_detail_endpoint(req, res) {

        if (typeof req.body.uid === 'undefined')
            return error(res, 400, "UID not provided!");

        const form = await this.#db.get("SELECT * FROM applications WHERE `mymlh_uid`=?;", [req.body.uid]);
        const table = await this.#db.get("SELECT table_code FROM user_tables WHERE `mymlh_uid`=?;", [req.body.uid])
        let table_code = "NONE"
        if (table.length > 0) {
            table_code = table[0].table_code
        }

        if (typeof form[0] === 'undefined')
            return error(res, 400, "Requested application not found!");

        if (form[0].cv_file_id === null) {
            const user = await mlhUserData(form[0].mymlh_uid);
            return res.status(200).send({
                user: {
                    name: `${user.first_name} ${user.last_name}`,
                    school: `${user.school?.name || ""}`,
                    level: `${user.level_of_study}`,
                    major: `${user.major}`,
                    birth: `${user.date_of_birth}`,
                    table_code: table_code
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
                school: `${user.school?.name || ""}`,
                level: `${user.level_of_study}`,
                major: `${user.major}`,
                birth: `${user.date_of_birth}`,
                table_code: table_code
            },
            form: form[0],
            cv: cv_filename[0].file_code
        });
    }

    async cast_vote_endpoint(req, res) {

        if (req.body.score < 0 || req.body.score > 10)
            return error(res, 400, "Score must be between 0 and 10!");

        const rating = await this.#db.get("SELECT * FROM votes WHERE `voter_uid`=? AND `mymlh_uid`=?;", [req.verification.voter_uid, req.body.uid]);

        if (typeof rating[0] !== 'undefined')
            return error(res, 403, "Voter has already voted on this application!");

        await this.#db.insert("INSERT INTO votes(`voter_uid`, `score`, `mymlh_uid`) VALUES (?, ?, ?);", [req.verification.voter_uid, req.body.score, req.body.uid]);
        res.status(200).send("ok");
    }

    //Probably the most expensive call
    async get_applications_scoreboard_endpoint(req, res) {

        let voted_applications = {};
        let results = [];
        const votes = await this.#db.get("SELECT `mymlh_uid`, `score` FROM votes;", []);
        const applications = await this.#db.get("SELECT `mymlh_uid` FROM applications;", []);
        let team_result;
        let myMlhUser;

        for (const vote of votes) {
            if (typeof voted_applications[vote.mymlh_uid] === 'undefined')
                voted_applications[vote.mymlh_uid] = {
                    score: 0,
                    judged: 0,
                    mymlh_uid: vote.mymlh_uid
                };

            voted_applications[vote.mymlh_uid].score += vote.score;
            voted_applications[vote.mymlh_uid].judged++;

        }

        //Normalize average out the score
        for (const application of applications) {
            team_result = await this.#db.get("SELECT T.team_name FROM applications AS A LEFT JOIN teams AS T ON A.team_id = T.team_id WHERE A.`mymlh_uid` = ?;", [application.mymlh_uid])
            myMlhUser = await mlhUserData(application.mymlh_uid)
            if (typeof voted_applications[application.mymlh_uid] === 'undefined') {
                results.push({
                    score: 0,
                    judged: 0,
                    name: myMlhUser.first_name + " " + myMlhUser.last_name,
                    status: (await this.#db.get("SELECT `application_status` FROM applications WHERE `mymlh_uid`=?;", [application.mymlh_uid]))[0].application_status,
                    team: team_result && team_result.length > 0 ? team_result[0].team_name : "",
                    mymlh_uid: application.mymlh_uid
                });
            }
            else {
                voted_applications[application.mymlh_uid].score /= voted_applications[application.mymlh_uid].judged;
                results.push({
                    ...voted_applications[application.mymlh_uid],
                    team: team_result && team_result.length > 0 ? team_result[0].team_name : "",
                    status: (await this.#db.get("SELECT `application_status` FROM applications WHERE `mymlh_uid`=?;", [application.mymlh_uid]))[0].application_status,
                    name: myMlhUser.first_name + " " + myMlhUser.last_name,
                });
            }
        }

        res.status(200).send(results);
    }

    async get_judge_scoreboard_endpoint(req, res) {

        let voters = {};
        let results = [];
        const votes = await this.#db.get("SELECT `voter_uid` FROM votes;", []);

        for (const vote of votes) {

            if (typeof voters[vote.voter_uid] === 'undefined')
                voters[vote.voter_uid] = 0;

            voters[vote.voter_uid]++;
        }

        for (const voter in voters) {

            const name = await this.#db.get("SELECT `username` FROM voters WHERE `voter_uid`=?;", [voter]);

            results.push({
                voter: name[0].username,
                votes: voters[voter]
            });
        }

        res.status(200).send(results);
    }

    async get_applications_csv(req, res) {
        const csv_content = await this.generate_csv_content_from_query("SELECT * FROM applications")

        res.setHeader("Content-type", "application/octet-stream");
        res.status(200).send(csv_content);
    }

    async get_invited_applications_csv(req, res) {
        const csv_content = await this.generate_csv_content_from_query("SELECT * FROM applications WHERE `application_status` = 'invited'")

        res.setHeader("Content-type", "application/octet-stream");
        res.status(200).send(csv_content);
    }

    async invite_application_endpoint(req, res) {
        req.body.accepted.forEach((mymlh_uid) => {
            this.#db.insert("UPDATE applications SET `application_status` = 'invited' WHERE `mymlh_uid` = ?;", [mymlh_uid])
        })

        res.status(200).send({
            message: "OK"
        });
    }

    async reject_application_endpoint(req, res) {
        req.body.rejected.forEach((mymlh_uid) => {
            this.#db.insert("UPDATE applications SET `application_status` = 'rejected' WHERE `mymlh_uid` = ?;", [mymlh_uid])
        })

        res.status(200).send({
            message: "OK"
        });
    }

    async generate_csv_content_from_query(query) {
        const fields = ["application_status", "travel_from", "reimbursement", "skills", "job_preference",
            "achievements", "site", "github", "linkedin", "devpost", "hear_hk22",
            "first_hack_hk22", "tshirt", "diet"];


        const applications = await this.#db.get(query, []);

        //TODO: add yes/no for cv
        let csv_content = "name,email,birth,major,education,school,status,country,reimbursement,skills,job,achievements,website,github,linkedin,devpost,hear_hk,hk_first,tshirt,diet\n";

        for (const application of applications) {
            const user = await mlhUserData(application.mymlh_uid);

            let line = `"${user.first_name} ${user.last_name}","${user.email}","${user.date_of_birth}","${user.major}","${user.level_of_study}",`;
            line += `"${user.school?.name || ""}"`;

            for (const field of fields) {
                line += `,"${application[field]}"`;
            }
            csv_content += `${line}\n`;
        }

        return csv_content;
    }

    async get_iban_judge(req, res) {

        if (typeof req.body.uid === 'undefined')
            return error(res, 400, "No UID provided!");

        const iban = await this.#db.get("SELECT `iban` FROM iban WHERE `mymlh_uid`=?;", [req.body.uid]);
        if (typeof iban[0] === 'undefined')
            return res.status(200).send({
                iban: ""
            });

        return res.status(200).send({
            iban: iban[0].iban
        });
    }

    #cache = null;
    #db = null;
    #jwt_key = null;
}
