const API_BASE = "https://sweet-dream-f697.rmgifts24.workers.dev";


/* =========================================================
   СОСТОЯНИЕ ПРИЛОЖЕНИЯ
   ========================================================= */

const state = {
    user: null,
    shopItems: [],
    inventory: [],
    messages: [],
    withdrawals: [],
    trades: [],
    adminItems: [],
    selectedWithdrawalId: null,
    selectedItemId: null,
    currentPage: "home"
};


/* =========================================================
   DOM
   ========================================================= */

const termsOverlay = document.getElementById("terms-overlay");
const acceptTermsButton = document.getElementById("accept-terms");

const site = document.getElementById("site");

const loginButton = document.getElementById("login-button");
const registerButton = document.getElementById("register-button");
const logoutButton = document.getElementById("logout-button");

const homeLoginButton = document.getElementById("home-login-button");
const homeRegisterButton = document.getElementById("home-register-button");

const redstoneCoinsElement =
    document.getElementById("redstone-coins");

const adminNavButton =
    document.getElementById("admin-nav-button");


/* =========================================================
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
   ========================================================= */

function apiUrl(path) {
    return API_BASE + path;
}


function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function showError(message) {
    alert(message || "Произошла ошибка.");
}


function showSuccess(message) {
    alert(message || "Готово.");
}


async function readResponse(response) {
    const text = await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        return {
            error: text
        };
    }
}


/* =========================================================
   API
   ========================================================= */

async function apiRequest(path, options = {}) {

    if (!API_BASE || API_BASE === "ВСТАВЬ_СЮДА_URL_WORKER") {
        throw new Error(
            "Не указан URL Cloudflare Worker в script.js."
        );
    }

    const requestOptions = {
        credentials: "include",
        ...options
    };

    requestOptions.headers = {
        ...(options.headers || {})
    };

    if (
        requestOptions.body &&
        typeof requestOptions.body !== "string"
    ) {
        requestOptions.headers["Content-Type"] =
            "application/json";

        requestOptions.body =
            JSON.stringify(requestOptions.body);
    }

    const response = await fetch(
        apiUrl(path),
        requestOptions
    );

    const data = await readResponse(response);

    if (!response.ok) {

        const errorMessage =
            data.error ||
            data.message ||
            `Ошибка сервера: ${response.status}`;

        throw new Error(errorMessage);
    }

    return data;
}


/* =========================================================
   ОКНО УСЛОВИЙ
   ========================================================= */

function lockSite() {

    if (!site) {
        return;
    }

    site.setAttribute("inert", "");
}


function unlockSite() {

    if (!site) {
        return;
    }

    site.removeAttribute("inert");

    if (termsOverlay) {
        termsOverlay.hidden = true;
    }
}


if (termsOverlay) {
    termsOverlay.hidden = false;
}

lockSite();


if (acceptTermsButton) {

    acceptTermsButton.addEventListener(
        "click",
        function () {
            unlockSite();
        }
    );

}


/* =========================================================
   НАВИГАЦИЯ
   ========================================================= */

function showPage(pageName) {

    const pages =
        document.querySelectorAll("[data-page-section]");

    pages.forEach(page => {

        page.hidden =
            page.dataset.pageSection !== pageName;

    });

    state.currentPage = pageName;

    if (pageName === "shop") {
        loadShop();
    }

    if (pageName === "inventory") {
        loadInventory();
    }

    if (pageName === "messages") {
        loadMessages();
    }

    if (pageName === "withdrawals") {
        loadWithdrawals();
    }

    if (pageName === "trades") {
        loadTrades();
    }

    if (
        pageName === "admin" &&
        state.user &&
        state.user.isAdmin
    ) {
        loadAdminData();
    }
}


document.addEventListener("click", event => {

    const navigationButton =
        event.target.closest("[data-page]");

    if (!navigationButton) {
        return;
    }

    event.preventDefault();

    const page =
        navigationButton.dataset.page;

    if (
        page !== "home" &&
        !state.user
    ) {
        openLoginModal();
        return;
    }

    if (
        page === "admin" &&
        (!state.user || !state.user.isAdmin)
    ) {
        showError("Доступ запрещён.");
        return;
    }

    showPage(page);
});


/* =========================================================
   МОДАЛЬНЫЕ ОКНА
   ========================================================= */

function openModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.hidden = false;
}


function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.hidden = true;
}


function openLoginModal() {
    openModal("login-modal");
}


function openRegisterModal() {
    openModal("register-modal");
}


document.addEventListener("click", event => {

    const closeButton =
        event.target.closest("[data-close-modal]");

    if (!closeButton) {
        return;
    }

    closeModal(
        closeButton.dataset.closeModal
    );
});


/* =========================================================
   КНОПКИ ВХОДА / РЕГИСТРАЦИИ
   ========================================================= */

if (loginButton) {
    loginButton.addEventListener(
        "click",
        openLoginModal
    );
}


if (registerButton) {
    registerButton.addEventListener(
        "click",
        openRegisterModal
    );
}


if (homeLoginButton) {
    homeLoginButton.addEventListener(
        "click",
        openLoginModal
    );
}


if (homeRegisterButton) {
    homeRegisterButton.addEventListener(
        "click",
        openRegisterModal
    );
}


/* =========================================================
   РЕГИСТРАЦИЯ
   ========================================================= */

const registerForm =
    document.getElementById("register-form");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const nick =
                document
                    .getElementById("register-nick")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("register-password")
                    .value;

            const passwordConfirm =
                document
                    .getElementById(
                        "register-password-confirm"
                    )
                    .value;

            if (password !== passwordConfirm) {
                showError("Пароли не совпадают.");
                return;
            }

            if (!nick || !password) {
                showError(
                    "Заполни Minecraft ник и пароль."
                );
                return;
            }

            try {

                await apiRequest(
                    "/api/register",
                    {
                        method: "POST",
                        body: {
                            minecraft_nick: nick,
                            password
                        }
                    }
                );

                closeModal("register-modal");

                await loadCurrentUser();

                showSuccess(
                    "Аккаунт успешно создан."
                );

            } catch (error) {

                showError(error.message);

            }

        }
    );

}


/* =========================================================
   ВХОД
   ========================================================= */

const loginForm =
    document.getElementById("login-form");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const nick =
                document
                    .getElementById("login-nick")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("login-password")
                    .value;

            if (!nick || !password) {
                showError(
                    "Заполни Minecraft ник и пароль."
                );
                return;
            }

            try {

                await apiRequest(
                    "/api/login",
                    {
                        method: "POST",
                        body: {
                            minecraft_nick: nick,
                            password
                        }
                    }
                );

                closeModal("login-modal");

                await loadCurrentUser();

                showSuccess("Вы успешно вошли.");

            } catch (error) {

                showError(error.message);

            }

        }
    );

}


/* =========================================================
   ВЫХОД
   ========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await apiRequest(
                    "/api/logout",
                    {
                        method: "POST"
                    }
                );

            } catch {
                /*
                 * Даже если сервер не ответил,
                 * локальное состояние всё равно очищаем.
                 */
            }

            state.user = null;
            state.inventory = [];
            state.messages = [];
            state.withdrawals = [];
            state.trades = [];

            updateUserInterface();

            showPage("home");

        }
    );

}


/* =========================================================
   ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ
   ========================================================= */

async function loadCurrentUser() {

    try {

        const data =
            await apiRequest("/api/me");

        state.user =
            data.user || null;

        updateUserInterface();

        if (state.user) {

            await loadShop();
            await loadInventory();
            await loadMessages();
            await loadWithdrawals();

        }

    } catch (error) {

        state.user = null;

        updateUserInterface();

        console.error(
            "Не удалось получить пользователя:",
            error
        );

    }
}


/* =========================================================
   ИНТЕРФЕЙС АККАУНТА
   ========================================================= */

function updateUserInterface() {

    const loggedIn =
        Boolean(state.user);

    if (loginButton) {
        loginButton.hidden = loggedIn;
    }

    if (registerButton) {
        registerButton.hidden = loggedIn;
    }

    if (logoutButton) {
        logoutButton.hidden = !loggedIn;
    }

    if (redstoneCoinsElement) {

        redstoneCoinsElement.textContent =
            loggedIn
                ? String(
                    state.user.redstone_coins ?? 0
                )
                : "0";

    }

    if (adminNavButton) {

        adminNavButton.hidden =
            !loggedIn ||
            !state.user.isAdmin;

    }

    const homeActions =
        document.getElementById(
            "home-account-actions"
        );

    if (homeActions) {
        homeActions.hidden = loggedIn;
    }
}


