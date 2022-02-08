const fetch         = require("node-fetch");


module.exports =  class MyMLH {

    constructor(mlh_token, mlh_secret) {

        this.#id = mlh_token;
        this.#secret = mlh_secret;
    }

    async auth_callback(req, res) {

        console.log(req.query);

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

        const user_res = await fetch("https://my.mlh.io/api/v3/user.json?access_token=" + token.access_token, {method: 'GET'});
        const user = await user_res.json();
  
    
        res.status(200).send(user.data.first_name + " " + user.data.last_name + "; school: " + user.data.school.name);
    }


    get_all_users = function() {
        
    }

    #id = "";
    #secret = "";
}