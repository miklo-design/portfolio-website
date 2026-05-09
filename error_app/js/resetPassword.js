// handle the recovery token from the email link
async function handleRecoveryToken() {
    console.log('full hash:', window.location.hash);
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    console.log('type:', type, 'has token:', !!accessToken);

    if (type === 'recovery' && accessToken) {
        const { data, error } = await db.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        });

        console.log('session set result:', data, error);

        if (error) {
            showToast('Invalid or expired reset link.', true);
        }
    }
}

handleRecoveryToken();

// clear highlights on input
['newPw', 'newPw2'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => clearHighlight(id));
});

document.getElementById('pwChBtn').addEventListener('click', async () => {
    const newPw = document.getElementById('newPw').value;
    const newPw2 = document.getElementById('newPw2').value;

    if (!newPw || !newPw2) {
        if (!newPw) highlightField('newPw');
        if (!newPw2) highlightField('newPw2');
        showToast('Please fill in all fields.');
        return;
    }

    if (newPw !== newPw2) {
        highlightField('newPw');
        highlightField('newPw2');
        showToast('Passwords do not match.');
        return;
    }

    if (newPw.length < 6) {
        highlightField('newPw');
        showToast('Password must be at least 6 characters.');
        return;
    }

    const { error } = await db.auth.updateUser({ password: newPw });

    if (error) {
        showToast('Password reset failed: ' + error.message, true);
        return;
    }

    showToast('Password changed successfully.', true, 'success');
    setTimeout(() => {
        window.location.href = 'Index2.html?tab=signin';
    }, 2000);
});