$ = (element) => { return document.getElementById(element); };

const statusData = {
    "open": {
        class: "is-info",
        title: "Status: Open",
        description: "You can still make changes to your application and we don't see it yet. Don't forget to submit once you are finished!"
    },
    "closed": {
        class: "is-warning",
        title: "Status: Closed",
        description: "You can no longer edit your application, as it's being reviewed by our staff."
    }
    //add more
};


const reimbData = {
    "none": {
        class: "is-error",
        title: "Status: None",
        description: "You have not requested travel reimbursement in your application."
    },
    "requested": {
        class: "is-warning",
        title: "Status: Requested",
        description: "You have requested reimbursement. We are now going to judge if you are allegeable to receive it."
    }
    //add more
};
window.onload = async function() {

    
    var fetches = [];
   
    fetches.push(fetch("/api/form-data", {method: 'POST', credentials: 'same-origin'}).then(
        async (response) => {
            const formdata = await response.json(); 
            window.formdata = formdata;

            if (typeof window.formdata.application_status === 'undefined')
                window.location = "/application.html";

            let status = statusData[formdata.application_status];
            $("state").textContent = status.title;
            $("description").textContent = status.description;
            $("status-card").classList.add(status.class);

            let reimb = reimbData[formdata.reimbursement_progress];
            $("reimb").textContent = reimb.title;
            $("reimb_description").textContent = reimb.description;
            $("reimb-card").classList.add(reimb.class);
        
            if (formdata.application_status === "open") {
                $("edit-application").classList.remove("hidden")
            } else {
                $("edit-application").classList.add("hidden")
            }
        })
    );

    //So we can ease the load on the server at least a bit 
    fetches.push(load_team());

    //Resolve all promises
    try {
        await Promise.all(fetches);
    } catch (err) {

    }

    //Add callback
    $("join").addEventListener('click', async () => {
        try {

            const teamCode = $("team_code").value;

            if (teamCode.trim() === "") {
                showError("team_code", "Code of the team can not be empty")
                return;
            }

            const body = {
                team_code: teamCode
            };

            $("join").classList.add("is-loading")

            await fetch("/api/team-join", {method: 'POST', credentials: 'same-origin', 
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify(body)
            }).then(async (response) => {
                if (response.status !== 200) {
                    const resData = await response.json()
                    $("join").classList.remove("is-loading")
                    showError("team_code", resData.error.message)
                }
            });

            $("join").classList.remove("is-loading")

            await load_team();
        } catch(err) {
            //Display error message
            $("join").classList.remove("is-loading")
        }
    });

    $("create").addEventListener('click', async () => {
        try {


            const teamName = $("team_name").value;

            if (teamName.trim() === "") {
                showError("team_name", "Name of the team can not be empty")
                return;
            }

            const body = {
                team_name: $("team_name").value
            };

            $("create").classList.add("is-loading")

            const data = await fetch("/api/team-create", {method: 'POST', credentials: 'same-origin', 
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify(body)
            }).then(async (response) => {
                if (response.status !== 200) {
                    const resData = await response.json()
                    $("create").classList.remove("is-loading")
                    showError("team_name", resData.error.message)
                }
            })

            await load_team();

            $("create").classList.remove("is-loading")
        } catch(err) {
            //Display error message
            $("create").classList.remove("is-loading")
            console.log(err);
        }
    });

    // Remove loader
    $("loader").classList.remove("is-active");
}


async function load_team() {
    return fetch("/api/team-info", {method: 'POST', credentials: 'same-origin', cache: 'force-cache'}).then(
        async (response) => {
            const teamdata = await response.json();
            window.teamdata = teamdata;

            //If user isn't in the team, server is gonna return an empry objecet
            if (typeof teamdata.members === 'undefined')
                return;

            let root = document.createElement("table");
            root.id = "team_table";

            for (const member of teamdata.members) {
                let row = document.createElement("tr");

                let name = document.createElement("th");
                name.textContent = member.name;

                let status = document.createElement("td");
                status.textContent = "Application Status: " + member.application;
                
                row.appendChild(name);
                row.appendChild(status);
                
                
                if (teamdata.data.owner === member.mymlh_uid) {
                    let owner = document.createElement("td");
                    owner.textContent = "owner";
                    row.appendChild(owner);
                }
                
                root.appendChild(row);
            }

            let label = document.createElement("p");
            label.textContent = "Your team's code is: " + teamdata.data.team_code;

            let leave_button = document.createElement("button");
            leave_button.textContent = "Leave team";
            leave_button.addEventListener('click', async () => {
                
                fetch("/api/team-leave", {method: 'POST', credentials: 'same-origin'}).then(
                    async (response) => {
                        if (response.status == 200)
                            window.location = window.location;
                    }
                )     
            });

            team.appendChild(root);
            team.appendChild(label);
            team.appendChild(leave_button);
            $("join_wrap").classList.add("hidden");
            $("create_wrap").classList.add("hidden");
    });
}

function showError(elementId, errorMessage) {
    $(elementId).classList.add("is-danger")
    $(`${elementId}_error`).classList.remove("hidden");
    $(`${elementId}_error`).textContent = errorMessage;
}
