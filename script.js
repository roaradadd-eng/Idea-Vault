const SUPABASE_URL = 'https://dlxqqqczygwrglfvghiq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zlJ93xLgYxEZuGL7Yc7EOg_gyAyjKSo';
const SUPABASE_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

// State Arrays
let ideas = [];
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
        modalTermsText: "Detailed terms: We store your data securely on our servers. However, you acknowledge that any shared ideas are submitted voluntarily without compensation.",
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
        alertError: "There was an error saving your idea. Please try again later.",
        searchResults: "Search Results",
        loading: "Loading..."
    },
    ar: {
        modalTitle: "اتفاقية الخصوصية",
        modalMainText: "باستخدام هذا الموقع، فإنك توافق على أن الأفكار التي ترسلها قد يتم تخزينها، ويحتفظ الموقع بالحق في استخدامها أو إدارتها كما يراه مناسباً.",
        modalTermsText: "شروط مفصلة: يتم تخزين البيانات بشكل آمن على خوادمنا. بتقديمك لهذه الأفكار، فإنك تمنحنا الإذن باستخدامها بحرية و بصورة تطوعية.",
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
        alertError: "حدث خطأ أثناء حفظ الفكرة. يرجى المحاولة لاحقاً.",
        searchResults: "نتائج البحث",
        loading: "جاري التحميل..."
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
    
    // Fetch ideas from Supabase on load
    fetchIdeas();
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
    
    if (!document.getElementById('listTitle').dataset.isSearching) {
        document.getElementById('listTitle').textContent = t.listTitle;
    } else {
        const currentText = document.getElementById('listTitle').textContent;
        const count = currentText.match(/\((\d+)\)/);
        if (count) {
            document.getElementById('listTitle').textContent = `${t.searchResults} (${count[1]})`;
        } else {
            document.getElementById('listTitle').textContent = t.searchResults;
        }
    }
    
    renderIdeas();
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

// Supabase API Integration - GET Ideas
async function fetchIdeas(query = "") {
    const t = translations[currentLang];
    ideasList.innerHTML = `<p style="color: #666; text-align: center; font-style: italic; padding: 20px;">${t.loading}</p>`;
    
    let url = `${SUPABASE_URL}/rest/v1/ideasformy?select=*&order=created_at.desc`;
    
    // Add text search if a query is provided
    if (query) {
        // Find chunks longer than 2 characters
        const words = query.split(/\s+/).filter(w => w.length > 2);
        if (words.length > 0) {
            const conditions = words.map(w => `idea.ilike.*${encodeURIComponent(w)}*`).join(',');
            url += `&or=(${conditions})`;
        } else {
            url += `&idea=ilike.*${encodeURIComponent(query)}*`;
        }
    }
    
    try {
        const response = await fetch(url, { headers: SUPABASE_HEADERS });
        
        if (!response.ok) throw new Error("Network response was not ok");
        
        ideas = await response.json();
        
        if (query) {
            document.getElementById('listTitle').dataset.isSearching = "true";
            document.getElementById('listTitle').textContent = `${t.searchResults} (${ideas.length})`;
        } else {
            document.getElementById('listTitle').dataset.isSearching = "";
            document.getElementById('listTitle').textContent = t.listTitle;
        }
        
        renderIdeas();
    } catch (error) {
        console.error("Failed to fetch ideas:", error);
        ideasList.innerHTML = `<p style="color: red; text-align: center; font-style: italic; padding: 20px;">${t.alertError}</p>`;
    }
}

// Supabase API Integration - POST Idea
btnSave.addEventListener('click', async () => {
    const age = ageInput.value.trim();
    const text = ideaInput.value.trim();
    
    if (!text) {
        alert(translations[currentLang].alertEmpty);
        return;
    }
    
    const newIdea = {
        age: age ? parseInt(age, 10) : null,
        idea: text
    };
    
    // Form processing UI
    btnSave.disabled = true;
    const originalText = btnSave.textContent;
    btnSave.textContent = '...';
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/ideasformy`, {
            method: 'POST',
            headers: SUPABASE_HEADERS,
            body: JSON.stringify(newIdea)
        });
        
        if (!response.ok) throw new Error("Network response was not ok");
        
        ideaInput.value = ''; // Clean input
        
        // Refresh ideas from the database
        document.getElementById('listTitle').dataset.isSearching = "";
        fetchIdeas();
    } catch (error) {
        console.error("Failed to save idea:", error);
        alert(translations[currentLang].alertError);
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = originalText;
    }
});

// Search Logic
btnSearch.addEventListener('click', () => {
    const query = ideaInput.value.trim().toLowerCase();
    fetchIdeas(query);
});

// Rendering List
function renderIdeas() {
    ideasList.innerHTML = '';
    const t = translations[currentLang];
    
    if (ideas.length === 0) {
        ideasList.innerHTML = `<p style="color: #666; text-align: center; font-style: italic; padding: 20px;">${t.noIdeas}</p>`;
        return;
    }
    
    ideas.forEach(ideaObj => {
        const card = document.createElement('div');
        card.className = 'idea-card';
        
        const safeText = escapeHTML(ideaObj.idea);
        const displayAge = ideaObj.age !== null ? ideaObj.age : '-';
        
        const dateObj = new Date(ideaObj.created_at);
        const timestamp = isNaN(dateObj.getTime()) ? ideaObj.created_at : dateObj.toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'en-US');
        
        card.innerHTML = `
            <div class="meta">${t.ageLabel}: ${displayAge} &nbsp;&bull;&nbsp; ${timestamp}</div>
            <div class="text">${safeText}</div>
        `;
        ideasList.appendChild(card);
    });
}

// Utility: Avoid malicious input execution
function escapeHTML(str) {
    if (!str) return '';
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
