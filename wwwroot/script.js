let allPlaces = []; // теперь заполняется с сервера

const atmosphereOptions = ["романтичная", "дружеская", "семейная", "деловая", "спокойная", "весёлая", "творческая", "престижная"];
const priceOptions = ["бюджетно (до 1000₽)", "средне (1000-3000₽)", "премиум (3000+₽)", "любой"];
const extraOptionsMap = {
    "культура": ["живопись", "скульптура", "театр", "опера", "балет"],
    "спорт": ["футбол", "хоккей", "теннис", "баскетбол", "плавание"],
    "музыка": ["рок", "джаз", "классика", "электронная", "поп"],
    "ночная жизнь": ["клубы", "караоке", "лаунж", "дискотеки"],
    "кино": ["комедия", "драма", "фантастика", "ужасы", "триллер"],
    "парки": ["аттракционы", "зоны пикника", "велодорожки", "лодочная станция"],
    "выставки": ["современное искусство", "исторические", "научные", "фотография"],
    "фестивали": ["музыкальные", "гастрономические", "культурные", "уличные"],
    "квесты": ["хоррор", "детектив", "приключения", "научная фантастика"],
    "экскурсии": ["пешеходные", "автобусные", "водные", "велосипедные"],
    "рестораны": ["итальянская", "японская", "грузинская", "русская", "азиатская", "европейская", "французская", "американская", "мексиканская", "вегетарианская", "десерты", "морепродукты", "стейки"],
    "бары": ["пивной бар", "винный бар", "коктейль-бар", "лаунж-бар", "крафтовый бар"],
    "кафе": ["кофейня", "кондитерская", "семейное кафе", "веганское кафе", "десертная"],
    "кофейни": ["кофе", "чай", "десерты", "выпечка", "смузи"],
    "пиццерии": ["пицца", "итальянская", "вегетарианская", "десерты"],
    "танцы": ["латина", "хип-хоп", "бальные", "contemporary", "танцевальные марафоны"],
    "йога": ["хатха", "кундалини", "аштанга", "йога-нидра", "силовая йога"]
};
const typeOptions = Object.keys(extraOptionsMap);

let currentCity = "Москва";
let userPrefs = { atmosphere: [], type: [], extra: {}, price: [] };
let visits = [];

// ==================== ЗАГРУЗКА ДАННЫХ С СЕРВЕРА ====================
async function loadPlacesFromServer() {
    try {
        const response = await fetch('/api/places');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        allPlaces = await response.json();
        console.log(`Загружено ${allPlaces.length} мест`);
    } catch (err) {
        console.error('Ошибка загрузки мест:', err);
        allPlaces = [];
        showToast('Не удалось загрузить данные с сервера', 'danger');
    }
}

// ==================== РАБОТА С LOCALSTORAGE ====================
function loadCity() {
    let saved = localStorage.getItem('leisure_city');
    if (saved && ["Москва","Санкт-Петербург","Новосибирск","Екатеринбург","Казань","Нижний Новгород","Челябинск","Самара","Омск","Ростов-на-Дону","Уфа","Красноярск"].includes(saved))
        currentCity = saved;
    document.getElementById('citySelect').value = currentCity;
}
function saveCity() { localStorage.setItem('leisure_city', currentCity); }

function loadPrefs() {
    let saved = localStorage.getItem(`leisure_prefs_${currentCity}`);
    if (saved) {
        try {
            let prefs = JSON.parse(saved);
            userPrefs = { atmosphere: prefs.atmosphere || [], type: prefs.type || [], extra: prefs.extra || {}, price: prefs.price || [] };
        } catch {
            userPrefs = { atmosphere: [], type: [], extra: {}, price: [] };
        }
    } else {
        userPrefs = { atmosphere: [], type: [], extra: {}, price: [] };
    }
}
function savePrefs() { localStorage.setItem(`leisure_prefs_${currentCity}`, JSON.stringify(userPrefs)); }

function loadVisits() {
    let saved = localStorage.getItem(`leisure_visits_${currentCity}`);
    if (!saved) {
        visits = [];
        return;
    }

    try {
        visits = JSON.parse(saved);
        if (!Array.isArray(visits)) visits = [];
    } catch {
        visits = [];
    }
}
function saveVisits() { localStorage.setItem(`leisure_visits_${currentCity}`, JSON.stringify(visits)); }

