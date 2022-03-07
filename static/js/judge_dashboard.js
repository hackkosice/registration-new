

window.onload = async function () {

    let fetches = [];

    fetches.push(fetch("/api/judge-application-scoreboard", {method: 'POST', credentials: 'same-origin', cache: 'force-cache'})
        .then(res => res.json()).then((scoreboard) => {

            if (typeof scoreboard.error !== 'undefined')
                window.location = "/";

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

            let action_header = document.createElement("th");
            action_header.textContent = "Actions";
            header.appendChild(action_header);


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
                let action = document.createElement("td");
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


                    action.appendChild(kick_link);
                }
                row.appendChild(action);

                root.appendChild(row);
            }
        })
    );
}
