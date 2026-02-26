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
        modalTermsText: "Detailed terms: We store your data securely across our services. By submitting your ideas, you acknowledge that they are provided voluntarily without compensation.",
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
        alertError: "Error saving idea. Please try again.",
        alertSuccess: "Idea saved successfully!",
        searchResults: "Search Results",
        loading: "Loading..."
    },
    ar: {
        modalTitle: "اتفاقية الخصوصية",
        modalMainText: "باستخدام هذا الموقع، فإنك توافق على أن الأفكار التي ترسلها قد يتم تخزينها، ويحتفظ الموقع بالحق في استخدامها أو إدارتها كما يراه مناسباً.",
        modalTermsText: "شروط مفصلة: يتم تخزين البيانات بشكل آمن على خوادمنا. بتقديمك لهذه الأفكار، فإنك تمنحنا الإذن باستخدامها بحرية و بصورة تطوعية بدون مقابل.",
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
        alertError: "حدث خطأ أثناء حفظ الفكرة. يرجى المحاولة مرة أخرى.",
        alertSuccess: "تم حفظ الفكرة بنجاح!",
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
    
    // We only update list title if it's the normal list (not currently searching)
    if (!document.getElementById('listTitle').dataset.isSearching) {
        document.getElementById('listTitle').textContent = t.listTitle;
    } else {
        // if searching, just update the label partial
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
    privacyModal.classList.add('hidden');
    mainApp.classList.remove('hidden');
});

// Database Fetch Logic (Supabase API)
async function fetchIdeas(query = '') {
    const t = translations[currentLang];
    ideasList.innerHTML = `<p style="color: #666; text-align: center; font-style: italic; padding: 20px;">${t.loading}</p>`;
    
    let url = `${SUPABASE_URL}/rest/v1/ideasformy?select=*&order=created_at.desc`;
    
    // Supabase native text filtering
    if (query) {
        // split words, only find words > 2 chars to avoid overly broad matching
        const words = query.split(/\s+/).filter(w => w.length > 2);
        if (words.length > 0) {
            const conditions = words.map(w => `idea.ilike.*${encodeURIComponent(w)}*`).join(',');
            url += `&or=(${conditions})`;
        } else {
            url += `&idea=ilike.*${encodeURIComponent(query)}*`;
        }
    }
    
    try {
        const res = await fetch(url, { headers: SUPABASE_HEADERS });
        if (res.ok) {
            ideas = await res.json();
            
            if (query) {
                document.getElementById('listTitle').dataset.isSearching = "true";
                document.getElementById('listTitle').textContent = `${t.searchResults} (${ideas.length})`;
            } else {
                document.getElementById('listTitle').dataset.isSearching = "";
                document.getElementById('listTitle').textContent = t.listTitle;
            }
            
            renderIdeas();
        } else {
            console.error('Failed to fetch ideas', await res.text());
            ideasList.innerHTML = `<p style="color: red; text-align: center; font-style: italic; padding: 20px;">${t.alertError}</p>`;
        }
    } catch (e) {
        console.error('Error fetching ideas:', e);
        ideasList.innerHTML = `<p style="color: red; text-align: center; font-style: italic; padding: 20px;">${t.alertError}</p>`;
    }
}

// Database Create Logic (Supabase API)
btnSave.addEventListener('click', async () => {
    const ageVal = ageInput.value.trim();
    const text = ideaInput.value.trim();
    const t = translations[currentLang];
    
    if (!text) {
        alert(t.alertEmpty);
        return;
    }
    
    // Disable inputs while saving to prevent double-click
    btnSave.disabled = true;
    const originalBtnText = btnSave.textContent;
    btnSave.textContent = '...';
    
    const newIdea = {
        age: ageVal ? parseInt(ageVal, 10) : null,
        idea: text
    };
    
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/ideasformy`, {
            method: 'POST',
            headers: SUPABASE_HEADERS,
            body: JSON.stringify(newIdea)
        });
        
        if (res.ok) {
            alert(t.alertSuccess);
            ideaInput.value = ''; // Clean input
            // Fetch updated list and reset search state
            document.getElementById('listTitle').dataset.isSearching = "";
            await fetchIdeas();
        } else {
            alert(t.alertError);
            console.error('Failed to save idea', await res.text());
        }
    } catch (e) {
        alert(t.alertError);
        console.error('Error saving idea:', e);
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = originalBtnText;
    }
});

// Search Filter Logic
btnSearch.addEventListener('click', () => {
    const query = ideaInput.value.trim().toLowerCase();
    fetchIdeas(query);
});

// UI Rendering Logic
function renderIdeas() {
    ideasList.innerHTML = '';
    const t = translations[currentLang];
    
    if (ideas.length === 0) {
        ideasList.innerHTML = `<p style="color: #666; text-align: center; font-style: italic; padding: 20px;">${t.noIdeas}</p>`;
        return;
    }
    
    ideas.forEach(record => {
        const card = document.createElement('div');
        card.className = 'idea-card';
        
        // Format timestamp safely
        const dateObj = new Date(record.created_at);
        const timestamp = isNaN(dateObj.getTime()) ? record.created_at : dateObj.toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'en-US');
        
        // Check age and text, prevent basic XSS
        const safeText = escapeHTML(record.idea);
        const displayAge = record.age !== null ? record.age : '-';
        
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
