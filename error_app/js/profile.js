let currentProfileId = null;
let loggedInUserId = null;

async function openProfile(userId) {
    const { data: { session } } = await db.auth.getSession();
    loggedInUserId = session?.user?.id;
    currentProfileId = userId;

    showPage('profile');
    await loadProfileData(userId);
    await loadUserPosts(userId);
    showTab('userPosts');
}

async function loadProfileData(userId) {
    const { data: profile, error } = await db
        .from('profiles')
        .select('username, bio, avatar_url')
        .eq('id', userId)
        .single();

    if (error || !profile) {
        console.error('Error loading profile:', error);
        return;
    }

    document.getElementById('userNameText').textContent = profile.username || '';
    document.getElementById('userBioText').textContent = profile.bio || '';

    const avatarEl = document.getElementById('userAvatar');
    let img = avatarEl.querySelector('img');
    if (!img) {
        img = document.createElement('img');
        avatarEl.insertBefore(img, avatarEl.firstChild);
    }
    if (profile.avatar_url) {
        img.src = profile.avatar_url;
    }

    const isOwnProfile = userId === loggedInUserId;
    toggleEditOptions(isOwnProfile);
}

function toggleEditOptions(show) {
    const userCont = document.querySelector('.user-cont');
    userCont.classList.toggle('own-profile', show);
}

// -------------------------
// EVENT DELEGATION
// -------------------------

document.getElementById('userName').addEventListener('click', (e) => {
    if (e.target.id === 'editUsername') editUsername();
});

document.getElementById('userBio').addEventListener('click', (e) => {
    if (e.target.id === 'editBio') editBio();
});

document.getElementById('userAvatar').addEventListener('click', (e) => {
    if (e.target.id === 'editAvatar') editAvatar();
});

// -------------------------
// USERNAME EDITING
// -------------------------

function editUsername() {
    const nameEl = document.getElementById('userName');
    const current = document.getElementById('userNameText').textContent;

    nameEl.innerHTML = '';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = current;
    input.classList.add('profile-edit-input');
    nameEl.appendChild(input);
    input.focus();

    let committed = false;

    async function commit() {
        if (committed) return;
        committed = true;

        const newName = input.value.trim().toLowerCase();

        restoreUsername(newName || current);

        if (!newName || newName === current) return;

        const { data: existing } = await db
            .from('profiles')
            .select('id')
            .eq('username', newName)
            .neq('id', loggedInUserId)
            .maybeSingle();

        if (existing) {
            alert('Username already taken');
            restoreUsername(current);
            return;
        }

        const { error } = await db
            .from('profiles')
            .update({ username: newName })
            .eq('id', loggedInUserId);

        if (error) {
            alert('Update failed');
            restoreUsername(current);
            return;
        }

        document.getElementById('userAccount').textContent = newName;
    }

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') {
            committed = true;
            restoreUsername(current);
        }
    });
}

function restoreUsername(text) {
    const nameEl = document.getElementById('userName');
    nameEl.innerHTML = '';
    const span = document.createElement('span');
    span.id = 'userNameText';
    span.textContent = text;
    const btn = document.createElement('button');
    btn.classList.add('edit-trigger');
    btn.id = 'editUsername';
    btn.textContent = '✎';
    nameEl.appendChild(span);
    nameEl.appendChild(btn);
}

// -------------------------
// BIO EDITING
// -------------------------

function editBio() {
    const bioEl = document.getElementById('userBio');
    const current = document.getElementById('userBioText').textContent;

    bioEl.innerHTML = '';

    const textarea = document.createElement('textarea');
    textarea.value = current;
    textarea.classList.add('profile-edit-input');
    bioEl.appendChild(textarea);
    textarea.focus();

    let committed = false;

    async function commit() {
        if (committed) return;
        committed = true;

        const newBio = textarea.value.trim();

        restoreBio(newBio !== undefined ? newBio : current);

        if (newBio === current) return;

        const { error } = await db
            .from('profiles')
            .update({ bio: newBio })
            .eq('id', loggedInUserId);

        if (error) {
            alert('Update failed');
            restoreBio(current);
        }
    }

    textarea.addEventListener('blur', commit);
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            committed = true;
            restoreBio(current);
        }
    });
}

function restoreBio(text) {
    const bioEl = document.getElementById('userBio');
    bioEl.innerHTML = '';
    const span = document.createElement('span');
    span.id = 'userBioText';
    span.textContent = text;
    const btn = document.createElement('button');
    btn.classList.add('edit-trigger');
    btn.id = 'editBio';
    btn.textContent = '✎';
    bioEl.appendChild(span);
    bioEl.appendChild(btn);
}

