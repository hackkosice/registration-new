const jwt           = require("jsonwebtoken");
const crypto        = require("crypto");

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

    constructor(database, jwt_key, mymlh_api) {

        this.#db = database;
        this.#jwt_key = jwt_key;
        this.#mymlh = mymlh_api;
    }
    
    async team_auth_middleware(req, res, next) {
        let verification = null;
        try {
            verification = await jwt.verify(req.cookies['verification'], this.#jwt_key);
        } catch (err) {
            return error(res, 401, "Authentification needed! Error: " + err);
        }

        req.verification = verification;
        next();
    }

    async team_create_endpoint(req, res) {

        let verification = req.verification;

        try {
            const team = await this.#db.get("SELECT `team_id` FROM teams WHERE `team_name`=?;", [req.body.team_name]);
            
            if (team[0] !== 'undefined')
                return error(res, 409, "Team Exists!");
            
            var team_code;
            while (true) {
                team_code = crypto.randomBytes(8).toString("base64");
    
                const result = await this.#db.get("SELECT `team_id` FROM applicaitons WHERE `team_code`=?;", [team_code]);
                if (typeof result[0] === 'undefined')
                    break; //Team does not exist, return the code
            }

            
            await this.#db.insert("INSERT INTO teams (team_code, team_name, owner) VALUES (?, ?, ?)", [team_code, req.body.team_name, verification.uid]);

            const team_id = await this.#db.get("SELECT `team_id` FROM teams WHERE `team_code=?;", [team_code])
            await this.#db.insert("UPDATE applications SET `team_id`=? WHERE `mymlh_uid`=?;", [team_id[0].team_id, verification.uid]);

        } catch(err) {
            return error(res, 500, "Unable to join team! Error: " + err);
        }

    }

    async team_join_endpoint(req, res) {
        
        let verification = req.verification;

        try {
            const team_id = await this.#db.get("SELECT `team_id` FROM teams WHERE `team_code`=?;", [req.body.team_code]);
            
                //Check if the team exist
                if (typeof team_id[0] === 'undefined')
                    return error(res, 409, "Unable to join team! Error: Team does not exist!");        
                

            const user = await this.#db.get("SELECT `team_id`. `application_progress` FROM applications WHERE `mymlh_uid`=?;", [verification.uid]);
                
                //Check if your application is finnished 
                if (typeof user[0] === 'undefined' || user[0].application_progress < 5)
                    return error(res, 400, "Unable to join team! Error: Application not yet finnished or not existant!");
                
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

        let verification = req.verification;

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
       
        let verification = req.verification;

        try {

            const owner = await this.#db.get("SELECT `owner` FROM teams WHERE `team_id`=?;", [req.body.team_id]);

            if (typeof owner[0] === 'undefined')
                return error(res, 400, "Selected team does not exist!");

            if (verification.uid !== owner[0].owner)
                return error(res, 400, "Error: User is not the owner of the team!");

            if (req.body.target === owner[0].owner)
                return error(res, 400, "Error: Owner can't kick self!");

            //Remove user from the team
            await this.#db.insert("UPDATE applications SET `team_id`=? WHERE `mymlh_uid`=?;", [null, req.body.target]);
            

        } catch(err) {
            return error(res, 500, "Database Error! Error: " + err);
        }
    }

    async team_info_endpoint(req, res) {

        let verification = req.verification;

        const users = await this.#mymlh.get_all_users();
        const team_id = await this.#db.get("SELECT `team_id` FROM applications WHERE `mymlh_uid`=?;", [verification.uid]); 

        if (team_id[0].team_id === null)
            return res.status(200).send([]);

        const team_members = await this.#db.get("SELECT `mymlh_uid`, `application_stauts` FROM applications WHERE `team_id`=?;", [team_id[0].team_id]);
        const team_data = await this.#db.get("SELECT * FROM teams WHERE `team_id`=?;", [team_id[0].team_id])

        var result = [];

        for (const user of users) {
            for (const member of members)
                if(user.id === member.mymlh_uid) {
                    result.push({
                        mymlh_uid: member.mymlh_uid,
                        application: member.application_status,
                        name: (user.first_name + " " + user.last_name)
                    });
                    break;
                }
        }



        res.status(200).send({
            members: result,
            data: team_data[0]
        });

    }

    #db = null;
    #jwt_key = null;
    #mymlh = null;
}