const signinBtn = document.querySelector('.signin');

signinBtn.addEventListener('click', async () => {
    document.querySelector('.signin-container').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        document.querySelector('.signin').click();
    }
});
    const identifier = document.querySelector('.signin-container input[placeholder="E-mail address"]').value.trim();
    const password = document.querySelector('.signin-container input[placeholder="Password"]').value.trim();

    if (!identifier || !password) {
        showNotification('message', 'error');
        //    alert('Please fill in all fields');
        return;
    }

    const { data, error } = await db.auth.signInWithPassword({
        email: identifier,
        password: password
    });

    if (error) {
        showNotification('message', 'error');
        //    alert('Sign in failed: ' + error.message);
        return;
    }

    // redirect to feed on success
    window.location.href = 'Index.html';
});

document.querySelector('.signup').addEventListener('click', async () => {
    const username = document.getElementById('signupUn').value.trim().toLowerCase();
    const password = document.getElementById('signupPw').value;
    const password2 = document.getElementById('signupPw2').value;
    const email = document.getElementById('signupEmail').value.trim();
    const tosChecked = document.getElementById('tosCheck').checked;

    // validation
    if (!username || !password || !password2 || !email) {
        showNotification('message', 'error');
        //alert('Please fill in all fields');
        return;
    }

    if (password !== password2) {
        showNotification('message', 'error');
        //alert('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        showNotification('message', 'error');
        //alert('Password must be at least 6 characters');
        return;
    }

    if (!tosChecked) {
        showNotification('message', 'error');
        //alert('Please accept the Terms of Service');
        return;
    }

    // check if username already taken
    const { data: existing } = await db
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

    if (existing) {
        showNotification('message', 'error');
        //alert('Username already taken');
        return;
    }

    // create auth user
    const { data, error } = await db.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                username: username
            }
        }
    });

    if (error) {
        showNotification('message', 'error');
//        alert('Sign up failed: ' + error.message);
        return;
    }

    // no profile insert needed — trigger handles it
    window.location.href = 'Index.html';
});