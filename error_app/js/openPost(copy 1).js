let currentMedia = [];
let currentMediaIndex = 0;
let preloadedImages = {};

function handlePostClick(e) {
    const card = e.target.closest('.post');
    if (card) {
        const postId = card.dataset.postId;
        showPage('viewContainer');
        loadPost(postId);
    }
}

document.getElementById('main').addEventListener('click', handlePostClick);
document.getElementById('userPosts').addEventListener('click', handlePostClick);
document.getElementById('userSaved').addEventListener('click', handlePostClick);

async function loadPost(postId) {
    const { data, error } = await db
        .from('posts')
        .select(`
            id,
            title,
            description,
            user_id,
            profiles (
                username,
                avatar_url
            ),
            post_media (
                media_url,
                media_type,
                display_order
            ),
            post_tags (
                tags (
                    name,
                    id
                )
            )
        `)
        .eq('id', postId)
        .single();

    if (error) {
        console.error('Error loading post:', error);
        return;
    }

    currentMedia = data.post_media.sort((a, b) => a.display_order - b.display_order);
    currentMediaIndex = 0;
    preloadedImages = {};

    document.getElementById('viewTitle').textContent = data.title;
    document.getElementById('viewDesc').textContent = data.description;

    // author — clickable
    const authorEl = document.getElementById('viewAuthor');
    authorEl.textContent = data.profiles.username;
    authorEl.style.cursor = 'pointer';
    authorEl.onclick = () => {
        showPage('profile');
        openProfile(data.user_id);
    };

    // tags — clickable
    const viewTags = document.getElementById('viewTags');
    viewTags.innerHTML = '';
    data.post_tags.forEach(pt => {
        const tag = document.createElement('div');
        tag.classList.add('tag', 'card');
        tag.textContent = pt.tags.name;
        tag.style.cursor = 'pointer';
        tag.addEventListener('click', () => {
            showPage('main');
            // select this tag in search and run search
            activeTagIds = [pt.tags.id];
            currentQuery = '';
            runSearch();
        });
        viewTags.appendChild(tag);
    });

    // preload all images
    currentMedia.forEach(m => {
        const img = new Image();
        img.src = m.media_url;
        preloadedImages[m.media_url] = img;
    });

    showMedia(0);
    updateNavigation();
    initSaveButton(postId);
}

function showMedia(index) {
    currentMediaIndex = index;
    const media = currentMedia[index];

    const viewMedia = document.getElementById('viewMedia');
    viewMedia.innerHTML = '';
    viewMedia.style.width = '';
    viewMedia.style.height = '';

    const img = document.createElement('img');
    img.src = media.media_url;
    viewMedia.appendChild(img);

    updateNavigation();
}

function updateNavigation() {
    const total = currentMedia.length;
    const index = currentMediaIndex;

    document.getElementById('prevMedia').style.visibility = index > 0 ? 'visible' : 'hidden';
    document.getElementById('nextMedia').style.visibility = index < total - 1 ? 'visible' : 'hidden';

    const dotsContainer = document.getElementById('mediaDots');
    dotsContainer.innerHTML = '';

    if (total > 1) {
        dotsContainer.style.display = 'flex';
        currentMedia.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.classList.add('media-dot');
            if (i === index) dot.classList.add('media-dot-active');
            dot.addEventListener('click', () => showMedia(i));
            dotsContainer.appendChild(dot);
        });
    } else {
        dotsContainer.style.display = 'none';
    }
}

document.getElementById('prevMedia').addEventListener('click', () => {
    if (currentMediaIndex > 0) showMedia(currentMediaIndex - 1);
});

document.getElementById('nextMedia').addEventListener('click', () => {
    if (currentMediaIndex < currentMedia.length - 1) showMedia(currentMediaIndex + 1);
});

// arrow key navigation
document.addEventListener('keydown', (e) => {
    const viewContainer = document.getElementById('viewContainer');
    if (viewContainer.hidden) return;
    if (e.key === 'ArrowLeft' && currentMediaIndex > 0) showMedia(currentMediaIndex - 1);
    if (e.key === 'ArrowRight' && currentMediaIndex < currentMedia.length - 1) showMedia(currentMediaIndex + 1);
});

let touchStartX = 0;

document.getElementById('viewMedia').addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
}, { passive: true });

document.getElementById('viewMedia').addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return; // ignore small swipes
    if (diff > 0 && currentMediaIndex < currentMedia.length - 1) {
        showMedia(currentMediaIndex + 1);
    } else if (diff < 0 && currentMediaIndex > 0) {
        showMedia(currentMediaIndex - 1);
    }
});