// -------------------------
// AVATAR EDITING
// -------------------------

function editAvatar() {
    const avatarInput = document.createElement('input');
    avatarInput.type = 'file';
    avatarInput.accept = 'image/*';
    avatarInput.style.display = 'none';
    document.body.appendChild(avatarInput);
    avatarInput.click();

    avatarInput.addEventListener('change', async () => {
        const file = avatarInput.files[0];
        document.body.removeChild(avatarInput);
        if (!file) return;

        const blob = await resizeAvatar(file);
        const path = `${loggedInUserId}.jpg`;

        const { error: uploadError } = await db.storage
            .from('avatars')
            .upload(path, blob, {
                contentType: 'image/jpeg',
                upsert: true
            });
console.log('upload error:', uploadError);
console.log('uploading to path:', path);
console.log('logged in user id:', loggedInUserId);
        if (uploadError) {
            alert('Avatar upload failed');
            return;
        }

        const { data: urlData } = db.storage
            .from('avatars')
            .getPublicUrl(path);

        const { error: updateError } = await db
            .from('profiles')
            .update({ avatar_url: urlData.publicUrl })
            .eq('id', loggedInUserId);

        if (updateError) {
            alert('Profile update failed');
            return;
        }

        const avatarEl = document.getElementById('userAvatar');
        let img = avatarEl.querySelector('img');
        if (!img) {
            img = document.createElement('img');
            avatarEl.insertBefore(img, avatarEl.firstChild);
        }
        img.src = urlData.publicUrl + '?t=' + Date.now();
    });
}

function resizeAvatar(file) {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;

            const size = Math.min(img.naturalWidth, img.naturalHeight);
            const sx = (img.naturalWidth - size) / 2;
            const sy = (img.naturalHeight - size) / 2;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);

            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
        };

        img.src = url;
    });
}

// -------------------------
// POST GRID
// -------------------------

async function loadUserPosts(userId) {
    const container = document.getElementById('userPosts');
    container.innerHTML = '';

    const { data: posts, error: postsError } = await db
        .from('posts')
        .select('id')
        .eq('user_id', userId);

    if (postsError || !posts) return;

    const postIds = posts.map(p => p.id);

    const { data: images, error } = await db
        .from('post_media')
        .select('thumbnail_url, post_id')
        .in('post_id', postIds)
        .not('thumbnail_url', 'is', null);

    if (error) {
        console.error('Error loading user posts:', error);
        return;
    }

    renderPostGrid(images, container);
}

async function loadSavedPosts(userId) {
    const container = document.getElementById('userSaved');
    container.innerHTML = '';

    // get saved post ids
    const { data: saved, error: savedError } = await db
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', userId);

    if (savedError || !saved || saved.length === 0) {
        container.innerHTML = '<p style="color:white">No saved posts yet</p>';
        return;
    }

    const postIds = saved.map(s => s.post_id);

    // get thumbnails for those posts
    const { data: images, error } = await db
        .from('post_media')
        .select('thumbnail_url, post_id')
        .in('post_id', postIds)
        .not('thumbnail_url', 'is', null);

    if (error) {
        console.error('Error loading saved posts:', error);
        return;
    }

    renderPostGrid(images, container);
}

function renderPostGrid(images, container) {
    const sizeClasses = {
        portrait: ['size-portrait-t1', 'size-portrait-t2'],
        landscape: ['size-lands-t1', 'size-lands-t2'],
        square: ['size-square-t1', 'size-square-t2']
    };

    let loadedCount = 0;

    if (images.length === 0) {
        container.innerHTML = '<p style="color:white">No posts yet</p>';
        return;
    }

    images.forEach(image => {
        const tempImg = new Image();
        tempImg.src = image.thumbnail_url;

        tempImg.onload = () => {
            const ratio = tempImg.naturalWidth / tempImg.naturalHeight;
            let orientation;
            if (ratio > 1.2) orientation = 'landscape';
            else if (ratio < 0.85) orientation = 'portrait';
            else orientation = 'square';

            const sizeOptions = sizeClasses[orientation];
            const sizeClass = sizeOptions[Math.floor(Math.random() * sizeOptions.length)];

            const card = document.createElement('div');
            card.classList.add('post', sizeClass);
            card.dataset.postId = image.post_id;

            const img = document.createElement('img');
            img.src = image.thumbnail_url;
            img.loading = 'lazy';

            card.appendChild(img);
            container.appendChild(card);

            loadedCount++;
            if (loadedCount === images.length) {
                positionCards(container);
            }
        };

        tempImg.onerror = () => {
            loadedCount++;
            if (loadedCount === images.length) {
                positionCards(container);
            }
        };
    });
}