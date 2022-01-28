const sqlite_db     = require("better-sqlite3");
const fs            = require("fs");

exports.provider = "sqlite";

exports.connect = async function(debug = false) {

    const db = new sqlite_db("sqlite.db", {verbose: debug ? console.log : null});

    
}