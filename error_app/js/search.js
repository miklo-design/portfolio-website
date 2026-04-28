let activeTagIds = [];
let currentQuery = '';

// -------------------------
// SHOW/HIDE FILTERS
// -------------------------

function showFilters() {
    const filters = document.getElementById('searchFilters');
    filters.style.display = 'block';
    renderFilterTags();
}

function hideFilters() {
    const filters = document.getElementById('searchFilters');
    filters.style.display = 'none';
}

document.getElementById('searchInput').addEventListener('focus', showFilters);

document.addEventListener('click', (e) => {
    const searchArea = document.getElementById('search');
    if (!searchArea.contains(e.target)) {
        hideFilters();
    }
});

// -------------------------
// TAG TOGGLE — called directly from onclick
// -------------------------

function toggleFilterTag(tagId) {
    console.log('toggleFilterTag called:', tagId);
    if (activeTagIds.includes(tagId)) {
        activeTagIds = activeTagIds.filter(id => id !== tagId);
    } else {
        activeTagIds.push(tagId);
    }
    renderFilterTags();
    runSearch();
}

// -------------------------
// FILTER TAGS
// -------------------------

function renderFilterTags() {
    const container = document.getElementById('filterTags');
    if (!container) return;
    container.innerHTML = '';

    const selected = allTags.filter(t => activeTagIds.includes(t.id));
    const unselected = allTags.filter(t => !activeTagIds.includes(t.id));
    const ordered = [...selected, ...unselected];

    ordered.forEach(tag => {
        const isSelected = activeTagIds.includes(tag.id);

        const card = document.createElement('button');
        card.classList.add('tag-example');
        card.type = 'button';
        if (isSelected) card.classList.add('tag-selected');
        card.setAttribute('onclick', `toggleFilterTag('${tag.id}')`);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = tag.name;
        card.appendChild(nameSpan);

        if (isSelected) {
            const removeBtn = document.createElement('span');
            removeBtn.textContent = ' ×';
            removeBtn.classList.add('tag-remove');
            card.appendChild(removeBtn);
        }

        container.appendChild(card);
    });
}

// -------------------------
// SEARCH INPUT
// -------------------------

document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        currentQuery = document.getElementById('searchInput').value.trim();
        runSearch();
    }
});

document.getElementById('searchBtn').addEventListener('click', () => {
    currentQuery = document.getElementById('searchInput').value.trim();
    runSearch();
});

// -------------------------
// SEARCH
// -------------------------

async function runSearch() {
    console.log('runSearch, query:', currentQuery, 'tags:', activeTagIds);
    const feed = document.getElementById('main');
    feed.innerHTML = '';

    if (currentQuery.length === 0 && activeTagIds.length === 0) {
        loadFeed();
        return;
    }

    let matchingPostIds = null;

    if (activeTagIds.length > 0) {
        const { data: taggedPosts, error: tagError } = await db
            .from('post_tags')
            .select('post_id')
            .in('tag_id', activeTagIds);

        if (tagError) {
            console.error('Tag filter error:', tagError);
            return;
        }

        const idCounts = {};
        taggedPosts.forEach(row => {
            idCounts[row.post_id] = (idCounts[row.post_id] || 0) + 1;
        });

        matchingPostIds = Object.keys(idCounts).filter(id => idCounts[id] === activeTagIds.length);

        if (matchingPostIds.length === 0) {
            showNoResults();
            return;
        }
    }

    if (currentQuery.length > 0) {
        const allMatchIds = new Set();

        let postQuery = db
            .from('posts')
            .select('id, title, description')
            .or(`title.ilike.%${currentQuery}%,description.ilike.%${currentQuery}%`);

        if (matchingPostIds) postQuery = postQuery.in('id', matchingPostIds);

        const { data: posts, error: postError } = await postQuery;
        if (postError) {
            console.error('Post search error:', postError);
            return;
        }
        posts.forEach(p => allMatchIds.add(p.id));

        const { data: profileMatches } = await db
            .from('profiles')
            .select('id')
            .ilike('username', `%${currentQuery}%`);

        if (profileMatches && profileMatches.length > 0) {
            const matchingUserIds = profileMatches.map(p => p.id);
            let userPostQuery = db
                .from('posts')
                .select('id')
                .in('user_id', matchingUserIds);
            if (matchingPostIds) userPostQuery = userPostQuery.in('id', matchingPostIds);
            const { data: userPosts } = await userPostQuery;
            if (userPosts) userPosts.forEach(p => allMatchIds.add(p.id));
        }

        const { data: tagMatches } = await db
            .from('tags')
            .select('id')
            .ilike('name', `%${currentQuery}%`);

        if (tagMatches && tagMatches.length > 0) {
            const { data: tagPostMatches } = await db
                .from('post_tags')
                .select('post_id')
                .in('tag_id', tagMatches.map(t => t.id));

            if (tagPostMatches) {
                let filteredTagPosts = tagPostMatches.map(t => t.post_id);
                if (matchingPostIds) {
                    filteredTagPosts = filteredTagPosts.filter(id => matchingPostIds.includes(id));
                }
                filteredTagPosts.forEach(id => allMatchIds.add(id));
            }
        }

        matchingPostIds = [...allMatchIds];

        if (matchingPostIds.length === 0) {
            showNoResults();
            return;
        }
    }

    const { data: images, error: imgError } = await db
        .from('post_media')
        .select('thumbnail_url, post_id')
        .in('post_id', matchingPostIds)
        .not('thumbnail_url', 'is', null);

    if (imgError || !images || images.length === 0) {
        showNoResults();
        return;
    }

    renderFeedImages(images);
}

function showNoResults() {
    const feed = document.getElementById('main');
    feed.innerHTML = '<p style="color:white;padding:16px">No results found</p>';
}