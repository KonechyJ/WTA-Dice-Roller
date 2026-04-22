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
const v5InstructionText = document.getElementById('v5InstructionText');


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

    v5InstructionText.innerText = "";

    const hungerDiceCount = Math.min(pool, hunger);
    const regularDiceCount = pool - hungerDiceCount;

    // 1. Generate Regular Dice
    for (let i = 0; i < regularDiceCount; i++) {
        v5Dice.push({ value: rollD10(), isHunger: false, selected: false });
    }

    // 2. Generate Hunger Dice
    for (let i = 0; i < hungerDiceCount; i++) {
        v5Dice.push({ value: rollD10(), isHunger: true, selected: false });
    }

    // 3. SORTING LOGIC (Only happens on initial roll)
    v5Dice.sort((a, b) => {
        // Rule: Hunger dice always come first (left)
        if (a.isHunger !== b.isHunger) {
            return a.isHunger ? -1 : 1;
        }

        if (a.isHunger) {
            // Hunger Sort: Success (6-10) > Failure (2-5) > Bestial (1)
            const getHungerRank = (val) => {
                if (val >= 6) return 1; // Top priority
                if (val > 1) return 2;  // Mid priority
                return 3;               // Bestial last
            };
            return getHungerRank(a.value) - getHungerRank(b.value);
        } else {
            // Regular Sort: Success (6-10) > Failure (1-5)
            const getRegularRank = (val) => (val >= 6 ? 1 : 2);
            return getRegularRank(a.value) - getRegularRank(b.value);
        }
    });

    // Reset UI Buttons
    v5WpBtn.classList.remove('hidden', 'active');
    v5WpBtn.innerText = "Spend Willpower (Reroll up to 3)";
    v5WpBtn.disabled = regularDiceCount === 0;
    v5ConfirmWpBtn.classList.add('hidden');

    renderV5Dice();
    calculateV5Results();
}

// --- Willpower Reroll Mechanics ---
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
    
    v5Dice.forEach(die => {
        if (die.selected) {
            die.value = rollD10();
            die.selected = false; 
        }
    });

    // Clear the instruction text now that the reroll is done
    v5InstructionText.innerText = "";

    v5ConfirmWpBtn.classList.add('hidden');
    v5WpBtn.classList.remove('hidden');
    v5WpBtn.innerText = "Willpower Spent";
    v5WpBtn.disabled = true;

    renderV5Dice();
    calculateV5Results(); // This will update the successes at the top
}

// --- Willpower Reroll Initialization ---
function initWillpowerSelection() {
    const regularDice = v5Dice.filter(d => !d.isHunger);
    if (regularDice.length === 0) return;

    isSelectingRerolls = true;

    // Show instructions in the NEW white text area
    v5InstructionText.innerText = "Select up to three non-Hunger dice to reroll, then press Confirm.";
    v5InstructionText.style.color = "white"; // Enforcing white as requested

    v5WpBtn.classList.add('hidden');
    v5ConfirmWpBtn.classList.remove('hidden');
    renderV5Dice();
}

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
    // 1. Get Difficulty (Fallback to 1 if the input is hidden or missing)
    const diffElement = document.getElementById('v5Diff');
    const difficulty = (diffElement ? parseInt(diffElement.value) : 1) || 1;
    
    let standardSuccesses = 0;
    let regularTens = 0;
    let hungerTens = 0;
    let hungerOnes = 0;

    // 2. Count the dice
    v5Dice.forEach(die => {
        if (die.value >= 6 && die.value <= 9) standardSuccesses++;
        else if (die.value === 10) {
            if (die.isHunger) hungerTens++;
            else regularTens++;
        } else if (die.value === 1 && die.isHunger) hungerOnes++;
    });

    // 3. V5 Crit Logic (Pairs of 10s = 4 successes)
    const totalTens = regularTens + hungerTens;
    const criticalPairs = Math.floor(totalTens / 2);
    const criticalSuccesses = criticalPairs * 4;
    const singleTens = totalTens % 2;
    const totalSuccesses = standardSuccesses + criticalSuccesses + singleTens;

    // 4. Determine Outcome States
    const isSuccess = totalSuccesses >= difficulty;
    const hasMessyCrit = criticalPairs > 0 && hungerTens > 0;
    const hasHungerOne = hungerOnes > 0;

    // 5. Build Result Message (Ensuring white text)
    // We display total successes regardless of "Success/Failure" status
    let outcomeHTML = `<div style="color: white; font-size: 1.4rem;"><strong>${totalSuccesses} Total Successes</strong></div>`;
    
    let statusMessage = "";
    if (isSuccess) {
        if (hasMessyCrit) statusMessage = "MESSY CRITICAL!";
        else if (criticalPairs > 0) statusMessage = "Critical Success!";
        else if (hasHungerOne) statusMessage = "Success (Hunger 1 Rolled!)";
        else statusMessage = "Success!";
    } else {
        // If they have less than 1 success, check for Bestial Failure
        if (hasHungerOne) statusMessage = "BESTIAL FAILURE!";
        else statusMessage = "Failure";
    }

    outcomeHTML += `<div style="color: white; font-size: 1.1rem; margin-top: 5px; opacity: 0.9;">${statusMessage}</div>`;

    // Final Render to the result div
    v5ResultText.innerHTML = outcomeHTML;
}