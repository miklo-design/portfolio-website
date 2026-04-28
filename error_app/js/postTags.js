const postTagsContainer = document.getElementById('postTags');
const tagCardsContainer = document.getElementById('tagCards');
const tagInput = document.getElementById('tagInput');
const tagSizer = document.querySelector('.tag-input-sizer');
const suggestionList = document.querySelector('.suggestions');

let addedTags = [];

// -------------------------
// SUGGESTIONS
// -------------------------

let suggestionTimeout = null;

function getSuggestions(query) {
    if (query.length === 0) return [];
    const lower = query.toLowerCase();
    return allTags
        .filter(t => t.name.toLowerCase().startsWith(lower))
        .slice(0, 10);
}

function formatTag(text) {
    return text.trim().toLowerCase();
}

function showSuggestions(suggestions) {
    suggestionList.innerHTML = '';

    if (suggestions.length === 0) {
        suggestionList.hidden = true;
        return;
    }

    suggestions.forEach(tag => {
        const li = document.createElement('li');
        li.textContent = tag.name;
        li.classList.add('suggestion-item');

        li.addEventListener('mousedown', (e) => {
            e.preventDefault();
            addTag({ id: tag.id, name: tag.name });
        });

        suggestionList.appendChild(li);
    });

    suggestionList.hidden = false;
}

function hideSuggestions() {
    suggestionList.hidden = true;
    suggestionList.innerHTML = '';
}

tagInput.addEventListener('input', () => {
    resizeInput();
    clearTimeout(suggestionTimeout);
    const query = tagInput.value.trim();

    if (query.length === 0) {
        hideSuggestions();
        return;
    }

    suggestionTimeout = setTimeout(() => {
        const suggestions = getSuggestions(query);
        showSuggestions(suggestions);
    }, 200);
});

tagInput.addEventListener('blur', () => {
    setTimeout(() => {
        hideSuggestions();
        if (tagInput.value.trim().length > 0) commitInput();
    }, 150);
});

tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        commitInput();
    }
});

// -------------------------
// INPUT SIZING
// -------------------------

function resizeInput() {
    tagSizer.textContent = tagInput.value || tagInput.placeholder;
    tagInput.style.width = tagSizer.offsetWidth + 'px';
}

// -------------------------
// COMMIT INPUT
// -------------------------

async function commitInput() {
    const raw = tagInput.value.trim();
    if (raw.length === 0) return;

    const formatted = formatTag(raw);

    // check if matches existing tag (case insensitive)
    const existing = allTags.find(t => t.name === formatted);

    if (existing) {
        addTag({ id: existing.id, name: existing.name });
    } else {
        addTag({ id: null, name: formatted });
    }
}

// -------------------------
// ADD TAG
// -------------------------

function addTag(tag) {
    // prevent duplicates
    if (addedTags.find(t => t.name === tag.name)) {        
        tagInput.value = '';
        resizeInput();
        hideSuggestions();
        return;
    }

    addedTags.push(tag);
    tagInput.value = '';
    resizeInput();
    hideSuggestions();
    renderCards();
    tagInput.focus();
}

// -------------------------
// RENDER CARDS
// -------------------------

function renderCards() {
    tagCardsContainer.innerHTML = '';

    addedTags.forEach((tag, index) => {
        const card = document.createElement('div');
        card.classList.add('tag-card');

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('tag-card-name');
        nameSpan.textContent = tag.name;

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('tag-card-delete');
        deleteBtn.textContent = '×';

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addedTags.splice(index, 1);
            renderCards();
        });

        card.appendChild(nameSpan);
        card.appendChild(deleteBtn);

        card.addEventListener('click', () => editCard(index));

        tagCardsContainer.appendChild(card);
    });
}

// -------------------------
// EDIT CARD
// -------------------------

function editCard(index) {
    const tag = addedTags[index];
    const card = tagCardsContainer.children[index];

    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.classList.add('tag-input');
    editInput.value = tag.name;

    const editSizer = document.createElement('span');
    editSizer.classList.add('tag-input-sizer');

    const editList = document.createElement('ul');
    editList.classList.add('suggestions');
    editList.hidden = true;

    function resizeEdit() {
        editSizer.textContent = editInput.value || editInput.placeholder;
        editInput.style.width = editSizer.offsetWidth + 'px';
    }

    editInput.addEventListener('input', () => {
        resizeEdit();
        const query = editInput.value.trim();
        if (query.length === 0) {
            editList.hidden = true;
            editList.innerHTML = '';
            return;
        }
        const suggestions = getSuggestions(query);
        renderEditSuggestions(suggestions, editInput, editList, index);
    });

    setTimeout(resizeEdit, 0);

    async function commitEdit() {
        const raw = editInput.value.trim();

        if (raw.length === 0) {
            addedTags.splice(index, 1);
            renderCards();
            return;
        }

        const formatted = formatTag(raw);
        const existing = allTags.find(t => t.name === formatted);

        if (existing) {
            addedTags[index] = { id: existing.id, name: existing.name };
        } else {
            addedTags[index] = { id: null, name: formatted };
        }

        renderCards();
    }

    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitEdit();
        }
    });

    editInput.addEventListener('blur', () => {
        setTimeout(commitEdit, 150);
    });

    card.replaceWith(editInput);
    tagCardsContainer.appendChild(editSizer);
    tagCardsContainer.appendChild(editList);
    editInput.focus();
}

function renderEditSuggestions(suggestions, editInput, editList, index) {
    editList.innerHTML = '';

    if (suggestions.length === 0) {
        editList.hidden = true;
        return;
    }

    suggestions.forEach(tag => {
        const li = document.createElement('li');
        li.textContent = tag.name;
        li.classList.add('suggestion-item');

        li.addEventListener('mousedown', (e) => {
            e.preventDefault();
            addedTags[index] = { id: tag.id, name: tag.name };
            renderCards();
        });

        editList.appendChild(li);
    });

    editList.hidden = false;
}

//tag-input-sizer - - - review later - - -

const sizer = document.querySelector('.tag-input-sizer');

        function resizeInput() {
            const content = tagInput.value || tagInput.placeholder;
            sizer.textContent = content;
            tagInput.style.width = sizer.offsetWidth + 'px';
        }

        tagInput.addEventListener('input', resizeInput);