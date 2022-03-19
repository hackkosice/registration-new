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

    $("btn_login").addEventListener('click', () => { login() });
}


async function login() {

    const username = $("username").value;
    const password = $("password").value;

     fetch("/api/auth-login", {
        method: 'POST', credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            user: username,
            password: password
        })
    }).then(res => res.json()).then((result) => {
        if (result.status === "error")
            return $("login_error").classList.remove("hidden");

        window.location = "/judge/dashboard.html";
    });
}