let allTags = [];

async function loadAllTags() {
    const { data, error } = await db
        .from('tags')
        .select('id, name')
        .order('name');

    if (error) {
        console.error('Error loading tags:', error);
        return;
    }

    allTags = data;
}

loadAllTags();