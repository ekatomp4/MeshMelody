// =======================
// Piano Roll Setup
// =======================

// Note names starting from E0 to E6 (52 notes total from E0-E6)
// But we need 127 notes ending on E, so we'll go from E-2 to E8
function setupPianoRoll() {
    const notes = [];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    for (let i = 127; i >= 1; i--) {
        const noteIndex = (i + 8) % 12;
        const octave = Math.floor((i + 8) / 12) - 2;
        const noteName = noteNames[noteIndex] + octave;
        const isBlack = noteNames[noteIndex].includes('#');
        notes.push({ name: noteName, isBlack });
    }

    const pianoKeys = document.getElementById('piano-keys');
    notes.forEach(note => {
        const key = document.createElement('div');
        key.className = `key ${note.isBlack ? 'black' : 'white'}`;
        key.textContent = note.name;
        pianoKeys.appendChild(key);
    });

    const grid = document.getElementById('grid');
    const rollWidth = 4000;
    const rollHeight = notes.length * 20;

    grid.style.width = rollWidth + 'px';
    grid.style.height = rollHeight + 'px';

    notes.forEach((note, index) => {
        const line = document.createElement('div');
        line.className = `grid-line ${note.isBlack ? 'black-note' : 'white-note'}`;
        line.style.top = (index * 20) + 'px';
        grid.appendChild(line);
    });

    const beatWidth = 30;
    for (let i = 0; i < rollWidth / beatWidth; i++) {
        const line = document.createElement('div');
        line.className = i % 16 === 0 ? 'bar-line' : 'beat-line';
        line.style.left = (i * beatWidth) + 'px';
        grid.appendChild(line);
    }

    const rollArea = document.getElementById('roll-area');
    rollArea.addEventListener('scroll', () => {
        pianoKeys.scrollTop = rollArea.scrollTop;
    });

    extendedKeyPlace();
}

// =======================
// Constants
// =======================

const GRID = {
    BEAT_WIDTH: 30,
    NOTE_HEIGHT: 20,
    MIN_WIDTH: 30,
    RESIZE_HANDLE: 6 // px from right edge
};

// =======================
// Utilities
// =======================

function snapToGrid(x, y) {
    return {
        x: Math.floor(x / GRID.BEAT_WIDTH) * GRID.BEAT_WIDTH,
        y: Math.floor(y / GRID.NOTE_HEIGHT) * GRID.NOTE_HEIGHT
    };
}

function getLocalPos(e, container) {
    const rect = container.getBoundingClientRect();
    return {
        x: e.clientX - rect.left + container.scrollLeft,
        y: e.clientY - rect.top + container.scrollTop
    };
}

// =======================
// Note Factory
// =======================

function createNote({ x, y, noteName }) {
    const note = document.createElement('div');

    note.className = 'note';
    note.style.position = 'absolute';
    note.style.left = x + 'px';
    note.style.top = y + 'px';
    note.style.width = GRID.BEAT_WIDTH + 'px';
    note.style.height = GRID.NOTE_HEIGHT + 'px';
    note.style.background = '#4a9eff';
    note.style.border = '1px solid #2070d0';

    note.dataset.note = noteName;

    return note;
}

// =======================
// Interaction State
// =======================

const state = {
    mode: null, // "resize" | "drag"
    note: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
};

// =======================
// Note Placement + Editing
// =======================

function extendedKeyPlace() {
    const pianoKeys = document.getElementById('piano-keys');
    const rollArea = document.getElementById('roll-area');
    const grid = document.getElementById('grid');

    // Cursor indicator
    rollArea.addEventListener('mousemove', (e) => {
        const target = e.target;
        if (!target.classList.contains('note')) {
            rollArea.style.cursor = 'default';
            return;
        }

        const rect = target.getBoundingClientRect();
        if (rect.right - e.clientX <= GRID.RESIZE_HANDLE) {
            rollArea.style.cursor = 'ew-resize';
        } else {
            rollArea.style.cursor = 'grab';
        }
    });

    rollArea.addEventListener('mousedown', (e) => {
        const pos = getLocalPos(e, rollArea);
        const snapped = snapToGrid(pos.x, pos.y);
        const target = e.target;

        // EXISTING NOTE
        if (target.classList.contains('note')) {
            const rect = target.getBoundingClientRect();

            // RESIZE
            if (rect.right - e.clientX <= GRID.RESIZE_HANDLE) {
                state.mode = 'resize';
                state.note = target;
                state.startX = parseFloat(target.style.left);
                return;
            }

            // DRAG
            state.mode = 'drag';
            state.note = target;
            state.offsetX = pos.x - parseFloat(target.style.left);
            state.offsetY = pos.y - parseFloat(target.style.top);
            return;
        }

        // CREATE NEW NOTE
        const noteIndex = Math.floor(snapped.y / GRID.NOTE_HEIGHT);
        const noteName = pianoKeys.children[noteIndex]?.textContent;
        if (!noteName) return;

        const note = createNote({
            x: snapped.x,
            y: snapped.y,
            noteName
        });

        grid.appendChild(note);

        state.mode = 'resize';
        state.note = note;
        state.startX = snapped.x;

        console.log(`Starts at X: ${snapped.x}, Y: ${snapped.y} - Note: ${noteName}`);
    });

    rollArea.addEventListener('mousemove', (e) => {
        if (!state.note) return;

        const pos = getLocalPos(e, rollArea);

        if (state.mode === 'resize') {
            const snappedX = snapToGrid(pos.x, 0).x;
            const width = snappedX - state.startX;
            if (width >= GRID.MIN_WIDTH) {
                state.note.style.width = width + 'px';
            }
        }

        if (state.mode === 'drag') {
            const snapped = snapToGrid(
                pos.x - state.offsetX,
                pos.y - state.offsetY
            );
            state.note.style.left = snapped.x + 'px';
            state.note.style.top = snapped.y + 'px';
        }
    });

    rollArea.addEventListener('mouseup', () => {
        state.mode = null;
        state.note = null;
    });
}

// =======================
// Init
// =======================

setupPianoRoll();
