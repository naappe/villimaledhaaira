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

  async function getActiveRole() {
    const sb = createSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    const email = String(data?.session?.user?.email || '').toLowerCase();
    const role = Object.values(window.LOGIN_USERS || {}).find(x => x.email.toLowerCase() === email);
    return role ? { ...role, user: data.session.user } : null;
  }

  async function loginWithUsername(username, password) {
    const mapped = resolveUserByUsername(username);
    if (!mapped) return { error: 'Username is not correct.' };
    const sb = createSupabaseClient();
    const { error } = await sb.auth.signInWithPassword({ email: mapped.email, password });
    if (error) return { error: 'Password is not correct.' };
    return { role: mapped };
  }

  async function requireAccess(options = {}) {
    const role = await getActiveRole();
    if (!role) {
      location.replace(options.loginPath || 'login.html');
      return null;
    }
    if (options.adminOnly && role.role !== 'admin') {
      location.replace(role.home || 'index.html');
      return null;
    }
    if (options.party && role.role !== 'admin' && role.party !== options.party) {
      location.replace(role.home || 'index.html');
      return null;
    }
    return role;
  }

  async function signOut() {
    const sb = createSupabaseClient();
    if (sb) await sb.auth.signOut();
    location.replace('index.html');
  }

  window.createSupabaseClient = createSupabaseClient;
  window.getActiveRole = getActiveRole;
  window.loginWithUsername = loginWithUsername;
  window.requireAccess = requireAccess;
  window.signOut = signOut;
})();
