$ = (element) => { return document.getElementById(element); };
let html5QrCode = null;
let cameras = null;

window.onload = async () => {

    rebuild_checked_in_table();
    html5QrCode = new Html5Qrcode("scanner");

    Html5Qrcode.getCameras().then(all_cameras => {
        if (all_cameras && all_cameras.length) {
            $("camera").value = all_cameras.length - 1;
            $("camera").max = all_cameras.length - 1;

            $("cameras").textContent = `Number  of cameras: ${all_cameras.length}`;
            cameras = all_cameras;
        }
    }).catch(err => {
        console.log(err);
    });

    $("start-scan").addEventListener("click", start_camera);
    $("stop-scan").addEventListener("click", stop_camera);
    $("allow-checkin").addEventListener("click", complete_checkin);

    $("deny-checkin").addEventListener("click", () => {
        $("person-bar").classList.add("is-hidden");
        show_error("Checkin canceled by user!");
    });

    //Populate manual checkin table
    fetch("/api/checkin-table", {method: 'POST', credentials: 'same-origin'}).then(async res => {
        if (res.status !== 200) {
            const err_status = await res.json();

            if (typeof err_status.error === "undefined" || typeof err_status.error.message === "undefined") {
                console.log(err_status);
                return show_error("Unknown error occurred. Check console for more details.");
            }

            $("person-bar").classList.add("is-hidden");
            return show_error(`An error occurred: ${err_status.error.message}`);
        }

        build_manual_checkin((await res.json()).users);
    });
}


async function start_camera() {
    $("success-bar").classList.add("is-hidden");
    let cameraId = cameras[Math.max(0, Math.min(cameras.length - 1, $("camera").value))].id;

    html5QrCode.start(
        cameraId,
        {
            fps: 10,
            qrbox: 400
        },
        on_scan
    ).catch(err => {
            show_error(`Unable to start camera stream. Error: ${err}`);
        });
}


async function stop_camera() {
    html5QrCode.stop().then(() => {}).catch(err => {
        show_error(`An error occurred while closing the camera steam. Error: ${err}`);
    });
}

async function on_scan(qr_message) {
    //Call to backend
    $("below18").classList.add("is-hidden");
    fetch("/api/checkin-user", {method: 'POST', credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
                token: qr_message
            }
        )
    }).then(async res => {
        stop_camera();
        if (res.status !== 200) {
            const err_status = await res.json();

            if (typeof err_status.error === "undefined" || typeof err_status.error.message === "undefined") {
                console.log(err_status);
                return show_error("Unknown error occurred. Check console for more details.");
            }
            return show_error(`An error occurred: ${err_status.error.message}`);
        }

        const user = await res.json();

        const table = await fetch("/api/checkin-table-uid", {method: 'POST', credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({
                    uid: user.uid
                }
            )
        });
        if (table.status !== 200) {
            const err_status = await table.json();

            if (typeof err_status.error === "undefined" || typeof err_status.error.message === "undefined") {
                console.log(err_status);
                return show_error("Unknown error occurred. Check console for more details.");
            }
            return show_error(`An error occurred: ${err_status.error.message}`);
        }

        const table_code = (await table.json()).table;

        if(!isAdult(user.birth))
            $("below18").classList.remove("is-hidden");
        $("error-bar").classList.add("is-hidden");

        $("person-uid").textContent = user.uid;
        $("person-name").textContent = user.name;
        $("person-tshirt").textContent = user.tshirt;
        $("person-table").textContent = table_code;
        $("person-bar").classList.remove("is-hidden");
    });
}

async function show_error(error) {
    $("error-bar").classList.remove("is-hidden");
    $("error-text").textContent = error;
}

async function complete_checkin() {

    fetch("/api/checkin-complete", {
        method: 'POST', credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            uid: Number($("person-uid").textContent),
            type: "qr"
        })
    }).then(async res => {

        if (res.status !== 200) {
            const err_status = await res.json();

            if (typeof err_status.error === "undefined" || typeof err_status.error.message === "undefined") {
                console.log(err_status);
                return show_error("Unknown error occurred. Check console for more details.");
            }

            $("person-bar").classList.add("is-hidden");
            return show_error(`An error occurred: ${err_status.error.message}`);
        }

        $("error-bar").classList.add("is-hidden");
        $("person-bar").classList.add("is-hidden");
        $("success-bar").classList.remove("is-hidden");
        $("manual_checkins").removeChild($($("person-uid").textContent));
        rebuild_checked_in_table();
    });
}


