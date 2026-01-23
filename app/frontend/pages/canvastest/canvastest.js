console.log('Loaded canvastest.js');


const editorConfig = {
    keyWidth: 90,
    keyHeight: 25,
    keys: 48,                 // number of piano rows
    notesPerMeasure: 16,
    measures: 1,
    gridColor: "#444",
    gridBoldColor: "#666",
    whiteKey: "#9b9b9bff",
    blackKey: "#141414",
    background: "#111",
    noteColor: "#5e6df3ff"
};

const c = document.getElementById('editorCanvas');
const ctx = c.getContext('2d');

function handleResize() {
    c.width = window.innerWidth;
    c.height = editorConfig.keys * editorConfig.keyHeight;
}

const notes = []; // each note: {x, y, width, height}
let dragNote = null;     // the note being moved
let placingNote = false; // currently dragging a new note
let dragStart = { x: 0, y: 0 }; // starting coords for preview
let previewNote = null;  // temporary note preview



window.addEventListener('resize', handleResize);
handleResize();

function isBlackKey(note) {
    return [1, 3, 6, 8, 10].includes(note % 12);
}


function drawKeys() {
    for (let i = 0; i < editorConfig.keys; i++) {
        const y = i * editorConfig.keyHeight;
        const black = isBlackKey(editorConfig.keys - i);

        ctx.fillStyle = black ? editorConfig.blackKey : editorConfig.whiteKey;
        ctx.fillRect(
            0,
            y,
            editorConfig.keyWidth,
            editorConfig.keyHeight
        );

        ctx.strokeStyle = "#000";
        ctx.strokeRect(
            0,
            y,
            editorConfig.keyWidth,
            editorConfig.keyHeight
        );
    }
}

function drawGrid() {
    const offsetX = editorConfig.keyWidth;
    const totalNotes = editorConfig.notesPerMeasure * editorConfig.measures;
    const noteWidth = (c.width - offsetX) / totalNotes;

    // background
    ctx.fillStyle = editorConfig.background;
    ctx.fillRect(offsetX, 0, c.width, c.height);

    // horizontal lines (notes)
    for (let i = 0; i <= editorConfig.keys; i++) {
        ctx.strokeStyle = editorConfig.gridColor;
        ctx.beginPath();
        ctx.moveTo(offsetX, i * editorConfig.keyHeight);
        ctx.lineTo(c.width, i * editorConfig.keyHeight);
        ctx.stroke();
    }

    // vertical lines (beats / measures)
    for (let i = 0; i <= totalNotes; i++) {
        const x = offsetX + i * noteWidth;
        const isMeasure = i % editorConfig.notesPerMeasure === 0;

        ctx.strokeStyle = isMeasure
            ? editorConfig.gridBoldColor
            : editorConfig.gridColor;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, c.height);
        ctx.stroke();
    }
}

function drawNotes() {
    ctx.fillStyle = editorConfig.noteColor;
    for (const n of notes) {
        ctx.fillRect(n.x, n.y, n.width, n.height);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(n.x, n.y, n.width, n.height);
    }

    // draw preview note if dragging
    if (previewNote) {
        ctx.fillStyle = editorConfig.noteColor + "88"; // semi-transparent
        ctx.fillRect(previewNote.x, previewNote.y, previewNote.width, previewNote.height);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(previewNote.x, previewNote.y, previewNote.width, previewNote.height);
    }
}

function snapToGrid(x, y, width = 0) {
    const offsetX = editorConfig.keyWidth;
    const totalNotes = editorConfig.notesPerMeasure * editorConfig.measures;
    const noteWidth = (c.width - offsetX) / totalNotes;

    // Snap column
    let col = Math.floor((x - offsetX + noteWidth / 2) / noteWidth);
    col = Math.max(0, Math.min(col, totalNotes - 1));
    const snappedX = offsetX + col * noteWidth;

    // Snap width to at least one column
    let snappedWidth = width;
    if (snappedWidth === 0) snappedWidth = noteWidth;

    // Snap row
    let row = Math.floor(y / editorConfig.keyHeight);
    row = Math.max(0, Math.min(row, editorConfig.keys - 1));
    const snappedY = row * editorConfig.keyHeight;

    return {
        x: snappedX,
        y: snappedY,
        width: snappedWidth,
        height: editorConfig.keyHeight
    };
}
function placeNote(x, y, width = 0, commit = true) {
    const snapped = snapToGrid(x, y, width);

    if (commit) {
        notes.push(snapped);
        return null;
    } else {
        // For preview purposes only
        return snapped;
    }
}



c.addEventListener("mousedown", (e) => {
    const rect = c.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const offsetX = editorConfig.keyWidth;
    if (mouseX < offsetX) return;

    // Check if clicked on existing note (start move)
    dragNote = notes.find(n =>
        mouseX >= n.x &&
        mouseX <= n.x + n.width &&
        mouseY >= n.y &&
        mouseY <= n.y + n.height
    );

    if (dragNote) {
        dragStart.x = mouseX - dragNote.x;
        dragStart.y = mouseY - dragNote.y;
    } else {
        placingNote = true;
        dragStart.x = mouseX;
        dragStart.y = mouseY;
        previewNote = placeNote(mouseX, mouseY, 0, false); // preview
    }
});

c.addEventListener("mousemove", (e) => {
    const rect = c.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const offsetX = editorConfig.keyWidth;
    const totalNotes = editorConfig.notesPerMeasure * editorConfig.measures;
    const noteWidth = (c.width - offsetX) / totalNotes;

    if (dragNote) {
        if (window.User.keys["i"]) { // inspect
            console.log(dragNote);
        }
        // shift for editing width
        if (window.User.keys["Shift"]) {
            const snapped = snapToGrid(mouseX - dragStart.x, mouseY - dragStart.y, dragNote.width);
            dragNote.width = snapped.width;
        } else {
            const snapped = snapToGrid(mouseX - dragStart.x, mouseY - dragStart.y, dragNote.width);
            dragNote.x = snapped.x;
            dragNote.y = snapped.y;
        }

    } else if (placingNote) {
        const startCol = Math.floor((dragStart.x - offsetX) / noteWidth);
        const currentCol = Math.floor((mouseX - offsetX) / noteWidth);
        const colStart = Math.min(startCol, currentCol);
        const colEnd = Math.max(startCol, currentCol);
        const width = (colEnd - colStart + 1) * noteWidth;

        previewNote = placeNote(offsetX + colStart * noteWidth, mouseY, width, false);
    }
});



c.addEventListener("mouseup", (e) => {
    if (placingNote && previewNote) {
        placeNote(previewNote.x, previewNote.y, previewNote.width, true);
    }

    dragNote = null;
    placingNote = false;
    previewNote = null;
});



function frame() {
    ctx.clearRect(0, 0, c.width, c.height);

    drawKeys();
    drawGrid();
    drawNotes();     // draw placed notes

    requestAnimationFrame(frame);
}
frame();
