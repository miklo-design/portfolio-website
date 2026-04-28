const signinBtn = document.querySelector('.signin');

signinBtn.addEventListener('click', async () => {
    const identifier = document.querySelector('.signin-container input[placeholder="E-mail address"]').value.trim();
    const password = document.querySelector('.signin-container input[placeholder="Password"]').value.trim();

    if (!identifier || !password) {
        alert('Please fill in all fields');
        return;
    }

    const { data, error } = await db.auth.signInWithPassword({
        email: identifier,
        password: password
    });

    if (error) {
        alert('Sign in failed: ' + error.message);
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
        alert('Please fill in all fields');
        return;
    }

    if (password !== password2) {
        alert('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    if (!tosChecked) {
        alert('Please accept the Terms of Service');
        return;
    }

    // check if username already taken
    const { data: existing } = await db
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

    if (existing) {
        alert('Username already taken');
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
        alert('Sign up failed: ' + error.message);
        return;
    }

    // no profile insert needed — trigger handles it
    window.location.href = 'Index.html';
});