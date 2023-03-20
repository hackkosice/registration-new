const dotenv                = require('dotenv').config();
const Database              = require('./services/database/sqlite3.js');
const jwt                   = require('jsonwebtoken');

let db = new Database();
let uid = 0;

while (true) {
    uid = Math.floor(Math.random() * 65536);

    const user = db.get("SELECT * FROM sponsors WHERE `sponsor_uid`=?", [uid]);
    if (typeof user[0] === 'undefined')
        break;
}
db.insert("INSERT INTO sponsors(`sponsor_uid`) VALUES(?);", [uid]);

const register_token = jwt.sign({
    uid: uid
}, process.env.JWT_SECRET, { expiresIn: '72h'});

const link = `https://portal.hackkosice.com/sponsors-admin?action=create&token=${register_token}`;

console.log(` Added sponsor with UID: ${uid}.\n Registration link: ${link}\n Registration link is valid for 72 hours.`);
process.exit(0);
