// State Arrays
let ideas = JSON.parse(localStorage.getItem('ideaVault_ideas') || '[]');
let currentLang = 'en'; // Default language

// DOM Elements
const langSwitch = document.getElementById('langSwitch');
const privacyModal = document.getElementById('privacyModal');
const mainApp = document.getElementById('mainApp');
const btnTerms = document.getElementById('btnTerms');
const btnAgree = document.getElementById('btnAgree');
const privacyTerms = document.getElementById('privacyTerms');

const ageInput = document.getElementById('ageInput');
const ideaInput = document.getElementById('ideaInput');
const btnSave = document.getElementById('btnSave');
const btnSearch = document.getElementById('btnSearch');
const ideasList = document.getElementById('ideasList');

// Translations Map
const translations = {
    en: {
        modalTitle: "Privacy Agreement",
        modalMainText: "By using this website, you agree that the ideas you submit may be stored, and the website reserves the right to use or manage them as it sees fit.",
        modalTermsText: "Detailed terms: We store your data locally on your device. However, you acknowledge that any shared ideas are submitted voluntarily without compensation.",
        btnTerms: "View Privacy Terms",
        btnAgree: "Agree",
        appTitle: "Idea Vault",
        labelAge: "Your Age",
        labelIdea: "Your Idea",
        btnSave: "Save Idea",
        btnSearch: "Search Similar Ideas",
        listTitle: "Saved Ideas",
        ageLabel: "Age",
        noIdeas: "No ideas yet. Be the first to save one!",
        alertEmpty: "Please enter an idea.",
        searchResults: "Search Results"
    },
    ar: {
        modalTitle: "اتفاقية الخصوصية",
        modalMainText: "باستخدام هذا الموقع، فإنك توافق على أن الأفكار التي ترسلها قد يتم تخزينها، ويحتفظ الموقع بالحق في استخدامها أو إدارتها كما يراه مناسباً.",
        modalTermsText: "شروط مفصلة: يتم تخزين البيانات محليًا على جهازك. بتقديمك لهذه الأفكار، فإنك تمنحنا الإذن باستخدامها بحرية و بصورة تطوعية.",
        btnTerms: "عرض شروط الخصوصية",
        btnAgree: "موافق",
        appTitle: "خزنة الأفكار",
        labelAge: "عمرك",
        labelIdea: "فكرتك",
        btnSave: "حفظ الفكرة",
        btnSearch: "البحث عن أفكار مشابهة",
        listTitle: "الأفكار المحفوظة",
        ageLabel: "العمر",
        noIdeas: "لا توجد أفكار بعد. كن أول من يحفظ فكرة!",
        alertEmpty: "يرجى إدخال فكرة.",
        searchResults: "نتائج البحث"
    }
};

// Canvas Background (Starry effect)
const canvas = document.getElementById('starCanvas');
const ctx = canvas.getContext('2d');
let stars = [];

function initStars() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.y -= star.speed;
        
        // Wrap around smoothly
        if (star.y < 0) {
            star.y = canvas.height;
            star.x = Math.random() * canvas.width;
        }
    });
    requestAnimationFrame(drawStars);
}

window.addEventListener('resize', initStars);

// Core Initialization
function init() {
    initStars();
    drawStars();
    renderLanguage();
    
    // Check local storage for privacy agreement
    if (localStorage.getItem('ideaVault_agreed') === 'true') {
        privacyModal.classList.add('hidden');
        mainApp.classList.remove('hidden');
    }
    
    renderIdeas();
}

// Language Logic
function renderLanguage() {
    const t = translations[currentLang];
    document.body.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    
    // Switch Texts
    document.getElementById('modalTitle').textContent = t.modalTitle;
    document.getElementById('modalMainText').textContent = t.modalMainText;
    document.getElementById('modalTermsText').textContent = t.modalTermsText;
    btnTerms.textContent = t.btnTerms;
    btnAgree.textContent = t.btnAgree;
    
    document.getElementById('appTitle').textContent = t.appTitle;
    document.getElementById('labelAge').textContent = t.labelAge;
    document.getElementById('labelIdea').textContent = t.labelIdea;
    btnSave.textContent = t.btnSave;
    btnSearch.textContent = t.btnSearch;
    
    // We only update list title if it's the normal list (not currently searching)
    if (!document.getElementById('listTitle').dataset.isSearching) {
        document.getElementById('listTitle').textContent = t.listTitle;
    } else {
        // if searching, just update the label partial (we lose count here but simpler logic)
        const currentText = document.getElementById('listTitle').textContent;
        const count = currentText.match(/\((\d+)\)/);
        if (count) {
            document.getElementById('listTitle').textContent = `${t.searchResults} (${count[1]})`;
        }
    }
    
    // Update existing idea cards
    // The language UI of tags on existing ideas inside localstorage doesn't change since we saved raw data,
    // but the word "Age" should translate.
    renderIdeas(ideas, false);
}

