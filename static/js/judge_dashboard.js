

window.onload = async function () {

    let fetches = [];

    fetches.push(fetch("/api/judge-application-scoreboard", {method: 'POST', credentials: 'same-origin', cache: 'force-cache'})
        .then(res => res.json()).then((scoreboard) => {

            if (typeof scoreboard.error !== 'undefined')
                window.location = "/";

            let root = document.createElement("table");
            root.classList.add("table", "is-fullwidth");
            root.id = "applications_table";

            let header = document.createElement("tr");

            let empty = document.createElement("th");
            header.appendChild(empty);

            let name_header = document.createElement("th");
            name_header.textContent = "Name";
            header.appendChild(name_header);

            let score_header = document.createElement("th");
            score_header.textContent = "Score";
            header.appendChild(score_header);

            let votes_header = document.createElement("th");
            votes_header.textContent = "Votes";
            header.appendChild(votes_header);

            let status_header = document.createElement("th");
            status_header.textContent = "Application status";
            header.appendChild(status_header);

            root.appendChild(header);

            for (const user of scoreboard) {
                let row = document.createElement("tr");

                console.log(user);

                let selector_chkbox = document.createElement("input");
                selector_chkbox.type = "checkbox";
                selector_chkbox.id = user.mymlh_uid; //User is MyMLH uid
                selector_chkbox.class = "user_chkbox";

                let selector = document.createElement("td");
                selector.appendChild(selector_chkbox);

                let name = document.createElement("td");
                name.textContent = user.name;

                let score = document.createElement("td");
                score.textContent = Math.round(user.score * 100) / 100;

                let votes = document.createElement("td");
                votes.textContent = user.judged;

                let status = document.createElement("td")
                status.textContent = user.status;

                row.appendChild(selector);
                row.appendChild(name);
                row.appendChild(score);
                row.appendChild(votes);
                row.appendChild(status);
                root.appendChild(row);
            }
            document.getElementById("user_scoreboard").appendChild(root);
        })
    );

    fetches.push(fetch("/api/judge-scoreboard", {method: 'POST', credentials: 'same-origin', cache: 'force-cache'})
        .then(res => res.json()).then((scoreboard) => {

            //sort
            scoreboard.sort((first, second) => {
                if (first.votes < second.votes)
                    return 1;
                else if (first.votes > second.votes)
                    return -1;
                return 0;
            } )

            if (typeof scoreboard.error !== 'undefined')
                window.location = "/";

            let root = document.createElement("table");
            root.classList.add("table", "is-fullwidth");
            root.id = "applications_table";

            let header = document.createElement("tr");

            let name_header = document.createElement("th");
            name_header.textContent = "Voter";
            header.appendChild(name_header);

            let score_header = document.createElement("th");
            score_header.textContent = "Votes";
            header.appendChild(score_header);


            root.appendChild(header);

            for (const user of scoreboard) {
                let row = document.createElement("tr");
                let name = document.createElement("td");
                name.textContent = user.voter;

                let score = document.createElement("td");
                score.textContent = user.votes;

                row.appendChild(name);
                row.appendChild(score);
                root.appendChild(row);
            }
            document.getElementById("voter_scoreboard").appendChild(root);
        })
    );

    try {
        Promise.all(fetches);
    } catch(err) {
        window.location = "/";
    }
}

async function sort_table() {

}