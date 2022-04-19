$ = (element) => { return document.getElementById(element); };
const MAX_CV_SIZE = 10 * 1024 * 1024;

const statusData = {
    "open": {
        class: "is-info",
        title: "Status: Open",
        description: "You can still make changes to your application and we don't see it yet. Don't forget to submit once you are finished!",
        buttons: []
    },
    "closed": {
        class: "is-warning",
        title: "Status: Closed",
        description: "You can no longer edit your application, as it's being reviewed by our staff.",
        buttons: []
    },
    "invited": {
        class: "is-success",
        title: "Status: Invited",
        description: "Congratulations! You have been officially invited to join us at Hack Kosice. Please let us know if you are coming as soon as possible:",
        buttons: [
            {
                text: "Confirm participation",
                class: "is-success",
                callback: acceptInvitation
            },
            {
                text: "Decline invitation",
                class: "is-danger",
                callback: declineInvitation
            }
        ]
    },
    "rejected": {
        class: "is-danger",
        title: "Status: Rejected",
        description: "We are sorry but we can't offer you place at our hackathon this year. But don't worry, you can have a chance to participate next year.",
        buttons: []
    },
    "accepted": {
        class: "is-success",
        title: "Status: Accepted",
        description: "We are looking forward to seeing you at Hack Kosice 2022. You can find an updated schedule on our website. If you no longer plan to attend please let us know by declining the invitation.",
        buttons: [
            {
                text: "Decline invitation",
                class: "is-danger",
                callback: declineInvitation
            },
        ]
    },
    "declined": {
        class: "is-danger",
        title: "Status: Declined",
        description: "We are sorry to hear that you can't make it this year and hope to see you next time! If you change your mind please email us at contact@hackkosice.com.",
        buttons: []
    },
    //add more
};


const reimbData = {
    "no": {
        class: "is-error",
        title: "Status: Not Requested",
        description: "You have not requested travel reimbursement in your application."
    },
    "yes": {
        class: "is-warning",
        title: "Status: Requested",
        description: "You have requested reimbursement. We are now going to judge if you are allegeable to receive it."
    }
    //add more
};
window.onload = async function() {

    await fetch_all_data()

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

    $("leave_team_button").addEventListener('click', async() => {
        fetch("/api/team-leave", {method: 'POST', credentials: 'same-origin'}).then(
            async (response) => {
                if (response.status == 200)
                    window.location = window.location;
            }
        )
    })

    if (window.formdata.application_status === "accepted") {
        await fetch("/api/checkin-info", {method: 'POST', credentials: 'same-origin'}).then(
            async (response) => {
                if (response.status != 200)
                    return;

                const content = await response.json();
                var qrc = new QRCode($("qrcode"), content.invite_token);
                $("checkin-uid").textContent = content.uid;
                $("checkin-name").textContent = content.name;
                $("qrcode").title = "";
            }
        );
        $("checkin-data").classList.remove("hidden");
        $("checkin-save").addEventListener("click", async () => {
            const pdf_data = $("to_pdf");
            const worker = html2pdf(pdf_data)/*.set({
                filename: 'invitation.pdf',
                margin: 2
            }).from(`<html>${pdf_data.innerHTML}</html>`);*/
        });

    }
  
    $("cv-button").addEventListener("click", async() => {
        if ($("cv_file_id").files.length === 0) {
            showError("cv_file_wrapper", "Please choose a file");
            return
        }
        const selectedFile = $("cv_file_id").files[0];
        if (selectedFile.size > MAX_CV_SIZE) {
            showError("cv_file_wrapper", "File is too big. Max size is 10 MiB.");
            return
        }
        hideError("cv_file_wrapper")
        const fileId = await upload_cv()
        if (fileId === 0) {
            showError("cv_file_wrapper", "Error uploading file to server");
            return
        }
        const body = {
            cv_file_id: fileId
        }
        await fetch("/api/update-cv-file-id", {method: 'POST', credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(body)
        })
        fetch_all_data();
    })


    $("cv_file_id").addEventListener("change", () => {
        if ($("cv_file_id").files.length > 0) {
            const selectedFile = $("cv_file_id").files[0];
            if (selectedFile.size > MAX_CV_SIZE) {
                showError("cv_file_wrapper", "File is too big. Max size is 10 MiB.");
            } else {
                hideError("cv_file_wrapper")
                $("cv-file-name").textContent = "";
            }
            $("cv-file-name").textContent = selectedFile.name;
        } else {
            hideError("cv_file_wrapper")
            $("cv-file-name").textContent = "";
        }
    });

    // Remove loader

}

