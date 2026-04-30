let currentMedia = [];
let currentMediaIndex = 0;

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
                    name
                )
            )
        `)
        .eq('id', postId)
        .single();

    if (error) {
        console.error('Error loading post:', error);
        return;
    }

    // sort media by display order
    currentMedia = data.post_media.sort((a, b) => a.display_order - b.display_order);
    currentMediaIndex = 0;

    // fill text content
    document.getElementById('viewTitle').textContent = data.title;
    document.getElementById('viewDesc').textContent = data.description;

    // display author
    document.getElementById('viewAuthor').textContent = data.profiles.username;

    // display tags
    const viewTags = document.getElementById('viewTags');
    viewTags.innerHTML = '';
    data.post_tags.forEach(pt => {
        const tag = document.createElement('div');
        tag.classList.add('tag');
        tag.textContent = pt.tags.name;
        viewTags.appendChild(tag);
    });

    // display media
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

    // update arrows
    document.getElementById('prevMedia').style.visibility = index > 0 ? 'visible' : 'hidden';
    document.getElementById('nextMedia').style.visibility = index < total - 1 ? 'visible' : 'hidden';

    // update dots
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