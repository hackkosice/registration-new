$ = (element) => { return document.getElementById(element); };

window.onload = async function () {

    fetch_all_data()

    $("param_sort").addEventListener('change', () => {
        sort_table()
    })

    $("status_filter").addEventListener('change', () => {
        sort_table()
    })

    $("accept").addEventListener('click', () => {
        accept_selected()
    })

    $("reject").addEventListener('click', () => {
        reject_selected()
    })

    $("vote").addEventListener('click', () => {
        window.location = "/judge/application.html";
    });
}

async function fetch_all_data() {
    let fetches = [];

    fetches.push(fetch("/api/judge-application-scoreboard", {method: 'POST', credentials: 'same-origin', cache: 'force-cache'})
        .then(res => res.json()).then((scoreboard) => {

            if (typeof scoreboard.error !== 'undefined')
                window.location = "/";

            window.user_scoreboard = scoreboard;
            sort_table();
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
            });

            if (typeof scoreboard.error !== 'undefined')
                window.location = "/";

            window.voter_scoreboard = scoreboard;

            build_voter_scoreboard()
        })
    );

    try {
        Promise.all(fetches);
    } catch(err) {
        window.location = "/";
    }
}

async function sort_table() {

    //Apply any sorting
    window.user_scoreboard.sort((first, second) => {

        switch ($("param_sort").value) {
            case "des_score":
                if (first.score < second.score)
                    return 1;
                else if (first.score > second.score)
                    return -1;
                return 0;

            case "asc_score":
                if (first.score > second.score)
                    return 1;
                else if (first.score < second.score)
                    return -1;
                return 0;

            case "des_votes":
                if (first.judged < second.judged)
                    return 1;
                else if (first.judged > second.judged)
                    return -1;
                return 0;

            case "asc_votes":
                if (first.judged < second.judged)
                    return 1;
                else if (first.judged > second.judged)
                    return -1;
                return 0;
        }
    });

    build_user_scoreboard();
}

function build_user_scoreboard() {
    //Build up new table
    let root = $("user_scoreboard_table")
    root.innerHTML = ''

    let header = document.createElement("tr");

    let padding_front = document.createElement("th");
    header.appendChild(padding_front);

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

    let padding_back = document.createElement("th");
    header.appendChild(padding_back);

    root.appendChild(header);

    //Apply any filtering
    for (const user of window.user_scoreboard) {

        if ($("status_filter").value !== "all") {
            if ($("status_filter").value !== user.status)
                continue; //A bit of a hacky way to do it... but it works
        }

        let row = document.createElement("tr");

        let selector_chkbox = document.createElement("input");
        selector_chkbox.type = "checkbox";
        selector_chkbox.id = user.mymlh_uid; //User is MyMLH uid
        selector_chkbox.classList.add("user_select_checkbox");

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

        let detail_link = document.createElement("a");
        detail_link.href = `/judge/detail.html?uid=${user.mymlh_uid}`;
        detail_link.textContent = "Details";

        let detail_wrapper = document.createElement("td")
        detail_wrapper.appendChild(detail_link);

        row.appendChild(selector);
        row.appendChild(name);
        row.appendChild(score);
        row.appendChild(votes);
        row.appendChild(status);
        row.appendChild(detail_wrapper);
        root.appendChild(row);
    }
}

function build_voter_scoreboard() {
    let root = $("voter_scoreboard_table")
    root.innerHTML = '';

    let header = document.createElement("tr");

    let name_header = document.createElement("th");
    name_header.textContent = "Voter";
    header.appendChild(name_header);

    let score_header = document.createElement("th");
    score_header.textContent = "Votes";
    header.appendChild(score_header);


    root.appendChild(header);

    for (const user of window.voter_scoreboard) {
        let row = document.createElement("tr");
        let name = document.createElement("td");
        name.textContent = user.voter;

        let score = document.createElement("td");
        score.textContent = user.votes;

        row.appendChild(name);
        row.appendChild(score);
        root.appendChild(row);
    }
}

function get_selected() {
    return Array.from(document.getElementsByClassName('user_select_checkbox'))
        .filter((el) => el.checked)
        .map((el) => parseInt(el.id))
}

async function accept_selected() {
    const selected = get_selected()

    await fetch("/api/judge-accept", {
        method: 'POST', credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            accepted: selected
        })
    });

    fetch_all_data();
}

async function reject_selected() {
    const selected = get_selected()

    await fetch("/api/judge-reject", {
        method: 'POST', credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            rejected: selected
        })
    });

    fetch_all_data();
}
