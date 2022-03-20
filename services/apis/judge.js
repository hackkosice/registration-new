const jwt           = require("jsonwebtoken");

const score_constants = {

};

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
            return res.status(401).send("Authentication needed! Error: " + err);
        }

        req.verification = verification;

        next();
    }

    async get_application_endpoint(req, res) {
        const rated = await this.#db.get("SELECT `mymlh_uid` FROM votes WHERE `voter_uid`=?;", [req.verification.voter_uid]);

        //pick one that has not been rated
        let closed = await this.#db.get("SELECT * FROM applications WHERE `application_status`=?;", ["closed"]);

        if (closed.length === 0 || rated.length === closed.length)
            return res.status(200).send({
                info: "All Done! There is nothing more to vote on!"
            });

        //pick a random one
        while (true) {
            let picked = closed[Math.floor(Math.random() * closed.length)];

            let was_rated = false;
            for (const item of rated) {
                if (item.application_id === picked.application_id) {
                    was_rated = true;
                    break;
                }
            }

            if (!was_rated) {
                const user = await this.#cache.get(picked.mymlh_uid);
                return res.status(200).send({
                    user: {
                        name: `${user.first_name} ${user.last_name}`,
                        school: `${user.school.name}`,
                        level: `${user.level_of_study}`,
                        major: `${user.major}`,
                        birth: `${user.date_of_birth}`
                    },
                    form: picked
                });
            }
        }
    }

    async get_application_detail_endpoint(req, res) {

        if (typeof req.body.uid === 'undefined')
            return error(res, 400, "UID not provided!");

        const form = await this.#db.get("SELECT * FROM applications WHERE `mymlh_uid`=?;", [req.body.uid]);

        if (typeof form[0] === 'undefined')
            return error(res, 400, "Requested application not found!");

        const user = await this.#cache.get(form[0].mymlh_uid);
        return res.status(200).send({
            user: {
                name: `${user.first_name} ${user.last_name}`,
                school: `${user.school.name}`,
                level: `${user.level_of_study}`,
                major: `${user.major}`,
                birth: `${user.date_of_birth}`
            },
            form: form[0]
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

        let applications = {};
        let results = [];
        const votes = await this.#db.get("SELECT `mymlh_uid`, `score` FROM votes;", []);

        for (const vote of votes) {

            if (typeof applications[vote.mymlh_uid] === 'undefined')
                applications[vote.mymlh_uid] = {
                    score: 0,
                    judged: 0,
                    name: (await this.#cache.get(vote.mymlh_uid)).first_name + " " + (await this.#cache.get(vote.mymlh_uid)).last_name,
                    status: (await this.#db.get("SELECT `application_status` FROM applications WHERE `mymlh_uid`=?;", [vote.mymlh_uid]))[0].application_status,
                    mymlh_uid: vote.mymlh_uid
                };

            applications[vote.mymlh_uid].score += vote.score;
            applications[vote.mymlh_uid].judged++;
        }


        //Normalize average out the score
        for (const application in applications) {
            applications[application].score /= applications[application].judged;
            results.push(applications[application]);
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

    #cache = null;
    #db = null;
    #jwt_key = null;
}