/* =========================================================
   МАГАЗИН
   ========================================================= */

async function loadShop() {

    try {

        const data =
            await apiRequest("/api/shop");

        state.shopItems =
            Array.isArray(data.items)
                ? data.items
                : [];

        renderShop();

    } catch (error) {

        console.error(
            "Ошибка загрузки магазина:",
            error
        );

    }
}


function renderShop() {

    const container =
        document.getElementById(
            "shop-items"
        );

    const empty =
        document.getElementById(
            "shop-empty"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (state.shopItems.length === 0) {

        if (empty) {
            empty.hidden = false;
        }

        return;
    }

    if (empty) {
        empty.hidden = true;
    }

    state.shopItems.forEach(item => {

        const element =
            document.createElement("div");

        element.className = "shop-item";

        element.innerHTML = `
            <div class="item-icon">
                ${
                    item.icon
                        ? `<img
                            src="${escapeHTML(item.icon)}"
                            alt=""
                           >`
                        : ""
                }
            </div>

            <h3>
                ${escapeHTML(item.name)}
            </h3>

            <p>
                ${escapeHTML(item.price)} RC
            </p>

            <button
                type="button"
                data-buy-item="${escapeHTML(item.id)}"
            >
                Купить
            </button>
        `;

        container.appendChild(element);

    });
}


document.addEventListener("click", async event => {

    const buyButton =
        event.target.closest(
            "[data-buy-item]"
        );

    if (!buyButton) {
        return;
    }

    if (!state.user) {
        openLoginModal();
        return;
    }

    const itemId =
        buyButton.dataset.buyItem;

    try {

        await apiRequest(
            "/api/buy",
            {
                method: "POST",
                body: {
                    item_id: itemId
                }
            }
        );

        await loadCurrentUser();

        showSuccess(
            "Предмет успешно куплен."
        );

    } catch (error) {

        showError(error.message);

    }

});


/* =========================================================
   ИНВЕНТАРЬ
   ========================================================= */

async function loadInventory() {

    if (!state.user) {
        return;
    }

    try {

        const data =
            await apiRequest(
                "/api/inventory"
            );

        state.inventory =
            Array.isArray(data.items)
                ? data.items
                : [];

        renderInventory();

    } catch (error) {

        console.error(
            "Ошибка загрузки инвентаря:",
            error
        );

    }
}


function renderInventory() {

    const container =
        document.getElementById(
            "inventory-items"
        );

    const empty =
        document.getElementById(
            "inventory-empty"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (state.inventory.length === 0) {

        if (empty) {
            empty.hidden = false;
        }

        return;
    }

    if (empty) {
        empty.hidden = true;
    }

    state.inventory.forEach(item => {

        const element =
            document.createElement("div");

        element.className = "inventory-item";

        element.innerHTML = `
            <div class="item-icon">
                ${
                    item.icon
                        ? `<img
                            src="${escapeHTML(item.icon)}"
                            alt=""
                           >`
                        : ""
                }
            </div>

            <h3>
                ${escapeHTML(item.name)}
            </h3>

            <button
                type="button"
                data-withdraw-item="${escapeHTML(item.id)}"
            >
                Вывести
            </button>

            <button
                type="button"
                data-trade-item="${escapeHTML(item.id)}"
            >
                Затрейдить
            </button>
        `;

        container.appendChild(element);

    });
}


/* =========================================================
   ВЫВОД ПРЕДМЕТА
   ========================================================= */

document.addEventListener("click", event => {

    const button =
        event.target.closest(
            "[data-withdraw-item]"
        );

    if (!button) {
        return;
    }

    state.selectedWithdrawalId =
        button.dataset.withdrawItem;

    openModal("withdraw-modal");

});


const confirmWithdrawButton =
    document.getElementById(
        "confirm-withdraw-button"
    );


if (confirmWithdrawButton) {

    confirmWithdrawButton.addEventListener(
        "click",
        async () => {

            if (!state.selectedWithdrawalId) {
                return;
            }

            try {

                await apiRequest(
                    "/api/withdrawals",
                    {
                        method: "POST",
                        body: {
                            inventory_id:
                                state.selectedWithdrawalId
                        }
                    }
                );

                closeModal("withdraw-modal");

                state.selectedWithdrawalId = null;

                await loadInventory();
                await loadWithdrawals();

                showSuccess(
                    "Запрос на вывод создан."
                );

            } catch (error) {

                showError(error.message);

            }

        }
    );

}


/* =========================================================
   ЗАПРОСЫ НА ВЫВОД
   ========================================================= */

async function loadWithdrawals() {

    if (!state.user) {
        return;
    }

    try {

        const data =
            await apiRequest(
                "/api/withdrawals"
            );

        state.withdrawals =
            Array.isArray(data.withdrawals)
                ? data.withdrawals
                : [];

        renderWithdrawals();

    } catch (error) {

        console.error(
            "Ошибка загрузки запросов:",
            error
        );

    }
}


function renderWithdrawals() {

    const container =
        document.getElementById(
            "withdrawals-list"
        );

    const empty =
        document.getElementById(
            "withdrawals-empty"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (state.withdrawals.length === 0) {

        if (empty) {
            empty.hidden = false;
        }

        return;
    }

    if (empty) {
        empty.hidden = true;
    }

    state.withdrawals.forEach(withdrawal => {

        const element =
            document.createElement("div");

        element.className =
            "withdrawal-item";

        element.innerHTML = `
            <h3>
                ${escapeHTML(
                    withdrawal.item_name ||
                    withdrawal.name ||
                    "Предмет"
                )}
            </h3>

            <p>
                Обрабатывается
            </p>
        `;

        container.appendChild(element);

    });
}


/* =========================================================
   СООБЩЕНИЯ
   ========================================================= */

async function loadMessages() {

    if (!state.user) {
        return;
    }

    try {

        const data =
            await apiRequest(
                "/api/messages"
            );

        state.messages =
            Array.isArray(data.messages)
                ? data.messages
                : [];

        renderMessages();

    } catch (error) {

        console.error(
            "Ошибка загрузки сообщений:",
            error
        );

    }
}


function renderMessages() {

    const container =
        document.getElementById(
            "messages-list"
        );

    const empty =
        document.getElementById(
            "messages-empty"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (state.messages.length === 0) {

        if (empty) {
            empty.hidden = false;
        }

        return;
    }

    if (empty) {
        empty.hidden = true;
    }

    state.messages.forEach(message => {

        const element =
            document.createElement("div");

        element.className =
            "message-item";

        element.innerHTML = `
            <h3>
                ${escapeHTML(message.title)}
            </h3>

            <p>
                ${escapeHTML(message.content)}
            </p>
        `;

        container.appendChild(element);

    });
}


/* =========================================================
   ТРЕЙДЫ
   ========================================================= */

async function loadTrades() {

    if (!state.user) {
        return;
    }

    try {

        const data =
            await apiRequest(
                "/api/trades"
            );

        state.trades =
            Array.isArray(data.trades)
                ? data.trades
                : [];

        renderTrades();

    } catch (error) {

        console.error(
            "Ошибка загрузки трейдов:",
            error
        );

    }
}


function renderTrades() {

    const container =
        document.getElementById(
            "incoming-trades-list"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    state.trades.forEach(trade => {

        const element =
            document.createElement("div");

        element.className = "trade-item";

        element.innerHTML = `
            <p>
                ${escapeHTML(
                    trade.message ||
                    "Входящий запрос на трейд"
                )}
            </p>

            <button
                type="button"
                data-accept-trade="${escapeHTML(trade.id)}"
            >
                Принять
            </button>

            <button
                type="button"
                data-decline-trade="${escapeHTML(trade.id)}"
            >
                Отклонить
            </button>
        `;

        container.appendChild(element);

    });
}


/* =========================================================
   ЗАГРУЗКА ПРЕДМЕТОВ ДРУГОГО ИГРОКА
   ========================================================= */

const loadTradePlayerButton =
    document.getElementById(
        "load-trade-player"
    );


if (loadTradePlayerButton) {

    loadTradePlayerButton.addEventListener(
        "click",
        async () => {

            const nick =
                document
                    .getElementById(
                        "trade-target"
                    )
                    .value
                    .trim();

            if (!nick) {
                showError(
                    "Введите Minecraft ник."
                );
                return;
            }

            try {

                const data =
                    await apiRequest(
                        "/api/inventory/player",
                        {
                            method: "POST",
                            body: {
                                minecraft_nick: nick
                            }
                        }
                    );

                renderOtherTradeItems(
                    data.items || []
                );

            } catch (error) {

                showError(error.message);

            }

        }
    );

}


function renderOtherTradeItems(items) {

    const container =
        document.getElementById(
            "trade-other-items"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    items.forEach(item => {

        const element =
            document.createElement("label");

        element.className =
            "trade-select-item";

        element.innerHTML = `
            <input
                type="checkbox"
                name="other-trade-item"
                value="${escapeHTML(item.id)}"
            >

            <span>
                ${escapeHTML(item.name)}
            </span>
        `;

        container.appendChild(element);

    });
}


function renderMyTradeItems() {

    const container =
        document.getElementById(
            "trade-my-items"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    state.inventory.forEach(item => {

        const element =
            document.createElement("label");

        element.className =
            "trade-select-item";

        element.innerHTML = `
            <input
                type="checkbox"
                name="my-trade-item"
                value="${escapeHTML(item.id)}"
            >

            <span>
                ${escapeHTML(item.name)}
            </span>
        `;

        container.appendChild(element);

    });
}


async function createTrade() {

    const target =
        document
            .getElementById("trade-target")
            .value
            .trim();

    const myItems =
        Array.from(
            document.querySelectorAll(
                'input[name="my-trade-item"]:checked'
            )
        ).map(
            input => input.value
        );

    const otherItems =
        Array.from(
            document.querySelectorAll(
                'input[name="other-trade-item"]:checked'
            )
        ).map(
            input => input.value
        );

    if (!target) {
        showError("Введите ник игрока.");
        return;
    }

    if (myItems.length === 0) {
        showError(
            "Выберите хотя бы один свой предмет."
        );
        return;
    }

    if (otherItems.length === 0) {
        showError(
            "Выберите хотя бы один предмет другого игрока."
        );
        return;
    }

    try {

        await apiRequest(
            "/api/trades",
            {
                method: "POST",
                body: {
                    receiver_nick: target,
                    sender_items: myItems,
                    receiver_items: otherItems
                }
            }
        );

        showSuccess(
            "Запрос на трейд отправлен."
        );

        await loadTrades();

    } catch (error) {

        showError(error.message);

    }
}


const createTradeButton =
    document.getElementById(
        "create-trade-button"
    );


if (createTradeButton) {

    createTradeButton.addEventListener(
        "click",
        createTrade
    );

}


document.addEventListener("click", async event => {

    const accept =
        event.target.closest(
            "[data-accept-trade]"
        );

    const decline =
        event.target.closest(
            "[data-decline-trade]"
        );

    if (accept) {

        try {

            await apiRequest(
                "/api/trades/accept",
                {
                    method: "POST",
                    body: {
                        trade_id:
                            accept.dataset.acceptTrade
                    }
                }
            );

            await loadTrades();
            await loadInventory();

            showSuccess(
                "Трейд принят."
            );

        } catch (error) {

            showError(error.message);

        }

        return;
    }

    if (decline) {

        try {

            await apiRequest(
                "/api/trades/decline",
                {
                    method: "POST",
                    body: {
                        trade_id:
                            decline.dataset.declineTrade
                    }
                }
            );

            await loadTrades();

            showSuccess(
                "Трейд отклонён."
            );

        } catch (error) {

            showError(error.message);

        }

    }

});


/* =========================================================
   АДМИН-ПАНЕЛЬ
   ========================================================= */

async function loadAdminData() {

    if (
        !state.user ||
        !state.user.isAdmin
    ) {
        return;
    }

    try {

        const [
            users,
            items,
            withdrawals
        ] = await Promise.all([

            apiRequest(
                "/api/admin/users"
            ),

            apiRequest(
                "/api/admin/items"
            ),

            apiRequest(
                "/api/admin/withdrawals"
            )

        ]);

        state.adminItems =
            Array.isArray(items.items)
                ? items.items
                : [];

        renderAdminItems();
        renderAdminWithdrawals();

        populateAdminItemSelect();

    } catch (error) {

        console.error(
            "Ошибка загрузки админ-панели:",
            error
        );

    }
}


/* =========================================================
   АДМИН - ПОЛЬЗОВАТЕЛИ
   ========================================================= */

const adminBanButton =
    document.getElementById(
        "admin-ban-button"
    );


if (adminBanButton) {

    adminBanButton.addEventListener(
        "click",
        async () => {

            const nick =
                document
                    .getElementById(
                        "admin-user-nick"
                    )
                    .value
                    .trim();

            if (!nick) {
                showError(
                    "Введите Minecraft ник."
                );
                return;
            }

            try {

                await apiRequest(
                    "/api/admin/users/ban",
                    {
                        method: "POST",
                        body: {
                            minecraft_nick: nick
                        }
                    }
                );

                showSuccess(
                    "Пользователь заблокирован."
                );

            } catch (error) {

                showError(error.message);

            }

        }
    );

}


const adminUnbanButton =
    document.getElementById(
        "admin-unban-button"
    );


if (adminUnbanButton) {

    adminUnbanButton.addEventListener(
        "click",
        async () => {

            const nick =
                document
                    .getElementById(
                        "admin-user-nick"
                    )
                    .value
                    .trim();

            if (!nick) {
                showError(
                    "Введите Minecraft ник."
                );
                return;
            }

            try {

                await apiRequest(
                    "/api/admin/users/unban",
                    {
                        method: "POST",
                        body: {
                            minecraft_nick: nick
                        }
                    }
                );

                showSuccess(
                    "Пользователь разблокирован."
                );

            } catch (error) {

                showError(error.message);

            }

        }
    );

}


/* =========================================================
   АДМИН - REDSTONECOIN
   ========================================================= */

const adminGiveCoinsButton =
    document.getElementById(
        "admin-give-coins-button"
    );


if (adminGiveCoinsButton) {

    adminGiveCoinsButton.addEventListener(
        "click",
        async () => {

            const nick =
                document
                    .getElementById(
                        "admin-coins-nick"
                    )
                    .value
                    .trim();

            const amount =
                Number(
                    document
                        .getElementById(
                            "admin-coins-amount"
                        )
                        .value
                );

            const reason =
                document
                    .getElementById(
                        "admin-coins-reason"
                    )
                    .value
                    .trim();

            if (!nick || !amount) {
                showError(
                    "Заполни ник и количество."
                );
                return;
            }

            try {

                await apiRequest(
                    "/api/admin/give-coins",
                    {
                        method: "POST",
                        body: {
                            minecraft_nick: nick,
                            amount,
                            reason
                        }
                    }
                );

                showSuccess(
                    "RedstoneCoin выданы."
                );

            } catch (error) {

                showError(error.message);

            }

        }
    );

}


/* =========================================================
   АДМИН - ВЫДАЧА ПРЕДМЕТА
   ========================================================= */

const adminGiveItemButton =
    document.getElementById(
        "admin-give-item-button"
    );


if (adminGiveItemButton) {

    adminGiveItemButton.addEventListener(
        "click",
        async () => {

            const nick =
                document
                    .getElementById(
                        "admin-item-nick"
                    )
                    .value
                    .trim();

            const itemId =
                document
                    .getElementById(
                        "admin-item-select"
                    )
                    .value;

            const reason =
                document
                    .getElementById(
                        "admin-item-reason"
                    )
                    .value
                    .trim();

            if (!nick || !itemId) {
                showError(
                    "Заполни ник и выбери предмет."
                );
                return;
            }

            try {

                await apiRequest(
                    "/api/admin/give-item",
                    {
                        method: "POST",
                        body: {
                            minecraft_nick: nick,
                            item_id: itemId,
                            reason
                        }
                    }
                );

                showSuccess(
                    "Предмет выдан."
                );

            } catch (error) {

                showError(error.message);

            }

        }
    );

}


/* =========================================================
   АДМИН - ПРЕДМЕТЫ
   ========================================================= */

function renderAdminItems() {

    const container =
        document.getElementById(
            "admin-items-list"
        );

    const removedContainer =
        document.getElementById(
            "admin-removed-items-list"
        );

    if (!container || !removedContainer) {
        return;
    }

    container.innerHTML = "";
    removedContainer.innerHTML = "";

    state.adminItems.forEach(item => {

        const element =
            document.createElement("div");

        element.className =
            "admin-item";

        element.innerHTML = `
            <strong>
                ${escapeHTML(item.name)}
            </strong>

            <span>
                ${escapeHTML(item.price)} RC
            </span>

            <button
                type="button"
                data-admin-item="${escapeHTML(item.id)}"
            >
                Выбрать
            </button>
        `;

        if (item.on_sale) {
            container.appendChild(element);
        } else {
            removedContainer.appendChild(element);
        }

    });
}


function populateAdminItemSelect() {

    const select =
        document.getElementById(
            "admin-item-select"
        );

    if (!select) {
        return;
    }

    select.innerHTML = "";

    state.adminItems.forEach(item => {

        const option =
            document.createElement("option");

        option.value = item.id;
        option.textContent = item.name;

        select.appendChild(option);

    });
}


document.addEventListener("click", event => {

    const button =
        event.target.closest(
            "[data-admin-item]"
        );

    if (!button) {
        return;
    }

    state.selectedItemId =
        button.dataset.adminItem;

    showSuccess(
        "Предмет выбран."
    );

});


const adminRemoveItemButton =
    document.getElementById(
        "admin-remove-item-button"
    );


if (adminRemoveItemButton) {

    adminRemoveItemButton.addEventListener(
        "click",
        async () => {

            if (!state.selectedItemId) {
                showError(
                    "Сначала выберите предмет."
                );
                return;
            }

            try {

                await apiRequest(
                    "/api/admin/items/sale",
                    {
                        method: "POST",
                        body: {
                            item_id:
                                state.selectedItemId,
                            onSale: false
                        }
                    }
                );

                await loadAdminData();

                showSuccess(
                    "Предмет снят с продажи."
                );

            } catch (error) {

                showError(error.message);

            }

        }
    );

}


const adminRestoreItemButton =
    document.getElementById(
        "admin-restore-item-button"
    );


if (adminRestoreItemButton) {

    adminRestoreItemButton.addEventListener(
        "click",
        async () => {

            if (!state.selectedItemId) {
                showError(
                    "Сначала выберите предмет."
                );
                return;
            }

            try {

                await apiRequest(
                    "/api/admin/items/sale",
                    {
                        method: "POST",
                        body: {
                            item_id:
                                state.selectedItemId,
                            onSale: true
                        }
                    }
                );

                await loadAdminData();

                showSuccess(
                    "Предмет возвращён в продажу."
                );

            } catch (error) {

                showError(error.message);

            }

        }
    );

}


/* =========================================================
   АДМИН - ЗАПРОСЫ НА ВЫВОД
   ========================================================= */

function renderAdminWithdrawals() {

    const container =
        document.getElementById(
            "admin-withdrawals-list"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const withdrawals =
        state.adminWithdrawals || [];

    if (withdrawals.length === 0) {

        container.innerHTML =
            "<p>Нет активных запросов.</p>";

        return;
    }

    withdrawals.forEach(withdrawal => {

        const element =
            document.createElement("div");

        element.className =
            "admin-withdrawal";

        element.innerHTML = `
            <h3>
                ${escapeHTML(
                    withdrawal.item_name ||
                    "Предмет"
                )}
            </h3>

            <p>
                Игрок:
                ${escapeHTML(
                    withdrawal.minecraft_nick ||
                    ""
                )}
            </p>

            <button
                type="button"
                data-approve-withdrawal="${escapeHTML(withdrawal.id)}"
            >
                Одобрить
            </button>

            <button
                type="button"
                data-reject-withdrawal="${escapeHTML(withdrawal.id)}"
            >
                Отклонить
            </button>
        `;

        container.appendChild(element);

    });
}


document.addEventListener("click", async event => {

    const approve =
        event.target.closest(
            "[data-approve-withdrawal]"
        );

    const reject =
        event.target.closest(
            "[data-reject-withdrawal]"
        );

    if (approve) {

        const code =
            prompt(
                "Введите код активации:"
            );

        if (code === null) {
            return;
        }

        if (!code.trim()) {
            showError(
                "Код не может быть пустым."
            );
            return;
        }

        try {

            await apiRequest(
                "/api/admin/withdrawals/approve",
                {
                    method: "POST",
                    body: {
                        withdrawal_id:
                            approve.dataset
                                .approveWithdrawal,
                        code: code.trim()
                    }
                }
            );

            await loadAdminData();

            showSuccess(
                "Запрос одобрен."
            );

        } catch (error) {

            showError(error.message);

        }

        return;
    }

    if (reject) {

        try {

            await apiRequest(
                "/api/admin/withdrawals/reject",
                {
                    method: "POST",
                    body: {
                        withdrawal_id:
                            reject.dataset
                                .rejectWithdrawal
                    }
                }
            );

            await loadAdminData();

            showSuccess(
                "Запрос отклонён."
            );

        } catch (error) {

            showError(error.message);

        }

    }

});


/* =========================================================
   АДМИН - ДОБАВЛЕНИЕ ПРЕДМЕТА
   ========================================================= */

const adminAddItemButton =
    document.getElementById(
        "admin-add-item-button"
    );


if (adminAddItemButton) {

    adminAddItemButton.addEventListener(
        "click",
        async () => {

            const name =
                prompt("Название предмета:");

            if (name === null) {
                return;
            }

            const icon =
                prompt(
                    "URL иконки предмета:"
                );

            if (icon === null) {
                return;
            }

            const minecraftId =
                prompt(
                    "Minecraft ID предмета:"
                );

            if (minecraftId === null) {
                return;
            }

            const price =
                Number(
                    prompt(
                        "Цена в RedstoneCoin:"
                    )
                );

            if (!Number.isSafeInteger(price) || price <= 0) {
                showError(
                    "Некорректная цена."
                );
                return;
            }

            try {

                await apiRequest(
                    "/api/admin/items",
                    {
                        method: "POST",
                        body: {
                            name: name.trim(),
                            icon: icon.trim(),
                            minecraft_id:
                                minecraftId.trim(),
                            price
                        }
                    }
                );

                await loadAdminData();

                showSuccess(
                    "Предмет добавлен."
                );

            } catch (error) {

                showError(error.message);

            }

        }
    );

}


/* =========================================================
   АДМИН - ИЗМЕНЕНИЕ ПРЕДМЕТА
   ========================================================= */

const adminEditItemButton =
    document.getElementById(
        "admin-edit-item-button"
    );


if (adminEditItemButton) {

    adminEditItemButton.addEventListener(
        "click",
        async () => {

            if (!state.selectedItemId) {
                showError(
                    "Сначала выберите предмет."
                );
                return;
            }

            const item =
                state.adminItems.find(
                    current =>
                        current.id ===
                        state.selectedItemId
                );

            if (!item) {
                showError(
                    "Предмет не найден."
                );
                return;
            }

            const name =
                prompt(
                    "Название предмета:",
                    item.name
                );

            if (name === null) {
                return;
            }

            const icon =
                prompt(
                    "URL иконки:",
                    item.icon || ""
                );

            if (icon === null) {
                return;
            }

            const minecraftId =
                prompt(
                    "Minecraft ID:",
                    item.minecraft_id
                );

            if (minecraftId === null) {
                return;
            }

            const price =
                Number(
                    prompt(
                        "Цена:",
                        item.price
                    )
                );

            if (!Number.isSafeInteger(price) || price <= 0) {
                showError(
                    "Некорректная цена."
                );
                return;
            }

            try {

                await apiRequest(
                    "/api/admin/items",
                    {
                        method: "PUT",
                        body: {
                            id:
                                state.selectedItemId,
                            name: name.trim(),
                            icon: icon.trim(),
                            minecraft_id:
                                minecraftId.trim(),
                            price
                        }
                    }
                );

                await loadAdminData();

                showSuccess(
                    "Предмет изменён."
                );

            } catch (error) {

                showError(error.message);

            }

        }
    );

}


/* =========================================================
   АДМИНСКИЕ ЗАПРОСЫ
   ========================================================= */

async function loadAdminWithdrawals() {

    const data =
        await apiRequest(
            "/api/admin/withdrawals"
        );

    state.adminWithdrawals =
        Array.isArray(data.withdrawals)
            ? data.withdrawals
            : [];

    renderAdminWithdrawals();
}


/* =========================================================
   ПЕРВИЧНАЯ ЗАГРУЗКА
   ========================================================= */

async function initialize() {

    showPage("home");

    await loadCurrentUser();

    if (
        state.user &&
        state.user.isAdmin
    ) {
        await loadAdminWithdrawals();
    }

    renderMyTradeItems();
}


/* =========================================================
   ЗАПУСК
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);
