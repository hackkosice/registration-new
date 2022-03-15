$ = (element) => { return document.getElementById(element); };
const hash_salt = "4861636B204B6F736963652052756C657A21"; //Hack Kosice Rulez!

window.onload = async () => {

    let queryObject = {};
    if (location.search.startsWith("?")) {
        const query = location.search.substring(1, location.search.length);
        const split = query.split("&");

        for (const parameter of split) {
            const subsplit = parameter.split("=");
            const key = subsplit[0];
            const value = subsplit[1];
            queryObject[key] = value;
        }
    }

    if (typeof queryObject.action === 'undefined')
        window.location = "/404.html";

    if (queryObject.action === "login") $("login").classList.remove("hidden");
    else $("register").classList.remove("hidden");
}


async function register() {
    let keyTestPair = await window.crypto.subtle.generateKey(
        {
            name: "HMAC",
            hash: "SHA-512"
        },
        true,
        ["sign", "verify"]
    );

    console.log(keyTestPair);



    argon2.hash({ pass: $("password").value, salt: hash_salt })
        .then(async (h) => {

            console.log(h.hash);
            let keyPair = await window.crypto.subtle.importKey(

                "raw",
                h.hash,
                {
                    name: "HMAC",
                    hash: "SHA-512"
                },
                true,
                ["sign", "verify"]
            );

            console.log(keyPair);
        })
        .catch(e => console.error(e.message, e.code));




}