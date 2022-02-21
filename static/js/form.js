$ = (element) => { return document.getElementById(element); };

//Build datalists from these jsons
const suggestions_datasets = ["/data/countries.json",
                              "/data/marketing_types.json",
                              "/data/skills.json",
                              "/data/diet.json"];

let COUNTRIES = null;
const MAX_CV_SIZE = 10000000;

//A smol trick so I don't have to write out everything out by hand
//Null: get value, id of the input is the same
const parts = [
    { //Part 1: nothing (mymlh uid is obtained from verification token)
        fields: [],
        functions: [],
        requirements: []
    },

    { //Part 2: Travel & etc
        fields: ["reimbursement", "travel_from", "visa"],
        functions: [() => { return $("reimbursement_y").checked ? "yes" : "no"; }, null,
                    () => { return $("visa_y").checked ? "yes" : "no"; }, null, null],
        requirements: [() => { return $("reimbursement_y").checked || $("reimbursement_n").checked; }, null, 
                       () => { return $("visa_y").checked || $("visa_n").checked; }]
    },

    { //Part 3: Job
        fields: ["job_preference", "skills", "cv_file_id", "achievements"],
        functions: [null,
                    () => { return get_all_skills(); },
                    () => { return 0 }, null],
        requirements: [null,
                       () => { return $("skills_wrap").children.length >= 3; }, () => {}, null]

    },

    { //Part 4: what you've build
        fields: ["site", "github", "devpost", "linkedin"],
        functions: [null, null, null, null],
        requirements:  [null, null, null, null] //null means input.value !== null || input.value !== ""
    },

    { //Part 5: get to know you
        fields: ["excited_hk22", "hear_hk22", "first_hack_hk22", "spirit_animal", "pizza", "tshirt", "diet"],
        functions: [null, null, () => { return $("firsthack_y").checked ? "yes" : "no"; }, 
                    null, null, null, null],
        requirements: [null, null, () => { return $("firsthack_y").checked || $("firsthack_n").checked; }, 
                       null, null, null, null]
    },

    { //Part 6: consents
        fields: ["consent_hk_privacy", "consent_coc", "consent_cvs", "consent_mlh_privacy", "consent_photos"],
        functions: [() => { return $("consent_hk_privacy").checked ? "true" : "false"; }, 
                    () => { return $("consent_coc").checked ? "true" : "false"; }, () => { return $("consent_cvs").checked ? "true" : "false"; },
                    () => { return $("consent_mlh_privacy").checked ? "true" : "false"; }, () => { return $("consent_photos").checked ? "true" : "false"; }],
        requirements: [() => { return $("consent_hk_privacy").checked; }, 
        () => { return $("consent_coc").checked; }, () => { return $("consent_cvs").checked; },
        () => { return $("consent_mlh_privacy").checked; }, () => { return $("consent_photos").checked; }],
    }

];


