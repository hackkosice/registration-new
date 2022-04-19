$ = (element) => { return document.getElementById(element); };

const suggestions_datasets = ["/data/skills.json"];

FILTERS = [
    {
        element: $("country_filter"),
        evalFunc: (filterValue, user) => {
            if (filterValue === "no-filter") {
                return true
            }
            return user.travel_from === filterValue
        },
        propertySelector: (user) => {
            return user.travel_from
        },
        blacklistValues: []
    },
    {
        element: $("major_filter"),
        evalFunc: (filterValue, user) => {
            if (filterValue === "no-filter") {
                return true
            }
            return user.major === filterValue
        },
        propertySelector: (user) => {
            return user.major
        },
        blacklistValues: ["none", "", "-", "1", "1st year"]
    },
    {
        element: $("level_filter"),
        evalFunc: (filterValue, user) => {
            if (filterValue === "no-filter") {
                return true
            }
            return user.level === filterValue
        },
        propertySelector: (user) => {
            return user.level
        },
        blacklistValues: []
    },
    {
        element: $("job_filter"),
        evalFunc: (filterValue, user) => {
            if (filterValue === "no-filter") {
                return true
            }
            return user.job_preference === filterValue
        },
        propertySelector: (user) => {
            return user.job_preference
        },
        blacklistValues: []
    }
]

window.onload = async function () {

    for (let i = 0; i < FILTERS.length; i++) {
        let filter = FILTERS[i];
        filter.element.addEventListener("change", () => {
            build_table()
        })
    }

    $("reset_filters").addEventListener("click", () => {
        for (let i = 0; i < FILTERS.length; i++) {
            let filter = FILTERS[i];
            filter.element.value = "no-filter"
        }
        $("skills_wrap").textContent = ""
        build_table()
    })

    $("skills").addEventListener('change', () => {
        for(const child of $("skills_wrap").children)
            if (child.value === $("skills").value)
                return ($("skills").value = "");


        let button = document.createElement("button");
        button.addEventListener('click', () => {
            $("skills_wrap").removeChild(button);
            build_table()
        });

        button.classList.add("button", "is-link", "is-small", "mr-1", "mb-1")
        button.value = $("skills").value;
        button.textContent = $("skills").value;

        $("skills_wrap").appendChild(button);
        $("skills").value = "";

        build_table()
    });

    for (const dataset of suggestions_datasets) {

        //Load the dataset
        fetch(dataset, {method: 'GET'}).then(
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
            }
        );
    }

    fetch_all_data()
}

async function fetch_all_data() {
    let fetches = [];

    fetches.push(fetch("/api/sponsors-applications", {method: 'POST', credentials: 'same-origin', cache: 'force-cache'})
        .then(res => res.json()).then((applications) => {

            if (typeof applications.error !== 'undefined')
                window.location = "/";

            window.sponsors_applications = applications;
            set_numbers();
            create_filter_options();
            build_table();

            $("loader").classList.remove("is-active");
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

        if (!should_show_with_filters(user)) {
            continue;
        }

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

function should_show_with_filters(user) {

    let shouldShow = true;

    // Basic value filters

    for (let i = 0; i < FILTERS.length; i++) {
        let filter = FILTERS[i];
        if (!filter.evalFunc(filter.element.value, user)) {
            shouldShow = false;
        }
    }

    // Skills filter
    const skills_filtered = get_all_skills()
    if (skills_filtered.length === 0) {
        return shouldShow
    }

    if (!user.skills) {
        return false;
    }

    const user_skills = user.skills.replace(/ /g, "").toLowerCase().split(',')

    for (let i = 0; i < skills_filtered.length; i++) {
        let skill = skills_filtered[i].replace(/ /g, "").toLowerCase()
        if (!user_skills.includes(skill)) {
            shouldShow = false;
        }
    }

    return shouldShow;
}

function create_filter_options() {
    for (let i = 0; i < FILTERS.length; i++) {
        let filter = FILTERS[i];

        let arr = window.sponsors_applications.map(filter.propertySelector)
        let unique = arr.filter((v, i, a) => a.indexOf(v) === i)

        let option = document.createElement("option")
        option.value = "no-filter"
        option.textContent = ""
        filter.element.appendChild(option)

        unique.forEach(value => {
            if (value && !filter.blacklistValues.includes(value.toLowerCase())) {
                let option = document.createElement("option")
                option.value = value
                option.textContent = value
                filter.element.appendChild(option)
            }
        })
    }
}

function get_all_skills() {
    var skills = [];

    for (const child of $("skills_wrap").children)
        skills.push(child.value)

    return skills;
}
