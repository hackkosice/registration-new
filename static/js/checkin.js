$ = (element) => { return document.getElementById(element); };
let html5QrCode = null;
let cameraId = null;

window.onload = async () => {

    html5QrCode = new Html5Qrcode("scanner");

    Html5Qrcode.getCameras().then(cameras => {
        if (cameras && cameras.length) {
            cameraId = cameras[0].id;
        }
    }).catch(err => {
        console.log(err);
    });

    $("start-scan").addEventListener("click", start_camera);
    $("stop-scan").addEventListener("click", stop_camera);

    $("deny-checkin").addEventListener("click", () => {
        $("person-bar").classList.add("is-hidden");
        show_error("Checkin canceled by user!");
    });
}


async function start_camera() {
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
    console.log(qr_message);
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

        $("person-uid").textContent = user.uid;
        $("person-name").textContent = user.name;
        $("person-bar").classList.remove("is-hidden");
    });
}

async function show_error(error) {
    $("error-bar").classList.remove("is-hidden");
    $("error-text").textContent = error;
}