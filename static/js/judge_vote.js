$ = (element) => { return document.getElementById(element); };

//Multiplication constants
const tech_constant = 0.6;
const effort_constant = 0.3;
const bonus_constant = 0.1;



window.onload = async function() {

    fetch("/api/judge-application", {method: 'POST', credentials: 'same-origin'})
        .then(res => res.json()).then((application) => {

            if (typeof application.info !== 'undefined') {
                $("application_wrapper").classList.add("hidden");
                return ($("box-title").textContent = application.info);
            }
            window.application = application;

            for (const part of document.getElementsByTagName("p")) {
                if (typeof application.form[part.id] !== 'undefined')
                    part.textContent = application.form[part.id];
            }

            $("name").textContent = application.user["name"];
            $("birth").textContent = application.user["birth"];
            $("school").textContent = application.user["school"];
            $("major").textContent = application.user["major"];
            $("grad").textContent = application.user["level"];
        });



    $("vote").addEventListener('click', () => {
        vote();
    });
    $("skip").addEventListener('click', () => {
        window.location = window.location;
    });

    $("exit").addEventListener('click', () => {
        window.location = "/judge/dashboard.html";
    });

    //Setup initial values
    $("tech_value").textContent = `${Math.floor(($("tech").value * tech_constant) * 10) / 10} / 6`;
    $("effort_value").textContent = `${Math.floor(($("effort").value * effort_constant) * 10) / 10} / 3`;
    $("bonus_value").textContent = `${Math.floor(($("bonus").value * bonus_constant) * 10) / 10} / 1`;


    $("tech").addEventListener('input', () => {
        $("tech_value").textContent = `${Math.floor(($("tech").value * tech_constant) * 10) / 10} / 6`;
    });
    $("effort").addEventListener('input', () => {
        $("effort_value").textContent = `${Math.floor(($("effort").value * effort_constant) * 10) / 10} / 3`;
    });

    $("bonus").addEventListener('input', () => {
        $("bonus_value").textContent = `${Math.floor(($("bonus").value * bonus_constant) * 10) / 10} / 1`;
    });
}

async function vote() {

    if (typeof window.application === 'undefined')
        window.location = window.location;

    const tech_score = $("tech").value * tech_constant;
    const effort = $("effort").value * effort_constant;
    const bonus = $("bonus").value * bonus_constant;

    await fetch("/api/judge-vote", {
        method: 'POST', credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            score: (tech_score + effort + bonus),
            uid: window.application.form.mymlh_uid
        })
    });

    window.location = window.location;
}