console.log('JS LOADED');
// elements
const mediaInput = document.getElementById('mediaUpload');
const dropZone = document.getElementById('dropZone');
// const uploadOverlay = document.getElementById('uploadOverlay');
const uploadPreview = document.getElementById('uploadPreview');
const uploadStrip = document.getElementById('uploadStrip');
const uploadLabel = document.getElementById('uploadLabel');
const media = document.getElementById('media');

let files = []; // stores processed file objects in order
let selectedIndex = 0;
let dragSrcIndex = null;

// -------------------------
// 1. FILE SELECTION
// -------------------------

// click overlay → open file dialog
dropZone.addEventListener('click', () => {
    console.log('uploadOverlay');
    mediaInput.click();
});

// file dialog selection
mediaInput.addEventListener('change', () => handleFiles(mediaInput.files));

// drag over
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = '#2a2a2a';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.backgroundColor = '';
});

// drop files
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = '';
    if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
    }
});


// -------------------------
// 2. HANDLE FILES
// -------------------------

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

async function handleFiles(newFiles) {
    console.log('handleFiles works');
    
    const validFiles = Array.from(newFiles).filter(f => {
        if (!allowedTypes.includes(f.type)) {
            showNotification(`${f.name} is not a supported format. Use JPG, PNG or WebP.`, 'error');
            return false;
        }
        if (f.size > 20 * 1024 * 1024) {
            showNotification(`${f.name} is too large. Maximum file size is 20MB.`, 'error');
            return false;
        }
        return true;
    });
    
    if (validFiles.length === 0) return;

    // resize each file before storing
    for (const file of validFiles) {
        const processed = await resizeImage(file);
        files.push(processed);
    }

    renderStrip();
    selectImage(files.length === 1 ? 0 : selectedIndex);

    // hide label permanently after first upload
    uploadLabel.style.display = 'none';

    // show strip only if more than one image
    if (files.length > 1) {
        uploadStrip.removeAttribute('hidden');
    }
}

// -------------------------
// 3. PREVIEW
// -------------------------

function selectImage(index) {
    selectedIndex = index;
    const url = URL.createObjectURL(files[index].blob);

    // clear previous preview
    uploadPreview.innerHTML = '';

    const img = document.createElement('img');
    img.src = url;

    // adapt drop zone width to image ratio
    img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        const dropHeight = dropZone.offsetHeight;
        const newWidth = Math.round(dropHeight * ratio);
        media.style.width = `${newWidth}px`;
    };

    uploadPreview.appendChild(img);

    // update selected state on thumbnails
    document.querySelectorAll('.upload-thumbnail').forEach((card, i) => {
        card.classList.toggle('selected', i === index);
    });
}

// -------------------------
// 4. UPLOAD LABEL ON HOVER
// -------------------------

// label is hidden after upload, reappears on hover
dropZone.addEventListener('mouseenter', () => {
    if (files.length > 0) uploadLabel.style.display = 'flex';
});

dropZone.addEventListener('mouseleave', () => {
    if (files.length > 0) uploadLabel.style.display = 'none';
});

// -------------------------
// 5. THUMBNAIL STRIP
// -------------------------

function renderStrip() {
    uploadStrip.innerHTML = '';

    files.forEach((file, index) => {
        const card = document.createElement('div');
        card.classList.add('upload-thumbnail');
        if (index === selectedIndex) card.classList.add('selected');
        card.draggable = true;
        card.dataset.index = index;

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file.blob);
        card.appendChild(img);

        // click to select
        card.addEventListener('click', () => selectImage(index));

        // drag to reorder
        card.addEventListener('dragstart', (e) => {
            dragSrcIndex = index;
            setTimeout(() => card.classList.add('dragging'), 0);
            e.dataTransfer.setData('text/plain', index);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dragSrcIndex === null || dragSrcIndex === index) return;

            const moved = files.splice(dragSrcIndex, 1)[0];
            files.splice(index, 0, moved);

            dragSrcIndex = null;
            selectedIndex = index;
            renderStrip();
            selectImage(selectedIndex);
        });

        uploadStrip.appendChild(card);
    });
}

// -------------------------
// 6. IMAGE RESIZING
// -------------------------

const sizes = {
    portrait:  { w: 1000, h: 1500 },
    landscape: { w: 1600, h: 900  },
    square:    { w: 1200, h: 1200 }
};

function getOrientation(w, h) {
    const ratio = w / h;
    if (ratio > 1.2) return 'landscape';
    if (ratio < 0.85) return 'portrait';
    return 'square';
}

function resizeImage(file) {

    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            const orientation = getOrientation(img.naturalWidth, img.naturalHeight);
            const { w, h } = sizes[orientation];

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;

            // crop to fill (object-fit: cover equivalent)
            const srcRatio = img.naturalWidth / img.naturalHeight;
            const dstRatio = w / h;

            let srcX = 0, srcY = 0, srcW = img.naturalWidth, srcH = img.naturalHeight;

            if (srcRatio > dstRatio) {
                // image is wider than target — crop sides
                srcW = Math.round(img.naturalHeight * dstRatio);
                srcX = Math.round((img.naturalWidth - srcW) / 2);
            } else {
                // image is taller than target — crop top/bottom
                srcH = Math.round(img.naturalWidth / dstRatio);
                srcY = Math.round((img.naturalHeight - srcH) / 2);
            }

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, w, h);

            canvas.toBlob((blob) => {
                resolve({ blob, orientation, file });
            }, 'image/jpeg', 0.85);
        };

        img.src = url;
    });
}




