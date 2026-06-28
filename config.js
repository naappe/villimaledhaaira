// ============================================================
// CONFIGURATION - PRODUCTION GRADE
// ============================================================

const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: 'https://espezmdpkoixnfchomqb.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcGV6bWRwa29peG5mY2hvbXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTU3NjAwMH0.fake',
    
    // App Configuration
    APP: {
        tableName: 'full_import',
        pageSize: 1000
    }
};

// Make config globally available
window.CONFIG = CONFIG;
console.log('✅ Config loaded');
