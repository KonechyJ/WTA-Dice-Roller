// 1. Database Loading Logic

// In details.js
const root = document.getElementById('v5-details-accordion-root');

async function loadV5Details() {
    try {
        const response = await fetch('details.json');
        if (!response.ok) throw new Error("JSON not found");
        const data = await response.json();
        const root = document.getElementById('v5-details-accordion-root');
        if (!root) return; // Guard clause if we aren't on the details page
        
        const v5Data = data.vampire;
        root.innerHTML = ''; // Clear loading text

        Object.keys(v5Data).forEach(groupName => {
            const groupBtn = createAccordionBtn(groupName);
            const panel = document.createElement('div');
            panel.className = 'accordion-panel hidden';

            if (groupName === "Disciplines") {
                v5Data[groupName].forEach(sub => {
                    const subBtn = createAccordionBtn(sub.category, 'sub-accordion');
                    const subPanel = document.createElement('div');
                    subPanel.className = 'accordion-panel hidden';
                    sub.powers.forEach(p => {
                        subPanel.appendChild(createClickableItem(p.name, p.desc));
                    });
                    panel.appendChild(subBtn);
                    panel.appendChild(subPanel);
                });
            } else {
                v5Data[groupName].forEach(item => {
                    panel.appendChild(createClickableItem(item.name, item.desc));
                });
            }
            root.appendChild(groupBtn);
            root.appendChild(panel);
        });
    } catch (err) {
        console.error("Error loading details:", err);
    }
}

// 2. Helper Functions
function createAccordionBtn(text, className = '') {
    const btn = document.createElement('button');
    btn.className = `accordion-btn ${className}`;
    btn.innerHTML = `${text} <span class="arrow">▼</span>`;
    btn.onclick = function(e) {
        e.preventDefault(); // Prevent any default bubbling
        this.classList.toggle('active');
        const panel = this.nextElementSibling;
        if (panel) panel.classList.toggle('hidden');
    };
    return btn;
}

function createClickableItem(name, desc) {
    const p = document.createElement('p');
    p.className = 'info-item';
    p.innerText = name;
    p.onclick = () => showModal(name, desc);
    return p;
}

function showModal(title, text) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalBody').innerText = text;
    document.getElementById('infoModal').classList.remove('hidden');
}

// 3. Sidebar Specific Logic - This is what was failing
const initSidebarAccordion = () => {
    const detailsBtn = document.getElementById('detailsAccordion');
    const detailsPanel = document.getElementById('detailsPanel');

    if (detailsBtn && detailsPanel) {
        detailsBtn.addEventListener('click', function(e) {
            this.classList.toggle('active');
            detailsPanel.classList.toggle('hidden');
            
            const arrow = this.querySelector('.arrow');
            if (arrow) {
                arrow.style.transform = this.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });
    }
};

// 4. Close Modal on Background Click
window.addEventListener('click', (event) => {
    const modal = document.getElementById('infoModal');
    if (event.target === modal) {
        modal.classList.add('hidden');
    }
});

// Run everything
initSidebarAccordion();
loadV5Details();