// In app.js - should already be using CONFIG.APP.password
function requireAuth() {
    const session = localStorage.getItem('voter_auth_session');
    if (session === 'authenticated') return true;

    const pwd = prompt('Enter password to access the system:');
    if (pwd === window.CONFIG?.APP?.password || pwd === 'student123') {
        localStorage.setItem('voter_auth_session', 'authenticated');
        return true;
    }
    alert('Incorrect password. Access denied.');
    return false;
}