function isAdult(birthday){ //birthday is string YYYY-MM-DD (ISO format)
    // adult is considered having the 18th birthday today or in the past
    let d = new Date(birthday);
    let now = new Date();

    if (now.getFullYear() - d.getFullYear() < 18){
        return false;
    } else if (now.getFullYear() - d.getFullYear() > 18){
        return true;
    }

    // difference in years is exactly 18
    if (now.getMonth() < d.getMonth()){
        return false;
    } else if (now.getMonth() > d.getMonth()){
        return true;
    }

    //months are the same, this is close
    if (now.getDate() < d.getDate()){
        return false;
    } else {
        return true;
    }
}

function build_manual_checkin(users) {
    //Build up new table
    let root = $("manual_checkins");
    root.innerHTML = '';

    let header = document.createElement("tr");

    let name_header = document.createElement("th");
    name_header.textContent = "Name";
    header.appendChild(name_header);

    let uid_header = document.createElement("th");
    uid_header.textContent = "User ID";
    header.appendChild(uid_header);

    let padding_back = document.createElement("th");
    header.appendChild(padding_back);

    root.appendChild(header);

    //Apply any filtering
    for (const user of users) {

        let row = document.createElement("tr");
        row.id = user.mymlh_uid;

        let name = document.createElement("td");
        name.textContent = user.name;

        let uid = document.createElement("td");
        uid.textContent = user.mymlh_uid;

        let checkin_link = document.createElement("a");
        checkin_link.id = user.mymlh_uid;
        checkin_link.href = "javascript:void(0)";
        checkin_link.textContent = "Check in!";
        checkin_link.addEventListener("click", () => {
            $("below18").classList.add("is-hidden");
            fetch("/api/checkin-data", {method: 'POST', credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({
                        uid: user.mymlh_uid
                    }
                )
            }).then(async res => {
                if (res.status !== 200) {
                    const err_status = await res.json();

                    if (typeof err_status.error === "undefined" || typeof err_status.error.message === "undefined") {
                        console.log(err_status);
                        return show_error("Unknown error occurred. Check console for more details.");
                    }
                    return show_error(`An error occurred: ${err_status.error.message}`);
                }

                const user = await res.json();

                const table = await fetch("/api/checkin-table-uid", {method: 'POST', credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    body: JSON.stringify({
                            uid: Number($("person-uid").textContent)
                        }
                    )
                });
                if (table.status !== 200) {
                    const err_status = await table.json();

                    if (typeof err_status.error === "undefined" || typeof err_status.error.message === "undefined") {
                        console.log(err_status);
                        return show_error("Unknown error occurred. Check console for more details.");
                    }
                    return show_error(`An error occurred: ${err_status.error.message}`);
                }

                const table_code = (await table.json()).table;

                if(!isAdult(user.birth))
                    $("below18").classList.remove("is-hidden");
                $("error-bar").classList.add("is-hidden");

                $("person-uid").textContent = user.uid;
                $("person-name").textContent = user.name;
                $("person-tshirt").textContent = user.tshirt;
                $("person-table").textContent = table_code;
                $("person-bar").classList.remove("is-hidden");
            });

        });


        let checkin_wrapper = document.createElement("td")
        checkin_wrapper.appendChild(checkin_link);

        row.appendChild(name);
        row.appendChild(uid);
        row.appendChild(checkin_wrapper);
        root.appendChild(row);
    }
}

async function rebuild_checked_in_table() {
    //Build up new table
    let root = $("checked_in");
    root.innerHTML = '';

    const table_data = await fetch("/api/checkin-checked-in", {method: 'POST', credentials: "same-origin"});

    let header = document.createElement("tr");

    let name_header = document.createElement("th");
    name_header.textContent = "Name";
    header.appendChild(name_header);

    let uid_header = document.createElement("th");
    uid_header.textContent = "User ID";
    header.appendChild(uid_header);

    let padding_back = document.createElement("th");
    header.appendChild(padding_back);

    root.appendChild(header);

    //Apply any filtering
    for (const user of (await table_data.json()).users) {

        let row = document.createElement("tr");
        row.id = user.mymlh_uid;

        let name = document.createElement("td");
        name.textContent = user.name;

        let uid = document.createElement("td");
        uid.textContent = user.mymlh_uid;


        row.appendChild(name);
        row.appendChild(uid);
        row.appendChild(checkin_wrapper);
        root.appendChild(row);
    }
}

