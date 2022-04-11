const fs = require("fs")
const fetch = require("node-fetch");

const defaultUser = {
        "id": 273250,
        "email": "not found",
        "created_at": "2020-10-07T07:25:44Z",
        "updated_at": "2022-02-24T06:28:09Z",
        "first_name": "not found",
        "last_name": "not found",
        "major": "not found",
        "date_of_birth": "not found",
        "gender": "Male",
        "phone_number": "",
        "level_of_study": "not found",
        "profession_type": "not found",
        "company_name": "",
        "company_title": "",
        "scopes": [
            "email",
            "education",
            "birthday",
            "phone_number",
            "demographics"
        ]
    }

module.exports = async function get_from_file(uid) {
    const buffer = fs.readFileSync("mymlh.json");
    const userData = JSON.parse(buffer);

    let foundUser = userData.data.filter(user => user.id === uid)
    if (foundUser.length === 1) {
        return foundUser[0];
    }

    let user = await get_from_api(uid)
    if (user) {
        return user;
    }

    return defaultUser
}

async function get_from_api(uid) {
    console.log(uid)
    const users_res = await fetch("https://my.mlh.io/api/v3/users.json?client_id=" + process.env.MLH_APP_ID + "&secret=" +
        process.env.MLH_APP_SECRET + "&per_page=1000&page=1" , {method: 'GET'});
    const userData = await users_res.json();
    const user = userData.data.filter(user => user.id === uid)

    if (user.length === 1) {
        console.log("FOUND FROM API" + uid.toString())
        return user[0];
    }

    return null;
}
