function positionCards(container) {
    if (!container) {
        console.error('positionCards: no container provided');
        return;
    }
const feed = container;
const cards = container.querySelectorAll('.post');
function positionCards() {
    //Waits until the browser has fully parsed all the HTML before running anything inside. 
    //Without this the script might run before the feed div exists.
    const feed = document.getElementById('main');
    const cards = document.querySelectorAll('.post');
    const placed = [];
    //An empty array that will store the position and size of every card after it's been placed. 
    //Used to check overlap against future cards.
    const maxOverlap = 0.15;
    //How much overlap is allowed.<0.15=15%>
    const maxAttempts = 30;
    //How many times it runs.

    // zone grid to track coverage
    const zoneSize = 40;
    const zoneCols = Math.ceil(feed.offsetWidth / zoneSize);
    const zoneRows = 20;
    const zoneCoverage = Array(zoneCols * zoneRows).fill(0);

    feed.style.height = `${zoneRows * zoneSize}px`;

    function getZoneIndex(x, y) {
        const col = Math.floor(x / zoneSize);
        const row = Math.floor(y / zoneSize);
        return row * zoneCols + col;
    }

    function markZones(pos) {
        // mark all zones this card covers as filled
        const startCol = Math.floor(pos.x / zoneSize);
        const endCol = Math.floor((pos.x + pos.w) / zoneSize);
        const startRow = Math.floor(pos.y / zoneSize);
        const endRow = Math.floor((pos.y + pos.h) / zoneSize);

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const idx = r * zoneCols + c;
                if (idx < zoneCoverage.length) zoneCoverage[idx]++;
            }
        }
    }

    function getEmptyZonePosition(w, h) {
        // find zones with lowest coverage
        const emptyZones = [];
        for (let i = 0; i < zoneCoverage.length; i++) {
            if (zoneCoverage[i] === 0) emptyZones.push(i);
        }

        if (emptyZones.length === 0) return null;

        // pick a random empty zone
        const zone = emptyZones[Math.floor(Math.random() * emptyZones.length)];
        const zoneCol = zone % zoneCols;
        const zoneRow = Math.floor(zone / zoneCols);

        // position within that zone with small random offset
        const x = Math.min(zoneCol * zoneSize + Math.floor(Math.random() * zoneSize * 0.5), feed.offsetWidth - w);
        const y = zoneRow * zoneSize + Math.floor(Math.random() * zoneSize * 0.3);

        return { x, y, w, h };
    }

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
            // first half of attempts try empty zones, second half go fully random
            let candidate;
            if (attempt < maxAttempts / 2) {
                candidate = getEmptyZonePosition(w, h) || {
                    x: Math.floor(Math.random() * maxX),
                    y: Math.floor(Math.random() * maxY),
                    w, h
                };
            } else {
                candidate = {
                    x: Math.floor(Math.random() * maxX),
                    y: Math.floor(Math.random() * maxY),
                    w, h
                };
            }

            if (!isTooMuchOverlap(candidate)) {
                pos = candidate;
                break;
            }
        }

        if (!pos) {
            pos = getEmptyZonePosition(w, h) || {
                x: Math.floor(Math.random() * maxX),
                y: Math.floor(Math.random() * maxY),
                w, h
            };
        }

        placed.push(pos);
        markZones(pos);

        card.style.position = 'absolute';
        card.style.left = `${pos.x}px`;
        card.style.top = `${pos.y}px`;
    });
}
}