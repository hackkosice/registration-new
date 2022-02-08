const bent          = require('bent');        


module.exports =  class MyMLH {

    constructor(mlh_token, mlh_secret) {


        this.#token = mlh_token;
        this.#secret = mlh_secret;

        this.#auth_request = bent('POST', "https://my.mlh.io/", 200);
    }

    auth_callback = async function(req, res) {

        if (typeof req.query.code === undefined) {
            //Handle errors
        }

        //Get auth token
        const auth_code = req.query.code;

    }

    #token = "";
    #secret = "";
    #auth_request = null;
}