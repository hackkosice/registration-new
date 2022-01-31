const mysql         = require("mysql");
const fs            = require("fs");



module.exports = class MySQL_db {
    
    provider = "sqlite3";

    constructor() {

    }

    disconnect = function() {
        this.#connection.end();
    }

    begin_transaction = function() {

    }
    
    exec_transaction = function(transaction) {

    }

    roll_transaction = function(transaction) {

    }


    query = function(command) {

        

    }


    #connection = null;
};