function getVisitedIds() { return visits.map(v => v.placeId); }
function addVisit(placeId) {
    if (getVisitedIds().includes(placeId)) return false;
    visits.push({ city: currentCity, placeId, timestamp: Date.now() });
    saveVisits();
    return true;
}
function resetHistory() { visits = []; saveVisits(); showToast('История очищена', 'info'); renderCurrentPage(); }
function getHistory() {
    return visits.map(v => {
        let place = allPlaces.find(p => p.id === v.placeId && p.city === currentCity);
        return place ? { ...place, visitedAt: v.timestamp } : null;
    }).filter(p => p).sort((a,b) => b.visitedAt - a.visitedAt);
}

function hasAnyPrefs() {
    return userPrefs.atmosphere.length > 0 || userPrefs.type.length > 0 || userPrefs.price.length > 0;
}

function getPlacesForCurrentCity() { return allPlaces.filter(p => p.city === currentCity); }

function getRankedPlacesByPrefs() {
    let placesInCity = getPlacesForCurrentCity();
    let visitedIds = getVisitedIds();
    let available = placesInCity.filter(p => !visitedIds.includes(p.id));
    let scored = available.map(place => {
        let score = 0, maxScore = 0;
        if (userPrefs.atmosphere.length) {
            maxScore += 30;
            if (userPrefs.atmosphere.includes(place.atmosphere)) score += 30;
            else if (userPrefs.atmosphere.some(a => place.atmosphere.includes(a) || a.includes(place.atmosphere))) score += 15;
        }
        if (userPrefs.type.length) {
            maxScore += 30;
            if (userPrefs.type.includes(place.type)) score += 30;
            else if (userPrefs.type.some(t => place.type.includes(t) || t.includes(place.type))) score += 15;
        }
        if (userPrefs.extra[place.type] && userPrefs.extra[place.type].length) {
            maxScore += 30;
            if (userPrefs.extra[place.type].includes(place.subcat)) score += 30;
            else if (userPrefs.extra[place.type].some(opt => place.subcat.includes(opt) || opt.includes(place.subcat))) score += 15;
        }
        if (userPrefs.price.length) {
            maxScore += 10;
            if (userPrefs.price.includes(place.price) || (userPrefs.price.includes("любой") && place.price !== "")) score += 10;
            else if (userPrefs.price.includes("бюджетно") && place.price === "средне") score += 5;
        }
        if (maxScore === 0) return { ...place, matchPercent: 0, finalScore: place.rating * 10 };
        let matchPercent = Math.round((score / maxScore) * 100);
        let finalScore = matchPercent * 0.8 + place.rating * 2;
        return { ...place, matchPercent, finalScore };
    });
    scored.sort((a,b) => b.finalScore - a.finalScore);
    return scored;
}

