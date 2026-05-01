['postTitle'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => clearHighlight(id));
});
const uploadBtn = document.getElementById('uploadButton');

uploadBtn.addEventListener('click', async () => {
    await uploadPost();
});

async function uploadPost() {
    
    // -------------------------
    // 1. GRAB ALL INPUT DATA
    // -------------------------

    const title = document.getElementById('postTitle').value.trim();
    const description = document.getElementById('desc').value.trim();

    if (!title) {
        highlightField('postTitle');
        showToast('Please add a title!');
//        alert('Please add a title');
        return;
    }

    if (files.length === 0) {
        showToast('Please add at least one image!', true);
//        alert('Please add at least one image');
        return;
    }

    // get logged in user not sure if we still need this
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
        showToast('Not logged in');
//        alert('Not logged in');
        return;
    }

    // -------------------------
    // 2. GENERATE IDS
    // -------------------------

    // generate post id on frontend so we can use it for storage paths
    const postId = crypto.randomUUID();

    // -------------------------
    // 3. UPLOAD IMAGES TO STORAGE
    // -------------------------

    const mediaRows = [];

    for (let i = 0; i < files.length; i++) {
        const fileObj = files[i]; // { blob, orientation, file }
        const ext = 'jpg'; // we convert everything to jpeg in resizeImage
        const fileName = `${postId}-${i}.${ext}`;
        const storagePath = `${user.id}/${postId}/${fileName}`;

        // upload full size image
        const { error: uploadError } = await db.storage
            .from('post-media')
            .upload(storagePath, fileObj.blob, {
                contentType: 'image/jpeg'
            });

        if (uploadError) {
            console.error('Image upload failed:', uploadError);
            showToast('Image uplaod failed.', true);
//            alert('Image upload failed');
            return;
        }

        // get public URL
        const { data: urlData } = db.storage
            .from('post-media')
            .getPublicUrl(storagePath);

        const mediaUrl = urlData.publicUrl;
        let thumbnailUrl = null;

        // for first image, also create and upload thumbnail
        if (i === 0) {
            const thumbBlob = await createThumbnail(fileObj.file);
            const thumbPath = `${user.id}/${postId}/thumb-${fileName}`;

            const { error: thumbError } = await db.storage
                .from('post-media')
                .upload(thumbPath, thumbBlob, {
                    contentType: 'image/jpeg'
                });

            if (!thumbError) {
                const { data: thumbUrlData } = db.storage
                    .from('post-media')
                    .getPublicUrl(thumbPath);
                thumbnailUrl = thumbUrlData.publicUrl;
            }
        }

        mediaRows.push({
            post_id: postId,
            media_url: mediaUrl,
            thumbnail_url: thumbnailUrl,
            media_type: 'image/jpeg',
            display_order: i + 1
        });
    }

    // -------------------------
    // 4. HANDLE TAGS
    // -------------------------

    const tagIds = [];

    for (const tag of addedTags) {
        if (tag.id) {
            // existing tag — just use its id
            tagIds.push(tag.id);
        } else {
            // new tag — insert into tags table first
            const { data: newTag, error: tagError } = await db
                .from('tags')
                .insert({ name: tag.name })
                .select('id')
                .single();

            if (tagError) {
                console.error('Tag insert failed:', tagError);
//                alert('Tag upload failed');
                return;
            }

            tagIds.push(newTag.id);
        }
    }

    // -------------------------
    // 5. INSERT POST ROW
    // -------------------------

    const { error: postError } = await db
        .from('posts')
        .insert({
            id: postId,
            user_id: user.id,
            title: title,
            description: description
        });

    if (postError) {
        console.error('Post insert failed:', postError);
        showToast('Failed to upload post.', true);
//        alert('Post upload failed');
        return;
    }

    // -------------------------
    // 6. INSERT POST_MEDIA ROWS
    // -------------------------

    const { error: mediaError } = await db
        .from('post_media')
        .insert(mediaRows);

    if (mediaError) {
        console.error('Media insert failed:', mediaError);
//        alert('Media upload failed');
        return;
    }

    // -------------------------
    // 7. INSERT POST_TAGS ROWS
    // -------------------------

    const postTagRows = tagIds.map(tagId => ({
        post_id: postId,
        tag_id: tagId
    }));

    if (postTagRows.length > 0) {
        const { error: postTagError } = await db
            .from('post_tags')
            .insert(postTagRows);

        if (postTagError) {
            console.error('Post tags insert failed:', postTagError);
//            alert('Tag linking failed');
            return;
        }
    }

    // -------------------------
    // 8. SUCCESS
    // -------------------------
    
    showPage('main');
    clearAddForm();
    loadFeed();
}

// -------------------------
// THUMBNAIL CREATION
// -------------------------

function createThumbnail(file) {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            const maxSize = 600;
            let w = img.naturalWidth;
            let h = img.naturalHeight;

            if (w > h) {
                h = Math.round(h * (maxSize / w));
                w = maxSize;
            } else {
                w = Math.round(w * (maxSize / h));
                h = maxSize;
            }

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);

            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
        };

        img.src = url;
    });
}

function clearAddForm() {
    document.getElementById('postTitle').value = '';
    document.getElementById('desc').value = '';
    document.getElementById('tagCards').innerHTML = '';
    document.getElementById('tagInput').value = '';
    document.getElementById('uploadPreview').innerHTML = '';
    document.getElementById('uploadStrip').innerHTML = '';
    document.getElementById('uploadStrip').hidden = true;
    document.getElementById('uploadLabel').style.display = 'flex';
    document.getElementById('dropZone').style.width = '';
    files = [];
    addedTags = [];
    resizeInput();
}