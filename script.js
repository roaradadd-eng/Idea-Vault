// Supabase Config
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
const translations = { /* ... نفس الترجمات كما في الكود الأصلي ... */ };

// Canvas Background (Starry effect)
const canvas = document.getElementById('starCanvas');
const ctx = canvas.getContext('2d');
let stars = [];

function initStars() { /* ... */ }
function drawStars() { /* ... */ }
window.addEventListener('resize', initStars);

// Fetch Ideas from Supabase
async function fetchIdeas(query = '') {
    const t = translations[currentLang];
    ideasList.innerHTML = `<p style="color: #666; text-align: center; font-style: italic; padding: 20px;">${t.loading || "Loading..."}</p>`;
    
    let url = `${SUPABASE_URL}/rest/v1/ideasformy?select=*&order=created_at.desc`;
    
    if (query) {
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
            renderIdeas();
        } else {
            console.error('Failed to fetch ideas', await res.text());
            ideasList.innerHTML = `<p style="color: red; text-align: center; font-style: italic; padding: 20px;">${t.alertError || "Error fetching ideas"}</p>`;
        }
    } catch (e) {
        console.error('Error fetching ideas:', e);
        ideasList.innerHTML = `<p style="color: red; text-align: center; font-style: italic; padding: 20px;">${t.alertError || "Error fetching ideas"}</p>`;
    }
}

// Save Idea to Supabase
btnSave.addEventListener('click', async () => {
    const ageVal = ageInput.value.trim();
    const text = ideaInput.value.trim();
    const t = translations[currentLang];

    if (!text) { alert(t.alertEmpty); return; }

    btnSave.disabled = true;
    const newIdea = { age: ageVal ? parseInt(ageVal,10) : null, idea: text };

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/ideasformy`, {
            method: 'POST',
            headers: SUPABASE_HEADERS,
            body: JSON.stringify(newIdea)
        });
        if (res.ok) {
            ideaInput.value = '';
            await fetchIdeas();
            alert(t.alertSuccess || "Idea saved successfully!");
        } else {
            alert(t.alertError || "Error saving idea");
            console.error(await res.text());
        }
    } catch(e) {
        alert(t.alertError || "Error saving idea");
        console.error(e);
    } finally {
        btnSave.disabled = false;
    }
});

// Search Logic
btnSearch.addEventListener('click', () => {
    const query = ideaInput.value.trim().toLowerCase();
    fetchIdeas(query);
});

// Rendering List
function renderIdeas(listToRender = ideas) {
    ideasList.innerHTML = '';
    const t = translations[currentLang];
    if (listToRender.length === 0) {
        ideasList.innerHTML = `<p style="color: #666; text-align: center; font-style: italic; padding: 20px;">${t.noIdeas}</p>`;
        return;
    }
    listToRender.forEach(record => {
        const card = document.createElement('div');
        card.className = 'idea-card';
        const safeText = escapeHTML(record.idea);
        const timestamp = record.created_at ? new Date(record.created_at).toLocaleString(currentLang==='ar'?'ar-EG':'en-US') : '';
        const displayAge = record.age !== null ? record.age : '-';
        card.innerHTML = `<div class="meta">${t.ageLabel}: ${displayAge} &nbsp;&bull;&nbsp; ${timestamp}</div>
                          <div class="text">${safeText}</div>`;
        ideasList.appendChild(card);
    });
}

// Utility
function escapeHTML(str) { return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[tag]||tag)); }

// Language & Modal Logic
function renderLanguage() { /* ... نفس كود اللغة السابق ... */ }
langSwitch.addEventListener('change', (e)=>{currentLang=e.target.value; renderLanguage();});
btnTerms.addEventListener('click', ()=>privacyTerms.classList.toggle('hidden'));
btnAgree.addEventListener('click', ()=>{ privacyModal.classList.add('hidden'); mainApp.classList.remove('hidden'); });

// Init
function init(){ initStars(); drawStars(); renderLanguage(); fetchIdeas(); }
init();
