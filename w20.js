// ==========================================
// w20.js - Werewolf: The Apocalypse Logic
// ==========================================

// Core Logic Variables
let diceBatches = []; 
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

// Event Listeners
rollBtn.addEventListener('click', () => startNewRoll(parseInt(dicePoolInput.value) || 1));
wpSpendBtn.addEventListener('click', spendWillpower);
explodeBtn.addEventListener('click', triggerExplosion);
specialtyToggle.addEventListener('change', () => {
    if (diceBatches.length > 0) calculateResults();
});

// Core Functions
function startNewRoll(pool) {
    diceBatches = []; 
    isWillpowerSpent = false;
    pendingExplosions = 0;

    const firstBatch = [];
    for (let i = 0; i < pool; i++) firstBatch.push(rollD10());
    diceBatches.push(firstBatch);

    wpSpendBtn.classList.remove('hidden', 'active');
    wpSpendBtn.innerText = "Spend Willpower (+1 Success)";
    wpSpendBtn.disabled = false; 
    
    checkForExplosions(firstBatch);
    renderDice();
    calculateResults();
}

function triggerExplosion() {
    if (pendingExplosions <= 0) return;

    const newBatch = [];
    for (let i = 0; i < pendingExplosions; i++) newBatch.push(rollD10());
    diceBatches.push(newBatch);

    explodeBtn.classList.add('hidden');
    pendingExplosions = 0;

    checkForExplosions(newBatch);
    renderDice();
    calculateResults();
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
    renderDice();
    calculateResults();
}

function rollD10() {
    return Math.floor(Math.random() * 10) + 1;
}

// Rendering Logic
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

// Calculation Logic
function calculateResults() {
    const difficulty = parseInt(difficultyInput.value) || 6;
    const isSpecialty = specialtyToggle.checked; 
    const allDice = diceBatches.flat();

    let tensCount = 0;
    let onesCount = 0;
    let otherSuccesses = 0; 

    allDice.forEach(val => {
        if (val === 10) tensCount++;
        else if (val === 1) onesCount++;
        else if (val >= difficulty) otherSuccesses++;
    });

    const unpairedOnes = Math.max(0, onesCount - tensCount);
    let tenSuccessValue = isSpecialty ? (tensCount * 2) : (tensCount * 1);
    const wpBonus = isWillpowerSpent ? 1 : 0;
    let totalSuccesses = (otherSuccesses + tenSuccessValue + wpBonus) - unpairedOnes;

    let outcomeHTML = '';
    const positiveSuccesses = otherSuccesses + tenSuccessValue + wpBonus;

    if (positiveSuccesses === 0 && unpairedOnes > 0) {
        outcomeHTML = `<span class="blunder-text">BOTCH!</span>`;
    } else if (totalSuccesses > 0) {
        outcomeHTML = `<span class="success-text">${totalSuccesses} Success${totalSuccesses > 1 ? 'es' : ''}</span>`;
    } else {
        outcomeHTML = `<span class="failure-text">Failure</span>`;
    }

    resultText.innerHTML = outcomeHTML;
}

