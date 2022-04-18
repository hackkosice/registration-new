$ = (element) => { return document.getElementById(element); };

window.onload = async function () {

    fetch_all_data()

    $("status_filter").addEventListener('change', () => {
        sort_table()
    })
}

async function fetch_all_data() {
    let fetches = [];

    fetches.push(fetch("/api/sponsors-applications", {method: 'POST', credentials: 'same-origin', cache: 'force-cache'})
        .then(res => res.json()).then((applications) => {

            if (typeof applications.error !== 'undefined')
                window.location = "/";

            window.sponsors_applications = applications;
            set_numbers();
            build_table();
        })
    );

    try {
        Promise.all(fetches);
    } catch(err) {
        window.location = "/";
    }
}

async function set_numbers() {
    $("applications_number").textContent = window.sponsors_applications.length
}

function build_table() {
    //Build up new table
    let root = $("sponsors_applications_table")
    root.innerHTML = ''

    let header = document.createElement("tr");

    add_header(header, "Name");
    add_header(header, "Birthdate");
    add_header(header, "Country");
    add_header(header, "School");
    add_header(header, "Major");
    add_header(header, "Level");
    add_header(header, "Job preference");

    let padding_back = document.createElement("th");
    header.appendChild(padding_back);

    root.appendChild(header);

    //Apply any filtering
    for (const user of window.sponsors_applications) {
        let row = document.createElement("tr");

        add_table_data(row, user.name);
        add_table_data(row, user.birth.split("-")[0]);
        add_table_data(row, user.travel_from)
        add_table_data(row, user.school);
        add_table_data(row, user.major);
        add_table_data(row, user.level);
        add_table_data(row, user.job_preference);

        let detail_link = document.createElement("a");
        detail_link.href = `/sponsors/detail.html?uid=${user.mymlh_uid}`;
        detail_link.textContent = "Details";

        let detail_wrapper = document.createElement("td")
        detail_wrapper.appendChild(detail_link);

        row.appendChild(detail_wrapper);
        root.appendChild(row);
    }
}

function add_header(header_elem, text) {
    let new_elem = document.createElement("th");
    new_elem.textContent = text;
    header_elem.appendChild(new_elem);
}

function add_table_data(row, text) {
    let new_elem = document.createElement("td");
    new_elem.textContent = text;
    row.appendChild(new_elem);
}
