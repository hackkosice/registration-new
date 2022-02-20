$ = (element) => { return document.getElementById(element); };

const desctriptions = {
    "open": "You can still edit your application but we won't be eable to judge it.",
    "closed": "You can no longer edit your application, as it's beeing reviewed by our staff.",
    //add more
};

window.onload = async function() {

    
    var fetches = [];
   
    fetches.push(fetch("/api/form-data", {method: 'POST', credentials: 'same-origin'}).then(
        async (response) => {
            const formdata = await response.json(); 
            window.formdata = formdata;
            $("state").textContent = formdata.application_status;
            $("description").textContent = desctriptions[formdata.application_status];
        
            if (formdata.application_status === "open") {
                var to_app = document.createElement("a");
                to_app.href = "/application.html";
                to_app.textContent = "Edit application";
                $("state_wrap").appendChild(to_app);
            }

            if (formdata.team_id !== null) {
                $("join_wrap").classList.add("hidden");
                $("create_wrap").classList.add("hidden");
            }
        })
    );

    //So we can ease the load on the server at least a bit 
    fetches.push(load_team);


    //Resolve all promises
    try {
        await Promise.all(fetches);
    } catch (err) {

    }

    //Add callback
    $("join").addEventListener('click', async () => {
        try {

            const body = {

            };

            await fetch("/api/team_join", {method: 'POST', credentials: 'same-origin', 
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify()
            });
        } catch(err) {
            //Display error message
        }

        await load_team();
    });
}


async function load_team() {
    
    fetch("/api/team-info", {method: 'POST', credentials: 'same-origin', cache: 'force-cache'}).then(
        async (response) => {

            const teamdata = await response.json();
            window.teamdata = teamdata;

            let root = document.createElement("table");
            root.id = "team_table";

            for (const member of teamdata.members) {
                let row = document.createElement("tr");

                let name = document.createElement("th");
                name.textContent = member.name;

                let status = document.createElement("td");
                status.textContent = "Application Status: " + status;

                row.appendChild(name);
                row.appendChild(status);
                root.appendChild(row);
            }
            team.appendChild(root);
    });
}