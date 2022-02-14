$ = (element) => { return document.getElementById(element); };

//Build datalists from these jsons
const suggestions_datasets = ["/data/countries.json",
                              "/data/marketing_types.json",
                              "/data/skills.json"];

//A smol trick so I don't have to write out everything out by hand
//Null: get value, id of the input is the same
const parts = [
    { //Part 1: nothing (mymlh uid is obtained from verification token)
        fields: [],
        functions: []
    },

    { //Part 2: Travel & etc
        fields: ["reimbursment", "travel_from", "visa", "tshirt", "diet"],
        functions: [() => { return $("reimbursment_y").checked ? "yes" : "no"; }, null,
                    () => { return $("visa_y").checked ? "yes" : "no"; }, null, null]
    },

    { //Part 3: Job
        fields: ["job_looking", "job_preference", "skills"],
        functions: [() => { return $("job_y").checked ? "yes" : "no"; }, null, 
                    () => { return get_all_skills(); }]
    },

    { //Part 4: what you've build
        fields: ["site", "github", "devpost", "linkedin"],
        functions: [null, null, null, null]
    },

    { //Part 5: get to know you
        fields: ["excited_hk22", "hear_hk22", "first_hack_hk22", "spirit_animal", "pizza"],
        functions: [null, null, () => { return $("firsthack_y").checked ? "yes" : "no"; }, 
                    null, null]
    }
]

window.onload = async function() {

    for (const button of document.getElementsByClassName("save_and_continue")) {
        button.addEventListener('click', () => { save_callback(button.id) });
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

async function save_callback(progress) {

    var body = {
        application_progress: Number(progress)
    };
    
    //Bump local application status variable
    window.formdata.application_progress = window.formdata.application_progress >= Number(progress) ? 
                                           window.formdata.application_progress : Number(progress);

    const progress_selector = parts[Number(progress) - 1]; //Convert to zero-index
    
    //A bit of a hack, but overall saves space
    for (let i = 0; i < progress_selector.fields.length; i++) {
        if (progress_selector.functions[i] == null)
            body[progress_selector.fields[i]] = $(progress_selector.fields[i]).value;
        else body[progress_selector.fields[i]] = progress_selector.functions[i]();
    }

    console.log(body);
    fetch("/api/form-update", {method: 'POST', credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(body)
    });
}


function get_all_skills() {
    var skills = "";

    for (const child of $("skills_wrap").children)
        skills += (child.value + ", ");

    return skills.trim().slice(0, skills.length - 2);
}

function autofill_form() {
   
    //Set checkboxes
    $(window.formdata.reimbursment === "yes" ? "reimbursment_y" : "reimbursment_n").checked = true;
    $(window.formdata.visa === "yes" ? "visa_y" : "visa_n").checked = true;
    $(window.formdata.job_looking === "yes" ? "job_y" : "job_n").checked = true;
    $(window.formdata.first_hack_hk22 === "yes" ? "firsthack_y" : "firsthack_n").checked = true;
   
    //Set textboxes
    $("excited_hk22").value = window.formdata.excited_hk22;
    $("spirit_animal").value = window.formdata.spirit_animal;

    //A bit of a hack... I don't know?!
    for (const part of $("application").children) {
        for (const child of part.children) {
            if ((child.tagName === "INPUT" || child.tagName === "SELECT") && typeof window.formdata[child.id] !== 'undefined') {
                console.log(child)
                child.value = window.formdata[child.id];

            }
        }
    }

    //Set skills (skills are sometimes null, that's why ==)
    if (window.formdata.skills == null)
        return;

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