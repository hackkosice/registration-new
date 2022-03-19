const argon2        = require('argon2');
const crypto        = require('crypto');
const jwt           = require('jsonwebtoken');

function error(res, status, msg) {
    return res.status(status).send({
        status: 'error',
        error: {
            code: status,
            message: msg
        }
    });
}

module.exports = class InternalAuth {

    constructor(db, jwt) {
        this.#db = db;
        this.#jwt_key = jwt;
    }

    //Mainly for creating account
    async auth_callback(req, res) {

        //If there is nothing or login as action, log in
        if (typeof req.query.action === 'undefined' || req.query.action === "login")
            return res.status(400).redirect("/judge/login.html?action=login");

        //If it's not login or creating, throw an error
        else if (req.query.action !== "create")
            return res.status(400).redirect("/404.html");

        if (typeof req.query.token === 'undefined')
            return res.status(400).redirect("/404.html");

        res.cookie('login', req.query.token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
        }).redirect("/judge/login.html?action=register");
    }

    async login_endpoint(req, res) {

        //Under cors, since you will be able to send requests directly
        if (typeof req.body.user === 'undefined' || typeof req.body.password == 'undefined')
            return error(res, 400, "User credentials not provided!");

        const username = req.body.user;
        const key_object = await this.#db.get("SELECT `voter_uid`, `salt`, `key` FROM voters WHERE `username`=?;", [username]);

        if (typeof key_object[0] === 'undefined')
            return error(res, 403, "Invalid credentials!");

        const password = await argon2.hash(req.body.password, {
            type: argon2.argon2id,
            raw: true,
            salt: Buffer.from(key_object[0].salt, 'hex'),
            hashLength: 32
        });

        if (key_object[0].key !== password.toString('base64'))
            return error(res, 403, "Invalid credentials!");

        const voter_token = jwt.sign({
            voter_uid: key_object[0].voter_uid,
            voter_name: username
        }, this.#jwt_key, { expiresIn: '8h'});

        res.cookie('voter_verification', voter_token, {
            maxAge: 12 * 60 * 60 * 1000,
            httpOnly: true,
        }).status(200).send({ status: "success" });
    }

    async register_endpoint(req, res) {

        let token = null;
        try {
            token = await jwt.verify(req.cookies['login'], this.#jwt_key);
        } catch (err) {
            return error(res, 400, err);
        }

        if (typeof token.uid === 'undefined')
            return error(res, 400, "Invalid token format!");

        if (typeof req.body.user === 'undefined' || typeof req.body.password == 'undefined')
            return error(res, 400, "User credentials not provided!");

        //Get user template from DB
        const key = await this.#db.get("SELECT `key` FROM voters WHERE `voter_uid`=?;", [token.uid]);

        if (typeof key[0] === 'undefined')
            return error(res, 403, "Requested user does not exist!");

        if (key[0].key !== null)
            return error(res, 403, "User already registered!");

        const username_check = await this.#db.get("SELECT * FROM voters WHERE `username`=?;", [req.body.user]);

        if(typeof username_check[0] !== 'undefined')
            return error(res, 409, "Username already in use!");

        //Generate user's salt
        const salt = crypto.randomBytes(64);

        const password = await argon2.hash(req.body.password, {
            type: argon2.argon2id,
            raw: true,
            salt: salt,
            hashLength: 32
        });

        console.log(req.body.user);

        //Register user's account
        const query = await this.#db.insert("UPDATE voters SET `username`=?, `salt`=?, `key`=? WHERE `voter_uid`=?;",
            [req.body.user, salt.toString('hex'), password.toString('base64'), token.uid]);

        const voter_token = jwt.sign({
            voter_uid: token.uid,
            voter_name: req.body.user
        }, this.#jwt_key, { expiresIn: '8h'});

        res.cookie('voter_verification', voter_token, {
            maxAge: 12 * 60 * 60 * 1000,
            httpOnly: true,
        }).status(200).send({ status: "success" });


    }


    #jwt_key = null;
    #db = null;
}

