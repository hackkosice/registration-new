$ = (element) => { return document.getElementById(element); };


//Build datalists from these jsons
const suggestions_datasets = ["/data/countries.json",
                              "/data/marketing_types.json",
                              "/data/skills.json"];


window.onload = async function() {

    for (const button of document.getElementsByClassName("save_and_continue")) {
        button.addEventListener('click', () => { sac_callback(button.id) });
    }

    $("skills_input").addEventListener('change', () => { 
        
        for(const child of $("skills_wrap").children) 
            if (child.value === $("skills_input").value)
                return ($("skills_input").value = "");


        let button = document.createElement("button");
        button.addEventListener('click', () => {;
            $("skills_wrap").removeChild(button);
        });

        button.value = $("skills_input").value;
        button.textContent = $("skills_input").value;

        $("skills_wrap").appendChild(button);
        $("skills_input").value = "";
    });



    var fetches = [];
   
    fetches.push(fetch("/api/user-info", {method: 'POST', credentials: 'same-origin'}).then(
        async (response) => {
            const userinfo = await response.json(); 
            window.userinfo = userinfo.data;
        })
    );

    fetches.push(fetch("/api/form-data", {method: 'POST', credentials: 'same-origin'}).then(
        async (response) => {
            const formdata = await response.json(); 
            window.formdata = formdata;
        })
    );

    
    for (const dataset of suggestions_datasets) {

        //Load the dataset
        fetches.push(fetch(dataset, {method: 'GET'}).then( 
            async (response) => {
                const suggestions = await response.json();

                var parent = document.createElement("datalist");
                parent.id = suggestions.name;
    
                for (const item of suggestions.data) {
    
                    var option = document.createElement("option");
                    option.value = item;
                    option.textContent = item;
    
                    parent.appendChild(option);
                }
                $("datasets").appendChild(parent);
            })
        );
    }



    //Resolve all promises
    try {
        await Promise.all(fetches);
    } catch (err) {

    }

    if (typeof window.formdata.application_status !== 'undefined' 
        && window.formdata.application_status !== "open")
        window.location = "/dashboard.html";


    //Autofill boxes with info form MyMLH
    $("firstname").value = window.userinfo.first_name;
    $("lastname").value = window.userinfo.last_name;
    
    $("email").value = window.userinfo.email;
    $("phone").value = window.userinfo.phone_number;
    $("birth").value = window.userinfo.date_of_birth;

    //Autofill the form 
    
    //Application object has always application id. If application id is undefined, no not autofill anything
    if (typeof window.formdata.application_id === 'undefined')
        return;

    autofill_form();
}

async function sac_callback(progress) {
    console.log(Number(progress));


    fetch("/api/form-update", {method: 'POST', credentials: 'same-origin',
        body: {
            
            /*application_progress: Number(progress),
            mymlh_uid: window.userinfo.id,
            reimbusment: $(""),
            "travel_from"	TEXT,
            "visa"	INTEGER,
            "diet"	TEXT NOT NULL,
            "tshirt"	TEXT NOT NULL,
            "job_looking"	INTEGER NOT NULL,
            "job_preference"	TEXT,
            "cv_path"	TEXT UNIQUE,
            "skills"	TEXT NOT NULL,
            "excited_hk22"	TEXT,
            "first_hear_hk22"	TEXT,
            "first_hack_hk22"	INTEGER,
            "spirit_animal"	TEXT,
            "pizza"	TEXT,
            "site"	TEXT UNIQUE,
            "github"	TEXT UNIQUE,
            "devpost"	TEXT UNIQUE,
            linkedin,*/
        }
    })
}

function get_all_skills() {
    var skills = "";

    for (const child of $("skills_wrap").children)
        skills += (child.value + ", ");

    return skills.trim().slice(0, skills.length - 2);
}

function autofill_form() {
   
    //Set checkboxes
    $(window.formdata.reimbusment === "yes" ? "reimbursment_y" : "reimbursment_n").checked = true;
    $(window.formdata.visa === "yes" ? "visa_y" : "visa_n").checked = true;
    $(window.formdata.job_looking === "yes" ? "job_y" : "job_n").checked = true;
    $(window.formdata.first_hack_hk22 === "yes" ? "firsthack_y" : "firsthack_y").checked = true;
   
    //Set textboxes
    $("travel_from").value = window.formdata.travel_from;
    //Set skills

    const skills = window.formdata.skills.split(", ");

    for (const skill of skills) {
        let button = document.createElement("button");
        button.addEventListener('click', () => {;
            $("skills_wrap").removeChild(button);
        });

        button.value = skill;
        button.textContent = skill;

        $("skills_wrap").appendChild(button);
    }

}