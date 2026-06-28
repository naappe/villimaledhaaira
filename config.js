// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: 'https://espezmdpkoixnfchomqb.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_xP8z74zcMuCkj6xlu1bJ3w_Kudqbcu1',
    
    // App Configuration
    APP: {
        password: 'Nihan@123',
        sessionKey: 'voter_auth_session',
        appName: 'Villimale Dhaaira Canvassing',
        tableName: 'full_import',
        settingsPassword: 'settings123'
    }
};

// Make config globally available
window.CONFIG = CONFIG;

// Also expose individual values for backward compatibility
window.SUPABASE_URL = CONFIG.SUPABASE_URL;
window.SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;
window.APP_CONFIG = CONFIG.APP;

console.log('✅ Config loaded successfully');
console.log('📊 Supabase URL:', CONFIG.SUPABASE_URL);
