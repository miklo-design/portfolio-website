

async function initAuth() {
    const { data: { user }, error } = await db.auth.getUser();

    if (!user) {
        // not logged in, redirect to landing page
        window.location.href = 'landing.html';
        return;
    } 

/*  
    if (error || !user) {
        // only redirect if we're not already on the landing page
        if (!window.location.href.includes('landing')) {
            window.location.href = 'landing.html';
        }
        return;
    } */
    
    // fetch profile to get username
    const { data: profile } = await db
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

    if (profile) {
        document.getElementById('userAccount').textContent = profile.username;
    }
}

initAuth(); 

document.getElementById('logoutBtn').addEventListener('click', async () => {
    const { error } = await db.auth.signOut();
    if (error) {
        console.error('Logout error:', error);
        return;
    }
    window.location.href = 'Index2.html';
});