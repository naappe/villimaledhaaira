const ROLE_TABLE = 'user_roles';
const IS_TEST_MODE = window.TEST_MODE_NO_LOGIN !== false;

function getAuthClient() {
    return createSupabaseClient();
}

async function getActiveUser() {
    const client = getAuthClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
}

async function getActiveRole() {
    if (IS_TEST_MODE) {
        return {
            user: null,
            role: 'test',
            party: null,
            canEdit: true,
            canExport: false
        };
    }

    const user = await getActiveUser();
    if (!user) return null;

    const client = getAuthClient();
    const { data, error } = await client
        .from(ROLE_TABLE)
        .select('role, party, can_edit, can_export')
        .eq('user_id', user.id)
        .maybeSingle();

    if (error || !data) {
        console.error('Role lookup failed:', error);
        return null;
    }

    return {
        user,
        role: data.role,
        party: data.party,
        canEdit: Boolean(data.can_edit),
        canExport: Boolean(data.can_export)
    };
}

function roleHomePath(roleInfo) {
    if (!roleInfo) return 'login.html';
    if (roleInfo.role === 'admin') return 'all-voters.html';
    if (roleInfo.party === 'MDP') return 'pages/mdp-tracker.html';
    if (roleInfo.party === 'PNC') return 'pages/pnc-tracker.html';
    return 'login.html';
}

function rootPrefix() {
    return window.location.pathname.includes('/pages/') ? '../' : '';
}

function resolveAppPath(path) {
    if (path.startsWith('http') || path.startsWith('../')) return path;
    return rootPrefix() + path;
}

async function redirectByRole() {
    const roleInfo = await getActiveRole();
    window.location.href = roleHomePath(roleInfo);
}

async function requireAccess(options = {}) {
    if (IS_TEST_MODE) {
        const allowedParties = options.parties || [];
        const allowedRoles = options.roles || [];
        return {
            user: null,
            role: allowedRoles.includes('admin') ? 'admin' : 'test',
            party: allowedParties[0] || null,
            canEdit: true,
            canExport: false
        };
    }

    const roleInfo = await getActiveRole();
    const allowedRoles = options.roles || [];
    const allowedParties = options.parties || [];
    const loginPath = options.loginPath || 'login.html';

    if (!roleInfo) {
        window.location.href = resolveAppPath(loginPath);
        return null;
    }

    const roleAllowed = allowedRoles.length === 0 || allowedRoles.includes(roleInfo.role);
    const partyAllowed = allowedParties.length === 0 || allowedParties.includes(roleInfo.party);

    if (!roleAllowed && !partyAllowed) {
        window.location.href = resolveAppPath(options.deniedPath || roleHomePath(roleInfo));
        return null;
    }

    return roleInfo;
}

async function signOut() {
    if (IS_TEST_MODE) {
        window.location.href = resolveAppPath('index.html');
        return;
    }

    const client = getAuthClient();
    await client.auth.signOut();
    window.location.href = resolveAppPath('login.html');
}

window.getActiveUser = getActiveUser;
window.getActiveRole = getActiveRole;
window.requireAccess = requireAccess;
window.redirectByRole = redirectByRole;
window.signOut = signOut;
