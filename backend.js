//Import libs
const http                  = require('http');
const express 		        = require('express');
const cookie_parser         = require('cookie-parser');
const dotenv                = require('dotenv').config();
const fileUpload            = require('express-fileupload');

const MyMLH                 = require('./services/auth/mymlh.js');
const Mailer                = require('./services/email/email.js');
const Database              = require('./services/database/sqlite3.js'); //swap provider when needed
const InternalAuth          = require('./services/auth/internal.js');

//Implement caching
const MyMLHUserCache        = require('./services/caching/mlh-usercache.js');

//Implement API endpoints
const FormApiEndpoints      = require('./services/apis/form.js');
const TeamsApiEndpoints     = require('./services/apis/teams.js');
const JudgeApiEndpoints     = require('./services/apis/judge.js');
const CheckinApiEndpoints   = require('./services/apis/checkin.js');

(async function main() {
    const app     = express();
    const router  = express.Router();

    app.use("/", require("body-parser").json());
    app.use(cookie_parser());
    app.use(fileUpload({
        createParentPath: true,
        limits: {
            fileSize: 10000000 //10mb
        },
        abortOnLimit: true
    }));

    //Setup APIs

    // Email setup
    const key = require('./credentials.json');
    const mailer = new Mailer(key);

    // Database Connection
    let db_connection = null;

    if (Database.provider !== "sqlite")
        db_connection = new Database(process.env.SQL_UNAME, process.env.SQL_PASS);
    else
        db_connection = new Database(); //sqlite connects to a file, no username and password needed

    //Start MLH api
    let mlh_auth = new MyMLH(process.env.MLH_APP_ID, process.env.MLH_APP_SECRET, process.env.JWT_SECRET);
    let admin_auth = new InternalAuth(db_connection, process.env.JWT_SECRET);

    //Set up cache
    let mlh_cache = new MyMLHUserCache(mlh_auth);
    await mlh_cache.build();

    //Start APIs
    let form_api = new FormApiEndpoints(db_connection, process.env.JWT_SECRET, mailer, mlh_auth);
    let team_api = new TeamsApiEndpoints(db_connection, process.env.JWT_SECRET, mlh_cache);
    let judge_api = new JudgeApiEndpoints(db_connection, process.env.JWT_SECRET, mlh_cache);
    let checkin_api = new CheckinApiEndpoints(db_connection, process.env.JWT_SECRET, mlh_cache);

    //Bind api calls
    router.get("/oauth", async (req, res) => { mlh_auth.auth_callback(req, res) });  //Node has a hella weird callback system
    router.get("/my-mlh-login", async (req, res) => { res.redirect("https://my.mlh.io/oauth/authorize?client_id=" + process.env.MLH_APP_ID +
                                                        "&redirect_uri=" + encodeURIComponent(process.env.MLH_REDIRECT_URI) +
                                                        "&response_type=code&scope=email+education+birthday+phone_number+demographics") }); //Auto-redirrect the user to mymlh
    //Admin login API
    router.get("/admin", async (req, res) => { admin_auth.auth_callback(req, res) });

    //Application CSV info
    router.get("/judge/applications.csv", async (req, res, next) => { judge_api.judge_auth_middleware(req, res, next) },
        async (req, res) => { judge_api.get_applications_csv(req, res) });

    router.get("/judge/applications_invited.csv", async (req, res, next) => { judge_api.judge_auth_middleware(req, res, next) },
        async (req, res) => { judge_api.get_invited_applications_csv(req, res) });

    //TODO: probably add auth
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
    router.post("/api/accept-invite",
        async (req, res, next) => { form_api.form_auth_middleware(req, res, next) },
        async (req, res) => { form_api.accept_invitation(req, res) });
    router.post("/api/decline-invite",
        async (req, res, next) => { form_api.form_auth_middleware(req, res, next) },
        async (req, res) => { form_api.decline_invitation(req, res) });
    router.post("/api/update-cv-file-id",
        async (req, res, next) => { form_api.form_auth_middleware(req, res, next) },
        async (req, res) => { form_api.update_cv_file_id(req, res) });


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

    //It's login and registration so there is no need for auth middleware
    router.post("/api/auth-login",
        async (req, res) => { admin_auth.login_endpoint(req, res) });
    router.post("/api/auth-register",
        async (req, res) => { admin_auth.register_endpoint(req, res) });


    router.post("/api/judge-vote",
        async (req, res, next) => { judge_api.judge_auth_middleware(req, res, next) },
        async (req, res) => { judge_api.cast_vote_endpoint(req, res) });
    router.post("/api/judge-application",
        async (req, res, next) => { judge_api.judge_auth_middleware(req, res, next) },
        async (req, res) => { judge_api.get_application_endpoint(req, res) });
    router.post("/api/judge-application-detail",
        async (req, res, next) => { judge_api.judge_auth_middleware(req, res, next) },
        async (req, res) => { judge_api.get_application_detail_endpoint(req, res) });
    router.post("/api/judge-scoreboard",
        async (req, res, next) => { judge_api.judge_auth_middleware(req, res, next) },
        async (req, res) => { judge_api.get_judge_scoreboard_endpoint(req, res) });
    router.post("/api/judge-application-scoreboard",
        async (req, res, next) => { judge_api.judge_auth_middleware(req, res, next) },
        async (req, res) => { judge_api.get_applications_scoreboard_endpoint(req, res) });
    router.post("/api/judge-invite",
        async (req, res, next) => { judge_api.judge_auth_middleware(req, res, next) },
        async (req, res) => { judge_api.invite_application_endpoint(req, res) });
    router.post("/api/judge-reject",
        async (req, res, next) => { judge_api.judge_auth_middleware(req, res, next) },
        async (req, res) => { judge_api.reject_application_endpoint(req, res) });

    router.post("/api/checkin-info",
        async (req, res, next) => { checkin_api.user_auth_middleware(req, res, next) },
        async (req, res) => { checkin_api.create_checkin_info_endpoint(req, res) });

    //Bind static content
    app.use("/", express.static("./static"));
    app.use("/", router);

    //CVs
    app.use('/judge/cvs/', async (req, res, next) => { judge_api.judge_auth_middleware(req, res, next) });
    app.use('/judge/cvs/', express.static("./uploads/cvs/"));

    //404 handler
    app.use(function(req, res) {
        res.status(404);
        res.redirect("/404.html");
    });

    //Start the HTTP server
    const server = http.createServer(app);
    const port = process.env.PORT;
    server.listen(port, "127.0.0.1");

    console.log("Server started in mode: " + process.env.NODE_ENV);
})();
