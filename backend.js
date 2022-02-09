//Import libs
const http                  = require('http');
const express 		        = require('express');
const dotenv                = require('dotenv').config();
const MyMLH                 = require('./services/auth/mymlh.js');
const Mailer                = require('./services/email/email.js');
const Database              = require('./services/database/sqlite3.js'); //swap provider when needed

const FormApiEndpoints      = require('./services/apis/form.js');
const TeamsApiEndpoints     = require('./services/apis/teams.js');


(async function main() {
    const app     = express();
    const router  = express.Router();

    app.use("/", require("body-parser").json());


    //Setup APIs

    // SMTP connection
    var mail_connection = new Mailer({
        host: process.env.EMAIL_SMTP,
        port: 465,
        secure: true, // use SSL
        auth: {
            user: process.env.EMAIL_UNAME,
            pass: process.env.EMAIL_PASS
        }    
    });
    
    // Database Connection
    var db_connection = null;

    if (database.provider !== "sqlite")
        db_connection = new Database(process.env.SQL_UNAME, process.env.SQL_PASS);
    else 
        db_connection = new Database(); //sqlite connects to a file, no username and password needed

    //Start MLH api
    var mlh_auth = new MyMLH(process.env.MLH_APP_ID, process.env.MLH_APP_SECRET);    
    
    //Start APIs
    var form_api = new FormApiEndpoints(db_connection);
    var team_api = new TeamsApiEndpoints(db_connection);

    //Bind api calls
    router.get("/oauth", async (req, res) => { mlh_auth.auth_callback(req, res) });  //Node has a hella weird callback system

    router.post("/api/form-update", async (req, res) => { form_api.form_delta_endpoint(req, res) });
    router.post("/api/form-close", async (req, res) => { form_api.form_close_endpoint(req, res) });

    router.post("/api/team-create", async (req, res) => { team_api.team_create_endpoint(req, res) });
    router.post("/api/team-update", async (req, res) => { team_api.team_update_endpoint(req, res) });

    router.post("/api/admin", async () => {});
    router.post("/api/judge", async () => {});

    //Bind static content
    app.use("/", express.static("./static"));
    app.use("/", router);


    //Start the HTTP server
    const server = http.createServer(app);
    server.listen(8000, "127.0.0.1");
})();