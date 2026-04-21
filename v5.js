// ==========================================
// v5.js - Vampire: The Masquerade V5 Logic
// ==========================================

// --- Core State Variables ---
let v5Dice = []; // Array of objects: { value: number, isHunger: boolean, selected: boolean }
let isV5WillpowerSpent = false;
let isSelectingRerolls = false;

// --- DOM Elements ---
const v5PoolInput = document.getElementById('v5Pool');
const v5HungerInput = document.getElementById('v5Hunger');
const v5DiffInput = document.getElementById('v5Diff');
const v5RollBtn = document.getElementById('v5RollBtn');
const v5WpBtn = document.getElementById('v5WpBtn');
const v5ConfirmWpBtn = document.getElementById('v5ConfirmWpBtn');
const v5DiceContainer = document.getElementById('v5DiceContainer');
const v5ResultText = document.getElementById('v5ResultText');

// --- Event Listeners ---
v5RollBtn.addEventListener('click', () => {
    const pool = parseInt(v5PoolInput.value) || 1;
    const hunger = parseInt(v5HungerInput.value) || 0;
    startV5Roll(pool, hunger);
});

v5WpBtn.addEventListener('click', initWillpowerSelection);
v5ConfirmWpBtn.addEventListener('click', executeWillpowerReroll);

// --- Core Logic ---

function rollD10() {
    return Math.floor(Math.random() * 10) + 1;
}

function startV5Roll(pool, hunger) {
    v5Dice = [];
    isV5WillpowerSpent = false;
    isSelectingRerolls = false;

    // Calculate how many dice are Hunger vs Regular
    // Hunger dice cannot exceed the total pool size
    const hungerDiceCount = Math.min(pool, hunger);
    const regularDiceCount = pool - hungerDiceCount;

    // Roll Regular Dice
    for (let i = 0; i < regularDiceCount; i++) {
        v5Dice.push({ value: rollD10(), isHunger: false, selected: false });
    }

    // Roll Hunger Dice
    for (let i = 0; i < hungerDiceCount; i++) {
        v5Dice.push({ value: rollD10(), isHunger: true, selected: false });
    }

    // Reset UI Buttons
    v5WpBtn.classList.remove('hidden', 'active');
    v5WpBtn.innerText = "Spend Willpower (Reroll up to 3)";
    v5WpBtn.disabled = regularDiceCount === 0; // Disable if no regular dice to reroll
    v5ConfirmWpBtn.classList.add('hidden');

    renderV5Dice();
    calculateV5Results();
}

// --- Willpower Reroll Mechanics ---

function initWillpowerSelection() {
    isSelectingRerolls = true;
    v5WpBtn.classList.add('hidden');
    v5ConfirmWpBtn.classList.remove('hidden');
    v5ResultText.innerHTML = `<span style="color: #42a5f5;">Select up to 3 Regular Dice to reroll...</span>`;
    renderV5Dice(); // Re-render to show selectable styling
}

function toggleDieSelection(index) {
    if (!isSelectingRerolls || v5Dice[index].isHunger) return; // Cannot select hunger dice

    const currentlySelected = v5Dice.filter(d => d.selected).length;

    // Toggle logic: If already selected, deselect. If not, select (up to max 3).
    if (v5Dice[index].selected) {
        v5Dice[index].selected = false;
    } else if (currentlySelected < 3) {
        v5Dice[index].selected = true;
    }
    renderV5Dice();
}

function executeWillpowerReroll() {
    isSelectingRerolls = false;
    isV5WillpowerSpent = true;
    
    // Reroll the selected dice
    v5Dice.forEach(die => {
        if (die.selected) {
            die.value = rollD10();
            die.selected = false; // clear selection after roll
        }
    });

    // Update UI
    v5ConfirmWpBtn.classList.add('hidden');
    v5WpBtn.classList.remove('hidden');
    v5WpBtn.innerText = "Willpower Spent";
    v5WpBtn.disabled = true;

    renderV5Dice();
    calculateV5Results();
}

// --- Rendering ---

