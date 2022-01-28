//Import libs
const http          = require('http');
const express 		= require('express');
const socket        = require('./services/network/socket.js');
const database      = require('./services/database/sqlie3.js'); //swap provider when needed 

const app     = express();
const router  = express.Router();

app.use("/", require("body-parser").json());

//Setup APIs
if (database.provider !== "sqlite")
    database.connect("root", "asd");
else 
    await database.connect();

    
//Bind api calls


//Bind static content
app.use("/", express.static("./static"));
app.use("/", router);


//Start the HTTP server
const server = http.createServer(app);
server.listen(8000, "0.0.0.0");
