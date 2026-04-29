// ==========================================
// w20.js - Werewolf: The Apocalypse Logic
// ==========================================

// Core Logic Variables
let diceBatches = []; 
let isWillpowerSpent = false; 
let pendingExplosions = 0; 

// Split Action State
let isSplitSequenceActive = false;
let isSplitFinished = false; 
let currentSplitStep = 0; 
let totalSplitActions = 0;
let lastRolledSplitStep = 0; 

// NEW: Stores the data for every split step { step: { batches: [], wpSpent: bool } }
let splitDiceHistory = {}; 

// --- DOM Elements ---
const rollBtn = document.getElementById('rollBtn');
const wpSpendBtn = document.getElementById('wpSpendBtn');
const explodeBtn = document.getElementById('explodeBtn'); 
const diceContainer = document.getElementById('diceContainer');
const resultText = document.getElementById('resultText');
const dicePoolInput = document.getElementById('dicePool');
const difficultyInput = document.getElementById('difficulty');
const specialtyToggle = document.getElementById('specialtyToggle');

// Split Action Elements
const splitActionToggle = document.getElementById('splitActionToggle');
const splitInputContainer = document.getElementById('splitInputContainer');
const splitActionIndex = document.getElementById('splitActionIndex');

// --- Event Listeners ---

// 1. Split Toggle Logic
splitActionToggle.addEventListener('change', () => {
    if (splitActionToggle.checked) {
        splitInputContainer.classList.remove('hidden');
    } else {
        cancelSplitSequence(); 
    }
});

// 2. Main Roll Button
rollBtn.addEventListener('click', () => {
    
    // If sequence is finished, clicking this button just resets the board
    if (isSplitFinished) {
        finishSplitSequence();
        return;
    }

    // BRANCH A: Normal Roll
    if (!splitActionToggle.checked) {
        const pool = parseInt(dicePoolInput.value) || 1;
        startNewRoll(pool);
        return;
    }

    // BRANCH B: Split Action Logic
    const requestedActions = parseInt(splitActionIndex.value) || 1;
    
    // If sequence hasn't started yet, initialize it
    if (!isSplitSequenceActive) {
        startSplitSequence(requestedActions);
    } 
    
    // Perform the roll for the CURRENT step
    performSplitStepRoll();
});

// 3. Post-Roll Actions
wpSpendBtn.addEventListener('click', spendWillpower);
explodeBtn.addEventListener('click', triggerExplosion);

specialtyToggle.addEventListener('change', () => {
    // If we have any dice (normal or split history), recalc results
    if (diceBatches.length > 0 || isSplitSequenceActive) {
        calculateResults(isSplitSequenceActive);
    }
});


// --- SPLIT ACTION LOGIC ---

function startSplitSequence(numActions) {
    isSplitSequenceActive = true;
    isSplitFinished = false;
    totalSplitActions = numActions;
    currentSplitStep = 1; 
    lastRolledSplitStep = 0;
    splitDiceHistory = {}; // Clear history for new sequence

    // Lock ONLY the action count
    splitActionIndex.disabled = true; 
    
    createSplitSlots(numActions);
}

function createSplitSlots(count) {
    diceContainer.innerHTML = ''; 
    const wrapper = document.createElement('div');
    wrapper.classList.add('split-slots-container');

    for (let i = 1; i <= count; i++) {
        const slot = document.createElement('div');
        slot.classList.add('action-slot');
        slot.id = `action-slot-${i}`;
        
        const label = document.createElement('span');
        label.classList.add('slot-label');
        label.innerText = `Action ${i}`;
        
        const info = document.createElement('span');
        info.classList.add('slot-info');
        info.innerText = `Penalty: -${i} dice`;

        const content = document.createElement('div');
        content.classList.add('slot-content');
        content.id = `slot-content-${i}`;

        slot.appendChild(label);
        slot.appendChild(info);
        slot.appendChild(content);
        wrapper.appendChild(slot);
    }
    diceContainer.appendChild(wrapper);
}

