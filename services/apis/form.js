

module.exports = class FormApiEndpoints {

    constructor(database, jwt_key) {

        this.#db = database;
        this.#jwt_key = jwt_key;
    }

    async form_delta_endpoint(req, res) {
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



    }

    async form_close_endpoint(req, res) {
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
        
    }

    #db = null;
    #jwt_key = null;

}