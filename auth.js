(function () {
    const USERS_KEY = "computerTimeUsers";
    const SESSION_KEY = "computerTimeSession";
    const LOGIN_PROMPT_INTERVAL_MS = 60000;
    const LOGIN_PAGE = "login.html";
    const SIGNUP_PAGE = "sign up.html";

    function readJson(key, fallbackValue) {
        try {
            const storedValue = window.localStorage.getItem(key);

            if (!storedValue) {
                return fallbackValue;
            }

            const parsedValue = JSON.parse(storedValue);
            return parsedValue ?? fallbackValue;
        } catch (error) {
            return fallbackValue;
        }
    }

    function writeJson(key, value) {
        window.localStorage.setItem(key, JSON.stringify(value));
    }

    function normalizeEmail(email) {
        return String(email || "").trim().toLowerCase();
    }

    function getUsers() {
        const users = readJson(USERS_KEY, []);
        return Array.isArray(users) ? users : [];
    }

    function saveUsers(users) {
        writeJson(USERS_KEY, users);
    }

    function getSession() {
        const session = readJson(SESSION_KEY, null);
        return session && typeof session === "object" ? session : null;
    }

    function setSession(user) {
        writeJson(SESSION_KEY, {
            email: normalizeEmail(user.email),
            username: user.username,
            loggedInAt: new Date().toISOString()
        });
    }

    function clearSession() {
        window.localStorage.removeItem(SESSION_KEY);
    }

    function findUserByEmail(email) {
        const normalizedEmail = normalizeEmail(email);
        return getUsers().find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
    }

    function getCurrentUser() {
        const session = getSession();

        if (!session || !session.email) {
            return null;
        }

        return findUserByEmail(session.email);
    }

    function isLoggedIn() {
        return Boolean(getCurrentUser());
    }

    function hasAccounts() {
        return getUsers().length > 0;
    }

    function signup(details) {
        const username = String(details.username || "").trim();
        const email = normalizeEmail(details.email);
        const password = String(details.password || "");

        if (!username || !email || !password) {
            return {
                ok: false,
                message: "Vul eerst alle velden in."
            };
        }

        if (findUserByEmail(email)) {
            return {
                ok: false,
                message: "Er bestaat al een account met dit e-mailadres."
            };
        }

        const users = getUsers();
        const newUser = {
            username,
            email,
            password,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);
        setSession(newUser);

        return {
            ok: true,
            user: newUser
        };
    }

    function login(email, password) {
        const user = findUserByEmail(email);

        if (!user) {
            return {
                ok: false,
                message: "Geen account gevonden. Maak eerst een account aan."
            };
        }

        if (user.password !== String(password || "")) {
            return {
                ok: false,
                message: "Het wachtwoord klopt niet."
            };
        }

        setSession(user);

        return {
            ok: true,
            user
        };
    }

    function logout() {
        clearSession();
    }

    function getCurrentPageName() {
        const path = window.location.pathname.split("/").pop() || "";
        return decodeURIComponent(path).toLowerCase();
    }

    function isAuthPage() {
        const pageName = getCurrentPageName();
        return pageName === LOGIN_PAGE || pageName === SIGNUP_PAGE;
    }

    function updateMenuLinks() {
        const authLinks = document.querySelectorAll('[href="login.html"]');

        authLinks.forEach((link) => {
            const isMenuLink = link.classList.contains("menu-link");

            if (!isMenuLink) {
                return;
            }

            if (isLoggedIn()) {
                link.textContent = "Logout";
                link.addEventListener("click", (event) => {
                    event.preventDefault();
                    logout();
                    window.location.href = LOGIN_PAGE;
                });
            } else {
                link.textContent = "Login";
            }
        });
    }

    function promptLogin() {
        if (isLoggedIn()) {
            return;
        }

        const shouldRedirect = window.confirm("Wil je inloggen om je account en de chatbot te gebruiken?");

        if (shouldRedirect) {
            window.location.href = LOGIN_PAGE;
        }
    }

    function startLoginReminder() {
        if (isLoggedIn() || isAuthPage()) {
            return;
        }

        window.setInterval(() => {
            promptLogin();
        }, LOGIN_PROMPT_INTERVAL_MS);
    }

    window.ComputerTimeAuth = {
        getUsers,
        getCurrentUser,
        hasAccounts,
        isLoggedIn,
        signup,
        login,
        logout,
        promptLogin,
        startLoginReminder
    };

    document.addEventListener("DOMContentLoaded", () => {
        updateMenuLinks();
        startLoginReminder();
    });
})();
