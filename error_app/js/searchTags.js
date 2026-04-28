let selectedTagIds = [];

function renderSearchTags(query = '') {
    const searchTagContainer = document.getElementById('searchFilters');
    searchTagContainer.innerHTML = '';

    const filtered = query.length === 0
        ? allTags
        : allTags.filter(t => t.name.toLowerCase().startsWith(query.toLowerCase()));

    filtered.forEach(tag => {
        const card = document.createElement('button');
        card.classList.add('tag-example');
        card.textContent = tag.name;

        if (selectedTagIds.includes(tag.id)) {
            card.classList.add('tag-selected');
        }

        card.addEventListener('click', () => {
            if (selectedTagIds.includes(tag.id)) {
                selectedTagIds = selectedTagIds.filter(id => id !== tag.id);
                card.classList.remove('tag-selected');
            } else {
                selectedTagIds.push(tag.id);
                card.classList.add('tag-selected');
            }
            // trigger feed filter here later
        });

        searchTagContainer.appendChild(card);
    });
}

// filter as user types in search input
document.getElementById('searchInput').addEventListener('input', (e) => {
    renderSearchTags(e.target.value);
});

// show all tags when search opens
// call renderSearchTags() when search area gains focus
document.getElementById('searchInput').addEventListener('focus', () => {
    renderSearchTags(document.getElementById('searchInput').value);
});