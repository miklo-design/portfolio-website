async function loadBgFeed() {
    const feed = document.getElementById('bgFeed');
    if (!feed) return;

    const { data: images, error } = await db
        .from('post_media')
        .select('thumbnail_url, post_id')
        .not('thumbnail_url', 'is', null);

    if (error || !images || images.length === 0) return;

    const sizeClasses = {
        portrait: ['size-portrait-t1', 'size-portrait-t2'],
        landscape: ['size-lands-t1', 'size-lands-t2'],
        square: ['size-square-t1', 'size-square-t2']
    };

    let loadedCount = 0;

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

            const img = document.createElement('img');
            img.src = image.thumbnail_url;
            card.appendChild(img);
            feed.appendChild(card);

            loadedCount++;
            if (loadedCount === images.length) {
                    positionCards(feed);
                    feed.style.visibility = 'visible';
                }
        };

        tempImg.onerror = () => {
            loadedCount++;
            if (loadedCount === images.length) {
                positionCards(feed);
                feed.style.visibility = 'visible';
            }
        };
    });
}

document.addEventListener('DOMContentLoaded', loadBgFeed);