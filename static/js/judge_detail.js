$ = (element) => { return document.getElementById(element); };

window.onload = async () => {


    let queryObject = {};
    if (location.search.startsWith("?")) {
        const query = location.search.substring(1, location.search.length);
        const split = query.split("&");

        for (const parameter of split) {
            const subsplit = parameter.split("=");
            const key = subsplit[0];
            const value = subsplit[1];
            queryObject[key] = value;
        }
    }

    if (typeof queryObject.uid === 'undefined')
        window.location = "/judge/dashboard.html";


    fetch("/api/judge-application-detail", {
        method: 'POST', credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            uid: queryObject.uid
        })
    }).then(res => res.json()).then((application) => {

        if (typeof application.error !== 'undefined')
            window.location = "/judge/dashboard.html";


        window.application = application;

        for (const part of document.getElementsByTagName("p")) {
            if (typeof application.form[part.id] !== 'undefined')
                part.textContent = application.form[part.id];
        }

        for (const part of document.getElementsByTagName("a")) {
            if (typeof application.form[part.id] !== 'undefined') {
                part.textContent = application.form[part.id];
                part.href = application.form[part.id];
            }
        }

        $("name").textContent = application.user["name"];
        $("birth").textContent = application.user["birth"];
        $("school").textContent = application.user["school"];
        $("major").textContent = application.user["major"];
        $("grad").textContent = application.user["level"];
        $("table").textContent = application.user["table_code"];

        if (typeof application.cv !== 'undefined') {
            $("cv").textContent = application.cv;
            $("cv").href = `/judge/cvs/${application.cv}`;
        }
    });

}
