// =======================
// Piano Roll Setup
// =======================

function setupPianoRoll() {
    const notes = [];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    for (let i = 127; i >= 1; i--) {
        const idx = (i + 8) % 12;
        const octave = Math.floor((i + 8) / 12) - 2;
        notes.push({
            name: noteNames[idx] + octave,
            isBlack: noteNames[idx].includes('#')
        });
    }

    const pianoKeys = document.getElementById('piano-keys');
    notes.forEach(n => {
        const k = document.createElement('div');
        k.className = `key ${n.isBlack ? 'black' : 'white'}`;
        k.textContent = n.name;
        pianoKeys.appendChild(k);
    });

    const grid = document.getElementById('grid');
    grid.style.width = '4000px';
    grid.style.height = notes.length * 20 + 'px';

    notes.forEach((n, i) => {
        const l = document.createElement('div');
        l.className = `grid-line ${n.isBlack ? 'black-note' : 'white-note'}`;
        l.style.top = i * 20 + 'px';
        grid.appendChild(l);
    });

    for (let i = 0; i < 4000 / 30; i++) {
        const l = document.createElement('div');
        l.className = i % 16 === 0 ? 'bar-line' : 'beat-line';
        l.style.left = i * 30 + 'px';
        grid.appendChild(l);
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
    RESIZE_HANDLE: 6
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

function getLocalPos(e, el) {
    const r = el.getBoundingClientRect();
    return {
        x: e.clientX - r.left + el.scrollLeft,
        y: e.clientY - r.top + el.scrollTop
    };
}

// =======================
// Note Factory
// =======================

function createNote({ x, y, noteName }) {
    const n = document.createElement('div');
    n.className = 'note';
    n.style.position = 'absolute';
    n.style.left = x + 'px';
    n.style.top = y + 'px';
    n.style.width = GRID.BEAT_WIDTH + 'px';
    n.style.height = GRID.NOTE_HEIGHT + 'px';
    n.style.background = '#4a9eff';
    n.style.border = '1px solid #2070d0';
    n.dataset.note = noteName;
    return n;
}

// =======================
// Selection
// =======================

const selectedNotes = new Set();

function clearSelection() {
    selectedNotes.forEach(n => n.classList.remove('selected'));
    selectedNotes.clear();
}

function selectExclusive(note) {
    clearSelection();
    selectedNotes.add(note);
    note.classList.add('selected');
}

function toggleSelection(note) {
    if (selectedNotes.has(note)) {
        selectedNotes.delete(note);
        note.classList.remove('selected');
    } else {
        selectedNotes.add(note);
        note.classList.add('selected');
    }
}

// =======================
// Interaction State
// =======================

const state = {
    mode: null,        // drag | resize
    anchor: null,
    startMouseX: 0,
    startMouseY: 0,
    snapshot: []       // frozen list
};

// =======================
// Interaction Logic
// =======================

function extendedKeyPlace() {
    const pianoKeys = document.getElementById('piano-keys');
    const rollArea = document.getElementById('roll-area');
    const grid = document.getElementById('grid');

    rollArea.addEventListener('mousemove', e => {
        const t = e.target;
        if (!t.classList.contains('note')) {
            rollArea.style.cursor = 'default';
            return;
        }
        const r = t.getBoundingClientRect();
        rollArea.style.cursor =
            r.right - e.clientX <= GRID.RESIZE_HANDLE ? 'ew-resize' : 'grab';
    });

    rollArea.addEventListener('mousedown', e => {
        const pos = getLocalPos(e, rollArea);
        const snapped = snapToGrid(pos.x, pos.y);
        const t = e.target;

        if (t.classList.contains('note')) {

            // SELECTION FIRST (CRITICAL)
            if (e.shiftKey) toggleSelection(t);
            else selectExclusive(t);

            const rect = t.getBoundingClientRect();
            state.mode =
                rect.right - e.clientX <= GRID.RESIZE_HANDLE ? 'resize' : 'drag';

            state.anchor = t;
            state.startMouseX = pos.x;
            state.startMouseY = pos.y;

            // FREEZE SNAPSHOT AFTER SELECTION
            state.snapshot = [...selectedNotes].map(n => ({
                note: n,
                left: parseFloat(n.style.left),
                top: parseFloat(n.style.top),
                width: parseFloat(n.style.width)
            }));

            return;
        }

        clearSelection();

        const idx = Math.floor(snapped.y / GRID.NOTE_HEIGHT);
        const noteName = pianoKeys.children[idx]?.textContent;
        if (!noteName) return;

        const n = createNote({ x: snapped.x, y: snapped.y, noteName });
        grid.appendChild(n);
        selectExclusive(n);

        state.mode = 'resize';
        state.anchor = n;
        state.startMouseX = snapped.x;

        state.snapshot = [{
            note: n,
            left: snapped.x,
            top: snapped.y,
            width: GRID.BEAT_WIDTH
        }];
    });

    rollArea.addEventListener('mousemove', e => {
        if (!state.mode) return;

        const pos = getLocalPos(e, rollArea);

        if (state.mode === 'drag') {
            const dx = snapToGrid(pos.x - state.startMouseX, 0).x;
            const dy = snapToGrid(0, pos.y - state.startMouseY).y;

            state.snapshot.forEach(s => {
                s.note.style.left = s.left + dx + 'px';
                s.note.style.top = s.top + dy + 'px';
            });
        }

        if (state.mode === 'resize') {
            const delta =
                snapToGrid(pos.x - state.startMouseX, 0).x;

            state.snapshot.forEach(s => {
                s.note.style.width =
                    Math.max(s.width + delta, GRID.MIN_WIDTH) + 'px';
            });
        }
    });

    rollArea.addEventListener('mouseup', () => {
        state.mode = null;
        state.anchor = null;
        state.snapshot = [];
    });
}

// =======================
// Delete
// =======================

document.addEventListener('keydown', e => {
    if (e.key === "Escape") clearSelection();
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    selectedNotes.forEach(n => n.remove());
    selectedNotes.clear();
});

// =======================
// Init
// =======================

setupPianoRoll();
