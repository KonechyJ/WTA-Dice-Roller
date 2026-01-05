// --- Core Logic Variables ---
let diceBatches = []; // Array of Arrays: [ [Original], [Explosion 1], [Explosion 2] ]
let isWillpowerSpent = false; 
let pendingExplosions = 0; 

// DOM Elements
const rollBtn = document.getElementById('rollBtn');
const wpSpendBtn = document.getElementById('wpSpendBtn');
const explodeBtn = document.getElementById('explodeBtn'); 
const diceContainer = document.getElementById('diceContainer');
const resultText = document.getElementById('resultText');
const dicePoolInput = document.getElementById('dicePool');
const difficultyInput = document.getElementById('difficulty');
const specialtyToggle = document.getElementById('specialtyToggle');

// --- PDF Drag & Drop Elements ---
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const pdfViewer = document.getElementById('pdfViewer');
const pdfObject = document.getElementById('pdfObject');
const pdfName = document.getElementById('pdfName');
const removePdfBtn = document.getElementById('removePdfBtn');

// --- Sidebar Logic ---
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('closeBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const splitViewToggle = document.getElementById('splitViewToggle');
const secondaryPanel = document.getElementById('secondaryPanel');
const mainContainer = document.getElementById('mainContainer');

// Listen for Toggle Change
splitViewToggle.addEventListener('change', () => {
    if (splitViewToggle.checked) {
        // Turn ON Split View
        secondaryPanel.classList.add('active');
        mainContainer.style.maxWidth = "100%"; // Allow it to fill half the space
        closeSidebar(); // Optional: Close menu so user can see the change
    } else {
        // Turn OFF Split View
        secondaryPanel.classList.remove('active');
        mainContainer.style.maxWidth = "600px"; // Return to focused width
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
overlay.addEventListener('click', closeSidebar); // Close when clicking outside
//------------------------------------------------------------------

// --- Navigation Logic ---
const navButtons = document.querySelectorAll('.nav-item');
const tabPages = document.querySelectorAll('.tab-page');

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // 1. Remove active class from all buttons and pages
        navButtons.forEach(b => b.classList.remove('active'));
        tabPages.forEach(p => p.classList.remove('active'));

        // 2. Add active class to clicked button
        btn.classList.add('active');

        // 3. Show the target page
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});
//--------------------------------------------------------

// --- Event Listeners ---
rollBtn.addEventListener('click', () => {
    const pool = parseInt(dicePoolInput.value) || 1;
    startNewRoll(pool);
});

wpSpendBtn.addEventListener('click', () => {
    spendWillpower();
});

explodeBtn.addEventListener('click', () => {
    triggerExplosion();
});

specialtyToggle.addEventListener('change', () => {
    if (diceBatches.length > 0) {
        calculateResults();
    }
});


// --- Core Functions ---
function startNewRoll(pool) {
    diceBatches = []; 
    isWillpowerSpent = false;
    pendingExplosions = 0;

    // Create First Batch (Original Roll)
    const firstBatch = [];
    for (let i = 0; i < pool; i++) {
        firstBatch.push(rollD10());
    }
    diceBatches.push(firstBatch);

    // Reset UI
    wpSpendBtn.classList.remove('hidden');
    wpSpendBtn.classList.remove('active');
    wpSpendBtn.innerText = "Spend Willpower (+1 Success)";
    wpSpendBtn.disabled = false; 
    
    checkForExplosions(firstBatch);
    renderDice();
    calculateResults();
}

function triggerExplosion() {
    if (pendingExplosions <= 0) return;

    // Roll new dice
    const newBatch = [];
    for (let i = 0; i < pendingExplosions; i++) {
        newBatch.push(rollD10());
    }
    diceBatches.push(newBatch);

    // Reset explosion button
    explodeBtn.classList.add('hidden');
    pendingExplosions = 0;

    checkForExplosions(newBatch);
    renderDice();
    calculateResults();
}

function checkForExplosions(batch) {
    // LOGIC: 1s cancel 10s for the purpose of exploding
    let tens = batch.filter(val => val === 10).length;
    let ones = batch.filter(val => val === 1).length;

    // Net 10s = (Total 10s) - (Total 1s)
    let netTens = Math.max(0, tens - ones);

    if (netTens > 0) {
        pendingExplosions = netTens;
        explodeBtn.innerText = `CRITICAL! Reroll (${pendingExplosions})`;
        explodeBtn.classList.remove('hidden');
    } else {
        explodeBtn.classList.add('hidden');
    }
}

function spendWillpower() {
    isWillpowerSpent = true;
    wpSpendBtn.classList.add('active');
    wpSpendBtn.innerText = "Willpower Spent (+1 Success)";
    wpSpendBtn.disabled = true; 
    renderDice();
    calculateResults();
}

function rollD10() {
    return Math.floor(Math.random() * 10) + 1;
}


// --- Rendering Logic (UPDATED) ---
function renderDice() {
    // We need the difficulty to know which dice to paint Gold
    const difficulty = parseInt(difficultyInput.value) || 6;

    diceContainer.innerHTML = ''; 

    diceBatches.forEach((batch, batchIndex) => {
        
        // Add separator if this is an explosion batch (Index > 0)
        if (batchIndex > 0) {
            const separator = document.createElement('div');
            separator.classList.add('batch-separator');
            diceContainer.appendChild(separator);
        }

        // Create the row
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('dice-batch');

        // Render dice in this batch
        batch.forEach(value => {
            const die = document.createElement('div');
            die.classList.add('die');
            die.innerText = value;

            // COLOR LOGIC
            if (value === 10) {
                die.classList.add('ten'); // Green
            } 
            else if (value === 1) {
                die.classList.add('one'); // Red
            } 
            else if (value >= difficulty) {
                die.classList.add('success'); // NEW: Gold
            }
            
            rowDiv.appendChild(die);
        });

        // If this is the FIRST batch AND Willpower is spent, add the Ghost Die here
        if (batchIndex === 0 && isWillpowerSpent) {
            const autoDie = document.createElement('div');
            autoDie.classList.add('die', 'auto-success');
            autoDie.innerHTML = "AUTO<br>SUCC";
            rowDiv.appendChild(autoDie);
        }

        diceContainer.appendChild(rowDiv);
    });
}


// --- Calculation Logic ---
function calculateResults() {
    const difficulty = parseInt(difficultyInput.value) || 6;
    const isSpecialty = specialtyToggle.checked; 
    
    // Flatten all batches into one list
    const allDice = diceBatches.flat();

    // 1. Tally up the raw counts
    let tensCount = 0;
    let onesCount = 0;
    let otherSuccesses = 0; 

    allDice.forEach(val => {
        if (val === 10) {
            tensCount++;
        } else if (val === 1) {
            onesCount++;
        } else if (val >= difficulty) {
            // These are successes that are neither 10 nor 1
            otherSuccesses++;
        }
    });

    // 2. Determine "Unpaired" 1s
    const unpairedOnes = Math.max(0, onesCount - tensCount);

    // 3. Score the 10s
    let tenSuccessValue = 0;
    if (isSpecialty) {
        tenSuccessValue = tensCount * 2; // Specialty: All 10s = 2 successes
    } else {
        tenSuccessValue = tensCount * 1; // Normal: All 10s = 1 success
    }

    // 4. Willpower
    const wpBonus = isWillpowerSpent ? 1 : 0;

    // 5. Final Sum
    // (Other Successes + Value of All 10s + WP) - (Only Unpaired 1s)
    let totalSuccesses = (otherSuccesses + tenSuccessValue + wpBonus) - unpairedOnes;

    // --- Result Text Logic ---
    let outcomeHTML = '';

    const positiveSuccesses = otherSuccesses + tenSuccessValue + wpBonus;

    if (positiveSuccesses === 0 && unpairedOnes > 0) {
        outcomeHTML = `<span class="blunder-text">BOTCH!</span>`;
    } 
    else if (totalSuccesses > 0) {
        outcomeHTML = `<span class="success-text">${totalSuccesses} Success${totalSuccesses > 1 ? 'es' : ''}</span>`;
    } 
    else {
        outcomeHTML = `<span class="failure-text">Failure</span>`;
    }

    resultText.innerHTML = outcomeHTML;
}

// --- PDF Drag & Drop Logic ---

// 1. Click to Upload
dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        loadPdf(e.target.files[0]);
    }
});

// 2. Drag & Drop Events
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault(); // Necessary to allow dropping
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    if (e.dataTransfer.files.length > 0) {
        loadPdf(e.dataTransfer.files[0]);
    }
});

// 3. Load the PDF Function
function loadPdf(file) {
    if (file.type !== 'application/pdf') {
        alert("Please upload a valid PDF file.");
        return;
    }

    // Create a temporary URL for the file
    const fileURL = URL.createObjectURL(file);

    // Update the DOM
    pdfName.textContent = file.name;
    pdfObject.data = fileURL;

    // Swap Views
    dropZone.classList.add('hidden');
    pdfViewer.classList.remove('hidden');
}

// 4. Remove PDF Function
removePdfBtn.addEventListener('click', () => {
    // Clear the object data to free memory
    pdfObject.data = "";
    
    // Swap Views back
    pdfViewer.classList.add('hidden');
    dropZone.classList.remove('hidden');
    
    // Reset input value so you can re-upload the same file if needed
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