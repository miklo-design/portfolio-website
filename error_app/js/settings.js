['newEmail', 'oldPw', 'newPw', 'newPw2'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => clearHighlight(id));
});

// -------------------------
// EMAIL CHANGE
// -------------------------

document.getElementById('emailChBtn').addEventListener('click', async () => {
    const newEmail = document.getElementById('newEmail').value.trim();

    if (!newEmail) {
        highlightField('newEmail');
        showToast('Please enter a new email address.');
        return;
    }

    const { error } = await db.auth.updateUser({ email: newEmail });

    if (error) {
        showToast('Email change failed.', true);
        return;
    }

    showToast('Confirmation sent to your new email address. Click the link to confirm the change.', true, 'success');
    document.getElementById('newEmail').value = '';
});

// -------------------------
// PASSWORD CHANGE
// -------------------------

document.getElementById('pwChBtn').addEventListener('click', async () => {
    const oldPw = document.getElementById('oldPw').value;
    const newPw = document.getElementById('newPw').value;
    const newPw2 = document.getElementById('newPw2').value;

    if (!oldPw || !newPw || !newPw2) {
        if (!oldPw) highlightField('oldPw');
        if (!newPw) highlightField('newPw');
        if (!newPw2) highlightField('newPw2');
        showToast('Please fill in all fields.');
        return;
    }

    if (newPw !== newPw2) {
        highlightField('newPw');
        highlightField('newPw2');
        showToast('New passwords do not match.');
        return;
    }

    if (newPw.length < 6) {
        highlightField('newPw');
        showToast('Password must be at least 6 characters.');
        return;
    }

    const { data: { user } } = await db.auth.getUser();

    const { error: signInError } = await db.auth.signInWithPassword({
        email: user.email,
        password: oldPw
    });

    if (signInError) {
        highlightField('oldPw');
        showToast('Current password is incorrect.');
        return;
    }

    const { error } = await db.auth.updateUser({ password: newPw });

    if (error) {
        showToast('Password change failed.', true);
        return;
    }

    showToast('Password changed successfully.', true, 'success');
    document.getElementById('oldPw').value = '';
    document.getElementById('newPw').value = '';
    document.getElementById('newPw2').value = '';
});

// -------------------------
// DELETE ACCOUNT
// -------------------------

document.getElementById('deleteAcc').addEventListener('click', () => {
    document.getElementById('deleteAcc').hidden = true;
    document.getElementById('delete-conf').hidden = false;
});

document.getElementById('delCancel').addEventListener('click', () => {
    document.getElementById('delete-conf').hidden = true;
    document.getElementById('deleteAcc').hidden = false;
});

document.getElementById('delFinal').addEventListener('click', async () => {
    const { data: { user } } = await db.auth.getUser();
    if (!user) return;

    const { error } = await db.functions.invoke('delete-user', {
        body: { userId: user.id }
    });

    if (error) {
        showToast('Account deletion failed.', true);
        return;
    }

    await db.auth.signOut();
    window.location.href = 'Index2.html';
});