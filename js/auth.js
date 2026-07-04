(() => {
  let client = null;
  function createSupabaseClient() {
    if (client) return client;
    if (!window.supabase || !window.SUPABASE_CONFIG) return null;
    client = window.supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.publishableKey,
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );
    return client;
  }

  async function getActiveRole() {
    return { role: 'admin', party: null, home: 'all-voters.html', canEdit: true, user: { email: '' } };
  }

  async function loginWithUsername() {
    return { ok: true };
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