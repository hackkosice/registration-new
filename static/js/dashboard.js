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
        title: "Status: Not Requested",
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

    await fetch("/api/form-data", {method: 'POST', credentials: 'same-origin'})
    .then(res => res.json()).then((formdata) => {
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
                $("edit-application").classList.remove("hidden");
                $("close-application").classList.remove("hidden");
            } else {
                $("edit-application").classList.add("hidden");
                $("close-application").classList.add("hidden");
            }
        });


    //So we can ease the load on the server at least a bit 
    await load_team(); 

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

    $("close-application").addEventListener('click', async () => {
        
        try {
            await fetch("/api/form-close", {method: 'POST', credentials: 'same-origin'});
            window.location = window.location;
        } catch (err) {
            window.location = "/404.html";
        }
    });

    // Remove loader
    $("loader").classList.remove("is-active");
}


function load_team() {
    return fetch("/api/team-info", {method: 'POST', credentials: 'same-origin', cache: 'force-cache'})
    .then(res => res.json()).then((teamdata) => {
            window.teamdata = teamdata;

            //If user isn't in the team, server is gonna return an empry objecet
            if (typeof teamdata.members === 'undefined')
                return;

            let root = document.createElement("table");
            root.classList.add("table", "is-fullwidth");
            root.id = "team_table";

            let header = document.createElement("tr");

            let name_header = document.createElement("th");
            name_header.textContent = "Name";
            header.appendChild(name_header);

            let status_header = document.createElement("th");
            status_header.textContent = "Application status";
            header.appendChild(status_header);

            let owner_header = document.createElement("th");
            owner_header.textContent = "Team role";
            header.appendChild(owner_header);


            root.appendChild(header);

            for (const member of teamdata.members) {
                let row = document.createElement("tr");

                let name = document.createElement("th");
                name.textContent = member.name;

                let status = document.createElement("td");
                status.textContent = member.application;
                
                row.appendChild(name);
                row.appendChild(status);

                let owner = document.createElement("td");

                if (teamdata.data.owner === member.mymlh_uid) {
                    owner.textContent = "owner";
                }

                row.appendChild(owner);

                //If you are owner, add the ablility to kick memers
                if (teamdata.data.owner === window.formdata.mymlh_uid &&
                    teamdata.data.owner !== member.mymlh_uid) {

                        
                    let kick_link = document.createElement("a");
                    kick_link.href = "javascript:void(0)";
                    kick_link.textContent = "kick";
                    kick_link.addEventListener('click', async () => {
                        await fetch("/api/team-kick", {method: 'POST', credentials: 'same-origin',
                            headers: {
                                'Content-Type': 'application/json;charset=utf-8'
                            }, 
                            body: JSON.stringify({
                                target: member.mymlh_uid
                            })
                        })
                        window.location = window.location;
                    });


                    let kick = document.createElement("td");
                    kick.appendChild(kick_link);
                    row.appendChild(kick);
                }

                root.appendChild(row);
            }

            $("team_code_label").textContent = teamdata.data.team_code;
            $("team_name_label").textContent = "Team name: " + teamdata.data.team_name;

            let leave_button = document.createElement("button");
            leave_button.textContent = "Leave team";
            leave_button.classList.add("button", "is-primary", "is-light")
            leave_button.addEventListener('click', async () => {
                
                fetch("/api/team-leave", {method: 'POST', credentials: 'same-origin'}).then(
                    async (response) => {
                        if (response.status == 200)
                            window.location = window.location;
                    }
                )     
            });

            team.appendChild(root);
            team.appendChild(leave_button);
            $("join_wrap").classList.add("hidden");
            $("create_wrap").classList.add("hidden");
            $("team_info_wrap").classList.remove("hidden");
    });
}

function showError(elementId, errorMessage) {
    $(elementId).classList.add("is-danger")
    $(`${elementId}_error`).classList.remove("hidden");
    $(`${elementId}_error`).textContent = errorMessage;
}
