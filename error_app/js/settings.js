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
/*
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
}); */

document.getElementById('delFinal').addEventListener('click', async () => {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return;

    const userId = session.user.id;

    // delete avatar from storage
    console.log('deleting avatar...');
    await db.storage.from('avatars').remove([`${userId}.jpg`]);
    const { error: avatarError } = await db.storage.from('avatars').remove([`${userId}.jpg`]);
    console.log('avatar delete error:', avatarError);

    // delete post media from storage
    console.log('fetching posts...');
    const { data: posts } = await db
        .from('posts')
        .select('id')
        .eq('user_id', userId);
    console.log('posts found:', posts);

    if (posts && posts.length > 0) {
        const { data: mediaFiles } = await db
            .from('post_media')
            .select('media_url, thumbnail_url')
            .in('post_id', posts.map(p => p.id));

        if (mediaFiles) {
            const paths = mediaFiles
                .flatMap(m => [m.media_url, m.thumbnail_url].filter(Boolean))
                .map(url => url.split('/post-media/')[1])
                .filter(Boolean);
                console.log('media paths to delete:', paths);

            if (paths.length > 0) {
                await db.storage.from('post-media').remove(paths);
                const { data: removeData, error: storageError } = await db.storage.from('post-media').remove(paths);
                console.log('storage delete result:', removeData);
                console.log('storage delete error:', storageError);
            }
        }
    }

    // call the SQL function to delete auth user
    const { error } = await db.rpc('delete_user_account');

    if (error) {
        showToast('Account deletion failed.', true);
        console.error(error);
        return;
    }

    await db.auth.signOut();
    await new Promise(resolve => setTimeout(resolve, 10000));
    window.location.href = 'Index2.html';
});
