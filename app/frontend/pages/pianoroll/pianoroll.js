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

const actionStack = [];

function addToActionStack(action, element, ...args) {
    const validActions = ['add', 'remove', 'move', 'lengthen', 'shorten'];
    actionStack.push({ action, element, args });
}

function undo() {

}
function redo() {

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
// Hotkeys
// =======================

const HOTKEYS = {
    MULTI_SELECT: e => e.shiftKey,
    MARQUEE_SELECT: e => e.ctrlKey || e.metaKey,
    DELETE: e => e.key === 'Delete' || e.key === 'Backspace',
    CLEAR_SELECTION: e => e.key === 'Escape' || e.key === 'q' || e.key === 'Q',

    MOVE_UP: e => e.key === 'w' || e.key === 'W',
    MOVE_DOWN: e => e.key === 's' || e.key === 'S',
    MOVE_LEFT: e => e.key === 'a' || e.key === 'A',
    MOVE_RIGHT: e => e.key === 'd' || e.key === 'D',

    UNDO: e => e.key === 'z' || e.key === 'Z',
    REDO: e => e.key === 'y' || e.key === 'Y'
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

function addSelection(note) {
    selectedNotes.add(note);
    note.classList.add('selected');
}

function getNotesInRect(x1, y1, x2, y2) {
    const notes = document.querySelectorAll('.note');
    return Array.from(notes).filter(n => {
        const r = n.getBoundingClientRect();
        return r.left <= x2 && r.right >= x1 && r.top <= y2 && r.bottom >= y1;
    });
}

// =======================
// Interaction State
// =======================

const state = {
    mode: null, // drag | resize | marquee
    startMouseX: 0,
    startMouseY: 0,
    snapshot: [],
    marquee: null
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

        // =======================
        // MARQUEE SELECT (CTRL)
        // =======================

        if (HOTKEYS.MARQUEE_SELECT(e)) {
            state.mode = 'marquee';
            state.startMouseX = pos.x;
            state.startMouseY = pos.y;

            state.marquee = document.createElement('div');
            state.marquee.className = 'marquee';
            state.marquee.style.position = 'absolute';
            state.marquee.style.border = '1px dashed #4a9eff';
            state.marquee.style.background = 'rgba(74,158,255,0.15)';
            grid.appendChild(state.marquee);
            return;
        }

        // =======================
        // CLICK EXISTING NOTE
        // =======================

        if (t.classList.contains('note')) {

            if (!selectedNotes.has(t)) {
                if (HOTKEYS.MULTI_SELECT(e)) addSelection(t);
                else selectExclusive(t);
            }

            const rect = t.getBoundingClientRect();
            state.mode =
                rect.right - e.clientX <= GRID.RESIZE_HANDLE ? 'resize' : 'drag';

            state.startMouseX = pos.x;
            state.startMouseY = pos.y;

            state.snapshot = [...selectedNotes].map(n => ({
                note: n,
                left: parseFloat(n.style.left),
                top: parseFloat(n.style.top),
                width: parseFloat(n.style.width)
            }));
            return;
        }

        // =======================
        // CLICK EMPTY GRID
        // =======================

        if (!HOTKEYS.MULTI_SELECT(e)) clearSelection();

        const idx = Math.floor(snapped.y / GRID.NOTE_HEIGHT);
        const noteName = pianoKeys.children[idx]?.textContent;
        if (!noteName) return;

        const n = createNote({ x: snapped.x, y: snapped.y, noteName });
        grid.appendChild(n);

        if (HOTKEYS.MULTI_SELECT(e)) addSelection(n);
        else selectExclusive(n);

        state.mode = 'resize';
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
            const delta = snapToGrid(pos.x - state.startMouseX, 0).x;
            state.snapshot.forEach(s => {
                s.note.style.width =
                    Math.max(s.width + delta, GRID.MIN_WIDTH) + 'px';
            });
        }

        if (state.mode === 'marquee') {
            const x = Math.min(state.startMouseX, pos.x);
            const y = Math.min(state.startMouseY, pos.y);
            const w = Math.abs(pos.x - state.startMouseX);
            const h = Math.abs(pos.y - state.startMouseY);

            Object.assign(state.marquee.style, {
                left: x + 'px',
                top: y + 'px',
                width: w + 'px',
                height: h + 'px'
            });
        }
    });

    rollArea.addEventListener('mouseup', () => {
        if (state.mode === 'marquee') {
            const r = state.marquee.getBoundingClientRect();
            state.marquee.remove();
            state.marquee = null;

            clearSelection();
            getNotesInRect(r.left, r.top, r.right, r.bottom)
                .forEach(addSelection);
        }

        state.mode = null;
        state.snapshot = [];
    });

}

// =======================
// Delete / Clear / Move
// =======================

document.addEventListener('keydown', e => {
    if (HOTKEYS.CLEAR_SELECTION(e)) clearSelection();

    if (HOTKEYS.DELETE(e)) {
        selectedNotes.forEach(n => n.remove());
        selectedNotes.clear();
        return;
    }

    let dx = 0;
    let dy = 0;

    if (HOTKEYS.MOVE_LEFT(e)) dx = -GRID.BEAT_WIDTH;
    if (HOTKEYS.MOVE_RIGHT(e)) dx = GRID.BEAT_WIDTH;
    if (HOTKEYS.MOVE_UP(e)) dy = -GRID.NOTE_HEIGHT;
    if (HOTKEYS.MOVE_DOWN(e)) dy = GRID.NOTE_HEIGHT;

    if (HOTKEYS.UNDO(e)) undo();
    if (HOTKEYS.REDO(e)) redo();

    if (dx !== 0 || dy !== 0) {
        selectedNotes.forEach(n => {
            n.style.left = parseFloat(n.style.left) + dx + 'px';
            n.style.top = parseFloat(n.style.top) + dy + 'px';
        });
    }
});

// =======================
// Init
// =======================


setupPianoRoll();
