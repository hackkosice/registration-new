$ = (element) => { return document.getElementById(element); };


//Build datalists from these jsons
const suggestions_datasets = ["/data/countries.json",
                              "/data/marketing_types.json",
                              "/data/skills.json"];


window.onload = async function() {

    for (const button of document.getElementsByClassName("save_and_continue")) {
        button.addEventListener('click', () => { sac_callback(button.id) });
    }

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

    //Autofill boxes with info form MyMLH
    $("firstname").value = window.userinfo.first_name;
    $("lastname").value = window.userinfo.last_name;
    
    $("email").value = window.userinfo.email;
    $("phone").value = window.userinfo.phone_number;
    $("birth").value = window.userinfo.date_of_birth;
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