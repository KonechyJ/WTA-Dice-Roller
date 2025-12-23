// Variables to store state
let currentDice = []; 
let isWillpowerSpent = false; // Tracks if user clicked the "Add Success" button

// DOM Elements
const rollBtn = document.getElementById('rollBtn');
const wpSpendBtn = document.getElementById('wpSpendBtn');
const postRollActions = document.getElementById('postRollActions');
const diceContainer = document.getElementById('diceContainer');
const resultText = document.getElementById('resultText');
const dicePoolInput = document.getElementById('dicePool');
const difficultyInput = document.getElementById('difficulty');

// --- Event Listeners ---

rollBtn.addEventListener('click', () => {
    const pool = parseInt(dicePoolInput.value) || 1;
    startNewRoll(pool);
});

wpSpendBtn.addEventListener('click', () => {
    spendWillpower();
});

// --- Core Functions ---

function startNewRoll(pool) {
    // 1. Generate Random Dice
    currentDice = [];
    for (let i = 0; i < pool; i++) {
        currentDice.push(rollD10());
    }

    // 2. Reset State
    isWillpowerSpent = false; 

    // 3. Reset UI
    postRollActions.classList.remove('hidden'); // Show the WP button
    
    // Reset WP Button to "Ready" state
    wpSpendBtn.classList.remove('active');
    wpSpendBtn.innerText = "Spend Willpower (+1 Success)";
    wpSpendBtn.disabled = false; // Re-enable the button for the new roll

    // 4. Render & Calc
    renderDice();
    calculateResults();
}

function spendWillpower() {
    // 1. Set state to spent
    isWillpowerSpent = true;

    // 2. Lock the button immediately
    wpSpendBtn.classList.add('active');
    wpSpendBtn.innerText = "Willpower Spent (+1 Success)";
    wpSpendBtn.disabled = true; // PREVENTS removing it

    // 3. Re-render to show the ghost die and update math
    renderDice();
    calculateResults();
}

function rollD10() {
    return Math.floor(Math.random() * 10) + 1;
}

function renderDice() {
    diceContainer.innerHTML = ''; 

    // 1. Render Rolled Dice
    currentDice.forEach((value) => {
        const die = document.createElement('div');
        die.classList.add('die');
        die.innerText = value;

        // Colors for 1s and 10s
        if (value === 10) die.classList.add('ten');
        if (value === 1) die.classList.add('one');
        
        die.style.cursor = "default";

        diceContainer.appendChild(die);
    });

    // 2. Render Auto Success Die (if active)
    if (isWillpowerSpent) {
        const autoDie = document.createElement('div');
        autoDie.classList.add('die', 'auto-success');
        autoDie.innerHTML = "AUTO<br>SUCC";
        diceContainer.appendChild(autoDie);
    }
}

function calculateResults() {
    const difficulty = parseInt(difficultyInput.value) || 6;
    
    let rawSuccesses = 0;
    let onesCount = 0;
    let tenCount = 0;

    // Scan the rolled dice
    currentDice.forEach(val => {
        if (val >= difficulty) rawSuccesses++;
        if (val === 1) onesCount++;
        if (val === 10) tenCount++;
    });

    // Rule: Pairs of 10s add +1 success
    const critBonus = Math.floor(tenCount / 2);
    
    // Rule: Willpower adds 1 automatic success
    const wpBonus = isWillpowerSpent ? 1 : 0;

    // Total Calculation
    // (Rolled Successes + Crit Bonus + Auto Success) - Ones
    let totalSuccesses = (rawSuccesses + critBonus + wpBonus) - onesCount;

    // --- Result Text Logic ---
    let outcomeHTML = '';

    // Blunder Check logic for W20:
    // If we have 0 raw successes, rolled 1s, and DID NOT spend willpower -> BOTCH
    // Spending WP gives you a success, effectively preventing the Botch.
    if (rawSuccesses === 0 && onesCount > 0 && !isWillpowerSpent) {
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