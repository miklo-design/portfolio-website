/*
document.addEventListener('DOMContentLoaded', async () => {
  //  console.log('feed script running');
    
    const feed = document.getElementById('main');
    feed.style.visibility = 'hidden';
 //   console.log('feed element:', feed);

    const sizeClasses = {
        portrait: ['size-portrait-t1', 'size-portrait-t2'],
        landscape: ['size-lands-t1', 'size-lands-t2'],
        square: ['size-square-t1', 'size-square-t2']
    };

    const { data: images, error } = await db
        .from('post_media')
        .select('thumbnail_url, post_id')
        .not('thumbnail_url', 'is', null);
    
        console.log('images from db:', images);
       // .eq('display_order', 1);
    
  //  console.log('images from db:', images);
 //   console.log('error:', error);

    if (error) {
        console.error('Error fetching images:', error);
        return;
    }

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
            card.dataset.postId = image.post_id;

            const img = document.createElement('img');
            img.src = image.thumbnail_url;
            img.loading = 'lazy';

            card.appendChild(img);
            feed.appendChild(card);
        };
    });

    await Promise.all(images.map(image => {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = image.thumbnail_url;
        });
    }));

    positionCards(document.getElementById('main'));
    feed.style.visibility = 'visible';
}); */

function renderFeedImages(images) {
    const feed = document.getElementById('main');
    feed.style.visibility = 'hidden';

    const sizeClasses = {
        portrait: ['size-portrait-t1', 'size-portrait-t2'],
        landscape: ['size-lands-t1', 'size-lands-t2'],
        square: ['size-square-t1', 'size-square-t2']
    };

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
            card.dataset.postId = image.post_id;

            const img = document.createElement('img');
            img.src = image.thumbnail_url;
            img.loading = 'lazy';

            card.appendChild(img);
            feed.appendChild(card);
        };
    });

    Promise.all(images.map(image => {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = image.thumbnail_url;
        });
    })).then(() => {
        positionCards(feed);
        feed.style.visibility = 'visible';
    });
}

async function loadFeed() {
    const { data: images, error } = await db
        .from('post_media')
        .select('thumbnail_url, post_id')
        .not('thumbnail_url', 'is', null);

    if (error) {
        console.error('Error fetching images:', error);
        return;
    }

    renderFeedImages(images);
}

document.addEventListener('DOMContentLoaded', () => {
    loadFeed();
});

window.addEventListener('resize', () => {
    const feed = document.getElementById('main');
    if (!feed.hidden) {
        feed.innerHTML = '';
        loadFeed();
    }
});