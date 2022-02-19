const jwt           = require("jsonwebtoken");

function error(res, status, msg) {
    return res.status(status).send({
        status: 'error',
        error: {
            code: status,
            message: message
        }
    });
}

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
            return error(res, 401, "Authentification needed! Error: " + err);
        }



    }

    async team_join_endpoint(req, res) {
        
        var verification = null;
        try {
            verification = await jwt.verify(req.cookies['verification'], this.#jwt_key);
        } catch (err) {
            return error(res, 401, "Authentification needed! Error: " + err);
        }

        try {
            const team_id = await this.#db.get("SELECT `team_id` FROM teams WHERE `team_code`=?;", [req.body.team_code]);
            
                //Check if the team exist
                if (typeof team_id[0] === 'undefined')
                    return error(res, 409, "Unable to join team! Error: Team does not exist!");        
                

            const user = await this.#db.get("SELECT `team_id`. `application_progress` FROM applications WHERE `mymlh_uid`=?;", [verification.uid]);
                
                //Check if your application is finnished 
                if (typeof user[0] === 'undefined' || user[0].application_progress < 5)
                    return error(res, 409, "Unable to join team! Error: Application not yet finnished or not existant!");
                
                //Check if you aren't in a team already
                if (user[0].team_id !== null)
                    return error(res, 409, "Unable to join team! Error: User has already team assigned!");

            const team_members = await this.#db.get("SELECT `mymlh_id` FROM applications WHERE `team_id`=?;", [team_id[0].team_id]);
                
                //Check if team isn't full            
                if (team_members.length === 4)
                    return error(res, 409, "Unable to join team! Error: Team is full!");

            //Add user to the team
            const update_result = await this.#db.insert("UPDATE applications SET `team_id`=? WHERE `mymlh_uid`=?;", [team_id[0].team_id, verification.uid]);

        } catch(err) {
            return error(res, 500, "Unable to join team! Error: " + err);
        }
    }

    async team_leave_endpoint(req, res) {
        var verification = null;
        try {
            verification = await jwt.verify(req.cookies['verification'], this.#jwt_key);
        } catch (err) {
            return error(res, 401,"Authentification needed! Error: " + err);
        }

        try {

            if(typeof req.body.team_id === "undefined") 
                return error(res, 400, "Bad request! team_id missing!");

            //Remove user from the team
            await this.#db.insert("UPDATE applications SET `team_id`=? WHERE `mymlh_uid`=?;", [null, verification.uid]);



            const owner = await this.#db.get("SELECT `owner` FROM teams WHERE `team_id`=?;", [req.body.team_id]);
            
            //Check if user is the owner
            if (team[0] !== undefined && team_id[0].owner === verification.uid) {
            
                //Set someone else as team owner
                const members = await this.#db.get("SELECT `mymlh_uid` FROM applications WHERE `team_id`=?;", [req.body.team_id]);
                if (typeof members[0] !== 'undefined') 
                    await this.#db.insert("UPDATE teams SET `owner`=? WHERE `team_id`=?;", [members[0].mymlh_uid, req.body.team_id]);
                else
                    //If there's noone left, delete the team
                    await this.#db.insert("DELETE FROM teams `team_id`=?;", [req.body.team_id]);
            
            }

        } catch(err) {
            return error(res, 500, "Database Error! Error: " + err);
        }
    }

    async team_kick_endpoint(req, res) {
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
            const team_id = await this.#db.get("SELECT `team_id`, `owner` FROM teams WHERE `team_code`=?;", [req.body.team_id]);
            
                //Check if the team exist
                if (typeof team_id[0] === 'undefined')
                    return res.status(409).send({
                        status: 'error',
                        error: {
                            code: 409,
                            message: "Unable to join team! Error: Team does not exist!"
                        }
                    });

            const user = await this.#db.get("SELECT `team_id`. `application_progress` FROM applications WHERE `mymlh_uid`=?;", [verification.uid]);
                
                //Check if your application is finnished 
                if (typeof user[0] === 'undefined' || user[0].application_progress < 5)
                    return res.status(409).send({
                        status: 'error',
                        error: {
                            code: 409,
                            message: "Unable to join team! Error: Application not yet finnished or not existant!"
                        }
                    });
                
                //Check if you aren't in a team already
                if (user[0].team_id !== null)
                    return res.status(409).send({
                        status: 'error',
                        error: {
                            code: 409,
                            message: "Unable to join team! Error: User has already team assigned!"
                        }
                    });

            const team_members = await this.#db.get("SELECT `mymlh_id` FROM applications WHERE `team_id`=?;", [team_id[0].team_id]);
                
                //Check if team isn't full            
                if (team_members.length === 4)
                    return res.status(409).send({
                        status: 'error',
                        error: {
                            code: 409,
                            message: "Unable to join team! Error: Team is full!"
                        }
                    });

            //Add user to the team
            const update_result = await this.#db.insert("UPDATE applications SET `team_id`=? WHERE `mymlh_uid`=?;", [team_id[0].team_id, verification.uid]);
            console.log(update_result);
            

        } catch(err) {
            return error(res, 500, "Database Error! Error: " + err);
        }
    }

    async team_info_endpoint(req, res) {

    }

    #db = null;
    #jwt_key = null;

}