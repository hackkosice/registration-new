const mysql         = require("mysql");
const fs            = require("fs");



module.exports = class MySQL_db {
    
    provider = "MySQL";

    constructor(user, password, host = "localhost", db = "hackkosice") {

        const connection = mysql.createConnection({
            host: host,
            user: user,
            password: password,
            database: db
        });

        connection.connect(function(err) {
            if (err) 
                return console.log("Unable to connect to the database " + db + "! Are you sure it exists? MySQL error: " + err.message);
        
            console.log("Successfully connected to the database " + db + "!");
            this.#connection = connection;
        });
    }

    disconnect = function() {
        this.#connection.end();
    }

    query = function(command, args = []) {
        return new Promise((resolve, reject) => {
            if (this.#connection == null) 
                return reject("Connection is null!");

            this.#connection.query(command, args, (err, result) => {
                if (err)
                    return reject("MySQL Query failed! Error: " + err);    
                resolve(result);
            });
        });
    }


    #connection = null;
};