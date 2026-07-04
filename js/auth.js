(() => {
    const ADMIN_EMAIL_VALUE = String(window.ADMIN_EMAIL || 'naappe@gmail.com').trim().toLowerCase();
    const ADMIN_USERNAME_VALUE = String(window.ADMIN_USERNAME || '5654').trim();
    const IS_TEST_MODE_VALUE = window.APP_ALLOW_TEST_MODE === true && window.TEST_MODE_NO_LOGIN === true;
    const SESSION_KEY = 'villimaleAdminSession';
    let supabaseClientInstance = null;

    function createSupabaseClient() {
        if (supabaseClientInstance) return supabaseClientInstance;
        if (!window.supabase || !window.SUPABASE_CONFIG?.url || !window.SUPABASE_CONFIG?.publishableKey) {
            console.error('Supabase config or library missing');
            return null;
        }
        supabaseClientInstance = window.supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.publishableKey,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                    flowType: 'pkce'
                }
            }
        );
        return supabaseClientInstance;
    }

    function getAuthClient() {
        return createSupabaseClient();
    }

    function timeout(ms) {
        return new Promise(resolve => setTimeout(() => resolve({ timedOut: true }), ms));
    }

    async function withTimeout(promise, ms = 2500) {
        try {
            return await Promise.race([promise, timeout(ms)]);
        } catch (error) {
            return { error };
        }
    }

    function readLocalSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw) return null;
            const session = JSON.parse(raw);
            const maxAge = 7 * 24 * 60 * 60 * 1000;
            if (!session?.ok || session.username !== ADMIN_USERNAME_VALUE || Date.now() - Number(session.timestamp || 0) > maxAge) {
                localStorage.removeItem(SESSION_KEY);
                return null;
            }
            return session;
        } catch {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }
    }

    function saveLocalSession() {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ ok: true, username: ADMIN_USERNAME_VALUE, email: ADMIN_EMAIL_VALUE, timestamp: Date.now() }));
    }

    function clearLocalSession() {
        localStorage.removeItem(SESSION_KEY);
    }

    async function getActiveUser() {
        const localSession = readLocalSession();
        if (localSession) return { email: ADMIN_EMAIL_VALUE, appUsername: ADMIN_USERNAME_VALUE, appSession: true };

        const client = getAuthClient();
        if (!client) return null;

        const sessionResult = await withTimeout(client.auth.getSession(), 1200);
        const sessionUser = sessionResult?.data?.session?.user;
        if (sessionUser) return sessionUser;

        const userResult = await withTimeout(client.auth.getUser(), 1800);
        if (userResult?.error || userResult?.timedOut || !userResult?.data?.user) return null;
        return userResult.data.user;
    }

    function isAdminUser(user) {
        return String(user?.email || '').trim().toLowerCase() === ADMIN_EMAIL_VALUE || user?.appUsername === ADMIN_USERNAME_VALUE;
    }

    async function getActiveRole() {
        if (IS_TEST_MODE_VALUE) {
            return { user: null, role: 'admin', party: null, canEdit: true, canExport: true };
        }

        const user = await getActiveUser();
        if (!user || !isAdminUser(user)) return null;

        return { user, role: 'admin', party: null, canEdit: true, canExport: true };
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
        window.location.replace(resolveAppPath(roleHomePath(roleInfo)));
    }

    async function requireAccess(options = {}) {
        const loginPath = options.loginPath || 'login.html';
        const roleInfo = await getActiveRole();

        if (!roleInfo) {
            window.location.replace(resolveAppPath(loginPath));
            return null;
        }

        return roleInfo;
    }

    async function signOut() {
        clearLocalSession();
        const client = getAuthClient();
        if (client) await withTimeout(client.auth.signOut(), 1500);
        localStorage.removeItem('villimaleRememberAdminEmail');
        window.location.replace(resolveAppPath('login.html'));
    }

    function appLogin(username) {
        if (String(username || '').trim() !== ADMIN_USERNAME_VALUE) return false;
        saveLocalSession();
        return true;
    }

    window.createSupabaseClient = createSupabaseClient;
    window.getAuthClient = getAuthClient;
    window.withTimeout = withTimeout;
    window.getActiveUser = getActiveUser;
    window.getActiveRole = getActiveRole;
    window.requireAccess = requireAccess;
    window.redirectByRole = redirectByRole;
    window.signOut = signOut;
    window.appLogin = appLogin;
})();
