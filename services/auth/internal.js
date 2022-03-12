const crypto        = require('crypto');
const jwt           = require('jsonwebtoken');


module.exports = class InternalAuth {

    constructor() {
    }

    //Mainly for creating account
    async auth_callback(req, res) {

        if (typeof req.query.action === 'undefined')
            res.status(400).redirect("/404.html");

        if (req.query.action === "login")
            res.status(200).redirect("/judge/login.html");

        //If it's not login or creating, throw an error
        else if (req.query.action !== "create")
            res.status(400).redirect("/404.html");


        res.cookie('login', req.query, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
        }).redirect("/judge/register.html");
    }

    async login_endpoint(req, res) {

    }

    async register_endpoint(req, res) {

        //Token = userid, 64 bytes of random data
        let token = null;
        try {
            token = await jwt.verify(req.cookies['login'], this.#jwt_key);
        } catch (err) {
            return res.status(400).send("Bad TOKEN! Auth Failed!");
        }

        //Get user template from DB
        const db_token = await this.#db.get("SELECT `key` FROM voters WHERE `voter_uid`=?;", [token.uid]);

        if (typeof db_token[0] === 'undefined')
            return res.status(400).send("Selected user DOES NOT EXIST!");

        if (!db_token[0].key.startsWith("create:"))
            return res.status(403).send("User ALREADY CREATED!");

        const key = db_token[0].key.split(':')[1];

        //Check if token matches one stored in database
        if (key !== token.key)
            return res.status(403).send("Invalid TOKEN!");

        //Register user's account
        const query = await this.#db.set("UPDATE voters SET `username`=?, `permissions`=?, `key`=? WHERE `voter_uid`=?;", [req.body.username, 0, req.body.key, token.uid]);
        res.status(200).send("Success!");
    }


    #jwt_key = null;
    #db = null;
}

