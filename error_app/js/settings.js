// -------------------------
// EMAIL CHANGE
// -------------------------

document.getElementById('emailChBtn').addEventListener('click', async () => {
    const newEmail = document.getElementById('newEmail').value.trim();

    if (!newEmail) {
        alert('Please enter a new email address');
        return;
    }

    const { error } = await db.auth.updateUser({ email: newEmail });

    if (error) {
        alert('Email change failed: ' + error.message);
        return;
    }

    alert('Confirmation sent to your new email address. Click the link to confirm the change.');
    document.getElementById('newEmail').value = '';
    document.getElementById('oldEmail').value = '';
});

// -------------------------
// PASSWORD CHANGE
// -------------------------

document.getElementById('pwChBtn').addEventListener('click', async () => {
    const oldPw = document.getElementById('oldPw').value;
    const newPw = document.getElementById('newPw').value;
    const newPw2 = document.getElementById('newPw2').value;

    if (!oldPw || !newPw || !newPw2) {
        alert('Please fill in all password fields');
        return;
    }

    if (newPw !== newPw2) {
        alert('New passwords do not match');
        return;
    }

    if (newPw.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    // re-authenticate with old password first
    const { data: { user } } = await db.auth.getUser();

    const { error: signInError } = await db.auth.signInWithPassword({
        email: user.email,
        password: oldPw
    });

    if (signInError) {
        alert('Current password is incorrect');
        return;
    }

    const { error } = await db.auth.updateUser({ password: newPw });

    if (error) {
        alert('Password change failed: ' + error.message);
        return;
    }

    alert('Password changed successfully');
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
        alert('Account deletion failed: ' + error.message);
        return;
    }

    await db.auth.signOut();
    window.location.href = 'Index2.html';
});

    // sign out and redirect
    await db.auth.signOut();
    window.location.href = 'Index2.html';
});