// --- Rendering ---
// --- Rendering ---
function renderV5Dice() {
    v5DiceContainer.innerHTML = '';
    
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('dice-batch');

    v5Dice.forEach((die, index) => {
        const dieElement = document.createElement('div');
        dieElement.classList.add('die', 'v5');
        
        // 1. Determine Type
        if (die.isHunger) {
            dieElement.classList.add('hunger');
        } else {
            dieElement.classList.add('normal');
        }

        // 2. Determine Value / Inject Images
        if (die.value === 10) {
            dieElement.classList.add('success', 'critical');
            if (die.isHunger) {
                dieElement.innerHTML = `<img src="Images/HungerCrit.png" class="dice-img" alt="Hunger Critical">`;
            } else {
                dieElement.innerHTML = `<img src="Images/Crit.png" class="dice-img" alt="Normal Critical">`;
            }
        } 
        else if (die.value >= 6) {
            dieElement.classList.add('success');
            if (die.isHunger) {
                dieElement.innerHTML = `<img src="Images/HungerSuccess.png" class="dice-img" alt="Hunger Success">`;
            } else {
                dieElement.innerHTML = `<img src="Images/success.png" class="dice-img" alt="Normal Success">`;
            }
        } 
        else {
            // Failure (5 or below)
            if (die.isHunger && die.value === 1) {
                // Bestial Failure! 
                dieElement.classList.add('bestial');
                dieElement.innerHTML = `<img src="Images/beast.png" class="dice-img" alt="Bestial Failure">`;
            } else {
                // Standard Failure
                dieElement.classList.add('failure');
                dieElement.innerHTML = '&bull;';
            }
        }

        // 3. Selection Styling Logic (Willpower Rerolls)
        if (isSelectingRerolls && !die.isHunger) {
            dieElement.classList.add('selectable');
            dieElement.addEventListener('click', () => toggleDieSelection(index));
        }

        if (die.selected) {
            dieElement.classList.add('selected');
        }

        rowDiv.appendChild(dieElement);
    });

    v5DiceContainer.appendChild(rowDiv);
}
// --- Calculation Logic ---

function calculateV5Results() {
    const difficulty = parseInt(v5DiffInput.value) || 1; // Default to needing 1 success
    
    let standardSuccesses = 0;
    let regularTens = 0;
    let hungerTens = 0;
    let hungerOnes = 0;

    // Tally the dice
    v5Dice.forEach(die => {
        if (die.value >= 6 && die.value <= 9) {
            standardSuccesses++;
        } else if (die.value === 10) {
            if (die.isHunger) hungerTens++;
            else regularTens++;
        } else if (die.value === 1 && die.isHunger) {
            hungerOnes++;
        }
    });

    // Calculate Criticals (Pairs of 10s)
    const totalTens = regularTens + hungerTens;
    const criticalPairs = Math.floor(totalTens / 2);
    
    // Each pair of 10s is worth 4 successes total (+2 standard, +2 bonus)
    const criticalSuccesses = criticalPairs * 4; 
    
    // Unpaired 10s are just worth 1 success
    const unpairedTens = totalTens % 2; 

    const totalSuccesses = standardSuccesses + criticalSuccesses + unpairedTens;

    // Determine Status Effects
    const isSuccess = totalSuccesses >= difficulty;
    const hasMessyCrit = criticalPairs > 0 && hungerTens > 0;
    const hasHungerOne = hungerOnes > 0;

    // Format the Output Text
    let outcomeHTML = `<div><strong>${totalSuccesses} Success${totalSuccesses !== 1 ? 'es' : ''}</strong> (vs Diff ${difficulty})</div>`;
    
    if (isSuccess) {
        if (hasMessyCrit) {
            outcomeHTML += `<div class="blunder-text" style="color: #ff5252; font-size: 1.2rem;">MESSY CRITICAL!</div>`;
        } else if (criticalPairs > 0) {
            outcomeHTML += `<div class="success-text" style="font-size: 1.2rem;">Critical Success!</div>`;
        } else if (hasHungerOne) {
            // Your special request: Success but with a Hunger 1
            outcomeHTML += `<div style="color: #ffa500; font-size: 1.2rem;">Success <em>(Hunger 1 Rolled - Messy Situation!)</em></div>`;
        } else {
            outcomeHTML += `<div class="success-text" style="font-size: 1.2rem;">Success!</div>`;
        }
    } else {
        if (hasHungerOne) {
            outcomeHTML += `<div class="blunder-text" style="color: #b71c1c; font-size: 1.2rem;">BESTIAL FAILURE!</div>`;
        } else {
            outcomeHTML += `<div class="failure-text" style="font-size: 1.2rem;">Failure</div>`;
        }
    }

    v5ResultText.innerHTML = outcomeHTML;
}