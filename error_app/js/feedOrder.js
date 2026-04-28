const feed = document.getElementById('main');
const cards = document.querySelectorAll('.example');
const placed = []; // tracks positions of placed cards
const maxOverlap = 0.3; // max 15% of card area can overlap
const maxAttempts = 20;

feed.style.position = 'relative';
feed.style.height = '2000px'; // set manually for now, adjust later

function getOverlapArea(a, b) {
    const xOverlap = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    const yOverlap = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    return xOverlap * yOverlap;
}

function isTooMuchOverlap(candidate) {
    for (const other of placed) {
        const overlap = getOverlapArea(candidate, other);
        const candidateArea = candidate.w * candidate.h;
        if (overlap / candidateArea > maxOverlap) return true;
    }
    return false;
}

cards.forEach(card => {
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const maxX = feed.offsetWidth - w;
    const maxY = parseInt(feed.style.height) - h;
    
    let pos = null;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const x = Math.floor(Math.random() * maxX);
        const y = Math.floor(Math.random() * maxY);
        const candidate = { x, y, w, h };
        
        if (!isTooMuchOverlap(candidate)) {
            pos = candidate;
            break;
        }
    }
    
    // if no clean position found, use last attempt anyway
    if (!pos) {
        pos = {
            x: Math.floor(Math.random() * maxX),
            y: Math.floor(Math.random() * maxY),
            w, h
        };
    }
    
    placed.push(pos);
    card.style.position = 'absolute';
    card.style.left = `${pos.x}px`;
    card.style.top = `${pos.y}px`;
});

console.log('feedOrder.js loaded');
console.log('cards found:', document.querySelectorAll('.example').length);