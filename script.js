// Variables to store state
let currentDice = []; 
let selectedIndices = new Set(); 
let canSelect = false; // NEW: Tracks if we are allowed to select dice
let hasRerolled = false; // NEW: Tracks if we have used our one reroll

// DOM Elements
const rollBtn = document.getElementById('rollBtn');
const rerollBtn = document.getElementById('rerollBtn');
const diceContainer = document.getElementById('diceContainer');
const resultText = document.getElementById('resultText');
const rerollSection = document.getElementById('rerollSection');
const dicePoolInput = document.getElementById('dicePool');
const difficultyInput = document.getElementById('difficulty');

// --- Event Listeners ---

rollBtn.addEventListener('click', () => {
    const pool = parseInt(dicePoolInput.value) || 1;
    startNewRoll(pool);
});

rerollBtn.addEventListener('click', () => {
    handleRerollButtonClick();
});

// --- Core Functions ---

function startNewRoll(pool) {
    // 1. Generate random numbers
    currentDice = [];
    for (let i = 0; i < pool; i++) {
        currentDice.push(rollD10());
    }

    // 2. Reset State
    selectedIndices.clear();
    canSelect = false;       // Dice are locked by default
    hasRerolled = false;     // Reset reroll tracking
    
    // 3. Reset Button State
    rerollSection.classList.remove('hidden');
    rerollBtn.innerText = "Willpower Reroll";
    rerollBtn.disabled = false; // Button is active immediately to START the process
    rerollBtn.classList.remove('secondary-btn-confirm'); // Remove styling if added

    // 4. Render and Calculate
    renderDice();
    calculateResults();
}

function handleRerollButtonClick() {
    // Phase 1: Activate Selection Mode
    if (!canSelect && !hasRerolled) {
        canSelect = true; // Unlock the dice
        rerollBtn.innerText = "Confirm Reroll (Select Dice First)";
        rerollBtn.disabled = true; // Disable until at least one die is picked
        renderDice(); // Re-render to show hover effects (cursor change)
    } 
    // Phase 2: Execute the Reroll
    else if (canSelect && selectedIndices.size > 0) {
        executeReroll();
    }
}

function rollD10() {
    return Math.floor(Math.random() * 10) + 1;
}

function renderDice() {
    diceContainer.innerHTML = ''; 

    currentDice.forEach((value, index) => {
        const die = document.createElement('div');
        die.classList.add('die');
        die.innerText = value;

        // Visual coloring
        if (value === 10) die.classList.add('ten');
        if (value === 1) die.classList.add('one');

        // Selection styling
        if (selectedIndices.has(index)) {
            die.classList.add('selected');
        }

        // Interaction Logic
        // Only allow clicking if 'canSelect' is true
        if (canSelect) {
            die.style.cursor = "pointer"; // Show hand cursor
            die.addEventListener('click', () => {
                toggleSelection(index);
            });
        } else {
            die.style.cursor = "default"; // Show arrow cursor
        }

        diceContainer.appendChild(die);
    });
}

function toggleSelection(index) {
    if (selectedIndices.has(index)) {
        selectedIndices.delete(index);
    } else {
        selectedIndices.add(index);
    }

    // Update Button Text based on selection
    if (selectedIndices.size > 0) {
        rerollBtn.innerText = "Confirm Reroll";
        rerollBtn.disabled = false;
    } else {
        rerollBtn.innerText = "Confirm Reroll (Select Dice First)";
        rerollBtn.disabled = true;
    }

    renderDice(); 
}

function executeReroll() {
    // Reroll only selected
    selectedIndices.forEach(index => {
        currentDice[index] = rollD10();
    });

    // Lock everything down
    selectedIndices.clear();
    canSelect = false;
    hasRerolled = true; // Mark as used

    // Update Button to "Used" state
    rerollBtn.innerText = "Reroll Used";
    rerollBtn.disabled = true;

    renderDice();
    calculateResults();
}

// --- Mechanics Logic (Same as before) ---

function calculateResults() {
    const difficulty = parseInt(difficultyInput.value) || 6;
    
    let rawSuccesses = 0;
    let onesCount = 0;
    let tenCount = 0;

    currentDice.forEach(val => {
        if (val >= difficulty) rawSuccesses++;
        if (val === 1) onesCount++;
        if (val === 10) tenCount++;
    });

    const critBonus = Math.floor(tenCount / 2);
    let totalSuccesses = (rawSuccesses + critBonus) - onesCount;

    let outcomeHTML = '';

    if (rawSuccesses === 0 && onesCount > 0) {
        outcomeHTML = `<span class="blunder-text">BLUNDER!</span>`;
    } 
    else if (totalSuccesses > 0) {
        outcomeHTML = `<span class="success-text">${totalSuccesses} Success${totalSuccesses > 1 ? 'es' : ''}</span>`;
    } 
    else {
        outcomeHTML = `<span class="failure-text">Failure</span>`;
    }

    resultText.innerHTML = outcomeHTML;
}