const sqlite         = require("better-sqlite3");
const fs             = require("fs");



module.exports = class SQLite3_db {
    
    provider = "sqlite3";

    constructor() {

        this.#connection = new sqlite("hackkosice.db");

        //Coment out this line if 
        //you don't need periodic backups
        //Btw. toto pisem zjebany celkom
        var backup = true;

        if(typeof backup === 'undefined') 
            return;
            
        setInterval(() => {
            this.#connection.backup(`hkbackup-${Date.now()}.db`)
                .then(() => {
                  console.log('backup complete!');
                })
                .catch((err) => {
                  console.log('backup failed:', err);
                });    
            }, 7 * 24 * 60 * 60 * 1000);
    }

    disconnect = function() {
        this.#connection.end();
    }

    get = function(command, args = []) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#connection.prepare(command).all(args));
            } catch (err) {
                return reject("SQLite error: " + err);
            }
        });
    }

    insert = function(command, args = []) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#connection.prepare(command).run(args));
            } catch (err) {
                return reject("SQLite error: " + err);
            }
        });
    }

    #connection = null;
};