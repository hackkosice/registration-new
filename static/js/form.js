
//Build datalists from these jsons
const suggestions_datasets = ["/data/countries.json",
                              "/data/marketing_types.json"];


window.onload = async function() {

    for (dataset of suggestions_datasets) {


        //Load the dataset
        const dataset_res = await fetch(dataset, {method: 'GET'});
        const suggestions = await dataset_res.json();

        var parent = document.createElement("datalist");
        parent.id = suggestions.name;

        for (item of suggestions.data) {
            
            var option = document.createElement("option");
            option.value = item;
            option.textContent = item;

            parent.appendChild(option);
        }

        document.getElementById("datasets").appendChild(parent);
    }

    const userinfo_res = await fetch("/api/user-info", {method: 'POST', credentials: 'same-origin'});
    const userinfo = await userinfo_res.json();
    window.userinfo = userinfo.data;
    console.log(window.userinfo);
}