function performSplitStepRoll() {
    // Highlight current slot
    const currentSlot = document.getElementById(`action-slot-${currentSplitStep}`);
    const previousSlot = document.getElementById(`action-slot-${currentSplitStep - 1}`);
    
    if (previousSlot) {
        previousSlot.classList.remove('active');
        previousSlot.classList.add('completed');
    }
    currentSlot.classList.add('active');

    // Calculate Dice Pool
    const basePool = parseInt(dicePoolInput.value) || 1;
    const penalty = currentSplitStep; 
    let actualPool = basePool - penalty;

    // Safety Check
    if (actualPool <= 0) {
        const slotContent = document.getElementById(`slot-content-${currentSplitStep}`);
        slotContent.innerHTML = `<span class="blunder-text">Pool reduced to 0!</span>`;
        
        // Record empty history for this step so loop doesn't break
        splitDiceHistory[currentSplitStep] = { batches: [], wpSpent: false };
        
        advanceSplitStep(); 
        return;
    }

    // Roll with "isSplitContext = true"
    startNewRoll(actualPool, true); 
}

function advanceSplitStep() {
    currentSplitStep++;

    // Check if we went past the last action
    if (currentSplitStep > totalSplitActions) {
        isSplitFinished = true;
        rollBtn.innerText = "FINISH SEQUENCE";
    } else {
        rollBtn.innerText = `ROLL ACTION ${currentSplitStep}`;
    }
}

function finishSplitSequence() {
    isSplitSequenceActive = false;
    isSplitFinished = false;
    currentSplitStep = 0;
    lastRolledSplitStep = 0;
    splitDiceHistory = {};
    diceBatches = []; // Clear the global dice var

    // Hide Buttons (FIX for bug where buttons lingered)
    wpSpendBtn.classList.add('hidden');
    explodeBtn.classList.add('hidden');
    
    // Unlock and Reset UI
    splitActionIndex.disabled = false;
    rollBtn.innerText = "ROLL";
    splitActionToggle.checked = false;
    splitInputContainer.classList.add('hidden');
    
    diceContainer.innerHTML = ''; 
    resultText.innerHTML = '';
}

function cancelSplitSequence() {
    finishSplitSequence(); // Reuse cleanup logic
}


// --- CORE ROLL FUNCTIONS ---

function startNewRoll(pool, isSplitContext = false) {
    diceBatches = []; 
    isWillpowerSpent = false;
    pendingExplosions = 0;

    const firstBatch = [];
    for (let i = 0; i < pool; i++) firstBatch.push(rollD10());
    diceBatches.push(firstBatch);

    wpSpendBtn.classList.remove('hidden');
    wpSpendBtn.classList.remove('active');
    wpSpendBtn.innerText = "Spend Willpower (+1 Success)";
    wpSpendBtn.disabled = false; 
    
    checkForExplosions(firstBatch);
    
    if (isSplitContext) {
        lastRolledSplitStep = currentSplitStep;
        
        // Save to History (Using Reference to diceBatches array)
        splitDiceHistory[currentSplitStep] = { 
            batches: diceBatches, 
            wpSpent: isWillpowerSpent 
        };
        
        renderDiceToSlot(); 
        calculateResults(true); 
        advanceSplitStep(); 
    } else {
        renderDice(); 
        calculateResults();
    }
}

function renderDiceToSlot() {
    const slotContent = document.getElementById(`slot-content-${lastRolledSplitStep}`);
    if (!slotContent) return;

    slotContent.innerHTML = ''; 

    diceBatches.forEach((batch, batchIndex) => {
        if (batchIndex > 0) {
            const separator = document.createElement('div');
            separator.classList.add('batch-separator');
            slotContent.appendChild(separator);
        }

        const rowDiv = document.createElement('div');
        rowDiv.classList.add('dice-batch');

        batch.forEach(value => {
            const die = document.createElement('div');
            die.classList.add('die');
            die.innerText = value;
            
            const difficulty = parseInt(difficultyInput.value) || 6;
            
            if (value === 10) die.classList.add('ten');
            else if (value === 1) die.classList.add('one');
            else if (value >= difficulty) die.classList.add('success');
            
            rowDiv.appendChild(die);
        });

        if (batchIndex === 0 && isWillpowerSpent) {
            const autoDie = document.createElement('div');
            autoDie.classList.add('die', 'auto-success');
            autoDie.innerHTML = "AUTO<br>SUCC";
            rowDiv.appendChild(autoDie);
        }
        slotContent.appendChild(rowDiv);
    });
}

