// Variables to store state
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
    let tensCount = batch.filter(val => val === 10).length;

    if (tensCount > 0) {
        pendingExplosions = tensCount;
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

// --- Rendering Logic (Updated) ---

function renderDice() {
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

            if (value === 10) die.classList.add('ten');
            if (value === 1) die.classList.add('one');
            
            rowDiv.appendChild(die);
        });

        // --- NEW LOCATION ---
        // If this is the FIRST batch (batchIndex === 0) AND Willpower is spent,
        // add the Ghost Die right here in the same row.
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
    
    // Flatten all batches into one list for calculation
    const allDice = diceBatches.flat();

    let rawSuccesses = 0;
    let onesCount = 0;
    let tenCount = 0;

    allDice.forEach(val => {
        if (val >= difficulty) rawSuccesses++;
        if (val === 1) onesCount++;
        if (val === 10) tenCount++;
    });

    let critBonus = 0;

    if (isSpecialty) {
        // Specialty Rule: Every 10 counts as 2 successes (+1 bonus)
        critBonus = tenCount; 
    } else {
        critBonus = 0; 
    }
    
    const wpBonus = isWillpowerSpent ? 1 : 0;

    let totalSuccesses = (rawSuccesses + critBonus + wpBonus) - onesCount;

    let outcomeHTML = '';

    if (rawSuccesses === 0 && onesCount > 0 && !isWillpowerSpent) {
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