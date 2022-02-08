//Import libs
const http          = require('http');
const express 		= require('express');
//const dotenv        = require('dotenv');
//const socket        = require('./services/network/socket.js');
const mail          = require('./services/email/email.js');
const database      = require('./services/database/sqlite3.js'); //swap provider when needed 



(async function main() {
    const app     = express();
    const router  = express.Router();

    app.use("/", require("body-parser").json());


    //Setup APIs

    // SMTP connection
    var mail_connection = new mail({
        host: 'smtp.zoho.com',
        port: 465,
        secure: true, // use SSL
        auth: {
            user: 'testmail@zoho.com',
            pass: '123456'
        }    
    });
    
    // Database Connection
    var db_connection = null;

    if (database.provider !== "sqlite")
        db_connection = new database(process.env.SQL_UNAME, process.env.SQL_PASS);
    else 
        db_connection = new database(); //sqlite connects to a file, no username and password needed

    
    //Bind api calls
    

    //Bind static content
    app.use("/", express.static("./static"));
    app.use("/", router);


    //Start the HTTP server
    const server = http.createServer(app);
    server.listen(8000, "0.0.0.0");
})();