function showToast(msg, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
    }

    const typeMap = {
        success: 'success',
        info: 'info',
        warning: 'warning',
        danger: 'danger'
    };
    const toastType = typeMap[type] || 'success';

    let toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${toastType} border-0`;
    toast.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    container.appendChild(toast);
    let bsToast = new bootstrap.Toast(toast, { delay: 2500 });
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

let currentPage = 'recommend';

function attachVisitButtons() {
    document.querySelectorAll('.btn-visit').forEach(btn => {
        btn.addEventListener('click', () => {
            let pid = btn.dataset.placeid;
            if (getVisitedIds().includes(pid)) { showToast('Вы уже отмечали это место', 'warning'); return; }
            let place = getPlacesForCurrentCity().find(p => p.id === pid);
            if (place && addVisit(pid)) { showToast(`✅ "${place.name}" добавлено в историю!`, 'success'); renderCurrentPage(); }
            else showToast('Ошибка', 'danger');
        });
    });
}

function renderRecommendations() {
    if (!hasAnyPrefs()) {
        document.getElementById('appContainer').innerHTML = `
            <div class="hero-section text-center">
                <i class="fas fa-sliders-h fa-3x mb-3"></i>
                <h2>Настройте свои предпочтения</h2>
                <p>Выберите тип места, дополнительные опции и ценовой сегмент.</p>
                <button class="btn btn-light mt-3" id="openPrefsFromHero"><i class="fas fa-sliders-h"></i> Настроить предпочтения</button>
            </div>
        `;
        document.getElementById('openPrefsFromHero')?.addEventListener('click', () => openPrefsModal());
        return;
    }
    const ranked = getRankedPlacesByPrefs();
    const topPlaces = ranked.slice(0, 24);
    if (topPlaces.length === 0) {
        document.getElementById('appContainer').innerHTML = `<div class="hero-section"><h2><i class="fas fa-sad-tear"></i> Нет подходящих мест</h2><p>Попробуйте расширить предпочтения или сменить город.</p></div>`;
        return;
    }
    let html = `<div class="hero-section"><h1><i class="fas fa-magic me-3"></i>Персональные рекомендации для ${currentCity}</h1><div class="mt-2"><small><i class="fas fa-bullseye"></i> Совпадение с вашими предпочтениями указано на карточках</small></div></div><div class="row g-4">`;
    topPlaces.forEach(place => {
        let visited = getVisitedIds().includes(place.id);
        let priceIcon = place.price === "бюджетно (до 1000₽)" ? '<i class="fas fa-coins"></i>' : (place.price === "премиум (3000+₽)" ? '<i class="fas fa-gem"></i>' : '<i class="fas fa-money-bill-wave"></i>');
        html += `<div class="col-md-6 col-lg-4"><div class="card h-100"><div class="card-body"><div class="d-flex flex-wrap gap-2 mb-3"><span class="badge-cat"><i class="fas fa-smile"></i> ${place.atmosphere}</span><span class="badge-cat"><i class="fas fa-tag"></i> ${place.type}</span><span class="badge-cat"><i class="fas fa-utensils"></i> ${place.subcat}</span><span class="match-score"><i class="fas fa-bullseye"></i> ${place.matchPercent}%</span></div><h5 class="fw-bold">${place.name}</h5><p class="small text-secondary mt-2">${place.description}</p><div class="d-flex justify-content-between align-items-center mt-3"><span class="rating-star"><i class="fas fa-star"></i> ${place.rating}</span><span class="small fw-semibold">${priceIcon} ${place.price}</span><span class="small text-muted"><i class="fas fa-map-marker-alt"></i> ${place.address}</span></div>`;
        if (place.website && place.website !== '#') {
            html += `<div class="mt-2"><a href="${place.website}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-light w-100">🌐 Сайт места</a></div>`;
        }
        html += `</div><div class="card-footer bg-transparent border-0 pb-3"><button class="btn btn-visit w-100 ${visited ? 'visited' : ''}" data-placeid="${place.id}"><i class="fas ${visited ? 'fa-check-circle' : 'fa-plus-circle'} me-1"></i> ${visited ? 'Посещено' : 'Отметить посещение'}</button></div></div></div>`;
    });
    html += `</div>`;
    document.getElementById('appContainer').innerHTML = html;
    attachVisitButtons();
}

function renderExplore() {
    let placesCity = getPlacesForCurrentCity();
    let visitedIds = getVisitedIds();
    let html = `<div class="hero-section"><h1><i class="fas fa-compass me-3"></i>Все места в ${currentCity}</h1><p>${placesCity.length} мест для отдыха и развлечений</p></div><div class="row g-4">`;
    placesCity.forEach(place => {
        let visited = visitedIds.includes(place.id);
        html += `<div class="col-md-6 col-lg-4"><div class="card h-100"><div class="card-body"><div class="d-flex flex-wrap gap-2 mb-3"><span class="badge-cat">${place.atmosphere}</span><span class="badge-cat">${place.type}</span><span class="badge-cat">${place.subcat}</span></div><h5>${place.name}</h5><p class="small">${place.description}</p><div class="d-flex justify-content-between mt-2"><span class="rating-star"><i class="fas fa-star"></i> ${place.rating}</span><span class="small">${place.price}</span></div><div class="mt-2 small text-muted"><i class="fas fa-map-marker-alt"></i> ${place.address}</div></div><div class="card-footer"><button class="btn btn-visit w-100 ${visited ? 'visited' : ''}" data-placeid="${place.id}"><i class="fas ${visited ? 'fa-check-circle' : 'fa-plus-circle'}"></i> ${visited ? 'Посещено' : 'Отметить'}</button></div></div></div>`;
    });
    html += `</div>`;
    document.getElementById('appContainer').innerHTML = html;
    attachVisitButtons();
}

function renderHistory() {
    let history = getHistory();
    if (!history.length) {
        document.getElementById('appContainer').innerHTML = `
            <div class="text-center p-5">
                <i class="fas fa-hourglass-half fa-4x icon-glow"></i>
                <h3 class="mt-3">История пуста</h3>
                <p>Отмечайте понравившиеся места</p>
            </div>
        `;
        return;
    }
    let html = `<div class="hero-section"><h2><i class="fas fa-history me-2"></i>Ваши посещения в ${currentCity}</h2></div>
                <div class="row g-4">`;
    history.forEach(item => {
        let date = new Date(item.visitedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
        let categoryIcon = {
            'современное искусство': 'fa-palette',
            'хип-хоп': 'fa-music',
            'исторические': 'fa-landmark',
            'живопись': 'fa-paintbrush',
            'джаз': 'fa-drumstick-bite'
        }[item.subcat] || 'fa-check-circle';
        
        html += `
            <div class="col-md-6 col-lg-4">
                <div class="history-card card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title fw-bold">${item.name}</h5>
                            <span class="badge-cat">${item.subcat}</span>
                        </div>
                        <p class="card-text small text-secondary">${item.description || 'Посещённое место'}</p>
                        <div class="history-meta mt-3">
                            <div class="d-flex align-items-center gap-2 mb-2">
                                <i class="fas fa-calendar-alt fa-fw"></i>
                                <span class="small">${date}</span>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <i class="fas fa-map-marker-alt fa-fw"></i>
                                <span class="small">${item.address}</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-0 pb-3 d-flex justify-content-between align-items-center">
                        <span class="rating-star"><i class="fas fa-star"></i> ${item.rating}</span>
                        <span class="text-success"><i class="fas ${categoryIcon}"></i> Посещено</span>
                    </div>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    document.getElementById('appContainer').innerHTML = html;
}

