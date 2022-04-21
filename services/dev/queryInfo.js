const fs = require("fs")
const userDataGetter = require('../caching/mlh-user-data.js')

module.exports = async function queryInfo(db) {

    // Custom query for database
    const QUERY = "SELECT * FROM applications where application_status='accepted'";

    // Load all data
    const applications = await db.get(QUERY, []);
    const buffer = fs.readFileSync("mymlh.json");
    const userData = JSON.parse(buffer).data;

    // Do your own custom processing over data

    const result = []
    for (const application of applications) {
        const mymlhData = await userDataGetter(application.mymlh_uid)
        // const birthday = mymlhData.date_of_birth
        // var optimizedBirthday = birthday.replace(/-/g, "/");
        // var birthdayObj = new Date(optimizedBirthday)
        // var currentDate = new Date().toJSON().slice(0,10)+' 01:00:00';
        //
        // var myAge = ~~((Date.now(currentDate) - birthdayObj) / (31557600000));
        //
        // if(myAge < 18) {
        //     result.push(`${mymlhData.first_name} ${mymlhData.last_name}, ${mymlhData.email} ${application.travel_from}`)
        // }

        result.push(`${mymlhData.first_name} ${mymlhData.last_name}, ${mymlhData.email}`)
    }

    result.forEach(res => console.log(res))
}