async function fetch_all_data() {
    await load_user_data()

    //So we can ease the load on the server at least a bit
    await load_team();
    $("loader").classList.remove("is-active");
}

async function load_user_data() {
    try {
        await fetch("/api/form-data", {method: 'POST', credentials: 'same-origin'})
            .then(res => {
                if (res.status === 200) {
                    return res.json()
                } else {
                    return null
                }
            })
            .then((formdata) => {
                if (formdata === null) {
                    window.location.href = "/my-mlh-login"
                }

                window.formdata = formdata;

                if (typeof window.formdata.application_status === 'undefined')
                    window.location = "/application.html";

                let status = statusData[formdata.application_status];
                $("state").textContent = status.title;
                $("description").textContent = status.description;
                $("status-card").classList.add(status.class);

                let messageButtonWrapper = $("status-button-wrapper")
                messageButtonWrapper.textContent = ""
                status.buttons.forEach(buttonData => {
                    // <button class="button is-success ml-5 mb-4" id="message-button"></button>
                    let button = document.createElement("button");
                    button.classList.add("button", "ml-5", "mb-4")
                    button.classList.add(buttonData.class)
                    button.textContent = buttonData.text
                    button.addEventListener('click', buttonData.callback)
                    messageButtonWrapper.appendChild(button)
                })

                let reimb = reimbData[formdata.reimbursement];
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

                if (window.formdata.cv_file_id || formdata.application_status === "rejected" || formdata.application_status === "declined") {
                    $("cv-card").classList.add("is-hidden")
                } else {
                    $("cv-card").classList.remove("is-hidden")
                }
            });
    } catch (e) {
        console.error(e)
    }
}


function load_team() {
    return fetch("/api/team-info", {method: 'POST', credentials: 'same-origin', cache: 'force-cache'})
    .then(res => res.json()).then((teamdata) => {
            window.teamdata = teamdata;

            //If user isn't in the team, server is gonna return an empry objecet
            if (typeof teamdata.members === 'undefined')
                return;

            let root = $("team_table");
            root.innerHTML = ''; // Clear content of table

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

            $("team_code_label").textContent = teamdata.data.team_code;
            $("team_name_label").textContent = "Team name: " + teamdata.data.team_name;

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

function hideError(elementId) {
    $(elementId).classList.remove("is-danger")
    $(`${elementId}_error`).classList.add("hidden");
}

async function acceptInvitation() {
    try {
        await fetch("/api/accept-invite", {method: 'POST', credentials: 'same-origin'});
        fetch_all_data();
    } catch(e) {
        console.error(e)
    }

}


async function declineInvitation() {
    try {
        await fetch("/api/decline-invite", {method: 'POST', credentials: 'same-origin'});
        fetch_all_data();
    } catch(e) {
        console.error(e)
    }

}

async function upload_cv() {
    try {
        const selectedFile = $("cv_file_id").files[0];
        if (selectedFile) {
            const data = new FormData();
            data.append("cv", selectedFile);
            const res = await fetch("/api/form-file-upload", {method: 'POST', credentials: 'same-origin',
                body: data
            });
            const resData = await res.json();
            return resData.fileId;
        } else {
            return 0;
        }
    }
    catch (err) {
        window.location = "/404.html";
    }
}