window.onload = async function() {

    for (const button of document.getElementsByClassName("save_and_continue"))
        button.addEventListener('click', () => { save_callback(button.id) });
    $("save_and_close").addEventListener("click", () => { save_and_close_callback() })
    
    for (let i = 1; i < 7; i++)
        $("show_form-part" + i).addEventListener('click', () => { header_callback(i) });

    $("skills").addEventListener('change', () => {
        
        for(const child of $("skills_wrap").children) 
            if (child.value === $("skills").value)
                return ($("skills").value = "");


        let button = document.createElement("button");
        button.addEventListener('click', () => {
            $("skills_wrap").removeChild(button);
        });

        button.classList.add("button", "is-link", "is-small", "mr-1", "mb-1")
        button.value = $("skills").value;
        button.textContent = $("skills").value;

        $("skills_wrap").appendChild(button);
        $("skills").value = "";
    });

    $("cv_file_id").addEventListener("change", () => {
        if ($("cv_file_id").files.length > 0) {
            const selectedFile = $("cv_file_id").files[0];
            if (selectedFile.size > MAX_CV_SIZE) {
                showError("cv_file_wrapper", "File is too big");
            } else {
                hideError("cv_file_wrapper")
                $("cv-file-name").textContent = "";
            }
            $("cv-file-name").textContent = selectedFile.name;
        } else {
            hideError("cv_file_wrapper")
            $("cv-file-name").textContent = "";
        }
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

                if (dataset === "/data/countries.json") {
                    COUNTRIES = suggestions.data
                }
    
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
        window.location = "/404.html";
    }


    if (typeof window.formdata.application_status !== 'undefined' 
        && window.formdata.application_status !== "open")
        window.location = "/dashboard.html";

    if (typeof window.formdata.application_progress !== 'undefined') {

        for (var i = 6; i > window.formdata.application_progress; i--)
            $("show_form-part" + i).classList.add("hidden");

        $("form-part" + window.formdata.application_progress).classList.remove("hidden");
        $("show_form-part" + window.formdata.application_progress).classList.add("is-active");
    } else {

        for (var i = 2; i <= 6; i++)
            $("show_form-part" + i).classList.add("hidden");

        $("form-part1").classList.remove("hidden");
        $("show_form-part1").classList.add("is-active");
    }



    //Autofill boxes with info form MyMLH
    $("firstname").value = window.userinfo.first_name;
    $("lastname").value = window.userinfo.last_name;
    
    $("email").value = window.userinfo.email;
    $("phone").value = window.userinfo.phone_number;
    $("birth").value = window.userinfo.date_of_birth;

    // Remove loader
    $("loader").classList.remove("is-active");

    //Autofill the form
    
    //Application object has always application id. If application id is undefined, no not autofill anything
    if (typeof window.formdata.application_id === 'undefined')
        return;


    autofill_form();
}

async function save_callback(progress, noRedirect = false) {

    var body = {
        application_progress: Number(progress)
    };
    
    //Bump local application status variable
    window.formdata.application_progress = window.formdata.application_progress >= Number(progress) ? 
                                           window.formdata.application_progress : Number(progress);

    const progress_selector = parts[Number(progress) - 1]; //Convert to zero-index

    let requiredOk = true;
    //A bit of a hack, but overall saves space
    for (let i = 0; i < progress_selector.fields.length; i++) {


        //Check, if the item is required and if it's filled in
        if ($(progress_selector.fields[i]).required) {

            var callback;
            if (progress_selector.requirements[i] == null)
                callback = () => { return $(progress_selector.fields[i]).value.trim() !== ""; }
            else 
                callback = progress_selector.requirements[i];

            if (!callback()) {
                //Show error message
                let errorMessage = "This field is required"
                if (progress_selector.fields[i] === "skills")
                    errorMessage = "Please choose at least 3 skills"

                showError(progress_selector.fields[i], errorMessage);
                requiredOk = false;
            } else {
                hideError(progress_selector.fields[i]);
            }
        }

        if (progress_selector.functions[i] == null)
            body[progress_selector.fields[i]] = $(progress_selector.fields[i]).value;
        else body[progress_selector.fields[i]] = progress_selector.functions[i]();
    }

    if (!requiredOk) return false;

    if (body.application_progress === Number(2)) {
        if (!COUNTRIES.includes($(["travel_from"]).value)) {
            showError("travel_from", "Value not in the list")
            return false;
        }
    }

    if (body.application_progress === Number(3)) {
        if (!cv_is_ok()) {
            return false;
        }
        body["cv_file_id"] = await upload_cv();
    }

    fetch("/api/form-update", {method: 'POST', credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(body)
    }).catch( (reason) => {
        // fix for safari
        //window.location = "/404.html";
    });

    if (Number(progress) > 0 && Number(progress)  < 6) {
        for (var i = 1; i <= 6; i++){ 
            $("form-part" + i).classList.add("hidden");
            $("show_form-part" + i).classList.remove("is-active");
        }
    
        $("show_form-part" + (Number(progress) + 1)).classList.remove("hidden");
        $("show_form-part" + (Number(progress) + 1)).classList.add("is-active");
        $("form-part" + (Number(progress) + 1)).classList.remove("hidden");
    }

    if (Number(progress) === 6 && !noRedirect)
        window.location = "/dashboard.html";

    return true;
}

function showError(elementId, errorMessage) {
    $(elementId).classList.add("is-danger")
    $(`${elementId}_error`).classList.remove("hidden");
    $(`${elementId}_error`).textContent = errorMessage;
}

function hideError(elementId) {
    $(elementId).classList.remove("is-danger")
    $(`${elementId}_error`).classList.add("hidden");
    console.log(elementId);
}


async function save_and_close_callback() {
    if(!(await save_callback(Number(6), true))) return;

    try {
        await fetch("/api/form-close", {method: 'POST', credentials: 'same-origin'});

        window.location = "/dashboard.html";
    } catch(err) {
        window.location = "/404.html";
    }
}

function cv_is_ok() {
    if ($("cv_file_id").files.length > 0) {
        const selectedFile = $("cv_file_id").files[0];
        if (selectedFile.size > MAX_CV_SIZE) {
            return false;
        }
    }
    return true;
}

async function upload_cv() {
    
    try {
        const selectedFile = $("cv_file_id").files[0];
        if (selectedFile) {
            const data = new FormData();
            data.append("cv", selectedFile);
            const res = await fetch("/api/form-file-upload", {method: 'POST', credentials: 'same-origin',
                body: data
            });
            const resData = await res.json();
            return resData.fileId;
        } else {
            return 0;
        }
    }
    catch (err) {
        window.location = "/404.html";
    }
}

async function header_callback(progress) {
    for (var i = 1; i <= 6; i++) {
        $("show_form-part" + i).classList.remove("is-active");
        $("form-part" + i).classList.add("hidden");
    }

    $("form-part" + progress).classList.remove("hidden");
    $("show_form-part" + progress).classList.add("is-active");

}

function get_all_skills() {
    var skills = "";

    for (const child of $("skills_wrap").children)
        skills += (child.value + ", ");

    return skills.trim().slice(0, skills.length - 2);
}

function autofill_form() {
   
    //Set checkboxes
    $(window.formdata.reimbursement === "yes" ? "reimbursement_y" : "reimbursement_n").checked = true;
    $(window.formdata.visa === "yes" ? "visa_y" : "visa_n").checked = true;
    $(window.formdata.first_hack_hk22 === "yes" ? "firsthack_y" : "firsthack_n").checked = true;

    //Set consents
    $("consent_hk_privacy").checked = window.formdata.consent_hk_privacy === "true";
    $("consent_coc").checked = window.formdata.consent_coc === "true";
    $("consent_cvs").checked = window.formdata.consent_cvs === "true";
    $("consent_mlh_privacy").checked = window.formdata.consent_mlh_privacy === "true";
    $("consent_photos").checked = window.formdata.consent_photos === "true";

   
    //Set textboxes
    let whitelist = ["skills", "cv_file_id", "consent_hk_privacy", "consent_coc",
                     "consent_cvs", "consent_mlh_privacy" , "consent_photos"]
    for (const part of document.getElementsByTagName("input")) {
        if (whitelist.includes(part.id)) continue

        if (typeof window.formdata[part.id] !== 'undefined')
            part.value = window.formdata[part.id];
    }

    for (const part of document.getElementsByTagName("select")) {
        if (typeof window.formdata[part.id] !== 'undefined' && window.formdata[part.id] !== null)
            part.value = window.formdata[part.id];
    }
        
    $("achievements").value = window.formdata.achievements;
    $("excited_hk22").value = window.formdata.excited_hk22;
    $("spirit_animal").value = window.formdata.spirit_animal;
    $("pizza").value = window.formdata.pizza;

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
        button.classList.add("button", "is-link", "is-small", "mr-1", "mb-1")

        $("skills_wrap").appendChild(button);
    }

    //Set cv filename
    $("cv-file-name").innerHTML = window.formdata.cv_file_name;

}

function isAdult(birthday){ //birthday is string YYYY-MM-DD (ISO format)
    // adult is considered having the 18th birthday today or in the past
    let d = new Date(birthday);
    let now = new Date();
    
    if (now.getFullYear() - d.getFullYear() < 18){
        return false;
    } else if (now.getFullYear() - d.getFullYear() > 18){
        return true;
    }

    // difference in years is exactly 18
    if (now.getMonth() < d.getMonth()){
        return false;
    } else if (now.getMonth() > d.getMonth()){
        return true;
    }
    
    //months are the same, this is close
    if (now.getDate() < d.getDate()){
        return false;
    } else {
        return true;
    }
}