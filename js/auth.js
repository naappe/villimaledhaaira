const ADMIN_EMAIL = String(window.ADMIN_EMAIL || 'naappe@gmail.com').trim().toLowerCase();
const IS_TEST_MODE = window.APP_ALLOW_TEST_MODE === true && window.TEST_MODE_NO_LOGIN === true;

function getAuthClient() {
    return createSupabaseClient();
}

async function getActiveUser() {
    const client = getAuthClient();
    if (!client) return null;

    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
}

function isAdminUser(user) {
    return String(user?.email || '').trim().toLowerCase() === ADMIN_EMAIL;
}

async function getActiveRole() {
    if (IS_TEST_MODE) {
        return {
            user: null,
            role: 'admin',
            party: null,
            canEdit: true,
            canExport: true
        };
    }

    const user = await getActiveUser();
    if (!user || !isAdminUser(user)) return null;

    return {
        user,
        role: 'admin',
        party: null,
        canEdit: true,
        canExport: true
    };
}

function roleHomePath(roleInfo) {
    return roleInfo ? 'all-voters.html' : 'login.html';
}

function rootPrefix() {
    const path = window.location.pathname;
    return path.includes('/pages/') || path.includes('/new-list/') ? '../' : '';
}

function resolveAppPath(path) {
    if (path.startsWith('http') || path.startsWith('../')) return path;
    return rootPrefix() + path;
}

async function redirectByRole() {
    const roleInfo = await getActiveRole();
    window.location.href = resolveAppPath(roleHomePath(roleInfo));
}

async function requireAccess(options = {}) {
    const roleInfo = await getActiveRole();
    const loginPath = options.loginPath || 'login.html';

    if (!roleInfo) {
        window.location.href = resolveAppPath(loginPath);
        return null;
    }

    return roleInfo;
}

async function signOut() {
    const client = getAuthClient();
    if (client) await client.auth.signOut();
    localStorage.removeItem('villimaleRememberAdminEmail');
    window.location.href = resolveAppPath('login.html');
}

window.getActiveUser = getActiveUser;
window.getActiveRole = getActiveRole;
window.requireAccess = requireAccess;
window.redirectByRole = redirectByRole;
window.signOut = signOut;
