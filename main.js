// ==========================================
// main.js - Global UI & Navigation Logic
// ==========================================

// --- Sidebar Logic ---
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('closeBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const splitViewToggle = document.getElementById('splitViewToggle');
const secondaryPanel = document.getElementById('secondaryPanel');
const mainContainer = document.getElementById('mainContainer');

splitViewToggle.addEventListener('change', () => {
    if (splitViewToggle.checked) {
        secondaryPanel.classList.add('active');
        mainContainer.style.maxWidth = "100%";
        closeSidebar(); 
    } else {
        secondaryPanel.classList.remove('active');
        mainContainer.style.maxWidth = "600px";
    }
});

function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
}

function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
}

menuBtn.addEventListener('click', openSidebar);
closeBtn.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);


//Scalable Navigation Logic
// To add new games in the future, just add a nav button with a 'data-target' 
// that matches the ID of your new game page container in the HTML.
const navButtons = document.querySelectorAll('.nav-item');
const tabPages = document.querySelectorAll('.tab-page');

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        tabPages.forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});


//PDF Drag & Drop Logic
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const pdfViewer = document.getElementById('pdfViewer');
const pdfObject = document.getElementById('pdfObject');
const pdfName = document.getElementById('pdfName');
const removePdfBtn = document.getElementById('removePdfBtn');

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) loadPdf(e.target.files[0]);
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault(); 
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) loadPdf(e.dataTransfer.files[0]);
});

function loadPdf(file) {
    if (file.type !== 'application/pdf') {
        alert("Please upload a valid PDF file.");
        return;
    }
    const fileURL = URL.createObjectURL(file);
    pdfName.textContent = file.name;
    pdfObject.data = fileURL;
    dropZone.classList.add('hidden');
    pdfViewer.classList.remove('hidden');
}

removePdfBtn.addEventListener('click', () => {
    pdfObject.data = "";
    pdfViewer.classList.add('hidden');
    dropZone.classList.remove('hidden');
    fileInput.value = "";
});



/* ======================================================
   LEGACY REROLL CODE (Commented Out as requested)
   ======================================================

let selectedIndices = new Set(); 
let canSelect = false; 
let hasRerolled = false;
const rerollBtn = document.getElementById('rerollBtn');
const rerollSection = document.getElementById('rerollSection');

// Event Listener
// rerollBtn.addEventListener('click', () => { handleRerollButtonClick(); });

function handleRerollButtonClick() {
    if (!canSelect && !hasRerolled) {
        canSelect = true; 
        rerollBtn.innerText = "Confirm Reroll (Select Dice First)";
        rerollBtn.disabled = true; 
        renderDice(); 
    } 
    else if (canSelect && selectedIndices.size > 0) {
        executeReroll();
    }
}

function toggleSelection(index) {
    if (selectedIndices.has(index)) {
        selectedIndices.delete(index);
    } else {
        selectedIndices.add(index);
    }
    // Update button...
    renderDice(); 
}

function executeReroll() {
    selectedIndices.forEach(index => {
        currentDice[index] = rollD10();
    });
    selectedIndices.clear();
    canSelect = false;
    hasRerolled = true; 
    renderDice();
    calculateResults();
}
====================================================== */