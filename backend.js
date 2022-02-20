//Import libs
const http                  = require('http');
const express 		        = require('express');
const cookie_parser         = require('cookie-parser');
const dotenv                = require('dotenv').config();
const fileUpload            = require('express-fileupload');


const MyMLH                 = require('./services/auth/mymlh.js');
const Mailer                = require('./services/email/email.js');
const Database              = require('./services/database/sqlite3.js'); //swap provider when needed

const FormApiEndpoints      = require('./services/apis/form.js');
const TeamsApiEndpoints     = require('./services/apis/teams.js');

(async function main() {
    const app     = express();
    const router  = express.Router();

    app.use("/", require("body-parser").json());
    app.use(cookie_parser());
    app.use(fileUpload({
        createParentPath: true
    }));

    //Setup APIs

    // Email setup
    //const key = require('./credentials.json');
    //const mailer = new Mailer(key);
    
    // Database Connection
    var db_connection = null;

    if (Database.provider !== "sqlite")
        db_connection = new Database(process.env.SQL_UNAME, process.env.SQL_PASS);
    else 
        db_connection = new Database(); //sqlite connects to a file, no username and password needed

    //Start MLH api
    var mlh_auth = new MyMLH(process.env.MLH_APP_ID, process.env.MLH_APP_SECRET, process.env.JWT_SECRET);    
    
    //Start APIs
    var form_api = new FormApiEndpoints(db_connection, process.env.JWT_SECRET);
    var team_api = new TeamsApiEndpoints(db_connection, process.env.JWT_SECRET, mlh_auth);

    //Bind api calls
    router.get("/oauth", async (req, res) => { mlh_auth.auth_callback(req, res) });  //Node has a hella weird callback system
    router.get("/my-mlh-login", async (req, res) => { res.redirect("https://my.mlh.io/oauth/authorize?client_id=" + process.env.MLH_APP_ID +
                                                        "&redirect_uri=" + encodeURIComponent(process.env.MLH_REDIRECT_URI) +
                                                        "&response_type=code&scope=email+education+birthday+phone_number+demographics") }); //Auto-redirrect the user to mymlh

    router.post("/api/user-info", async (req, res) => { mlh_auth.get_user_data_endpoint(req, res) });

    router.post("/api/form-data",
        async (req, res, next) => { form_api.form_auth_middleware(req, res, next) },
        async (req, res) => { form_api.form_data_endpoint(req, res) });
    router.post("/api/form-update",
        async (req, res, next) => { form_api.form_auth_middleware(req, res, next) },
        async (req, res) => { form_api.form_delta_endpoint(req, res) });
    router.post("/api/form-close",
        async (req, res, next) => { form_api.form_auth_middleware(req, res, next) },
        async (req, res) => { form_api.form_close_endpoint(req, res) });
    router.post("/api/form-file-upload",
        async (req, res, next) => { form_api.form_auth_middleware(req, res, next) },
        async (req, res) => { form_api.form_upload_file(req, res) });


    router.post("/api/team-create", 
        async (req, res, next) => { team_api.team_auth_middleware(req, res, next) },
        async (req, res) => { team_api.team_create_endpoint(req, res) }); 
    router.post("/api/team-join", 
        async (req, res, next) => { team_api.team_auth_middleware(req, res, next) },
        async (req, res) => { team_api.team_join_endpoint(req, res) }); 
    router.post("/api/team-leave", 
        async (req, res, next) => { team_api.team_auth_middleware(req, res, next) },
        async (req, res) => { team_api.team_leave_endpoint(req, res) }); 
    router.post("/api/team-kick", 
        async (req, res, next) => { team_api.team_auth_middleware(req, res, next) },
        async (req, res) => { team_api.team_kick_endpoint(req, res) }); 
    router.post("/api/team-info", 
        async (req, res, next) => { team_api.team_auth_middleware(req, res, next) },
        async (req, res) => { team_api.team_info_endpoint(req, res) }); 
    
    router.post("/api/admin", async () => {});
    router.post("/api/judge", async () => {});    

    //Bind static content
    app.use("/", express.static("./static"));
    app.use("/", router);


    //Start the HTTP server
    const server = http.createServer(app);
    const port = process.env.PORT;
    server.listen(port, "127.0.0.1");
})();