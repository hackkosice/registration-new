const mysql         = require("mysql");
const fs            = require("fs");

exports.provider = "MySQL";

exports.connect = function(user, password, host = "localhost", db = "hackkosice") {

    const connection = mysql.createConnection({
        host: host,
        user: user,
        password: password,
        database: db
    });

    connection.connect(function(err) {
        if (err) {
            return console.error("Unable to connect to the database " + db + "! Are you sure it exists? MySQL error: " + err.message);
        }
      
        console.log("Successfully connected to the database " + db + "!");
    });
}