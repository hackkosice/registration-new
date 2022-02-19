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
        })
    );

    
    for (const dataset of suggestions_datasets) {

        //Load the dataset
        fetches.push(fetch(dataset, {method: 'GET'}).then( 
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
            })
        );
    }



    //Resolve all promises
    try {
        await Promise.all(fetches);
    } catch (err) {

    }
}