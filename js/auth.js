(() => {
    const USERS = {
        'naappe@gmail.com': { role: 'admin', party: null, canEdit: true, canExport: true, home: 'all-voters.html' },
        'pnc2026@villimaledhaaira.local': { role: 'party', party: 'PNC', canEdit: true, canExport: false, home: 'pages/pnc-tracker.html' }
    };
    const IS_TEST_MODE_VALUE = window.APP_ALLOW_TEST_MODE === true && window.TEST_MODE_NO_LOGIN === true;
    let supabaseClientInstance = null;

    function createSupabaseClient() {
        if (supabaseClientInstance) return supabaseClientInstance;
        if (!window.supabase || !window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url || !window.SUPABASE_CONFIG.publishableKey) {
            console.error('Supabase config or library missing');
            return null;
        }
        supabaseClientInstance = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.publishableKey, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
        });
        return supabaseClientInstance;
    }

    function getAuthClient() { return createSupabaseClient(); }
    function timeout(ms) { return new Promise(resolve => setTimeout(() => resolve({ timedOut: true }), ms)); }
    async function withTimeout(promise, ms = 2500) {
        try { return await Promise.race([promise, timeout(ms)]); }
        catch (error) { return { error }; }
    }
    function clearUnsafeLocalBypass() { localStorage.removeItem('villimaleAdminSession'); }

    async function getActiveUser() {
        clearUnsafeLocalBypass();
        const client = getAuthClient();
        if (!client) return null;
        const sessionResult = await withTimeout(client.auth.getSession(), 1800);
        const sessionUser = sessionResult && sessionResult.data && sessionResult.data.session && sessionResult.data.session.user;
        if (sessionUser) return sessionUser;
        const userResult = await withTimeout(client.auth.getUser(), 2200);
        if (!userResult || userResult.error || userResult.timedOut || !userResult.data || !userResult.data.user) return null;
        return userResult.data.user;
    }

    function getUserRole(user) {
        const email = String(user && user.email || '').trim().toLowerCase();
        const profile = USERS[email];
        if (!profile) return null;
        return { user, role: profile.role, party: profile.party, canEdit: profile.canEdit, canExport: profile.canExport, home: profile.home };
    }

    function roleAllowed(roleInfo, options) {
        if (!roleInfo) return false;
        if (Array.isArray(options.roles) && options.roles.length && !options.roles.includes(roleInfo.role)) return false;
        if (options.party && roleInfo.role !== 'admin' && roleInfo.party !== options.party) return false;
        if (options.adminOnly && roleInfo.role !== 'admin') return false;
        return true;
    }

    async function getActiveRole() {
        if (IS_TEST_MODE_VALUE) return { user: null, role: 'admin', party: null, canEdit: true, canExport: true, home: 'all-voters.html' };
        const user = await getActiveUser();
        return getUserRole(user);
    }

    function rootPrefix() {
        const path = window.location.pathname;
        return path.includes('/pages/') || path.includes('/new-list/') ? '../' : '';
    }

    function resolveAppPath(path) {
        if (path.startsWith('http') || path.startsWith('../')) return path;
        return rootPrefix() + path;
    }

    async function requireAccess(options = {}) {
        const roleInfo = await getActiveRole();
        if (!roleAllowed(roleInfo, options)) {
            window.location.replace(resolveAppPath(options.loginPath || 'login.html'));
            return null;
        }
        return roleInfo;
    }

    async function redirectByRole() {
        const roleInfo = await getActiveRole();
        window.location.replace(resolveAppPath(roleInfo ? roleInfo.home : 'login.html'));
    }

    async function signOut() {
        clearUnsafeLocalBypass();
        const client = getAuthClient();
        if (client) await withTimeout(client.auth.signOut(), 1500);
        window.location.replace(resolveAppPath('index.html'));
    }

    window.createSupabaseClient = createSupabaseClient;
    window.getAuthClient = getAuthClient;
    window.withTimeout = withTimeout;
    window.getActiveUser = getActiveUser;
    window.getActiveRole = getActiveRole;
    window.requireAccess = requireAccess;
    window.redirectByRole = redirectByRole;
    window.signOut = signOut;
})();
