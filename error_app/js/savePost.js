let currentPostId = null;
let isSaved = false;

async function initSaveButton(postId) {
    currentPostId = postId;
    
    const { data: { session } } = await db.auth.getSession();
    if (!session) return;

    // check if already saved
    const { data } = await db
        .from('saved_posts')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('post_id', postId)
        .maybeSingle();

    isSaved = !!data;
    updateSaveButton();
}

function updateSaveButton() {
    const btn = document.getElementById('save');
    if (isSaved) {
        btn.textContent = 'SAVED';
        btn.classList.add('saved');
    } else {
        btn.textContent = 'SAVE';
        btn.classList.remove('saved');
    }
}

document.getElementById('save').addEventListener('click', async () => {
    const { data: { session } } = await db.auth.getSession();
    if (!session || !currentPostId) return;

    if (isSaved) {
        // unsave
        const { error } = await db
            .from('saved_posts')
            .delete()
            .eq('user_id', session.user.id)
            .eq('post_id', currentPostId);

        if (error) {
            console.error('Error unsaving post:', error);
            return;
        }

        isSaved = false;
    } else {
        // save
        const { error } = await db
            .from('saved_posts')
            .insert({
                user_id: session.user.id,
                post_id: currentPostId
            });

        if (error) {
            console.error('Error saving post:', error);
            return;
        }

        isSaved = true;
    }

    updateSaveButton();
});