const dwQtyInput = document.getElementById('dwQty');
const dwTypeSelect = document.getElementById('dwType');
const dwTargetInput = document.getElementById('dwTarget');
const dwRollBtn = document.getElementById('dwRollBtn');
const dwResultText = document.getElementById('dwResultText');

// Hide target input if not rolling d100 for a cleaner UI
dwTypeSelect.addEventListener('change', () => {
    const targetSection = document.getElementById('dwTargetSection');
    targetSection.style.display = dwTypeSelect.value === "100" ? "block" : "none";
});

dwRollBtn.addEventListener('click', () => {
    let qty = parseInt(dwQtyInput.value) || 1;
    const sides = parseInt(dwTypeSelect.value);
    const target = parseInt(dwTargetInput.value) || 50;

    // Enforce the max limit of 20
    if (qty > 20) qty = 20;
    if (qty < 1) qty = 1;

    let rolls = [];
    let total = 0;

    for (let i = 0; i < qty; i++) {
        const roll = Math.floor(Math.random() * sides) + 1;
        rolls.push(roll);
        total += roll;
    }

    // Build the Result UI
    let resultHTML = `<div style="font-size: 1rem; color: #aaa; margin-bottom: 10px;">Results: ${rolls.join(', ')}</div>`;
    resultHTML += `<div style="font-size: 2rem; margin-bottom: 10px;">Total: <strong>${total}</strong></div>`;

    // Special Logic for single d100 (Deathwatch Success/Failure)
    if (sides === 100 && qty === 1) {
        const roll = rolls[0];
        const targetTens = Math.floor(target / 10);
        const rollTens = Math.floor(roll / 10);

        if (roll <= target) {
            let dos = Math.max(1, (targetTens - rollTens) + 1);
            resultHTML += `<div style="color: #4CAF50; font-weight: bold;">SUCCESS (${dos} DoS)</div>`;
        } else {
            let dof = Math.max(1, (rollTens - targetTens) + 1);
            resultHTML += `<div style="color: #F44336; font-weight: bold;">FAILURE (${dof} DoF)</div>`;
        }
    }

    dwResultText.innerHTML = resultHTML;
});