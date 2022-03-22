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
    $("btn_register").addEventListener('click', () => { register() });
}


async function login() {

    const username = $("username").value;
    const password = $("password").value;

    if (username.length === 0) {
        $("login_error").textContent = "Username can't be empty!";
        return $("login_error").classList.remove("hidden");
    }

    if (password.length < 8) {
        $("login_error").textContent = "Password must be at least 8 characters long!";
        return $("login_error").classList.remove("hidden");
    }

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
        if (result.status === "error") {
            $("login_error").textContent = "Incorrect username/password!";
            return $("login_error").classList.remove("hidden");
        }

        window.location = "/judge/dashboard.html";
    });
}

async function register() {

    const username = $("username").value;
    const password = $("password").value;

    if (username.length === 0) {
        $("register_error").textContent = "Username can't be empty!";
        return $("register_error").classList.remove("hidden");
    }

    if (password.length < 8) {
        $("register_error").textContent = "Password must be at least 8 characters long!";
        return $("register_error").classList.remove("hidden");
    }

    if ($("password_repeat").value !== password) {
        $("register_error").textContent = "Passwords do not match!";
        return $("register_error").classList.remove("hidden");
    }

    fetch("/api/auth-register", {
        method: 'POST', credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            user: username,
            password: password
        })
    }).then(res => res.json()).then((result) => {
        if (result.status === "error") {

            if (result.error.code === 409) {
                $("register_error").textContent = "Username already in use!";
                return $("register_error").classList.remove("hidden");
            }

            $("register_error").textContent = "Registration error. Please, try again.";
            return $("register_error").classList.remove("hidden");
        }

        window.location = "/judge/dashboard.html";
    });
}