function renderDice() {
    const difficulty = parseInt(difficultyInput.value) || 6;
    diceContainer.innerHTML = ''; 

    diceBatches.forEach((batch, batchIndex) => {
        if (batchIndex > 0) {
            const separator = document.createElement('div');
            separator.classList.add('batch-separator');
            diceContainer.appendChild(separator);
        }
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('dice-batch');
        batch.forEach(value => {
            const die = document.createElement('div');
            die.classList.add('die');
            die.innerText = value;
            if (value === 10) die.classList.add('ten');
            else if (value === 1) die.classList.add('one');
            else if (value >= difficulty) die.classList.add('success');
            rowDiv.appendChild(die);
        });
        if (batchIndex === 0 && isWillpowerSpent) {
            const autoDie = document.createElement('div');
            autoDie.classList.add('die', 'auto-success');
            autoDie.innerHTML = "AUTO<br>SUCC";
            rowDiv.appendChild(autoDie);
        }
        diceContainer.appendChild(rowDiv);
    });
}

function calculateResults(isSplitContext = false) {
    // Helper function to calculate one set of dice
    const calcScore = (batches, wpSpent) => {
        const difficulty = parseInt(difficultyInput.value) || 6;
        const isSpecialty = specialtyToggle.checked; 
        const allDice = batches.flat();

        let tensCount = 0;
        let onesCount = 0;
        let otherSuccesses = 0; 

        allDice.forEach(val => {
            if (val === 10) tensCount++;
            else if (val === 1) onesCount++;
            else if (val >= difficulty) otherSuccesses++;
        });

        const unpairedOnes = Math.max(0, onesCount - tensCount);
        let tenSuccessValue = isSpecialty ? tensCount * 2 : tensCount * 1;
        const wpBonus = wpSpent ? 1 : 0;
        let totalSuccesses = (otherSuccesses + tenSuccessValue + wpBonus) - unpairedOnes;

        const positiveSuccesses = otherSuccesses + tenSuccessValue + wpBonus;
        
        let outcomeHTML = '';
        if (positiveSuccesses === 0 && unpairedOnes > 0) {
            outcomeHTML = `<span class="blunder-text">BOTCH!</span>`;
        } else if (totalSuccesses > 0) {
            outcomeHTML = `<span class="success-text">${totalSuccesses} Success${totalSuccesses > 1 ? 'es' : ''}</span>`;
        } else {
            outcomeHTML = `<span class="failure-text">Failure</span>`;
        }
        return outcomeHTML;
    };

    if (isSplitContext) {
        // NEW LOGIC: Loop through HISTORY and update ALL slots
        Object.keys(splitDiceHistory).forEach(stepKey => {
            const stepData = splitDiceHistory[stepKey];
            if (stepData && stepData.batches.length > 0) {
                const result = calcScore(stepData.batches, stepData.wpSpent);
                const slotInfo = document.querySelector(`#action-slot-${stepKey} .slot-info`);
                if(slotInfo) slotInfo.innerHTML = result; 
            }
        });
    } else {
        // Normal Mode
        const result = calcScore(diceBatches, isWillpowerSpent);
        resultText.innerHTML = result;
    }
}

function triggerExplosion() {
    if (pendingExplosions <= 0) return;
    const newBatch = [];
    for (let i = 0; i < pendingExplosions; i++) newBatch.push(rollD10());
    diceBatches.push(newBatch);
    explodeBtn.classList.add('hidden');
    pendingExplosions = 0;
    checkForExplosions(newBatch);
    
    if (isSplitSequenceActive) {
        // Update history for the current slot with new batch
        // Since `diceBatches` is passed by reference, `splitDiceHistory` might already be updated,
        // but explicit assignment is safer if structure changed.
        // Actually, since batches is an array and we pushed to it, history is updated.
        
        renderDiceToSlot();
        calculateResults(true);
    } else {
        renderDice();
        calculateResults();
    }
}

function checkForExplosions(batch) {
    let tens = batch.filter(val => val === 10).length;
    let ones = batch.filter(val => val === 1).length;
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
    
    if (isSplitSequenceActive) {
        // Update History Tracking
        if(splitDiceHistory[lastRolledSplitStep]) {
            splitDiceHistory[lastRolledSplitStep].wpSpent = true;
        }
        
        renderDiceToSlot();
        calculateResults(true);
    } else {
        renderDice();
        calculateResults();
    }
}

function rollD10() {
    return Math.floor(Math.random() * 10) + 1;
}
