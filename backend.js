//Import libs
const http          = require('http');
const express 		= require('express');
const socket        = require('./services/network/socket.js');
const database      = require('./services/database/mysql.js'); //swap provider when needed 



(async function main() {
    const app     = express();
    const router  = express.Router();

    app.use("/", require("body-parser").json());


    //Setup APIs


    // Database Connection
    var connection = null;

    if (database.provider !== "sqlite")
        connection = new database("root", "asd");
    else 
        connection = await database.connect(); //sqlite connects to a file, no username and password needed

    
    //Bind api calls
    

    //Bind static content
    app.use("/", express.static("./static"));
    app.use("/", router);


    //Start the HTTP server
    const server = http.createServer(app);
    server.listen(8000, "0.0.0.0");
})();