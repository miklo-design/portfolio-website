// -------------------------
// CLEAR ERRORS ON INPUT
// put one of these for each field that can show an error
// clearFieldError takes the element ID as argument
// -------------------------
['signupUn', 'signupPw', 'signupPw2', 'signupEmail'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => clearHighlight(id));
});
document.querySelector('.signin-container input[placeholder="E-mail address"]')
    .addEventListener('input', () => {
        document.querySelector('.signin-container input[placeholder="E-mail address"]').classList.remove('input-error');
        hideToast();
    });
document.querySelector('.signin-container input[placeholder="Password"]')
    .addEventListener('input', () => {
        document.querySelector('.signin-container input[placeholder="Password"]').classList.remove('input-error');
        hideToast();
    });
// enter key triggers signin
document.querySelector('.signin-container').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.querySelector('.signin').click();
});

// -------------------------
// SIGNIN
// -------------------------

document.querySelector('.signin').addEventListener('click', async () => {
    const identifier = document.querySelector('.signin-container input[placeholder="E-mail address"]').value.trim();
    const password = document.querySelector('.signin-container input[placeholder="Password"]').value.trim();

    if (!identifier || !password) {
        // highlight by class since no ids
        document.querySelector('.signin-container input[placeholder="E-mail address"]').classList.add('input-error');
        document.querySelector('.signin-container input[placeholder="Password"]').classList.add('input-error');
        showToast('All fields must be filled.');
        return;
    }

    const { data, error } = await db.auth.signInWithPassword({
        email: identifier,
        password: password
    });

    if (error) {
        document.querySelector('.signin-container input[placeholder="E-mail address"]').classList.add('input-error');
        document.querySelector('.signin-container input[placeholder="Password"]').classList.add('input-error');
        showToast('Incorrect email or password.');
        return;
    }
    window.location.href = 'Index.html';
});

// -------------------------
// SIGNUP
// -------------------------

document.querySelector('.signup').addEventListener('click', async () => {
    const username = document.getElementById('signupUn').value.trim().toLowerCase();
    const password = document.getElementById('signupPw').value;
    const password2 = document.getElementById('signupPw2').value;
    const email = document.getElementById('signupEmail').value.trim();
    const tosChecked = document.getElementById('tosCheck').checked;

    // showFieldError for errors tied to a specific input field
    // first argument is the element ID, second is the message
    // the error appears directly under that input

    if (!username || !email || !password || !password2) {
        if (!username) highlightField('signupUn');
        if (!email) highlightField('signupEmail');
        if (!password) highlightField('signupPw');
        if (!password2) highlightField('signupPw2');
        showToast('All fields must be filled.');
        return;
    }

    if (password.length < 6) {
        highlightField('signupPw');
        showToast('Password must be at least 6 characters.');
        return;
    }
    
    if (password !== password2) {
        highlightField('signupPw2');
        showToast('Passwords do not match.');
        return;
    }
    if (!tosChecked) {
        highlightField('tosCheck');
        showToast('Please accept the Terms of Service.');
        return;
    }

    const { data: existing } = await db
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

    if (existing) {
        highlightField('signupUn');
        showToast('Username already taken.');
        return;
    }

    const { data, error } = await db.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { username: username }
        }
    });

    
    if (error) {
        showToast('Sign up failed: ' + error.message);
        return;
    }

    document.getElementById('signupContainer').hidden = true;
    document.getElementById('confirmContainer').hidden = false;
});