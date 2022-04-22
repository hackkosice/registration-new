const fs = require("fs")
const userDataGetter = require('../caching/mlh-user-data.js')

module.exports = async function assignTables(db) {

    await db.insert("delete from user_tables;")

    const tables = await db.get("select team_id, table_code from team_tables;")

    for (const table of tables) {
        const users = await db.get("select mymlh_uid from applications where team_id=?;", [table.team_id])
        for (const user of users) {
            await db.insert("insert into user_tables values(?, ?);", [user.mymlh_uid, table.table_code])
        }
    }

    console.log("Done")

}
