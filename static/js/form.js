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
        fields: ["reimbursement", "travel_from", "visa"],
        functions: [() => { return $("reimbursement_y").checked ? "yes" : "no"; }, null,
                    () => { return $("visa_y").checked ? "yes" : "no"; }, null, null],
        requirements: [() => { return $("reimbursement_y").checked || $("reimbursement_n").checked; }, null, 
                       () => { return $("visa_y").checked || $("visa_n").checked; }]
    },

    { //Part 3: Job
        fields: ["job_preference", "skills", "cv_file_id"],
        functions: [null,
                    () => { return get_all_skills(); },
                    () => { return 0 }],
        requirements: [null,
                       () => { return $("skills_wrap").children.length > 2; }]

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
    }
];


window.onload = async function() {

    for (const button of document.getElementsByClassName("save_and_continue"))
        button.addEventListener('click', () => { save_callback(button.id) });
    $("save_and_close").addEventListener("click", () => { save_and_close_callback() })
    
    for (let i = 1; i < 6; i++)
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
        const selectedFile = $("cv_file_id").files[0];
        $("cv-file-name").innerHTML = selectedFile.name;
    })


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

    if (typeof window.formdata.application_progress !== 'undefined') {

        for (var i = 5; i > window.formdata.application_progress; i--)
            $("show_form-part" + i).classList.add("hidden");

        $("form-part" + window.formdata.application_progress).classList.remove("hidden");
        $("show_form-part" + window.formdata.application_progress).classList.add("is-active");
    } else {

        for (var i = 2; i < 6; i++)
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
                showError(progress_selector.fields[i]);
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

    if (body.application_progress === Number(3)) {
        const fileId = await upload_cv();
        body["cv_file_id"] = fileId;
    }

    fetch("/api/form-update", {method: 'POST', credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(body)
    });

    if (Number(progress) > 0 && Number(progress)  < 5) {
        for (var i = 1; i < 6; i++){ 
            $("form-part" + i).classList.add("hidden");
            $("show_form-part" + i).classList.remove("is-active");
        }
    
        $("show_form-part" + (Number(progress) + 1)).classList.remove("hidden");
        $("show_form-part" + (Number(progress) + 1)).classList.add("is-active");
        $("form-part" + (Number(progress) + 1)).classList.remove("hidden");
    }

    if (Number(progress) === 5 && !noRedirect)
        window.location = "/dashboard.html";

    return true;
}

function showError(elementId) {
    $(elementId).classList.add("is-danger")
    $(`${elementId}_error`).classList.remove("hidden");
}

function hideError(elementId) {
    $(elementId).classList.remove("is-danger")
    $(`${elementId}_error`).classList.add("hidden");
}


async function save_and_close_callback() {
    if(!(await save_callback(Number(5), true))) return;

    await fetch("/api/form-close", {method: 'POST', credentials: 'same-origin'});

    window.location = "/dashboard.html";
}

async function upload_cv() {
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

async function header_callback(progress) {
    for (var i = 1; i < 6; i++) {
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
   
    //Set textboxes
    let whitelist = ["skills", "cv_file_id"]
    for (const part of document.getElementsByTagName("input")) {
        if (whitelist.includes(part.id)) continue

        if (typeof window.formdata[part.id] !== 'undefined')
            part.value = window.formdata[part.id];
    }

    for (const part of document.getElementsByTagName("select")) {
        if (typeof window.formdata[part.id] !== 'undefined' && window.formdata[part.id] !== null)
            part.value = window.formdata[part.id];
    }
        
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