function renderCurrentPage() {
    if (currentPage === 'recommend') renderRecommendations();
    else if (currentPage === 'explore') renderExplore();
    else if (currentPage === 'history') renderHistory();
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    let activeLink = document.querySelector(`.nav-link[data-page="${currentPage}"]`);
    if (activeLink) activeLink.classList.add('active');
}

let prefsModalInstance;

function rebuildExtraOptions() {
    const container = document.getElementById('extraOptionsContainer');
    container.innerHTML = '';
    for (let type of userPrefs.type) {
        const extraList = extraOptionsMap[type];
        if (extraList && extraList.length) {
            const section = document.createElement('div');
            section.className = 'pref-section';
            section.innerHTML = `<div class="pref-title"><i class="fas fa-cog me-2"></i>Дополнительно для: ${type}</div><div class="pref-options" data-type="${type}"></div>`;
            const optionsDiv = section.querySelector('.pref-options');
            extraList.forEach(opt => {
                const isActive = userPrefs.extra[type] && userPrefs.extra[type].includes(opt);
                const btn = document.createElement('div');
                btn.className = `pref-btn ${isActive ? 'active' : ''}`;
                btn.textContent = opt;
                btn.dataset.type = type;
                btn.dataset.opt = opt;
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (btn.classList.contains('active')) {
                        btn.classList.remove('active');
                        if (userPrefs.extra[type]) {
                            userPrefs.extra[type] = userPrefs.extra[type].filter(v => v !== opt);
                            if (userPrefs.extra[type].length === 0) delete userPrefs.extra[type];
                        }
                    } else {
                        btn.classList.add('active');
                        if (!userPrefs.extra[type]) userPrefs.extra[type] = [];
                        if (!userPrefs.extra[type].includes(opt)) userPrefs.extra[type].push(opt);
                    }
                });
                optionsDiv.appendChild(btn);
            });
            container.appendChild(section);
        }
    }
}