langSwitch.addEventListener('change', (e) => {
    currentLang = e.target.value;
    renderLanguage();
});

// Modal Logic
btnTerms.addEventListener('click', () => {
    privacyTerms.classList.toggle('hidden');
});

btnAgree.addEventListener('click', () => {
    localStorage.setItem('ideaVault_agreed', 'true');
    privacyModal.classList.add('hidden');
    mainApp.classList.remove('hidden');
});

// Save Logic
btnSave.addEventListener('click', () => {
    const age = ageInput.value.trim();
    const text = ideaInput.value.trim();
    
    if (!text) {
        alert(translations[currentLang].alertEmpty);
        return;
    }
    
    const newIdea = {
        id: Date.now(),
        age: age || '-',
        text: text,
        timestamp: new Date().toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'en-US')
    };
    
    ideas.unshift(newIdea); // Insert at beginning
    localStorage.setItem('ideaVault_ideas', JSON.stringify(ideas));
    
    ideaInput.value = ''; // Clean input
    
    // reset search state
    document.getElementById('listTitle').dataset.isSearching = "";
    document.getElementById('listTitle').textContent = translations[currentLang].listTitle;
    
    renderIdeas();
});

// Search Logic
btnSearch.addEventListener('click', () => {
    const query = ideaInput.value.trim().toLowerCase();
    
    if (!query) {
        // If empty, show all ideas
        document.getElementById('listTitle').dataset.isSearching = "";
        document.getElementById('listTitle').textContent = translations[currentLang].listTitle;
        renderIdeas();
        return;
    }
    
    // Basic word matching (Split text by spaces and filter out tiny words)
    const words = query.split(/\s+/).filter(w => w.length > 2);
    
    const matched = ideas.filter(idea => {
        const ideaText = idea.text.toLowerCase();
        
        // Exact substring match
        if (ideaText.includes(query)) return true;
        
        // Word sharing match
        if (words.length > 0) {
            for (let w of words) {
                if (ideaText.includes(w)) return true;
            }
        }
        return false;
    });
    
    document.getElementById('listTitle').dataset.isSearching = "true";
    document.getElementById('listTitle').textContent = `${translations[currentLang].searchResults} (${matched.length})`;
    
    renderIdeas(matched);
});

// Rendering List
function renderIdeas(listToRender = document.getElementById('listTitle').dataset.isSearching ? undefined : ideas, preserveScroll = true) {
    // If not passed explicitly, and we are searching, we shouldn't wipe out search results on normal language render, 
    // but the logic here handles language render re-rendering all ideas. 
    // Let's just default to all ideas for simplicity unless searching is explicitly active and not handled.
    if (listToRender === undefined) listToRender = ideas; 
    
    ideasList.innerHTML = '';
    const t = translations[currentLang];
    
    if (listToRender.length === 0) {
        ideasList.innerHTML = `<p style="color: #666; text-align: center; font-style: italic; padding: 20px;">${t.noIdeas}</p>`;
        return;
    }
    
    listToRender.forEach(idea => {
        const card = document.createElement('div');
        card.className = 'idea-card';
        
        // Escape HTML to prevent basic XSS
        const safeText = escapeHTML(idea.text);
        
        card.innerHTML = `
            <div class="meta">${t.ageLabel}: ${idea.age} &nbsp;&bull;&nbsp; ${idea.timestamp}</div>
            <div class="text">${safeText}</div>
        `;
        ideasList.appendChild(card);
    });
}

// Utility: Avoid malicious input execution
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Start app
init();
