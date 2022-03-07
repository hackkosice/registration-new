const jwt           = require("jsonwebtoken");

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
            verification = await jwt.verify(req.cookies['verification'], this.#jwt_key);
        } catch (err) {
            return error(res, 401, "Authentication needed! Error: " + err);
        }


        req.verification = verification;

        if (!verification.is_admin)
        return error(res, 403, "Access denied!");

        next();
    }

    async get_application_endpoint(req, res) {
        const rated = await this.#db.get("SELECT `application_id` FROM votes WHERE `voter_uid`=?;", [req.verification.uid]);

        //pick one that has not been rated
        let closed = await this.#db.get("SELECT * FROM applications WHERE `application_status`=?;", ["closed"]);

        //pick a random one
    }

    async cast_vote_endpoint(req, res) {

    }

    //Probably the most expensive call
    async get_applications_scoreboard_endpoint(req, res) {

        let applications = {};
        const votes = await this.#db.get("SELECT `mymlh_uid`, `score` FROM votes;", []);

        for (const vote of votes) {

            if (typeof applications[vote.mymlh_uid] === 'undefined')
                applications[vote.mymlh_uid] = {
                    score: 0,
                    judged: 0,
                    name: (await this.#cache.get(vote.mymlh_uid)).first_name + " " + (await this.#cache.get(vote.mymlh_uid)).last_name,
                    status: (await this.#db.get("SELECT `application_status` FROM applications WHERE `mymlh_uid`=?;", [vote.mymlh_uid]))[0].application_status
                };

            applications[vote.mymlh_uid].score += vote.score;
            applications[vote.mymlh_uid].judged++;
        }


        //Normalize average out the score
        for (const application in applications)
            applications[application].score /= applications[application].judged;

        res.status(200).send(applications);
    }

    async get_judge_scoreboard_endpoint(req, res) {

        let voters = {};
        let results = {};
        const votes = await this.#db.get("SELECT `voter_uid` FROM votes;", []);

        for (const vote of votes) {

            if (typeof voters[vote.voter_uid] === 'undefined')
                voters[vote.voter_uid] = 0;

            voters[vote.voter_uid]++;
        }

        for (const voter in voters) {

            const name = await this.#cache.get(Number(voter));

            results[voter] = {
                voter: (name.first_name + " " + name.last_name),
                votes: voters[voter]
            };
        }

        res.status(200).send(results);
    }

    #cache = null;
    #db = null;
    #jwt_key = null;
}