function openPrefsModal() {
    document.getElementById('modalCityName').innerText = currentCity;
    let atm = document.getElementById('atmOptions');
    atm.innerHTML = '';
    atmosphereOptions.forEach(opt => {
        let active = userPrefs.atmosphere.includes(opt) ? 'active' : '';
        atm.innerHTML += `<div class="pref-btn ${active}" data-group="atmosphere" data-value="${opt}">${opt}</div>`;
    });
    let typ = document.getElementById('typeOptions');
    typ.innerHTML = '';
    typeOptions.forEach(opt => {
        let active = userPrefs.type.includes(opt) ? 'active' : '';
        typ.innerHTML += `<div class="pref-btn ${active}" data-group="type" data-value="${opt}">${opt}</div>`;
    });
    let prc = document.getElementById('priceOptions');
    prc.innerHTML = '';
    priceOptions.forEach(opt => {
        let active = userPrefs.price.includes(opt) ? 'active' : '';
        prc.innerHTML += `<div class="pref-btn ${active}" data-group="price" data-value="${opt}">${opt}</div>`;
    });
    document.querySelectorAll('#atmOptions .pref-btn, #typeOptions .pref-btn, #priceOptions .pref-btn').forEach(btn => {
        btn.removeEventListener('click', atmTypeHandler);
        btn.addEventListener('click', atmTypeHandler);
    });
    rebuildExtraOptions();
    prefsModalInstance.show();
}

function atmTypeHandler(e) {
    let btn = e.currentTarget;
    let group = btn.dataset.group;
    let value = btn.dataset.value;
    if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        userPrefs[group] = userPrefs[group].filter(v => v !== value);
    } else {
        btn.classList.add('active');
        if (!userPrefs[group].includes(value)) userPrefs[group].push(value);
    }
    if (group === 'type') {
        for (let t in userPrefs.extra) {
            if (!userPrefs.type.includes(t)) delete userPrefs.extra[t];
        }
        rebuildExtraOptions();
    }
}

function savePrefsAndUpdate() {
    savePrefs();
    prefsModalInstance.hide();
    if (currentPage === 'recommend') renderRecommendations();
    else { currentPage = 'recommend'; renderRecommendations(); }
    showToast(`Предпочтения сохранены! Подобрано мест: ${getRankedPlacesByPrefs().length}`, 'success');
}

function resetAllPrefs() {
    userPrefs = { atmosphere: [], type: [], extra: {}, price: [] };
    savePrefs();
    openPrefsModal();
    showToast('Все предпочтения сброшены', 'info');
    if (currentPage === 'recommend') renderRecommendations();
}

// ==================== ИНИЦИАЛИЗАЦИЯ (АСИНХРОННАЯ) ====================
window.addEventListener('DOMContentLoaded', async () => {
    await loadPlacesFromServer();   // загружаем места с API
    loadCity();
    loadPrefs();
    loadVisits();
    prefsModalInstance = new bootstrap.Modal(document.getElementById('prefsModal'));
    if (!hasAnyPrefs()) setTimeout(() => openPrefsModal(), 500);
    renderCurrentPage();

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => { e.preventDefault(); currentPage = link.dataset.page; renderCurrentPage(); });
    });
    document.getElementById('citySelect').addEventListener('change', (e) => {
        currentCity = e.target.value; saveCity(); loadPrefs(); loadVisits();
        if (!hasAnyPrefs()) openPrefsModal();
        renderCurrentPage();
    });
    document.getElementById('resetHistoryBtn').addEventListener('click', () => { if(confirm(`Сбросить историю для ${currentCity}?`)) resetHistory(); });
    document.getElementById('changePrefsBtn').addEventListener('click', () => openPrefsModal());
    document.getElementById('savePrefsBtn').addEventListener('click', () => savePrefsAndUpdate());
    document.getElementById('resetPrefsBtn').addEventListener('click', () => resetAllPrefs());

    const subForm = document.getElementById('subscribeForm');
    if (subForm) {
        subForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('subEmail');
            const agree = document.getElementById('subAgree');
            let valid = true;
            if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { email.classList.add('is-invalid'); valid = false; } else email.classList.remove('is-invalid');
            if (!agree.checked) { agree.classList.add('is-invalid'); valid = false; } else agree.classList.remove('is-invalid');
            if (valid) {
                document.getElementById('subscribeMessage').innerHTML = '<div class="alert alert-success">Спасибо за подписку!</div>';
                subForm.reset();
                setTimeout(() => document.getElementById('subscribeMessage').innerHTML = '', 3000);
            }
        });
    }
});