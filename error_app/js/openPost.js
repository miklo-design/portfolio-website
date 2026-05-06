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

    const carousel = document.getElementById('mediaCarousel');
    carousel.innerHTML = '';

    currentMedia.forEach(m => {
        const img = document.createElement('img');
        img.src = m.media_url;
        carousel.appendChild(img);
    });

    
    initSaveButton(postId);
    

}

