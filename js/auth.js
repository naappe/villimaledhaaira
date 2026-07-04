(() => {
  let client = null;
  function createSupabaseClient() {
    if (client) return client;
    if (!window.supabase || !window.SUPABASE_CONFIG) return null;
    client = window.supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.publishableKey,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
    );
    return client;
  }

  function resolveUserByUsername(username) {
    const u = String(username || '').trim().toLowerCase();
    return Object.values(window.LOGIN_USERS || {}).find(x => x.username.toLowerCase() === u) || null;
  }

  function inferRoleFromPage() {
    const party = String(new URLSearchParams(location.search).get('party') || '').toUpperCase();
    const path = String(location.pathname || '').toLowerCase();
    if (party === 'PNC' || path.includes('pnc-login')) {
      return window.LOGIN_USERS?.pnc ? { ...window.LOGIN_USERS.pnc, user: { email: window.LOGIN_USERS.pnc.email } } : null;
    }
    return window.LOGIN_USERS?.admin ? { ...window.LOGIN_USERS.admin, user: { email: window.LOGIN_USERS.admin.email } } : null;
  }

  async function getActiveRole() {
    const sb = createSupabaseClient();
    if (sb) {
      try {
        const { data } = await sb.auth.getSession();
        const email = String(data?.session?.user?.email || '').toLowerCase();
        const role = Object.values(window.LOGIN_USERS || {}).find(x => x.email.toLowerCase() === email);
        if (role) return { ...role, user: data.session.user };
      } catch (e) {}
    }
    return inferRoleFromPage();
  }

  async function loginWithUsername(username, password) {
    const mapped = resolveUserByUsername(username);
    if (!mapped) return { error: 'Username is not correct.' };
    return { role: mapped, ok: true };
  }

  async function requireAccess() {
    return getActiveRole();
  }

  async function signOut() {
    location.replace('index.html');
  }

  window.createSupabaseClient = createSupabaseClient;
  window.getActiveRole = getActiveRole;
  window.loginWithUsername = loginWithUsername;
  window.requireAccess = requireAccess;
  window.signOut = signOut;
})();