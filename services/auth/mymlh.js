const fetch         = require("node-fetch");
const jwt           = require("jsonwebtoken");

module.exports =  class MyMLH {

    constructor(mlh_token, mlh_secret, server_secret) {

        this.#id = mlh_token;
        this.#secret = mlh_secret;
        this.#jwt_key = server_secret;
    }

    async auth_callback(req, res) {

        if (typeof req.query.code === 'undefined') {
            //TODO: send out error page
            return res.status(401).send(req.query.error);
        }

        //TODO: change
        const token_res = await fetch("https://my.mlh.io/oauth/token?client_id=" + this.#id + "&client_secret=" + this.#secret + 
                                "&code=" + req.query.code + "&redirect_uri=" + "http%3A%2F%2F127.0.0.1%3A8000%2Foauth" + "&grant_type=authorization_code", { method: 'POST' });
        const token = await token_res.json();


        if (typeof token.error !== 'undefined') {
            //TODO: send out error page
            return res.status(401).send(token.error_description);
        }

        //Choose the right path for the user to be sent to
        const user_res = await fetch("https://my.mlh.io/api/v3/user.json?access_token=" + token.access_token, {method: 'GET'});
        const user = await user_res.json();

        //If user is not from judging team, determine wether he has already completed his application or not
        var path = "./application.html";

        if (user.data.email.endsWith('@hackkosice.com')) {


        }

        //Generate authentification token
        const usr_token = jwt.sign({
            uid: user.data.id,
            token: token.access_token,
            is_admin: user.data.email.endsWith('@hackkosice.com')
        }, this.#jwt_key, { expiresIn: '12h'});
    
        res.cookie('verification', usr_token, { 
            maxAge: 12 * 60 * 60,
            httpOnly: true,
        }).redirect(path);
    }

    async get_user_data_endpoint(req, res) {

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

        const user_res = await fetch("https://my.mlh.io/api/v3/user.json?access_token=" + verification.token, {method: 'GET'});
        const user = await user_res.json();

        if (user.status === 'error')
            res.status(user.error.code).send(user);

        res.status(200).send(user);

  
    }

    async get_all_users() {
        const usercount_res = await fetch("https://my.mlh.io/api/v3/users.json?client_id=" + this.#id + "&secret=" + this.#secret + "&per_page=1");
        const usercount = await usercount_res.json();

        var userdb = [];

        for (let i = 0; i < Math.ceil(usercount.pagination.results_total / 250); i++) {
            const users_res = await fetch("https://my.mlh.io/api/v3/users.json?client_id=" + this.#id + "&secret=" + this.#secret + "&page=" + i);
            const users = await users_res.json();

            userdb = [].concat(userdb, users.data);
        }

        return userdb;
    }

    #id = "";
    #secret = "";
    #jwt_key = "";
}