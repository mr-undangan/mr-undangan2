// =========================================================================
// TITIK GOWES — FRONTEND RENTAL, MULTI-CABANG, ANTI-BENTROK & KASIR OFFLINE
// File: js/gowes.js (V14.10)
// =========================================================================

let activeBookingBike = null;
let bookingSelectedBikeIds = [];
let gowesKtpDraft = "";
let gowesBookingVoucherCode = "";
let gowesBookingVoucherDiscount = 0;
let gowesBannerIdx = 0;
let gowesShowcaseIdx = 0;
let gowesBannerTimer = null;
let gowesShowcaseTimer = null;
let activeGowesShelterId = "";
let openBookingBikePickerIdx = -1;

// State Kasir Offline (Walk-in) & Struk
let offlinePosSelectedBikeIds = [];
let offlinePosOpenPickerIdx = -1;
let offlinePosKtpDraft = "";
let activeOfflineQrisRental = null;
let activeGowesReceiptRental = null;

// ================= 1. DETEKSI & MANAJEMEN CABANG AKTIF OTOMATIS =================
function getGowesSheltersList() {
    if (Array.isArray(db.gowesShelters) && db.gowesShelters.length) return db.gowesShelters;
    if (typeof DEFAULT_GOWES_SHELTERS !== "undefined" && Array.isArray(DEFAULT_GOWES_SHELTERS) && DEFAULT_GOWES_SHELTERS.length) {
        return DEFAULT_GOWES_SHELTERS;
    }
    const single = db.gowesShelter || DEFAULT_GOWES_SHELTER;
    return [Object.assign({ id: "sh_smd_1", city: "Samarinda" }, single)];
}

function _matchBranchByKeyword(keyword) {
    const k = String(keyword || "").trim().toLowerCase().replace(/[_-]+/g, " ");
    if (!k) return null;
    const list = getGowesSheltersList();
    return list.find(s =>
        String(s.id || "").toLowerCase() === k ||
        String(s.city || "").toLowerCase().includes(k) ||
        String(s.name || "").toLowerCase().includes(k) ||
        k.includes(String(s.city || "").toLowerCase())
    ) || null;
}

function resolveInitialGowesBranch() {
    const list = getGowesSheltersList();
    if (!list.length) return DEFAULT_GOWES_SHELTER;

    try {
        const q = new URLSearchParams(window.location.search);
        const qBranch = q.get("branch") || q.get("cabang") || q.get("gerai") || q.get("daerah") || "";
        if (qBranch) {
            const matchedUrl = _matchBranchByKeyword(qBranch);
            if (matchedUrl) {
                activeGowesShelterId = matchedUrl.id;
                localStorage.setItem(typeof GOWES_BRANCH_KEY !== "undefined" ? GOWES_BRANCH_KEY : "GOWES_ACTIVE_BRANCH_ID", matchedUrl.id);
                return matchedUrl;
            }
        }
    } catch {}

    if (activeGowesShelterId) {
        const foundCur = list.find(s => String(s.id) === String(activeGowesShelterId));
        if (foundCur) return foundCur;
    }

    const savedId = localStorage.getItem(typeof GOWES_BRANCH_KEY !== "undefined" ? GOWES_BRANCH_KEY : "GOWES_ACTIVE_BRANCH_ID") || "";
    if (savedId) {
        const foundSaved = list.find(s => String(s.id) === String(savedId));
        if (foundSaved) {
            activeGowesShelterId = foundSaved.id;
            return foundSaved;
        }
    }

    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (curU && curU.address) {
        const matchedAddr = _matchBranchByKeyword(curU.address);
        if (matchedAddr) {
            activeGowesShelterId = matchedAddr.id;
            return matchedAddr;
        }
    }

    activeGowesShelterId = list[0].id;
    return list[0];
}

function getActiveShelterObject() {
    return resolveInitialGowesBranch();
}

function switchGowesActiveBranch(branchId) {
    const list = getGowesSheltersList();
    const target = list.find(s => String(s.id) === String(branchId));
    if (!target) return;
    activeGowesShelterId = target.id;
    gowesShowcaseIdx = 0;
    localStorage.setItem(typeof GOWES_BRANCH_KEY !== "undefined" ? GOWES_BRANCH_KEY : "GOWES_ACTIVE_BRANCH_ID", target.id);
    renderGowesLandingPage();
    showToast(`Cabang aktif: ${target.city || target.name}`, "info");
}

// ================= 2. INISIALISASI & BERANDA TITIK GOWES =================
function toggleClosedBranchDropdown(forceState = null) {
    const menu = document.getElementById("gowes-closed-dd-menu");
    const chev = document.getElementById("gowes-closed-dd-chev");
    if (!menu) return;
    const willOpen = forceState !== null ? !!forceState : menu.classList.contains("hide");
    menu.classList.toggle("hide", !willOpen);
    if (chev) chev.style.transform = willOpen ? "rotate(180deg)" : "rotate(0deg)";
}

function renderClosedBranchSwitcher(currentShelter) {
    const box = document.getElementById("gowes-closed-branch-switcher");
    if (!box) return;
    const shelters = getGowesSheltersList();
    if (shelters.length <= 1) {
        box.innerHTML = "";
        return;
    }

    const openBranches = shelters.filter(s => !s.isClosed);
    const itemsHtml = shelters.map(s => {
        const isSel = String(s.id) === String(currentShelter.id);
        const isOpen = !s.isClosed;
        return `
            <button type="button" onclick="toggleClosedBranchDropdown(false);switchGowesActiveBranch('${esc(s.id)}')" class="w-full px-3.5 py-2.5 flex items-center justify-between gap-2.5 text-left transition ${isSel ? 'bg-emerald-500/20' : 'hover:bg-white/10'}">
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                        <strong class="text-xs font-extrabold text-white truncate">${escHtml(s.city || s.name)}</strong>
                        <span class="text-[8.5px] px-1.5 py-0.5 rounded-full font-extrabold uppercase shrink-0 ${isOpen ? 'bg-emerald-400/25 text-emerald-300' : 'bg-red-500/25 text-red-300'}">${isOpen ? '● BUKA' : '● TUTUP'}</span>
                    </div>
                    <p class="text-[10px] text-zinc-300/85 truncate">${escHtml(s.name)}</p>
                </div>
                ${isSel ? `<i class="fa-solid fa-circle-check text-emerald-400 text-sm shrink-0"></i>` : `<i class="fa-solid fa-arrow-right text-xs text-white/60 shrink-0"></i>`}
            </button>
        `;
    }).join("");

    box.innerHTML = `
        <div class="space-y-2">
            <button type="button" onclick="toggleClosedBranchDropdown()" class="w-full px-4 py-3 rounded-2xl bg-white/12 hover:bg-white/18 border border-emerald-400/45 text-white flex items-center justify-between gap-3 transition shadow">
                <span class="flex items-center gap-2.5 min-w-0">
                    <span class="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0"><i class="fa-solid fa-location-dot"></i></span>
                    <span class="min-w-0 text-left">
                        <span class="block text-[9.5px] uppercase tracking-wider text-emerald-300 font-extrabold">Pindah ke Cabang Lain</span>
                        <strong class="block text-xs font-bold truncate">${openBranches.length ? `${openBranches.length} cabang lain sedang BUKA` : `Lihat daftar cabang (${shelters.length})`}</strong>
                    </span>
                </span>
                <i id="gowes-closed-dd-chev" class="fa-solid fa-chevron-down text-xs text-emerald-300 transition-transform duration-200 shrink-0"></i>
            </button>
            <div id="gowes-closed-dd-menu" class="hide rounded-2xl bg-black/55 backdrop-blur-md border border-white/15 divide-y divide-white/10 overflow-hidden">
                ${itemsHtml}
            </div>
        </div>
    `;
}

function renderGowesLandingPage() {
    const vGws = document.getElementById("view-gowes");
    if (!vGws || vGws.classList.contains("hide")) return;

    const shelter = getActiveShelterObject();
    const isClosed = !!(shelter && shelter.isClosed);

    const closedNotice = document.getElementById("gowes-closed-notice");
    const openContent = document.getElementById("gowes-open-content");
    const closedTitle = document.getElementById("gowes-closed-title");
    const closedDesc = document.getElementById("gowes-closed-desc");
    const closedWaBtn = document.getElementById("gowes-closed-wa-btn");

    if (isClosed) {
        if (closedNotice) closedNotice.classList.remove("hide");
        if (openContent) openContent.classList.add("hide");
        if (closedTitle) {
            closedTitle.innerText = `Garasi ${shelter.city || "Titik Gowes"} Sedang Tutup`;
        }
        if (closedDesc) {
            closedDesc.innerText = shelter.closedReason || `Garasi ${shelter.name} sedang istirahat / tutup sementara. Anda bisa memilih cabang lain yang sedang buka di bawah ini.`;
        }
        renderClosedBranchSwitcher(shelter);
        if (closedWaBtn) {
            const rawPhone = String(shelter.csPhone || "085117488828").replace(/\D/g, "");
            closedWaBtn.href = `https://wa.me/${rawPhone}?text=${encodeURIComponent("Halo Admin " + (shelter.name || "Titik Gowes") + ", saya ingin menanyakan jadwal buka rental sepeda.")}`;
        }
        return;
    }

    if (closedNotice) closedNotice.classList.add("hide");
    if (openContent) openContent.classList.remove("hide");

    renderGowesBannerSlider();
    renderGowesShowcaseTrack();
    renderGowesShelterSection();
    startGowesAutoSlides();
}

// ================= 3. PETA GOOGLE MAPS ELEGAN & DROPDOWN GERAI DAERAH =================
function _buildGoogleMapsEmbedUrl(shelter) {
    if (!shelter) return "https://maps.google.com/maps?q=Samarinda&t=&z=14&ie=UTF8&iwloc=&output=embed";
    let q = String(shelter.mapsQuery || "").trim();
    if (!q && shelter.mapsUrl) {
        const mCoords = String(shelter.mapsUrl).match(/[?&](?:q|ll)=([^&]+)/i);
        if (mCoords) {
            try { q = decodeURIComponent(mCoords[1]); } catch { q = mCoords[1]; }
        } else {
            const mAt = String(shelter.mapsUrl).match(/@(-?\d+\.\d+,-?\d+\.\d+)/);
            if (mAt) q = mAt[1];
        }
    }
    if (!q) q = [shelter.name, shelter.address, shelter.city].filter(Boolean).join(", ");
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

function toggleGowesBranchDropdown(forceState = null) {
    const menu = document.getElementById("gowes-branch-dropdown-menu");
    const btn = document.getElementById("gowes-branch-dropdown-btn");
    const chev = document.getElementById("gowes-branch-dd-chevron");
    if (!menu || !btn) return;
    const willOpen = forceState !== null ? !!forceState : menu.classList.contains("hide");
    menu.classList.toggle("hide", !willOpen);
    btn.classList.toggle("is-open", willOpen);
    if (chev) chev.style.transform = willOpen ? "rotate(180deg)" : "rotate(0deg)";
}

function selectGowesBranchFromDropdown(branchId) {
    toggleGowesBranchDropdown(false);
    switchGowesActiveBranch(branchId);
}

function renderGowesShelterSection() {
    const container = document.getElementById("sec-gowes-shelter");
    if (!container) return;

    const shelters = getGowesSheltersList();
    const current = getActiveShelterObject();
    const mapsHref = current.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(current.address || current.city || "Samarinda")}`;
    const embedUrl = _buildGoogleMapsEmbedUrl(current);

    const dropdownItemsHtml = shelters.map(s => {
        const isSel = String(s.id) === String(current.id);
        return `
            <button type="button" onclick="selectGowesBranchFromDropdown('${esc(s.id)}')" class="w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left transition hover:bg-emerald-500/10 ${isSel ? 'bg-emerald-500/10' : ''}">
                <div class="flex items-center gap-2.5 min-w-0 flex-1">
                    <span class="w-8 h-8 rounded-xl ${isSel ? 'bg-emerald-500 text-white' : 'app-card-soft border text-emerald-600'} flex items-center justify-center text-xs shrink-0">
                        <i class="fa-solid fa-location-dot"></i>
                    </span>
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                            <strong class="text-xs sm:text-sm font-extrabold truncate">${escHtml(s.city || s.name)}</strong>
                            ${s.isClosed
                                ? `<span class="text-[8.5px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-500 font-extrabold uppercase shrink-0">Tutup</span>`
                                : `<span class="text-[8.5px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-extrabold uppercase shrink-0">Buka</span>`}
                        </div>
                        <p class="text-[10px] app-muted truncate">${escHtml(s.address || s.name)}</p>
                    </div>
                </div>
                ${isSel ? `<i class="fa-solid fa-circle-check text-emerald-600 text-base shrink-0"></i>` : `<i class="fa-regular fa-circle app-muted text-sm opacity-45 shrink-0"></i>`}
            </button>
        `;
    }).join("");

    container.innerHTML = `
        <div class="space-y-3">
            <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                    <div>
                        <span class="gowes-brand-tag">GERAI &amp; POS GARASI</span>
                        <h4 class="text-xs font-extrabold uppercase app-muted tracking-wider mt-1">Pilih Cabang Daerah</h4>
                    </div>
                    <span class="text-[10px] font-bold text-emerald-600">${shelters.length} Lokasi</span>
                </div>

                <!-- Tombol Dropdown Lokasi Memanjang Profesional -->
                <div id="gowes-branch-dropdown-wrap" class="relative">
                    <button type="button" id="gowes-branch-dropdown-btn" onclick="toggleGowesBranchDropdown()" class="gowes-branch-select-btn" aria-haspopup="listbox">
                        <span class="flex items-center gap-2.5 min-w-0 flex-1">
                            <span class="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xs shadow-sm shrink-0">
                                <i class="fa-solid fa-location-dot"></i>
                            </span>
                            <span class="min-w-0 flex-1">
                                <span class="block text-xs sm:text-sm font-extrabold truncate leading-tight">${escHtml(current.city || current.name)}</span>
                                <span class="block text-[10px] app-muted truncate">${escHtml(current.name)}</span>
                            </span>
                        </span>
                        <span class="flex items-center gap-1.5 shrink-0">
                            <span class="text-[9.5px] font-extrabold text-emerald-600 uppercase hidden sm:inline">Ganti Lokasi</span>
                            <i id="gowes-branch-dd-chevron" class="fa-solid fa-chevron-down text-xs text-emerald-600 transition-transform duration-200"></i>
                        </span>
                    </button>

                    <div id="gowes-branch-dropdown-menu" class="hide gowes-branch-dropdown-menu divide-y divide-black/10">
                        ${dropdownItemsHtml}
                    </div>
                </div>
            </div>

            <div class="flex items-start justify-between gap-3 pt-1">
                <div class="flex items-start gap-3 min-w-0 flex-1">
                    <div class="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                        <i class="fa-solid fa-store"></i>
                    </div>
                    <div class="min-w-0">
                        <h3 id="gowes-shelter-name" class="font-extrabold text-sm sm:text-base leading-snug line-clamp-2">${escHtml(current.name)}</h3>
                        <p id="gowes-shelter-address" class="text-[11px] app-muted line-clamp-2 mt-0.5">${escHtml(current.address)}</p>
                    </div>
                </div>
                <a id="gowes-shelter-map-btn" href="${esc(mapsHref)}" target="_blank" rel="noopener noreferrer" class="gowes-pill-btn px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow shrink-0 mt-0.5">
                    <i class="fa-solid fa-diamond-turn-right"></i> Rute
                </a>
            </div>

            <!-- Tampilan Maps Bersih (Tombol Buka Maps di Kanan Atas, Tanpa Menimpa Watermark Google) -->
            <div class="gowes-map-card-frame shadow-sm">
                <iframe src="${esc(embedUrl)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Peta ${escHtml(current.name)}"></iframe>
                <a href="${esc(mapsHref)}" target="_blank" rel="noopener noreferrer" class="gowes-map-click-overlay" title="Buka rute di Google Maps">
                    <span class="px-3 py-1.5 rounded-xl bg-white/95 text-zinc-900 text-[10px] font-extrabold shadow-md flex items-center gap-1.5 border border-black/10">
                        <i class="fa-solid fa-location-arrow text-emerald-600"></i> Buka Maps
                    </span>
                </a>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t gold-border text-[11px]">
                <div class="flex items-center gap-1.5"><i class="fa-regular fa-clock text-emerald-600"></i><span id="gowes-hours-lbl" class="app-muted font-medium">Buka: ${escHtml(current.operationalHours || "05.30 - 20.00 WITA")}</span></div>
                <div class="flex items-center gap-1.5"><i class="fa-solid fa-shield-halved text-emerald-600"></i><span class="app-muted font-medium">Jaminan: KTP / SIM Asli</span></div>
                <div class="flex items-center gap-1.5"><i class="fa-solid fa-helmet-safety text-emerald-600"></i><span class="app-muted font-medium">Gratis Helm &amp; Kunci</span></div>
            </div>
        </div>
    `;
}

if (!window.__gowesBranchOutsideBound) {
    window.__gowesBranchOutsideBound = true;
    document.addEventListener("click", (ev) => {
        const wrap = document.getElementById("gowes-branch-dropdown-wrap");
        if (wrap && !wrap.contains(ev.target)) {
            toggleGowesBranchDropdown(false);
        }
    });
}

// ================= 4. BANNER PROMOSI FULL MENTOK HEADER (RASIO 16 : 7) =================
function _getGowesBannersList() {
    if (Array.isArray(db.gowesBanners) && db.gowesBanners.length) return db.gowesBanners;
    return DEFAULT_GOWES_BANNERS;
}

function renderGowesBannerSlider() {
    const track = document.getElementById("gowes-banner-track");
    if (!track) return;
    const slides = _getGowesBannersList();
    if (gowesBannerIdx >= slides.length) gowesBannerIdx = 0;

    const safeDefaultImg = "https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=1200&q=80";
    track.innerHTML = slides.map((s, idx) => {
        const primaryImg = (s.img && String(s.img).trim()) ? s.img : safeDefaultImg;
        return `
            <div onclick="handleGowesBannerClick(${idx})" class="min-w-full h-full relative flex items-center px-5 sm:px-8 cursor-pointer select-none overflow-hidden" style="background:linear-gradient(135deg,#064e3b 0%,#0f172a 55%,#09090b 100%);">
                <img src="${esc(primaryImg)}" alt="" onerror="if(this.dataset.tried!=='1'){this.dataset.tried='1';this.src='${safeDefaultImg}';}else{this.style.display='none';}" class="absolute inset-0 w-full h-full object-cover object-center">
                <div class="absolute inset-0 bg-gradient-to-r from-black/88 via-black/52 to-black/15"></div>
                <div class="relative z-10 max-w-[78%] sm:max-w-md space-y-1.5 text-white">
                    <h3 class="gowes-banner-headline text-base sm:text-2xl leading-[1.12] text-white">${escHtml(s.title || "SEHAT & BAHAGIA DENGAN BERSEPEDA!")}</h3>
                    <p class="text-[10.5px] sm:text-xs text-white/95 font-semibold italic line-clamp-2 drop-shadow">${escHtml(s.subtitle || "RASAKAN MANFAATNYA!")}</p>
                    ${s.ctaText ? `<span class="inline-block mt-1 px-3 py-1 rounded-lg bg-emerald-500/95 text-[10px] font-extrabold text-white shadow">${escHtml(s.ctaText)} <i class="fa-solid fa-arrow-right ml-1 text-[8px]"></i></span>` : ""}
                </div>
            </div>
        `;
    }).join("");

    updateGowesBannerPos();
}

function updateGowesBannerPos() {
    const track = document.getElementById("gowes-banner-track");
    if (track) track.style.transform = `translateX(-${gowesBannerIdx * 100}%)`;
}

function handleGowesBannerClick(idx) {
    const s = _getGowesBannersList()[idx];
    if (!s) return;
    if (!s.targetSection || s.targetSection === "open_booking" || s.targetSection === "sec-gowes-booking-cta") {
        openGowesBookingModal();
        return;
    }
    const targetEl = document.getElementById(s.targetSection);
    if (targetEl) targetEl.scrollIntoView({ behavior: "smooth" });
    else openGowesBookingModal();
}

// ================= 5. DURASI DINAMIS, JADWAL 14 HARI & DETEKSI BENTROK =================
function parseGowesDurationHours(bike, durationKey, durationLabelFallback = "") {
    if (durationKey === "full_day") {
        const lblF = String((bike && bike.labelFullDay) || durationLabelFallback || "");
        const mF = lblF.match(/(\d+(?:\.\d+)?)\s*jam/i);
        return mF ? Math.max(1, parseFloat(mF[1])) : 0; // 0 = sampai 20:00 WITA
    }
    const lbl = durationKey === "6_hours"
        ? String((bike && bike.label6Hours) || durationLabelFallback || "6 Jam")
        : String((bike && bike.label2Hours) || durationLabelFallback || "2 Jam");
    const m = lbl.match(/(\d+(?:\.\d+)?)\s*jam/i);
    if (m) return Math.max(1, parseFloat(m[1]));
    return durationKey === "6_hours" ? 6 : 2;
}

function getBookingIntervalMinutes(startTime, durationKey, bike = null, durationLabelFallback = "") {
    const parts = String(startTime || "08:00").trim().split(":");
    let hh = parseInt(parts[0], 10);
    let mm = parseInt(parts[1], 10);
    if (isNaN(hh)) hh = 8;
    if (isNaN(mm)) mm = 0;

    const startMin = hh * 60 + mm;
    const hrs = parseGowesDurationHours(bike, durationKey, durationLabelFallback);
    let endMin;
    if (durationKey === "full_day" && hrs === 0) {
        endMin = Math.max(startMin + 120, 20 * 60);
    } else {
        endMin = startMin + Math.round(hrs * 60);
    }

    const endH = Math.floor((endMin % 1440) / 60);
    const endM = endMin % 60;
    const nextDay = endMin >= 1440;
    const pad2 = (n) => String(n).padStart(2, "0");

    return {
        startMin,
        endMin,
        durationHours: hrs,
        nextDay,
        startDot: `${pad2(hh)}.${pad2(mm)}`,
        endDot: `${pad2(endH)}.${pad2(endM)}`,
        endColon: `${pad2(endH)}:${pad2(endM)}`,
        rangeText: `${pad2(hh)}.${pad2(mm)}-${pad2(endH)}.${pad2(endM)}`
    };
}

function _getAllActiveGowesBookings() {
    const sources = [];
    if (Array.isArray(db.gowesUpcomingBookings)) sources.push(...db.gowesUpcomingBookings);
    if (Array.isArray(db.gowesTodayBookings)) sources.push(...db.gowesTodayBookings);
    if (Array.isArray(db.gowesRentals)) sources.push(...db.gowesRentals);

    const seen = new Set();
    const out = [];
    sources.forEach(r => {
        if (!r) return;
        const st = String(r.status || "");
        if (st === "Dibatalkan" || st === "Selesai") return;
        const rid = String(r.id || `${r.bikeId}_${r.startDate}_${r.startTime}`);
        if (seen.has(rid)) return;
        seen.add(rid);
        out.push(r);
    });
    return out;
}

function getBikeBookingsForDate(bikeId, dateStr) {
    if (!dateStr) return [];
    const allBikes = Array.isArray(db.gowesBikes) && db.gowesBikes.length ? db.gowesBikes : DEFAULT_GOWES_BIKES;
    const bikeObj = allBikes.find(b => String(b.id) === String(bikeId)) || null;

    const list = _getAllActiveGowesBookings().filter(r => {
        if (String(r.startDate || "") !== String(dateStr)) return false;
        return (Array.isArray(r.selectedBikes) && r.selectedBikes.length)
            ? r.selectedBikes.some(sb => String(sb.bikeId) === String(bikeId))
            : String(r.bikeId) === String(bikeId);
    }).map(r => {
        const iv = getBookingIntervalMinutes(r.startTime, r.durationKey, bikeObj, r.durationLabel);
        return {
            id: r.id,
            startTime: r.startTime || "08:00",
            startMin: iv.startMin,
            endMin: iv.endMin,
            rangeText: iv.rangeText
        };
    });

    list.sort((a, b) => a.startMin - b.startMin);
    return list;
}

function getBikeTodayBookingSlots(bikeId) {
    const todayStr = new Date().toISOString().split("T")[0];
    const items = getBikeBookingsForDate(bikeId, todayStr);
    return Array.from(new Set(items.map(x => x.rangeText)));
}

function findBikeScheduleConflict(bikeId, dateStr, startTime, durationKey, bikeObj = null) {
    if (!bikeId || !dateStr || !startTime) return null;
    const reqIv = getBookingIntervalMinutes(startTime, durationKey, bikeObj, "");
    const existing = getBikeBookingsForDate(bikeId, dateStr);
    for (let i = 0; i < existing.length; i++) {
        const ex = existing[i];
        if (reqIv.startMin < ex.endMin && ex.startMin < reqIv.endMin) {
            return ex;
        }
    }
    return null;
}

function validateBookingListConflicts(bikeObjs, dateStr, startTime, durationKey) {
    const conflicts = [];
    for (let i = 0; i < bikeObjs.length; i++) {
        const b = bikeObjs[i];
        if (!b) continue;
        const c = findBikeScheduleConflict(b.id, dateStr, startTime, durationKey, b);
        if (c) {
            conflicts.push({
                bikeId: b.id,
                bikeName: b.name,
                rangeText: c.rangeText,
                message: `Unit ${b.name} di jam ini sudah di booking, silahkan pilih unit lain.`
            });
        }
    }
    return conflicts;
}

function buildBikeStatusBadgesHtml(bike) {
    if (bike.status === "Servis") {
        return `<span class="px-2.5 py-0.5 rounded-full bg-zinc-700/90 backdrop-blur-md text-white font-extrabold text-[9px] uppercase tracking-wider shadow">✕ Masa Servis</span>`;
    }

    const todaySlots = getBikeTodayBookingSlots(bike.id);
    if (todaySlots.length > 0) {
        const compactRanges = todaySlots.length <= 2
            ? todaySlots.join(" & ")
            : `${todaySlots.slice(0, 2).join(", ")} +${todaySlots.length - 2}`;
        return `
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-md text-white font-extrabold text-[9px] uppercase tracking-wider shadow">● Ready Hari Ini</span>
            <span class="px-2.5 py-0.5 rounded-full bg-amber-400/95 backdrop-blur-md text-zinc-950 font-extrabold text-[9px] tracking-tight shadow" title="Sudah dibooking hari ini pada jam tersebut">
                <i class="fa-regular fa-clock mr-1"></i>Booked ${escHtml(compactRanges)}
            </span>
        `;
    }

    if (bike.status === "Sedang Disewa") {
        return `<span class="px-2.5 py-0.5 rounded-full bg-amber-400/95 backdrop-blur-md text-zinc-950 font-extrabold text-[9px] uppercase tracking-wider shadow">● Sedang Dipakai</span>`;
    }

    return `<span class="px-2.5 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-md text-white font-extrabold text-[9px] uppercase tracking-wider shadow">● Ready Hari Ini</span>`;
}

// ================= 6. SHOWCASE PILIHAN SEPEDA PER CABANG (4:3 ELEGAN) =================
function getAvailableGowesBikes(branchIdOverride = null) {
    const list = Array.isArray(db.gowesBikes) && db.gowesBikes.length ? db.gowesBikes : DEFAULT_GOWES_BIKES;
    const activeBranch = branchIdOverride || (getActiveShelterObject() && getActiveShelterObject().id) || "";
    const filtered = list.filter(b => {
        if (!b || b.status === "Dihapus") return false;
        if (!activeBranch || !b.branchId || b.branchId === "all") return true;
        return String(b.branchId) === String(activeBranch);
    });
    return filtered;
}

function renderGowesShowcaseDots(count) {
    const dotsBox = document.getElementById("gowes-showcase-dots");
    if (!dotsBox) return;
    if (count <= 1) {
        dotsBox.innerHTML = "";
        return;
    }
    dotsBox.innerHTML = Array.from({ length: count }, (_, i) => {
        const active = i === gowesShowcaseIdx;
        return `<button type="button" onclick="jumpToGowesShowcaseSlide(${i})" class="gowes-dot-btn ${active ? 'w-5 bg-emerald-500' : 'w-1.5 bg-zinc-400/50'}" aria-label="Unit ${i + 1}"></button>`;
    }).join("");
}

function jumpToGowesShowcaseSlide(idx) {
    const track = document.getElementById("gowes-showcase-track");
    if (!track || !track.children.length) return;
    gowesShowcaseIdx = Math.max(0, Math.min(track.children.length - 1, idx));
    const targetSlide = track.children[gowesShowcaseIdx];
    if (targetSlide) {
        track.scrollTo({ left: targetSlide.offsetLeft, behavior: "smooth" });
    }
    renderGowesShowcaseDots(track.children.length);
}

function renderGowesShowcaseTrack() {
    const track = document.getElementById("gowes-showcase-track");
    if (!track) return;

    const bikes = getAvailableGowesBikes();
    const currentBranch = getActiveShelterObject();

    if (!bikes.length) {
        track.innerHTML = `
            <div class="w-full py-14 px-4 text-center app-card border border-dashed rounded-3xl space-y-2">
                <i class="fa-solid fa-bicycle text-4xl text-emerald-600/60"></i>
                <h4 class="font-extrabold text-sm">Belum Ada Unit di Cabang ${escHtml((currentBranch && currentBranch.city) || "Ini")}</h4>
                <p class="text-xs app-muted">Silakan pilih cabang daerah lain di bawah atau hubungi petugas kami via Live Chat.</p>
            </div>
        `;
        renderGowesShowcaseDots(0);
        return;
    }

    if (gowesShowcaseIdx >= bikes.length) gowesShowcaseIdx = 0;
    const fallbackImg = "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75";

    track.innerHTML = bikes.map((b, idx) => {
        const isMaintenance = b.status === "Servis";
        const statusBadgesHtml = buildBikeStatusBadgesHtml(b);
        const l2h = b.label2Hours || "2 Jam";
        const l6h = b.label6Hours || "6 Jam";
        const lFull = b.labelFullDay || "Full Day";

        const actionBtn = !isMaintenance
            ? `<button type="button" onclick="openGowesBookingModal('${esc(b.id)}')" class="w-full gowes-pill-btn py-3 rounded-2xl text-xs uppercase tracking-wider font-extrabold shadow-xl flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-bicycle"></i> Sewa Unit Ini
               </button>`
            : `<button type="button" disabled class="w-full py-3 rounded-2xl bg-white/15 text-white/60 text-xs font-bold text-center cursor-not-allowed">
                Dalam Masa Servis
               </button>`;

        return `
            <div class="gowes-showcase-slide" data-slide-idx="${idx}">
                <div class="gowes-showcase-photo-box">
                    <img src="${b.image || fallbackImg}" alt="${escHtml(b.name)}" loading="lazy">
                    <div class="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent pointer-events-none"></div>
                    <div class="absolute top-3 inset-x-3 z-10 flex items-center gap-1.5 flex-wrap">
                        ${statusBadgesHtml}
                        <span class="px-2.5 py-0.5 rounded-full bg-black/55 text-white text-[9px] font-bold backdrop-blur-md border border-white/20">${escHtml(b.type || "Sepeda")}</span>
                    </div>
                    <div class="gowes-showcase-photo-fade"></div>
                </div>

                <div class="gowes-showcase-info">
                    <div>
                        <h3 class="text-lg sm:text-xl font-extrabold leading-tight text-white">${escHtml(b.name)}</h3>
                        <p class="text-[11px] text-zinc-300 line-clamp-2 mt-0.5">${escHtml(b.description || "")}</p>
                    </div>

                    <div class="flex flex-wrap gap-1.5 text-[10px]">
                        ${b.frameSize ? `<span class="px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-zinc-100 font-semibold"><i class="fa-solid fa-ruler-combined text-emerald-400 mr-1"></i>${escHtml(b.frameSize)}</span>` : ""}
                        ${b.gears ? `<span class="px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-zinc-100 font-semibold"><i class="fa-solid fa-gear text-emerald-400 mr-1"></i>${escHtml(b.gears)}</span>` : ""}
                        ${b.brakes ? `<span class="px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-zinc-100 font-semibold"><i class="fa-solid fa-circle-stop text-emerald-400 mr-1"></i>${escHtml(b.brakes)}</span>` : ""}
                    </div>

                    <div class="grid grid-cols-3 gap-1.5 p-2 rounded-2xl bg-white/5 border border-white/15 text-center">
                        <div class="p-1">
                            <span class="text-[8.5px] uppercase font-bold text-zinc-400 block truncate">${escHtml(l2h)}</span>
                            <strong class="text-xs font-extrabold text-emerald-400 block">${fmtRp(b.price2Hours || 40000)}</strong>
                        </div>
                        <div class="p-1 border-x border-white/15">
                            <span class="text-[8.5px] uppercase font-bold text-zinc-400 block truncate">${escHtml(l6h)}</span>
                            <strong class="text-xs font-extrabold text-emerald-400 block">${fmtRp(b.price6Hours || 75000)}</strong>
                        </div>
                        <div class="p-1">
                            <span class="text-[8.5px] uppercase font-bold text-zinc-400 block truncate">${escHtml(lFull)}</span>
                            <strong class="text-xs font-extrabold text-emerald-400 block">${fmtRp(b.priceFullDay || 120000)}</strong>
                        </div>
                    </div>

                    <div class="pt-0.5">
                        ${actionBtn}
                    </div>
                </div>
            </div>
        `;
    }).join("");

    renderGowesShowcaseDots(bikes.length);

    if (!track.dataset.dotScrollBound) {
        track.dataset.dotScrollBound = "1";
        let dotRaf = null;
        track.addEventListener("scroll", () => {
            if (dotRaf) return;
            dotRaf = requestAnimationFrame(() => {
                dotRaf = null;
                const slideW = track.clientWidth || window.innerWidth || 1;
                const nextIdx = Math.round(track.scrollLeft / slideW);
                if (nextIdx !== gowesShowcaseIdx && nextIdx >= 0 && nextIdx < track.children.length) {
                    gowesShowcaseIdx = nextIdx;
                    renderGowesShowcaseDots(track.children.length);
                }
            });
        }, { passive: true });
    }
}

function startGowesAutoSlides() {
    clearInterval(gowesBannerTimer);
    clearInterval(gowesShowcaseTimer);

    gowesBannerTimer = setInterval(() => {
        if (document.hidden || currentViewName !== "landing" || currentAppMode !== "titik_gowes") return;
        const banners = _getGowesBannersList();
        if (banners.length > 1) {
            gowesBannerIdx = (gowesBannerIdx + 1) % banners.length;
            updateGowesBannerPos();
        }
    }, 4500);

    gowesShowcaseTimer = setInterval(() => {
        if (document.hidden || currentViewName !== "landing" || currentAppMode !== "titik_gowes") return;
        const track = document.getElementById("gowes-showcase-track");
        if (!track || track.children.length <= 1) return;

        gowesShowcaseIdx = (gowesShowcaseIdx + 1) % track.children.length;
        const targetSlide = track.children[gowesShowcaseIdx];
        if (targetSlide) {
            track.scrollTo({ left: targetSlide.offsetLeft, behavior: "smooth" });
        }
        renderGowesShowcaseDots(track.children.length);
    }, 6500);
}

// ================= 7. KOMPONEN PEMILIH SEPEDA BERGAMBAR (ANTI DUPLIKAT & ANTI BENTROK) =================
function _buildVisualBikePickerHtml({ bikes, selectedIds, openIdx, dateStr, startTime, durationKey, toggleFnName, pickFnName, idPrefix }) {
    const fallbackImg = "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75";
    const totalUnits = selectedIds.length || 1;

    return selectedIds.map((selId, idx) => {
        const labelTxt = totalUnits > 1 ? `Pilih Unit Sepeda #${idx + 1}` : "Pilih Unit Sepeda";
        const selBike = bikes.find(b => String(b.id) === String(selId)) || bikes.find(b => b.status !== "Servis") || bikes[0];
        if (!selBike) return "";

        const isOpen = openIdx === idx;
        const selConflict = findBikeScheduleConflict(selBike.id, dateStr, startTime, durationKey, selBike);
        const selDateSlots = getBikeBookingsForDate(selBike.id, dateStr);

        const selBadgeHtml = selBike.status === "Servis"
            ? `<span class="inline-block px-1.5 py-0.5 rounded-md bg-zinc-600/20 text-zinc-500 text-[9px] font-extrabold">Masa Servis</span>`
            : selConflict
                ? `<span class="inline-block px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-600 text-[9px] font-extrabold"><i class="fa-solid fa-triangle-exclamation mr-0.5"></i>Bentrok (${escHtml(selConflict.rangeText)})</span>`
                : selDateSlots.length
                    ? `<span class="inline-block px-1.5 py-0.5 rounded-md bg-amber-400/25 text-amber-700 text-[9px] font-extrabold">Booked ${escHtml(selDateSlots[0].rangeText)}</span>`
                    : `<span class="inline-block px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 text-[9px] font-extrabold">● Ready</span>`;

        const listItemsHtml = bikes.map(b => {
            const isSel = String(b.id) === String(selBike.id);
            const isMaint = b.status === "Servis";
            const pickedOtherIdx = selectedIds.findIndex((oid, oIdx) => oIdx !== idx && String(oid) === String(b.id));
            const isUsedElsewhere = pickedOtherIdx >= 0;
            const conflictObj = findBikeScheduleConflict(b.id, dateStr, startTime, durationKey, b);
            const dateSlots = getBikeBookingsForDate(b.id, dateStr);
            const isDisabled = isMaint || isUsedElsewhere;

            let statusPill = `<span class="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 text-[8.5px] font-extrabold">● Ready</span>`;
            if (isMaint) {
                statusPill = `<span class="px-1.5 py-0.5 rounded bg-zinc-500/20 text-zinc-500 text-[8.5px] font-extrabold uppercase">Servis</span>`;
            } else if (isUsedElsewhere) {
                statusPill = `<span class="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 text-[8.5px] font-extrabold">Dipilih di Unit #${pickedOtherIdx + 1}</span>`;
            } else if (conflictObj) {
                statusPill = `<span class="px-1.5 py-0.5 rounded bg-red-500/20 text-red-600 text-[8.5px] font-extrabold">Sudah Dibooking (${escHtml(conflictObj.rangeText)})</span>`;
            } else if (dateSlots.length) {
                statusPill = `<span class="px-1.5 py-0.5 rounded bg-amber-400/30 text-amber-800 text-[8.5px] font-extrabold">Booked ${escHtml(dateSlots[0].rangeText)}</span>`;
            }

            const specsLine = [b.type, b.frameSize, b.gears].filter(Boolean).join(" • ");

            return `
                <button type="button" ${isDisabled ? "disabled" : `onclick="${pickFnName}(${idx},'${esc(b.id)}')"`} class="w-full p-2.5 flex items-center gap-3 text-left transition ${isSel ? 'bg-emerald-500/12' : 'hover:bg-black/5'} ${isDisabled ? 'opacity-45 cursor-not-allowed' : conflictObj ? 'bg-red-500/5 cursor-pointer' : 'cursor-pointer'}">
                    <img src="${esc(b.image || fallbackImg)}" alt="${escHtml(b.name)}" onerror="this.src='${fallbackImg}'" class="w-16 h-12 rounded-xl object-cover bg-black border gold-border shrink-0">
                    <div class="min-w-0 flex-1 space-y-0.5">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <strong class="text-xs font-extrabold truncate">${escHtml(b.name)}</strong>
                            ${statusPill}
                        </div>
                        <p class="text-[10px] app-muted truncate">${escHtml(specsLine || "Sepeda Siap Gowes")}</p>
                        <p class="text-[10.5px] font-extrabold text-emerald-600">${fmtRp(b.price2Hours || 40000)} <span class="font-normal app-muted">/ ${escHtml(b.label2Hours || "2 Jam")}</span></p>
                    </div>
                    <span class="shrink-0 pr-1">
                        ${isSel
                            ? `<i class="fa-solid fa-circle-check text-emerald-600 text-base"></i>`
                            : isUsedElsewhere
                                ? `<i class="fa-solid fa-lock text-blue-500 text-sm"></i>`
                                : conflictObj
                                    ? `<i class="fa-solid fa-triangle-exclamation text-red-500 text-sm"></i>`
                                    : `<i class="fa-regular fa-circle app-muted text-base opacity-45"></i>`}
                    </span>
                </button>
            `;
        }).join("");

        return `
            <div class="space-y-1">
                <label class="app-label">${labelTxt}</label>
                <input type="hidden" id="${idPrefix}-select-${idx}" value="${esc(selBike.id)}">
                <button type="button" id="${idPrefix}-btn-${idx}" onclick="${toggleFnName}(${idx})" class="gowes-bike-picker-trigger ${isOpen ? 'is-open' : ''} ${selConflict ? '!border-red-500' : ''}">
                    <img src="${esc(selBike.image || fallbackImg)}" alt="${escHtml(selBike.name)}" onerror="this.src='${fallbackImg}'" class="w-16 h-12 rounded-xl object-cover bg-black border gold-border shrink-0">
                    <div class="min-w-0 flex-1 space-y-0.5">
                        <strong class="text-xs sm:text-sm font-extrabold block truncate leading-tight">${escHtml(selBike.name)}</strong>
                        <span class="text-[10px] app-muted block truncate">${escHtml(selBike.type || "Sepeda")} • <strong class="text-emerald-600">${fmtRp(selBike.price2Hours || 40000)}</strong></span>
                        <div>${selBadgeHtml}</div>
                    </div>
                    <div class="flex flex-col items-end gap-0.5 shrink-0 pr-0.5">
                        <span class="text-[9px] font-bold text-emerald-600 uppercase">${isOpen ? 'Tutup' : 'Ganti'}</span>
                        <i class="fa-solid fa-chevron-down text-xs text-emerald-600 transition-transform duration-200" style="transform:${isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}"></i>
                    </div>
                </button>
                <div id="${idPrefix}-list-${idx}" class="${isOpen ? '' : 'hide'} gowes-bike-picker-list divide-y divide-black/10">
                    ${listItemsHtml}
                </div>
            </div>
        `;
    }).join("");
}

function _renderConflictBannerInto(alertElId, submitBtnId, conflicts) {
    const alertEl = document.getElementById(alertElId);
    const submitBtn = document.getElementById(submitBtnId);
    if (alertEl) {
        if (conflicts && conflicts.length) {
            alertEl.className = "gowes-conflict-alert";
            alertEl.innerHTML = `
                <i class="fa-solid fa-triangle-exclamation text-base shrink-0 mt-0.5"></i>
                <div class="space-y-1 flex-1">
                    ${conflicts.map(c => `<p>${escHtml(c.message)}</p>`).join("")}
                </div>
            `;
        } else {
            alertEl.className = "hide";
            alertEl.innerHTML = "";
        }
    }
    if (submitBtn) {
        submitBtn.disabled = !!(conflicts && conflicts.length);
        submitBtn.classList.toggle("opacity-50", !!(conflicts && conflicts.length));
        submitBtn.classList.toggle("cursor-not-allowed", !!(conflicts && conflicts.length));
    }
}

// ================= 8. FORMULIR SEWA ONLINE PELANGGAN =================
function getSelectedBookingBikesObjects() {
    const bikes = getAvailableGowesBikes();
    if (!bikes.length) return [];
    const fallbackBike = bikes.find(b => b.status !== "Servis") || bikes[0];
    return bookingSelectedBikeIds.map(id => bikes.find(b => String(b.id) === String(id)) || fallbackBike);
}

function toggleBookingBikePicker(slotIdx) {
    openBookingBikePickerIdx = (openBookingBikePickerIdx === slotIdx) ? -1 : slotIdx;
    renderBookingBikeSelectors();
}

function pickBookingBikeVisual(slotIdx, bikeId) {
    if (bookingSelectedBikeIds.some((oid, i) => i !== slotIdx && String(oid) === String(bikeId))) {
        return showToast("Unit sepeda ini sudah dipilih di slot lain.", "info");
    }
    openBookingBikePickerIdx = -1;
    onBookingBikeSlotChange(slotIdx, bikeId);
    renderBookingBikeSelectors();
}

function onGowesBookingScheduleChange() {
    renderBookingBikeSelectors();
    updateGowesBookingPriceCalc();
}

function renderBookingBikeSelectors() {
    const box = document.getElementById("gw-book-bikes-container");
    if (!box) return;
    const bikes = getAvailableGowesBikes();
    if (!bikes.length) {
        box.innerHTML = `<p class="text-xs text-red-500 font-bold">Belum ada unit sepeda tersedia di cabang ini.</p>`;
        return;
    }

    const dateStr = document.getElementById("gw-book-date")?.value || new Date().toISOString().split("T")[0];
    const startTime = document.getElementById("gw-book-time")?.value || "08:00";
    const durRadio = document.querySelector('input[name="gw_duration"]:checked');
    const durationKey = durRadio ? durRadio.value : "2_hours";

    box.innerHTML = _buildVisualBikePickerHtml({
        bikes,
        selectedIds: bookingSelectedBikeIds,
        openIdx: openBookingBikePickerIdx,
        dateStr,
        startTime,
        durationKey,
        toggleFnName: "toggleBookingBikePicker",
        pickFnName: "pickBookingBikeVisual",
        idPrefix: "gw-book-bike"
    });

    const conflicts = validateBookingListConflicts(getSelectedBookingBikesObjects(), dateStr, startTime, durationKey);
    _renderConflictBannerInto("gw-book-conflict-alert", "btn-submit-gw-booking", conflicts);
}

function onBookingBikeSlotChange(slotIdx, bikeId) {
    bookingSelectedBikeIds[slotIdx] = bikeId;
    const bikes = getAvailableGowesBikes();
    if (slotIdx === 0) {
        activeBookingBike = bikes.find(b => String(b.id) === String(bikeId)) || activeBookingBike;
        _refreshBookingBranchBadge();
    }
    updateGowesBookingPriceCalc();
}

function _refreshBookingBranchBadge() {
    const branchBadge = document.getElementById("gw-book-branch-badge");
    if (!branchBadge || !activeBookingBike) return;
    const currentBranch = getActiveShelterObject();
    const bookedToday = getBikeTodayBookingSlots(activeBookingBike.id);
    const bookedHint = bookedToday.length
        ? `<span class="block text-[10px] text-amber-600 font-bold mt-1"><i class="fa-regular fa-clock mr-1"></i>Info hari ini: unit #1 terbooking jam ${escHtml(bookedToday.join(" & "))} WITA — pilih jam lain yang kosong.</span>`
        : "";
    branchBadge.innerHTML = `
        <div class="rounded-2xl p-3 bg-emerald-500/10 border border-emerald-500/35 space-y-0.5">
            <div class="flex items-center justify-between gap-2 text-xs">
                <strong class="text-emerald-700 truncate"><i class="fa-solid fa-location-dot mr-1.5"></i>Form Cabang ${escHtml(currentBranch.city || "Utama")}</strong>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold shrink-0">OTOMATIS</span>
            </div>
            <p class="text-[10.5px] app-muted truncate">${escHtml(currentBranch.name)} • ${escHtml(currentBranch.address)}</p>
            ${bookedHint}
        </div>
    `;
}

function changeBookingBikeQty(delta) {
    const inp = document.getElementById("gw-book-qty");
    const lbl = document.getElementById("gw-book-qty-lbl");
    if (!inp || !lbl) return;

    const bikes = getAvailableGowesBikes().filter(b => b.status !== "Servis");
    if (!bikes.length) return;
    const maxAllowed = Math.max(1, Math.min(10, bikes.length));

    let cur = parseInt(inp.value, 10) || 1;
    const nextQty = Math.max(1, Math.min(maxAllowed, cur + delta));
    if (delta > 0 && cur >= maxAllowed) {
        showToast(`Maksimal ${maxAllowed} unit sepeda berbeda tersedia di cabang ini.`, "info");
        return;
    }

    inp.value = nextQty;
    lbl.innerText = String(nextQty);

    const dateStr = document.getElementById("gw-book-date")?.value || new Date().toISOString().split("T")[0];
    const startTime = document.getElementById("gw-book-time")?.value || "08:00";
    const durVal = document.querySelector('input[name="gw_duration"]:checked')?.value || "2_hours";

    while (bookingSelectedBikeIds.length < nextQty) {
        const unusedFree = bikes.find(b =>
            !bookingSelectedBikeIds.includes(b.id) &&
            !findBikeScheduleConflict(b.id, dateStr, startTime, durVal, b)
        ) || bikes.find(b => !bookingSelectedBikeIds.includes(b.id));
        if (!unusedFree) break;
        bookingSelectedBikeIds.push(unusedFree.id);
    }
    if (bookingSelectedBikeIds.length > nextQty) {
        bookingSelectedBikeIds = bookingSelectedBikeIds.slice(0, nextQty);
    }

    openBookingBikePickerIdx = -1;
    renderBookingBikeSelectors();
    updateGowesBookingPriceCalc();
}

function updateGowesReturnEstimate() {
    const timeInp = document.getElementById("gw-book-time");
    const durRadio = document.querySelector('input[name="gw_duration"]:checked');
    const textEl = document.getElementById("gw-return-estimate-text");
    if (!textEl) return;

    const timeVal = timeInp ? timeInp.value : "";
    const durVal = durRadio ? durRadio.value : "2_hours";
    const firstBike = getSelectedBookingBikesObjects()[0];
    const lbl = durVal === "6_hours"
        ? ((firstBike && firstBike.label6Hours) || "6 Jam")
        : durVal === "full_day"
            ? ((firstBike && firstBike.labelFullDay) || "Full Day")
            : ((firstBike && firstBike.label2Hours) || "2 Jam");

    if (!timeVal) {
        textEl.innerText = "Pilih jam ambil untuk melihat perkiraan batas kembali";
        return;
    }

    const iv = getBookingIntervalMinutes(timeVal, durVal, firstBike, lbl);
    if (durVal === "full_day" && iv.durationHours === 0) {
        textEl.innerHTML = `Batas kembali: <strong>Pukul 20:00 WITA</strong> hari yang sama (${escHtml(lbl)})`;
    } else {
        textEl.innerHTML = `Batas kembali: <strong>Pukul ${iv.endColon} WITA${iv.nextDay ? " (Besok)" : ""}</strong> (${escHtml(lbl)})`;
    }
}

function updateGowesBookingPriceCalc() {
    const selectedObjs = getSelectedBookingBikesObjects();
    if (!selectedObjs.length) return;

    const first = selectedObjs[0];
    const sum2h = selectedObjs.reduce((s, b) => s + Number(b.price2Hours || 40000), 0);
    const sum6h = selectedObjs.reduce((s, b) => s + Number(b.price6Hours || 75000), 0);
    const sumFull = selectedObjs.reduce((s, b) => s + Number(b.priceFullDay || 120000), 0);

    const l2 = document.getElementById("gw-lbl-2h");
    const l6 = document.getElementById("gw-lbl-6h");
    const lf = document.getElementById("gw-lbl-fullday");
    if (l2) l2.innerText = first.label2Hours || "Paket 2 Jam";
    if (l6) l6.innerText = first.label6Hours || "Paket 6 Jam";
    if (lf) lf.innerText = first.labelFullDay || "Full Day";

    const r2 = document.getElementById("gw-rate-2h");
    const r6 = document.getElementById("gw-rate-6h");
    const rf = document.getElementById("gw-rate-fullday");
    if (r2) r2.innerText = fmtRp(sum2h);
    if (r6) r6.innerText = fmtRp(sum6h);
    if (rf) rf.innerText = fmtRp(sumFull);

    const durRadio = document.querySelector('input[name="gw_duration"]:checked');
    const durVal = durRadio ? durRadio.value : "2_hours";
    const rawTotal = durVal === "6_hours" ? sum6h : durVal === "full_day" ? sumFull : sum2h;
    if (gowesBookingVoucherCode && typeof evaluateVoucherCode === "function") {
        const reval = evaluateVoucherCode(gowesBookingVoucherCode, "gowes", rawTotal);
        gowesBookingVoucherDiscount = reval.ok ? reval.discount : 0;
    } else {
        gowesBookingVoucherDiscount = 0;
    }
    const total = Math.max(1000, rawTotal - gowesBookingVoucherDiscount);

    const calcEl = document.getElementById("gw-book-total-calc");
    if (calcEl) {
        calcEl.innerHTML = gowesBookingVoucherDiscount > 0
            ? `<span class="text-xs line-through app-muted mr-1.5">${fmtRp(rawTotal)}</span>${fmtRp(total)} <span class="text-[10px] font-bold">(${selectedObjs.length} Sepeda)</span>`
            : `${fmtRp(total)} (${selectedObjs.length} Sepeda)`;
    }

    updateGowesReturnEstimate();

    const dateStr = document.getElementById("gw-book-date")?.value || new Date().toISOString().split("T")[0];
    const startTime = document.getElementById("gw-book-time")?.value || "08:00";
    const conflicts = validateBookingListConflicts(selectedObjs, dateStr, startTime, durVal);
    _renderConflictBannerInto("gw-book-conflict-alert", "btn-submit-gw-booking", conflicts);
}

function openGowesBookingModal(bikeId = null) {
    if (!currentSessionUser) {
        showToast("Silakan masuk / daftar akun terlebih dahulu untuk booking sepeda.", "info");
        if (typeof openAuthModal === "function") openAuthModal();
        return;
    }

    const bikes = getAvailableGowesBikes();
    if (!bikes.length) return showToast("Belum ada unit sepeda yang tersedia di cabang ini.", "info");

    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    const currentBranch = getActiveShelterObject();
    const readyFirst = bikes.find(b => b.status !== "Servis") || bikes[0];
    activeBookingBike = bikeId ? (bikes.find(b => String(b.id) === String(bikeId)) || readyFirst) : readyFirst;
    bookingSelectedBikeIds = [activeBookingBike.id];
    openBookingBikePickerIdx = -1;
    gowesKtpDraft = "";
    gowesBookingVoucherCode = "";
    gowesBookingVoucherDiscount = 0;
    const gvInp = document.getElementById("gw-book-voucher"); if (gvInp) gvInp.value = "";
    const gvClr = document.getElementById("btn-gw-clear-voucher"); if (gvClr) gvClr.classList.add("hide");
    const gvStat = document.getElementById("gw-book-voucher-status"); if (gvStat) { gvStat.className = "hide text-[11px] font-semibold"; gvStat.innerText = ""; }

    _refreshBookingBranchBadge();

    const nameInp = document.getElementById("gw-book-name");
    const phInp = document.getElementById("gw-book-phone");
    const addrInp = document.getElementById("gw-book-address");
    if (nameInp) nameInp.value = (curU && (curU.name || curU.username)) || "";
    if (phInp) phInp.value = (curU && curU.phone) || "";
    if (addrInp) addrInp.value = (curU && curU.address) || currentBranch.city || "";

    const qtyInp = document.getElementById("gw-book-qty");
    const qtyLbl = document.getElementById("gw-book-qty-lbl");
    if (qtyInp) qtyInp.value = "1";
    if (qtyLbl) qtyLbl.innerText = "1";

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const dateInp = document.getElementById("gw-book-date");
    if (dateInp) { dateInp.value = todayStr; dateInp.min = todayStr; }

    const timeInp = document.getElementById("gw-book-time");
    if (timeInp) {
        const hh = String(Math.min(19, now.getHours() + 1)).padStart(2, "0");
        timeInp.value = `${hh}:00`;
    }

    const rad2h = document.querySelector('input[name="gw_duration"][value="2_hours"]');
    if (rad2h) rad2h.checked = true;

    const ktpPrev = document.getElementById("gw-ktp-preview");
    if (ktpPrev) { ktpPrev.src = ""; ktpPrev.classList.add("hide"); }
    const ktpInp = document.getElementById("gw-ktp-input");
    if (ktpInp) ktpInp.value = "";

    renderBookingBikeSelectors();
    updateGowesBookingPriceCalc();

    const modal = document.getElementById("modal-gowes-booking");
    if (modal) modal.classList.remove("hide");
    if (typeof mrNavPush === "function") mrNavPush({ type: "modal", id: "modal-gowes-booking" });
}

function closeGowesBookingModal() {
    activeBookingBike = null;
    bookingSelectedBikeIds = [];
    openBookingBikePickerIdx = -1;
    gowesKtpDraft = "";
    gowesBookingVoucherCode = "";
    gowesBookingVoucherDiscount = 0;
    document.getElementById("modal-gowes-booking")?.classList.add("hide");
    if (typeof _mrDropTopModalById === "function") _mrDropTopModalById("modal-gowes-booking");
}

function handleGowesKtpPick(inp) {
    const file = inp.files && inp.files[0];
    if (!file) return;
    inp.value = "";

    if (typeof openImageCropper === "function") {
        openImageCropper(file, 1.6, "Potong Foto KTP / SIM Penjamin", 800, 500, (dataUrl) => {
            gowesKtpDraft = dataUrl;
            const prev = document.getElementById("gw-ktp-preview");
            if (prev) { prev.src = dataUrl; prev.classList.remove("hide"); }
            if (typeof showToast === "function") showToast("Foto KTP siap dilampirkan.");
        });
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            gowesKtpDraft = e.target.result;
            const prev = document.getElementById("gw-ktp-preview");
            if (prev) { prev.src = gowesKtpDraft; prev.classList.remove("hide"); }
        };
        reader.readAsDataURL(file);
    }
}

async function submitGowesRentalBooking(e) {
    e.preventDefault();
    const selectedObjs = getSelectedBookingBikesObjects();
    if (!selectedObjs.length) return showToast("Pilih minimal 1 unit sepeda terlebih dahulu.", "error");

    const firstBike = selectedObjs[0];
    const durRadio = document.querySelector('input[name="gw_duration"]:checked');
    const durationKey = durRadio ? durRadio.value : "2_hours";
    const durLabel = durationKey === "6_hours"
        ? (firstBike.label6Hours || "Paket 6 Jam")
        : durationKey === "full_day"
            ? (firstBike.labelFullDay || "Full Day")
            : (firstBike.label2Hours || "Paket 2 Jam");

    const currentBranch = getActiveShelterObject();
    const customerName = document.getElementById("gw-book-name")?.value.trim() || "";
    const customerPhone = document.getElementById("gw-book-phone")?.value.trim() || "";
    const customerAddress = document.getElementById("gw-book-address")?.value.trim() || "";
    const startDate = document.getElementById("gw-book-date")?.value.trim() || "";
    const startTime = document.getElementById("gw-book-time")?.value.trim() || "";
    const quantity = selectedObjs.length;
    const note = document.getElementById("gw-book-note")?.value.trim() || "";

    if (!customerName) return showToast("Nama pemesan wajib diisi.", "error");
    if (!customerPhone) return showToast("Nomor WhatsApp wajib diisi.", "error");
    if (!customerAddress) return showToast("Alamat domisili wajib diisi.", "error");
    if (!startDate || !startTime) return showToast("Tentukan tanggal dan jam sewa.", "error");

    const conflicts = validateBookingListConflicts(selectedObjs, startDate, startTime, durationKey);
    if (conflicts.length) {
        _renderConflictBannerInto("gw-book-conflict-alert", "btn-submit-gw-booking", conflicts);
        return showToast(conflicts[0].message, "error");
    }

    if (!gowesKtpDraft) return showToast("Silakan unggah foto KTP/SIM penjamin.", "error");

    const uniqueNames = Array.from(new Set(selectedObjs.map(b => b.name)));
    const combinedBikeName = uniqueNames.length === 1 ? uniqueNames[0] : uniqueNames.join(" + ");

    setBtnLoading("btn-submit-gw-booking", true, "Menyimpan Booking...");

    const bookingPayload = {
        bikeId: firstBike.id,
        bikeName: combinedBikeName,
        bikeImage: firstBike.image || "",
        selectedBikes: selectedObjs.map(b => ({
            bikeId: b.id,
            bikeName: b.name,
            bikeType: b.type || "",
            bikeImage: b.image || ""
        })),
        durationKey,
        durationLabel: durLabel,
        quantity,
        customerName,
        customerPhone,
        customerAddress,
        startDate,
        startTime,
        branchId: currentBranch.id || "sh_smd_1",
        branchCity: currentBranch.city || "Samarinda",
        pickupLocation: currentBranch.name || "Titik Gowes Shelter Utama",
        ktpImage: gowesKtpDraft,
        voucherCode: gowesBookingVoucherCode || "",
        voucherDiscount: Number(gowesBookingVoucherDiscount || 0),
        note
    };

    const res = await apiAction({ action: "gowes_create_booking", booking: bookingPayload });
    setBtnLoading("btn-submit-gw-booking", false);

    if (!res || !res.ok || !res.rental) {
        return showToast((res && res.message) || "Gagal membuat pesanan sewa sepeda.", "error");
    }

    if (Array.isArray(res.upcomingBookings)) {
        db.gowesUpcomingBookings = res.upcomingBookings;
        db.gowesTodayBookings = res.upcomingBookings;
    }
    if (!Array.isArray(db.gowesRentals)) db.gowesRentals = [];
    const existingIdx = db.gowesRentals.findIndex(r => String(r.id) === String(res.rental.id));
    if (existingIdx >= 0) db.gowesRentals[existingIdx] = res.rental;
    else db.gowesRentals.unshift(res.rental);

    closeGowesBookingModal();
    showToast("Pesanan sewa berhasil dibuat! Selesaikan pembayaran melalui QRIS.");
    openGowesRentalPayment(res.rental.id);
}

// ================= 9. KASIR SEWA OFFLINE / WALK-IN (ADMINISTRASI & FOUNDER) =================
function _getOfflinePosBranchObj() {
    const shelters = getGowesSheltersList();
    const selId = document.getElementById("gw-pos-branch")?.value || "";
    return shelters.find(s => String(s.id) === String(selId)) || getActiveShelterObject() || shelters[0];
}

function _getOfflinePosBikesPool() {
    const br = _getOfflinePosBranchObj();
    return getAvailableGowesBikes(br ? br.id : null);
}

function _getOfflinePosSelectedObjs() {
    const pool = _getOfflinePosBikesPool();
    if (!pool.length) return [];
    const fb = pool.find(b => b.status !== "Servis") || pool[0];
    return offlinePosSelectedBikeIds.map(id => pool.find(b => String(b.id) === String(id)) || fb);
}

function openGowesOfflinePosModal() {
    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!curU || (curU.role !== "master" && curU.role !== "administrasi")) {
        return showToast("Fitur Kasir Offline khusus untuk Tim Administrasi dan Founder.", "error");
    }

    const shelters = getGowesSheltersList();
    const activeSh = getActiveShelterObject();
    const brSel = document.getElementById("gw-pos-branch");
    if (brSel) {
        brSel.innerHTML = shelters.map(s =>
            `<option value="${esc(s.id)}" ${String(s.id) === String(activeSh.id) ? "selected" : ""}>${escHtml(s.city || s.name)} — ${escHtml(s.name)}</option>`
        ).join("");
    }

    ["gw-pos-name", "gw-pos-phone", "gw-pos-address", "gw-pos-note"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");

    const dateInp = document.getElementById("gw-pos-date");
    const timeInp = document.getElementById("gw-pos-time");
    if (dateInp) dateInp.value = todayStr;
    if (timeInp) timeInp.value = `${hh}:${mm}`;

    const qtyInp = document.getElementById("gw-pos-qty");
    const qtyLbl = document.getElementById("gw-pos-qty-lbl");
    if (qtyInp) qtyInp.value = "1";
    if (qtyLbl) qtyLbl.innerText = "1";

    const dur2 = document.querySelector('input[name="gw_pos_duration"][value="2_hours"]');
    if (dur2) dur2.checked = true;
    const payCash = document.querySelector('input[name="gw_pos_payment"][value="cash"]');
    if (payCash) payCash.checked = true;

    const ktpHeld = document.getElementById("gw-pos-ktp-held");
    if (ktpHeld) ktpHeld.checked = true;
    toggleOfflinePosKtpUpload(true);
    offlinePosKtpDraft = "";
    const ktpPrev = document.getElementById("gw-pos-ktp-preview");
    if (ktpPrev) { ktpPrev.src = ""; ktpPrev.classList.add("hide"); }

    const pool = _getOfflinePosBikesPool();
    const readyFirst = pool.find(b => b.status !== "Servis" && !findBikeScheduleConflict(b.id, todayStr, `${hh}:${mm}`, "2_hours", b))
        || pool.find(b => b.status !== "Servis")
        || pool[0];
    offlinePosSelectedBikeIds = readyFirst ? [readyFirst.id] : [];
    offlinePosOpenPickerIdx = -1;

    renderOfflinePosBikeSelectors();
    updateOfflinePosPriceCalc();

    document.getElementById("modal-gowes-offline-pos")?.classList.remove("hide");
    if (typeof mrNavPush === "function") mrNavPush({ type: "modal", id: "modal-gowes-offline-pos" });
}

function closeGowesOfflinePosModal() {
    offlinePosOpenPickerIdx = -1;
    offlinePosKtpDraft = "";
    document.getElementById("modal-gowes-offline-pos")?.classList.add("hide");
    if (typeof _mrDropTopModalById === "function") _mrDropTopModalById("modal-gowes-offline-pos");
}

function onOfflinePosBranchChange() {
    const pool = _getOfflinePosBikesPool().filter(b => b.status !== "Servis");
    offlinePosSelectedBikeIds = pool.length ? [pool[0].id] : [];
    offlinePosOpenPickerIdx = -1;
    const qtyInp = document.getElementById("gw-pos-qty");
    const qtyLbl = document.getElementById("gw-pos-qty-lbl");
    if (qtyInp) qtyInp.value = String(offlinePosSelectedBikeIds.length || 1);
    if (qtyLbl) qtyLbl.innerText = String(offlinePosSelectedBikeIds.length || 1);
    renderOfflinePosBikeSelectors();
    updateOfflinePosPriceCalc();
}

function onOfflinePosScheduleChange() {
    renderOfflinePosBikeSelectors();
    updateOfflinePosPriceCalc();
}

function toggleOfflinePosBikePicker(slotIdx) {
    offlinePosOpenPickerIdx = (offlinePosOpenPickerIdx === slotIdx) ? -1 : slotIdx;
    renderOfflinePosBikeSelectors();
}

function pickOfflinePosBikeVisual(slotIdx, bikeId) {
    if (offlinePosSelectedBikeIds.some((oid, i) => i !== slotIdx && String(oid) === String(bikeId))) {
        return showToast("Unit sepeda ini sudah dipilih di slot lain.", "info");
    }
    offlinePosSelectedBikeIds[slotIdx] = bikeId;
    offlinePosOpenPickerIdx = -1;
    renderOfflinePosBikeSelectors();
    updateOfflinePosPriceCalc();
}

function changeOfflinePosBikeQty(delta) {
    const inp = document.getElementById("gw-pos-qty");
    const lbl = document.getElementById("gw-pos-qty-lbl");
    if (!inp || !lbl) return;

    const bikes = _getOfflinePosBikesPool().filter(b => b.status !== "Servis");
    if (!bikes.length) return;
    const maxAllowed = Math.max(1, Math.min(10, bikes.length));

    let cur = parseInt(inp.value, 10) || 1;
    const nextQty = Math.max(1, Math.min(maxAllowed, cur + delta));
    if (delta > 0 && cur >= maxAllowed) {
        showToast(`Maksimal ${maxAllowed} unit sepeda berbeda di cabang ini.`, "info");
        return;
    }

    inp.value = nextQty;
    lbl.innerText = String(nextQty);

    const dateStr = document.getElementById("gw-pos-date")?.value || new Date().toISOString().split("T")[0];
    const startTime = document.getElementById("gw-pos-time")?.value || "08:00";
    const durVal = document.querySelector('input[name="gw_pos_duration"]:checked')?.value || "2_hours";

    while (offlinePosSelectedBikeIds.length < nextQty) {
        const nextBike = bikes.find(b =>
            !offlinePosSelectedBikeIds.includes(b.id) &&
            !findBikeScheduleConflict(b.id, dateStr, startTime, durVal, b)
        ) || bikes.find(b => !offlinePosSelectedBikeIds.includes(b.id));
        if (!nextBike) break;
        offlinePosSelectedBikeIds.push(nextBike.id);
    }
    if (offlinePosSelectedBikeIds.length > nextQty) {
        offlinePosSelectedBikeIds = offlinePosSelectedBikeIds.slice(0, nextQty);
    }

    offlinePosOpenPickerIdx = -1;
    renderOfflinePosBikeSelectors();
    updateOfflinePosPriceCalc();
}

function renderOfflinePosBikeSelectors() {
    const box = document.getElementById("gw-pos-bikes-container");
    if (!box) return;
    const bikes = _getOfflinePosBikesPool();
    if (!bikes.length) {
        box.innerHTML = `<p class="text-xs text-red-500 font-bold">Belum ada unit sepeda tersedia di cabang ini.</p>`;
        return;
    }
    const dateStr = document.getElementById("gw-pos-date")?.value || new Date().toISOString().split("T")[0];
    const startTime = document.getElementById("gw-pos-time")?.value || "08:00";
    const durVal = document.querySelector('input[name="gw_pos_duration"]:checked')?.value || "2_hours";

    box.innerHTML = _buildVisualBikePickerHtml({
        bikes,
        selectedIds: offlinePosSelectedBikeIds,
        openIdx: offlinePosOpenPickerIdx,
        dateStr,
        startTime,
        durationKey: durVal,
        toggleFnName: "toggleOfflinePosBikePicker",
        pickFnName: "pickOfflinePosBikeVisual",
        idPrefix: "gw-pos-bike"
    });

    const conflicts = validateBookingListConflicts(_getOfflinePosSelectedObjs(), dateStr, startTime, durVal);
    _renderConflictBannerInto("gw-pos-conflict-alert", "btn-submit-gw-pos", conflicts);
}

function toggleOfflinePosKtpUpload(isHeld) {
    document.getElementById("gw-pos-ktp-upload-wrap")?.classList.toggle("hide", !!isHeld);
}

function handleOfflinePosKtpPick(inp) {
    const file = inp.files && inp.files[0];
    if (!file) return;
    inp.value = "";
    if (typeof openImageCropper === "function") {
        openImageCropper(file, 1.6, "Potong Foto KTP Penjamin", 800, 500, (dataUrl) => {
            offlinePosKtpDraft = dataUrl;
            const prev = document.getElementById("gw-pos-ktp-preview");
            if (prev) { prev.src = dataUrl; prev.classList.remove("hide"); }
            showToast("Foto KTP siap dilampirkan.");
        });
    } else {
        const r = new FileReader();
        r.onload = (e) => {
            offlinePosKtpDraft = e.target.result;
            const prev = document.getElementById("gw-pos-ktp-preview");
            if (prev) { prev.src = offlinePosKtpDraft; prev.classList.remove("hide"); }
        };
        r.readAsDataURL(file);
    }
}

function updateOfflinePosPriceCalc() {
    const selectedObjs = _getOfflinePosSelectedObjs();
    if (!selectedObjs.length) return;
    const first = selectedObjs[0];

    const sum2h = selectedObjs.reduce((s, b) => s + Number(b.price2Hours || 40000), 0);
    const sum6h = selectedObjs.reduce((s, b) => s + Number(b.price6Hours || 75000), 0);
    const sumFull = selectedObjs.reduce((s, b) => s + Number(b.priceFullDay || 120000), 0);

    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
    setTxt("gw-pos-lbl-2h", first.label2Hours || "2 Jam");
    setTxt("gw-pos-lbl-6h", first.label6Hours || "6 Jam");
    setTxt("gw-pos-lbl-fullday", first.labelFullDay || "Full Day");
    setTxt("gw-pos-rate-2h", fmtRp(sum2h));
    setTxt("gw-pos-rate-6h", fmtRp(sum6h));
    setTxt("gw-pos-rate-fullday", fmtRp(sumFull));

    const durVal = document.querySelector('input[name="gw_pos_duration"]:checked')?.value || "2_hours";
    const payMethod = document.querySelector('input[name="gw_pos_payment"]:checked')?.value || "cash";
    const total = durVal === "6_hours" ? sum6h : durVal === "full_day" ? sumFull : sum2h;

    setTxt("gw-pos-total-label", payMethod === "cash" ? "Total Tunai (Tanpa Kode Unik):" : "Subtotal QRIS (+ Kode Unik Otomatis):");
    setTxt("gw-pos-total-calc", `${fmtRp(total)} (${selectedObjs.length} Sepeda)`);

    const pill = document.getElementById("gw-pos-pay-pill");
    if (pill) {
        pill.innerText = payMethod === "cash" ? "CASH" : "QRIS";
        pill.className = payMethod === "cash"
            ? "px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 text-[10px] font-extrabold uppercase"
            : "px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600 text-[10px] font-extrabold uppercase";
    }

    const btn = document.getElementById("btn-submit-gw-pos");
    if (btn && !btn.dataset.origHtml) {
        btn.innerText = payMethod === "cash" ? "Simpan & Aktifkan (Cash)" : "Buat & Tampilkan QRIS";
    }

    const timeVal = document.getElementById("gw-pos-time")?.value || "08:00";
    const dateStr = document.getElementById("gw-pos-date")?.value || new Date().toISOString().split("T")[0];
    const lbl = durVal === "6_hours" ? (first.label6Hours || "6 Jam") : durVal === "full_day" ? (first.labelFullDay || "Full Day") : (first.label2Hours || "2 Jam");
    const iv = getBookingIntervalMinutes(timeVal, durVal, first, lbl);
    const estEl = document.getElementById("gw-pos-return-estimate-text");
    if (estEl) {
        estEl.innerHTML = (durVal === "full_day" && iv.durationHours === 0)
            ? `Batas kembali: <strong>Pukul 20:00 WITA</strong> hari yang sama (${escHtml(lbl)})`
            : `Batas kembali: <strong>Pukul ${iv.endColon} WITA${iv.nextDay ? " (Besok)" : ""}</strong> (${escHtml(lbl)})`;
    }

    const conflicts = validateBookingListConflicts(selectedObjs, dateStr, timeVal, durVal);
    _renderConflictBannerInto("gw-pos-conflict-alert", "btn-submit-gw-pos", conflicts);
}

async function submitGowesOfflineBooking(e) {
    e.preventDefault();
    const selectedObjs = _getOfflinePosSelectedObjs();
    if (!selectedObjs.length) return showToast("Pilih minimal 1 unit sepeda.", "error");

    const firstBike = selectedObjs[0];
    const durVal = document.querySelector('input[name="gw_pos_duration"]:checked')?.value || "2_hours";
    const payMethod = document.querySelector('input[name="gw_pos_payment"]:checked')?.value || "cash";
    const durLabel = durVal === "6_hours"
        ? (firstBike.label6Hours || "6 Jam")
        : durVal === "full_day"
            ? (firstBike.labelFullDay || "Full Day")
            : (firstBike.label2Hours || "2 Jam");

    const branch = _getOfflinePosBranchObj();
    const customerName = document.getElementById("gw-pos-name")?.value.trim() || "";
    const customerPhone = document.getElementById("gw-pos-phone")?.value.trim() || "";
    const customerAddress = document.getElementById("gw-pos-address")?.value.trim() || branch.city || "";
    const startDate = document.getElementById("gw-pos-date")?.value.trim() || "";
    const startTime = document.getElementById("gw-pos-time")?.value.trim() || "";
    const ktpHeldAtShop = !!document.getElementById("gw-pos-ktp-held")?.checked;
    const note = document.getElementById("gw-pos-note")?.value.trim() || "";

    if (!customerName || !customerPhone) return showToast("Nama dan nomor WhatsApp pelanggan wajib diisi.", "error");
    if (!ktpHeldAtShop && !offlinePosKtpDraft) return showToast("Foto KTP penjamin atau aktifkan opsi KTP dititipkan di kasir.", "error");

    const conflicts = validateBookingListConflicts(selectedObjs, startDate, startTime, durVal);
    if (conflicts.length) {
        _renderConflictBannerInto("gw-pos-conflict-alert", "btn-submit-gw-pos", conflicts);
        return showToast(conflicts[0].message, "error");
    }

    setBtnLoading("btn-submit-gw-pos", true, "Memproses Kasir...");
    const hbMeta = typeof buildHandledByMeta === "function" ? buildHandledByMeta() : null;
    const res = await apiAction({
        action: "gowes_create_offline_booking",
        handledBy: hbMeta,
        booking: {
            bikeId: firstBike.id,
            selectedBikes: selectedObjs.map(b => ({ bikeId: b.id, bikeName: b.name, bikeType: b.type || "", bikeImage: b.image || "" })),
            durationKey: durVal,
            durationLabel: durLabel,
            quantity: selectedObjs.length,
            paymentMethod: payMethod,
            ktpHeldAtShop,
            ktpImage: ktpHeldAtShop ? "" : offlinePosKtpDraft,
            customerName,
            customerPhone,
            customerAddress,
            startDate,
            startTime,
            branchId: branch.id,
            branchCity: branch.city || "",
            pickupLocation: branch.name || "",
            note
        }
    });
    setBtnLoading("btn-submit-gw-pos", false);

    if (!res || !res.ok || !res.rental) {
        return showToast((res && res.message) || "Gagal menyimpan transaksi kasir offline.", "error");
    }

    if (Array.isArray(res.upcomingBookings)) {
        db.gowesUpcomingBookings = res.upcomingBookings;
        db.gowesTodayBookings = res.upcomingBookings;
    }
    if (hbMeta && !res.rental.handledBy) res.rental.handledBy = hbMeta;
    if (!Array.isArray(db.gowesRentals)) db.gowesRentals = [];
    db.gowesRentals.unshift(res.rental);

    if (payMethod === "cash" && Array.isArray(db.gowesBikes)) {
        const ids = selectedObjs.map(b => String(b.id));
        db.gowesBikes.forEach(b => { if (ids.includes(String(b.id))) b.status = "Sedang Disewa"; });
    }

    closeGowesOfflinePosModal();
    if (typeof refreshAfterAdminOrderAction === "function") {
        refreshAfterAdminOrderAction(payMethod === "cash" ? "Sewa Offline (Cash) langsung aktif!" : "Pesanan QRIS Kasir dibuat!");
    }

    if (payMethod === "qris") {
        openGowesOfflineQrisModal(res.rental);
    } else {
        openGowesReceiptModal(res.rental);
    }
}

async function openGowesOfflineQrisModal(rental) {
    if (!rental) return;
    activeOfflineQrisRental = rental;
    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
    setTxt("gw-oq-title", `${rental.customerName || "Pelanggan"} — ${rental.bikeName}`);
    setTxt("gw-oq-sub", `${rental.quantity || 1} Unit • ${rental.durationLabel} • ${rental.branchCity || ""}`);
    setTxt("gw-oq-amount", fmtRp(rental.totalPrice || 0));
    setTxt("gw-oq-unique", rental.uniqueCode ? `Termasuk kode unik Rp ${rental.uniqueCode}` : "");

    const wrap = document.getElementById("gw-oq-qr-wrap");
    const badge = document.getElementById("gw-oq-mode-badge");
    const ms = db.masterSettings || {};
    const totalPay = Number(rental.totalPrice || 0);
    const isDynamic = ms.qrisMode === "dynamic" && ms.qrisDynamicString && ms.qrisDynamicString.startsWith("000201");

    if (wrap) {
        wrap.innerHTML = `<span class="text-xs text-zinc-500"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>Membuat QRIS...</span>`;
    }
    document.getElementById("modal-gowes-offline-qris")?.classList.remove("hide");
    if (typeof mrNavPush === "function") mrNavPush({ type: "modal", id: "modal-gowes-offline-qris" });

    if (isDynamic && typeof buildDynamicQrisString === "function") {
        try {
            await loadScriptOnce("https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js");
            const dynStr = buildDynamicQrisString(ms.qrisDynamicString, totalPay);
            const dataUrl = await window.QRCode.toDataURL(dynStr, { width: 420, margin: 2, color: { dark: "#09090b", light: "#ffffff" } });
            if (wrap) wrap.innerHTML = `<img src="${dataUrl}" class="w-52 h-52 object-contain" alt="QRIS Dinamis">`;
            if (badge) badge.innerText = `QRIS Dinamis • ${fmtRp(totalPay)}`;
            return;
        } catch {}
    }

    const fallbackQris = ms.qrisImage || `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=TITIKGOWES-${totalPay}`;
    if (wrap) wrap.innerHTML = `<img src="${fallbackQris}" class="w-52 h-52 object-contain" alt="QRIS">`;
    if (badge) badge.innerText = "QRIS Resmi Titik Gowes";
}

function closeGowesOfflineQrisModal() {
    activeOfflineQrisRental = null;
    document.getElementById("modal-gowes-offline-qris")?.classList.add("hide");
    if (typeof _mrDropTopModalById === "function") _mrDropTopModalById("modal-gowes-offline-qris");
}

async function confirmGowesOfflineQrisPaid() {
    if (!activeOfflineQrisRental) return;
    const rentalId = activeOfflineQrisRental.id;
    setBtnLoading("btn-confirm-oq-paid", true, "Mengaktifkan...");
    const hbMeta = typeof buildHandledByMeta === "function" ? buildHandledByMeta() : null;
    const res = await apiAction({ action: "gowes_confirm_offline_qris", rentalId, handledBy: hbMeta });
    setBtnLoading("btn-confirm-oq-paid", false);

    if (!res || !res.ok || !res.rental) {
        return showToast((res && res.message) || "Gagal mengonfirmasi pembayaran QRIS.", "error");
    }

    if (Array.isArray(res.upcomingBookings)) {
        db.gowesUpcomingBookings = res.upcomingBookings;
        db.gowesTodayBookings = res.upcomingBookings;
    }
    if (hbMeta && !res.rental.handledBy) res.rental.handledBy = hbMeta;
    const idx = (db.gowesRentals || []).findIndex(r => String(r.id) === String(rentalId));
    if (idx >= 0) db.gowesRentals[idx] = res.rental;

    const affectedIds = (Array.isArray(res.rental.selectedBikes) && res.rental.selectedBikes.length)
        ? res.rental.selectedBikes.map(sb => String(sb.bikeId))
        : [String(res.rental.bikeId)];
    if (Array.isArray(db.gowesBikes)) {
        db.gowesBikes.forEach(b => { if (affectedIds.includes(String(b.id))) b.status = "Sedang Disewa"; });
    }

    closeGowesOfflineQrisModal();
    if (typeof refreshAfterAdminOrderAction === "function") {
        refreshAfterAdminOrderAction("Pembayaran QRIS lunas! Unit langsung aktif.");
    }
    openGowesReceiptModal(res.rental);
}

// ================= 10. STRUK DIGITAL UNIVERSAL (PRINT & KIRIM WA SEMUA TRANSAKSI) =================
let activeUniversalReceipt = null;

function _normalizeWaPhoneID(phone) {
    let digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("0")) digits = "62" + digits.slice(1);
    else if (digits.startsWith("8")) digits = "62" + digits;
    return digits;
}

function _buildPrintableReceiptHtml(rec) {
    const logoSrc = rec.brand === "gowes" ? "./titik-gowes-logo.png" : "./lembarku-logo.png";
    const rowsHtml = (rec.rows || []).map(row => `
        <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:4px;">
            <span style="color:#52525b;">${escHtml(row.label)}</span>
            <strong style="text-align:right;color:#111827;">${escHtml(row.value)}</strong>
        </div>
    `).join("");

    const itemsHtml = (rec.items || []).map((it, idx) => `
        <div style="margin-bottom:3px;">${idx + 1}. <strong>${escHtml(it)}</strong></div>
    `).join("");

    return `
        <div style="max-width:76mm;margin:0 auto;color:#111827;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:11px;line-height:1.45;">
            <div style="text-align:center;border-bottom:1px dashed #9ca3af;padding-bottom:8px;margin-bottom:8px;">
                <img src="${logoSrc}" alt="${escHtml(rec.brandName)}" style="width:42px;height:42px;object-fit:contain;margin:0 auto 4px auto;display:block;" onerror="this.style.display='none'">
                <div style="font-weight:800;font-size:13px;letter-spacing:0.03em;">${escHtml(rec.brandName)}</div>
                <div style="font-size:10px;color:#52525b;">${escHtml(rec.subHeader || "")}</div>
                <div style="display:inline-block;margin-top:4px;padding:2px 8px;border:1px solid #111827;border-radius:999px;font-size:9px;font-weight:800;text-transform:uppercase;">${escHtml(rec.payBadge || "LUNAS")}</div>
            </div>
            <div style="border-bottom:1px dashed #9ca3af;padding-bottom:8px;margin-bottom:8px;">
                ${rowsHtml}
            </div>
            ${itemsHtml ? `<div style="border-bottom:1px dashed #9ca3af;padding-bottom:8px;margin-bottom:8px;"><div style="font-size:9.5px;font-weight:800;text-transform:uppercase;color:#52525b;margin-bottom:4px;">${escHtml(rec.itemsHeader || "Rincian Pesanan")}</div>${itemsHtml}</div>` : ""}
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:800;padding:4px 0;">
                <span>TOTAL BAYAR</span>
                <span>${escHtml(rec.grandTotalLabel || fmtRp(rec.grandTotal || 0))}</span>
            </div>
            ${rec.footerNote ? `<div style="margin-top:8px;padding-top:6px;border-top:1px dashed #9ca3af;font-size:9.5px;color:#52525b;text-align:center;">${escHtml(rec.footerNote)}</div>` : ""}
            <div style="margin-top:6px;text-align:center;font-size:9px;color:#71717a;">Terima kasih atas kepercayaan Anda • ${escHtml(new Date().toLocaleString("id-ID"))}</div>
        </div>
    `;
}

function openUniversalReceiptModal(rec) {
    if (!rec) return;
    activeUniversalReceipt = rec;
    const isGowes = rec.brand === "gowes";
    const logoSrc = isGowes ? "./titik-gowes-logo.png" : "./lembarku-logo.png";

    const topBar = document.getElementById("gw-receipt-topbar");
    const topTitle = document.getElementById("gw-receipt-topbar-title");
    if (topBar) {
        topBar.className = `px-5 py-3.5 ${isGowes ? "bg-emerald-600" : "gold-gradient"} text-white flex items-center justify-between shrink-0`;
    }
    if (topTitle) topTitle.innerText = isGowes ? "Struk Sewa Titik Gowes" : "Struk Transaksi Lembarku";

    const rowsHtml = (rec.rows || []).map(row => `
        <div class="flex justify-between gap-2">
            <span class="app-muted shrink-0">${escHtml(row.label)}</span>
            <strong class="text-right ${row.accentCls || ""}">${escHtml(row.value)}</strong>
        </div>
    `).join("");

    const itemsHtml = (rec.items || []).map((it, idx) => `<div>${idx + 1}. <strong>${escHtml(it)}</strong></div>`).join("");

    const body = document.getElementById("gw-receipt-body");
    if (body) {
        body.innerHTML = `
            <div class="text-center border-b border-dashed gold-border pb-3 space-y-1">
                <img src="${logoSrc}" alt="${escHtml(rec.brandName)}" class="w-12 h-12 rounded-2xl bg-white p-1.5 object-contain mx-auto border border-black/10 shadow-sm" onerror="this.src='./lembarku-logo.png'">
                <strong class="text-sm font-extrabold block pt-0.5">${escHtml(rec.brandName)}</strong>
                <span class="text-[10px] app-muted block">${escHtml(rec.subHeader || "")}</span>
                <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full ${isGowes ? "bg-emerald-500/15 text-emerald-700" : "app-accent-bg app-accent"} text-[9.5px] font-extrabold uppercase">${escHtml(rec.payBadge || "LUNAS")}</span>
            </div>
            <div class="space-y-1.5 border-b border-dashed gold-border pb-3">
                ${rowsHtml}
            </div>
            ${itemsHtml ? `<div class="space-y-1 border-b border-dashed gold-border pb-3">
                <span class="text-[10px] uppercase font-bold app-muted block">${escHtml(rec.itemsHeader || "Rincian Pesanan")}</span>
                ${itemsHtml}
            </div>` : ""}
            <div class="flex items-center justify-between pt-0.5">
                <span class="font-bold text-xs">Total Bayar</span>
                <strong class="text-lg font-extrabold ${isGowes ? "text-emerald-600" : "app-accent"}">${escHtml(rec.grandTotalLabel || fmtRp(rec.grandTotal || 0))}</strong>
            </div>
            ${rec.footerNote ? `<p class="text-[10px] app-muted bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 leading-relaxed">${escHtml(rec.footerNote)}</p>` : ""}
        `;
    }

    document.getElementById("modal-gowes-receipt")?.classList.remove("hide");
    if (typeof mrNavPush === "function") mrNavPush({ type: "modal", id: "modal-gowes-receipt" });
}

function openGowesReceiptModal(rentalOrId) {
    const r = (typeof rentalOrId === "object" && rentalOrId)
        ? rentalOrId
        : (db.gowesRentals || []).find(x => String(x.id) === String(rentalOrId));
    if (!r) return showToast("Data transaksi tidak ditemukan.", "error");

    activeGowesReceiptRental = r;
    const allBikes = Array.isArray(db.gowesBikes) && db.gowesBikes.length ? db.gowesBikes : DEFAULT_GOWES_BIKES;
    const refBike = allBikes.find(b => String(b.id) === String(r.bikeId)) || null;
    const iv = getBookingIntervalMinutes(r.startTime, r.durationKey, refBike, r.durationLabel);
    const extraH = Number(r.extraHours || 0);
    const endTotalMin = iv.endMin + extraH * 60;
    const endH = Math.floor((endTotalMin % 1440) / 60);
    const endM = endTotalMin % 60;
    const endLabel = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")} WITA${endTotalMin >= 1440 ? " (Besok)" : ""}`;
    const returnText = (r.durationKey === "full_day" && iv.durationHours === 0 && extraH === 0) ? "20:00 WITA" : endLabel;

    const payBadge = r.isOffline
        ? (r.paymentMethod === "cash" ? "OFFLINE • CASH (LUNAS)" : "OFFLINE • QRIS")
        : "ONLINE • QRIS";
    const lateFee = Math.max(0, Number(r.lateFee || 0));
    const grandTotal = Number(r.totalPrice || 0) + lateFee;
    const handlerText = (r.handledBy && r.handledBy.name)
        ? `${r.handledBy.name} (@${r.handledBy.username})`
        : (r.cashierName || "");

    const units = (Array.isArray(r.selectedBikes) && r.selectedBikes.length)
        ? r.selectedBikes.map(sb => sb.bikeName)
        : [r.bikeName || "Sepeda"];

    const rows = [
        { label: "No. Nota", value: String(r.id) },
        { label: "Penyewa", value: r.customerName || r.customerUsername || "-" },
        { label: "WhatsApp", value: r.customerPhone || "-" },
        { label: "Tanggal", value: r.startDate || "-" },
        { label: "Jam Mulai", value: `${r.startTime || "-"} WITA` },
        { label: "Batas Kembali", value: returnText, accentCls: "text-emerald-600" },
        { label: "Jaminan", value: r.ktpHeldAtShop ? "KTP Asli di Kasir" : "Foto KTP Terlampir" },
        { label: "Status", value: r.status || "-" }
    ];
    if (Number(r.voucherDiscount || 0) > 0) {
        rows.push({ label: `Voucher (${r.voucherCode || "PROMO"})`, value: `-${fmtRp(r.voucherDiscount)}`, accentCls: "text-emerald-600" });
    }
    if (extraH > 0) {
        rows.push({ label: `Perpanjangan (+${extraH} Jam)`, value: fmtRp(r.extraFee || 0), accentCls: "text-blue-600" });
    }
    if (lateFee > 0) {
        rows.push({ label: `Denda Telat (${r.lateHours || 1} Jam)`, value: `${fmtRp(lateFee)} (${(r.latePaymentMethod || "cash").toUpperCase()})`, accentCls: "text-red-500" });
    }
    if (handlerText) {
        rows.push({ label: "Petugas / Kasir", value: handlerText });
    }

    const unitsStr = units.map((u, i) => `${i + 1}. ${u}`).join("\n");
    const waText =
`*STRUK SEWA SEPEDA — TITIK GOWES*
Gerai: ${r.pickupLocation || r.branchCity || "Titik Gowes"}
No. Nota: ${r.id}

Nama: *${r.customerName || "-"}*
Tanggal: ${r.startDate}
Jam Mulai: *${r.startTime} WITA*
Batas Kembali: *${returnText}*
Paket: ${r.durationLabel} (${r.quantity || 1} Unit)${extraH > 0 ? ` + Perpanjang ${extraH} Jam` : ""}

*Unit Sepeda:*
${unitsStr}

Biaya Sewa: ${fmtRp(r.totalPrice || 0)}${lateFee > 0 ? `\nDenda Keterlambatan (${r.lateHours || 1} Jam): ${fmtRp(lateFee)}` : ""}
Total Bayar: *${fmtRp(grandTotal)}*
Pembayaran: ${payBadge}
Status: ${r.status}${handlerText ? `\nPetugas: ${handlerText}` : ""}

_Catatan: Toleransi pengembalian 20 menit per jam (lewat 21 mnt = 1 jam, 01:21 = 2 jam)._
Selamat bersepeda & utamakan keselamatan di jalan!`;

    openUniversalReceiptModal({
        brand: "gowes",
        brandName: "TITIK GOWES RENTAL",
        subHeader: r.pickupLocation || r.branchCity || "Shelter Resmi Titik Gowes",
        payBadge,
        rows,
        itemsHeader: `Unit Sepeda (${r.quantity || 1} Unit • ${r.durationLabel || ""})`,
        items: units,
        grandTotal,
        grandTotalLabel: fmtRp(grandTotal),
        footerNote: "Toleransi pengembalian 20 menit setiap jamnya (lewat 21 mnt = 1 jam, 01:21 = 2 jam).",
        waPhone: r.customerPhone || "",
        waText
    });
}

function openLembarkuOrderReceiptModal(kind, docId) {
    const isPf = kind === "pf" || kind === "portfolio" || kind === "coin_topup" || kind === "pro_upgrade" || kind === "cv_edit_addon";
    const doc = isPf
        ? (db.portfolios || []).find(p => String(p.id) === String(docId))
        : (db.invitations || []).find(i => String(i.id) === String(docId));
    if (!doc) return showToast("Data transaksi Lembarku tidak ditemukan.", "error");

    const ownerObj = (db.users || []).find(u => String(u.username || "").toLowerCase() === String(doc.owner || "").toLowerCase());
    const typeLabel = doc.docType === "coin_topup"
        ? "Top-Up Coin"
        : doc.docType === "pro_upgrade"
            ? "Upgrade Akun PRO"
            : doc.docType === "cv_edit_addon"
                ? "Tambah +2x Edit CV"
                : isPf
                    ? (doc.docType === "lamaran" ? "Surat Lamaran Kerja" : "Curriculum Vitae (CV)")
                    : `Undangan ${doc.category || "Digital"}`;
    const dtStr = new Date(Number(doc.createdAt || doc.id || Date.now())).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const handlerText = (doc.handledBy && doc.handledBy.name) ? `${doc.handledBy.name} (@${doc.handledBy.username})` : "";
    const grandTotal = Number(doc.totalPay || doc.price || 0);
    const payBadge = doc.coinCost > 0
        ? `LUNAS • ${doc.coinCost} COIN`
        : (doc.status === "Aktif" ? "LUNAS • TERKONFIRMASI" : String(doc.status || "PROSES").toUpperCase());

    const rows = [
        { label: "No. Order", value: `#${doc.id}` },
        { label: "Tanggal", value: dtStr },
        { label: "Pemesan", value: `${(ownerObj && ownerObj.name) || doc.fullName || doc.owner || "-"}` },
        { label: "Layanan", value: typeLabel },
        { label: "Desain / Paket", value: doc.themeName || doc.theme || "-" },
        { label: "Status", value: doc.status || "-" }
    ];
    if (Number(doc.voucherDiscount || 0) > 0) {
        rows.push({ label: `Voucher (${doc.voucherCode || "PROMO"})`, value: `-${fmtRp(doc.voucherDiscount)}`, accentCls: "text-emerald-600" });
    }
    if (Number(doc.uniqueCode || 0) > 0 && !doc.coinCost) {
        rows.push({ label: "Kode Unik", value: fmtRp(doc.uniqueCode) });
    }
    if (handlerText) {
        rows.push({ label: "Diproses Oleh", value: handlerText });
    }

    const totalLbl = doc.coinCost > 0 ? `${doc.coinCost} Coin` : fmtRp(grandTotal);
    const waText =
`*STRUK TRANSAKSI RESMI — LEMBARKU*
No. Order: #${doc.id}
Tanggal: ${dtStr}

Pemesan: *${(ownerObj && ownerObj.name) || doc.fullName || doc.owner || "-"}*
Layanan: ${typeLabel}
Judul: *${doc.title || "-"}*
Desain / Paket: ${doc.themeName || doc.theme || "-"}${Number(doc.voucherDiscount || 0) > 0 ? `\nDiskon Voucher (${doc.voucherCode}): -${fmtRp(doc.voucherDiscount)}` : ""}

Total Pembayaran: *${totalLbl}*
Status: ${payBadge}${handlerText ? `\nPetugas: ${handlerText}` : ""}

Terima kasih telah menggunakan layanan Lembarku!`;

    openUniversalReceiptModal({
        brand: "lembarku",
        brandName: "LEMBARKU DIGITAL",
        subHeader: "Undangan Digital, CV & Surat Lamaran Resmi",
        payBadge,
        rows,
        itemsHeader: "Detail Produk",
        items: [`${doc.title || typeLabel}`],
        grandTotal: doc.coinCost > 0 ? 0 : grandTotal,
        grandTotalLabel: totalLbl,
        footerNote: doc.coinCost > 0
            ? `Pembayaran menggunakan saldo ${doc.coinCost} Coin Lembarku.`
            : "Simpan struk ini sebagai bukti transaksi resmi Lembarku.",
        waPhone: (ownerObj && ownerObj.phone) || doc.phone || "",
        waText
    });
}

function closeGowesReceiptModal() {
    activeGowesReceiptRental = null;
    activeUniversalReceipt = null;
    document.getElementById("modal-gowes-receipt")?.classList.add("hide");
    if (typeof _mrDropTopModalById === "function") _mrDropTopModalById("modal-gowes-receipt");
}

function printActiveUniversalReceipt() {
    if (!activeUniversalReceipt) return;
    const sheet = document.getElementById("receipt-print-sheet");
    if (!sheet) return window.print();
    sheet.innerHTML = _buildPrintableReceiptHtml(activeUniversalReceipt);
    document.body.classList.add("printing-receipt");

    const cleanup = () => {
        document.body.classList.remove("printing-receipt");
        window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    setTimeout(() => {
        window.print();
        setTimeout(cleanup, 1200);
    }, 120);
}

function copyActiveReceiptText() {
    if (!activeUniversalReceipt || !activeUniversalReceipt.waText) return;
    navigator.clipboard?.writeText(activeUniversalReceipt.waText);
    showToast("Teks struk berhasil disalin!");
}

function sendActiveGowesReceiptWA() {
    if (!activeUniversalReceipt) return;
    const waNum = _normalizeWaPhoneID(activeUniversalReceipt.waPhone || "");
    const msg = activeUniversalReceipt.waText || "";
    const url = waNum
        ? `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
}

// ================= 11. PEMBAYARAN QRIS ONLINE PELANGGAN =================
async function openGowesRentalPayment(rentalId) {
    const list = Array.isArray(db.gowesRentals) ? db.gowesRentals : [];
    const rental = list.find(r => String(r.id) === String(rentalId));
    if (!rental) return showToast("Data pesanan sewa tidak ditemukan.", "error");

    if (typeof hideAllViews === "function") hideAllViews();
    currentViewName = "payment";
    document.body.classList.remove("in-home");

    const viewPay = document.getElementById("view-payment");
    if (viewPay) viewPay.classList.remove("hide");

    const baseGwPrice = Number(rental.basePrice || Math.max(0, Number(rental.totalPrice || 0) - Number(rental.uniqueCode || 0)));
    if (typeof activePaymentState !== "undefined") {
        activePaymentState.kind = "gowes_rental";
        activePaymentState.id = rental.id;
        activePaymentState.basePrice = baseGwPrice;
        activePaymentState.origPrice = 0;
        activePaymentState.voucherCode = rental.voucherCode || "";
        activePaymentState.voucherDiscount = Number(rental.voucherDiscount || 0);
        activePaymentState.totalPay = Number(rental.totalPrice || 0);
        activePaymentState.uniqueCode = Number(rental.uniqueCode || 0);
        activePaymentState.title = `Sewa Sepeda: ${rental.bikeName}`;
        activePaymentState.qrisDataUrl = "";
    }
    const pvWrap = document.getElementById("pay-voucher-wrap");
    const pvInp = document.getElementById("pay-voucher-code");
    const pvClr = document.getElementById("btn-pay-clear-voucher");
    const pvStat = document.getElementById("pay-voucher-status");
    if (pvWrap) pvWrap.classList.remove("hide");
    if (pvInp) pvInp.value = rental.voucherCode || "";
    if (pvClr) pvClr.classList.toggle("hide", !rental.voucherCode);
    if (pvStat) {
        if (rental.voucherCode && Number(rental.voucherDiscount || 0) > 0) {
            pvStat.className = "text-[11px] font-semibold text-emerald-600";
            pvStat.innerText = `✓ Voucher ${rental.voucherCode} aktif (-${fmtRp(rental.voucherDiscount)})`;
        } else {
            pvStat.className = "hide text-[11px] font-semibold";
            pvStat.innerText = "";
        }
    }

    const statusBadge = document.getElementById("pay-status-badge");
    const headingText = document.getElementById("pay-heading-text");
    const itemName = document.getElementById("pay-item-name");
    const finalPrice = document.getElementById("pay-final-price");
    const uniqueHint = document.getElementById("pay-unique-hint");
    const origPrice = document.getElementById("pay-orig-price");
    const discBadge = document.getElementById("pay-disc-badge");

    if (statusBadge) {
        statusBadge.className = "text-[11px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 font-extrabold uppercase";
        statusBadge.innerText = `TITIK GOWES: ● ${rental.status.toUpperCase()}`;
    }
    if (headingText) headingText.innerText = "Konfirmasi Sewa Sepeda";
    if (itemName) {
        const multiHtml = (Array.isArray(rental.selectedBikes) && rental.selectedBikes.length > 1)
            ? `<div class="text-[10px] app-muted mt-1">${rental.selectedBikes.map((sb, i) => `Unit #${i + 1}: <strong>${escHtml(sb.bikeName)}</strong>`).join(" • ")}</div>`
            : "";
        itemName.innerHTML = `<strong>${escHtml(rental.bikeName)}</strong> (${rental.quantity || 1} Unit) • ${escHtml(rental.durationLabel)}${multiHtml}<span class="block text-[10px] app-muted mt-0.5">Gerai: ${escHtml(rental.pickupLocation || "Shelter Utama")} • Jadwal: ${escHtml(rental.startDate)} pukul ${escHtml(rental.startTime)} WITA</span>`;
    }
    if (finalPrice) finalPrice.innerText = fmtRp(rental.totalPrice);
    if (uniqueHint) {
        uniqueHint.innerText = `Sudah termasuk kode unik Rp ${rental.uniqueCode || 0} untuk percepatan verifikasi Admin.`;
        uniqueHint.classList.remove("hide");
    }
    if (origPrice) origPrice.classList.add("hide");
    if (discBadge) discBadge.classList.add("hide");

    const ms = db.masterSettings || {};
    if (typeof renderPaymentQrisCode === "function") {
        await renderPaymentQrisCode(ms, Number(rental.totalPrice || 0));
    }

    const banksBox = document.getElementById("pay-banks-list");
    if (banksBox && typeof getMasterBanksList === "function") {
        const banks = getMasterBanksList();
        banksBox.innerHTML = banks.map(b => `
            <div class="app-card-soft border rounded-2xl p-2.5 flex items-center justify-between text-xs">
                <div>
                    <span class="text-[10px] app-muted block font-semibold">${escHtml(b.bank)}</span>
                    <strong class="font-mono text-sm block">${escHtml(b.no)}</strong>
                    <span class="text-[10px] app-muted block">a.n. ${escHtml(b.holder)}</span>
                </div>
                <button type="button" onclick="navigator.clipboard.writeText('${esc(b.no)}');showToast('Nomor rekening disalin!');" class="px-3 py-1.5 rounded-xl app-btn-sec text-[11px] font-bold">Salin</button>
            </div>
        `).join("");
    }

    const proofInput = document.getElementById("pay-proof-input");
    const proofPrev = document.getElementById("pay-proof-preview");
    if (proofInput) proofInput.value = "";
    if (proofPrev) {
        proofPrev.src = rental.paymentProof || "";
        proofPrev.classList.toggle("hide", !rental.paymentProof);
    }

    const sendProofBtn = document.getElementById("btn-send-proof");
    if (sendProofBtn) {
        sendProofBtn.onclick = () => submitGowesPaymentProof(rental.id);
    }

    if (typeof renderHeaderActions === "function") renderHeaderActions();
    if (typeof mrNavPush === "function") mrNavPush({ type: "view", view: "payment" });
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function submitGowesPaymentProof(rentalId) {
    const proofInput = document.getElementById("pay-proof-input");
    const file = proofInput && proofInput.files && proofInput.files[0];
    const prevSrc = document.getElementById("pay-proof-preview")?.src || "";

    if (!file && (!prevSrc || prevSrc.startsWith("http"))) {
        return showToast("Pilih file bukti transfer terlebih dahulu.", "error");
    }

    setBtnLoading("btn-send-proof", true, "Mengirim Bukti...");
    let proofDataUrl = prevSrc;
    if (file) proofDataUrl = await quickResizeImage(file, 900, 0.82);

    const res = await apiAction({ action: "gowes_submit_payment", rentalId, paymentProof: proofDataUrl });
    setBtnLoading("btn-send-proof", false);

    if (!res || !res.ok || !res.rental) {
        return showToast((res && res.message) || "Gagal mengunggah bukti bayar.", "error");
    }

    if (!Array.isArray(db.gowesRentals)) db.gowesRentals = [];
    const idx = db.gowesRentals.findIndex(r => String(r.id) === String(rentalId));
    if (idx >= 0) db.gowesRentals[idx] = res.rental;

    showToast("Bukti pembayaran berhasil dikirim! Menunggu konfirmasi Admin.");
    if (typeof routeDashboard === "function") routeDashboard();
}

// ================= 12. KARTU RIWAYAT SEWA PELANGGAN & DETAIL =================
function buildUserRentalCardHtml(rental) {
    const isPay = rental.status === "Menunggu Pembayaran";
    const isVerif = rental.status === "Menunggu Verifikasi";
    const isConfirmed = rental.status === "Terkonfirmasi";
    const isInUse = rental.status === "Sedang Digunakan";
    const isDone = rental.status === "Selesai";

    const statusBadge = isDone
        ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-extrabold uppercase">● Selesai</span>`
        : isInUse
            ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 font-extrabold uppercase">● Sedang Digunakan</span>`
            : isConfirmed
                ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 font-extrabold uppercase">● Siap Diambil</span>`
                : isVerif
                    ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-extrabold uppercase">● Verifikasi Pembayaran</span>`
                    : `<span class="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 font-extrabold uppercase">● Menunggu Bayar</span>`;

    const payActionHtml = isPay
        ? `<button type="button" onclick="openGowesRentalPayment('${esc(rental.id)}')" class="gowes-pill-btn px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm"><i class="fa-solid fa-qrcode mr-1"></i>Bayar QRIS</button>`
        : "";

    return `
        <div class="app-card border rounded-2xl p-3.5 space-y-3 shadow-sm">
            <div class="flex items-start gap-3">
                <img src="${rental.bikeImage || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75'}" class="w-16 h-16 rounded-xl object-cover bg-black border gold-border shrink-0">
                <div class="min-w-0 flex-1 space-y-0.5">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="gowes-brand-tag !text-[8.5px]">TITIK GOWES</span>
                        ${statusBadge}
                    </div>
                    <h4 class="font-extrabold text-xs sm:text-sm truncate pt-0.5">${escHtml(rental.bikeName)} (${rental.quantity || 1} Unit)</h4>
                    <p class="text-[10px] app-muted truncate">${escHtml(rental.durationLabel)} • ${fmtRp(rental.totalPrice)}</p>
                    <p class="text-[9.5px] text-emerald-600 font-semibold"><i class="fa-regular fa-clock mr-1"></i>${escHtml(rental.startDate)} pukul ${escHtml(rental.startTime)} WITA • ${escHtml(rental.pickupLocation || "Shelter Utama")}</p>
                </div>
            </div>
            <div class="flex items-center justify-between gap-2 pt-2 border-t gold-border">
                <button type="button" onclick="openGowesRentalDetail('${esc(rental.id)}')" class="px-3 py-1.5 rounded-xl app-btn-sec text-xs font-bold"><i class="fa-regular fa-eye mr-1"></i>Rincian</button>
                <div class="flex gap-1.5">
                    ${payActionHtml}
                    ${isConfirmed ? `<span class="text-[10px] text-emerald-600 font-bold self-center"><i class="fa-solid fa-circle-check mr-1"></i>Tunjukkan KTP di shelter</span>` : ""}
                </div>
            </div>
        </div>
    `;
}

function openGowesRentalDetail(rentalId) {
    const list = Array.isArray(db.gowesRentals) ? db.gowesRentals : [];
    const r = list.find(x => String(x.id) === String(rentalId));
    if (!r) return showToast("Detail sewa tidak ditemukan.", "error");

    let modal = document.getElementById("modal-gowes-rental-detail");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modal-gowes-rental-detail";
        modal.className = "hide fixed inset-0 z-[148] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4";
        modal.onclick = (e) => { if (e.target === modal) modal.classList.add("hide"); };
        document.body.appendChild(modal);
    }

    const bikesListHtml = (Array.isArray(r.selectedBikes) && r.selectedBikes.length > 1)
        ? `<div class="app-card-soft border rounded-2xl p-3 space-y-1">
            <span class="text-[10px] font-bold uppercase text-emerald-600 block">Rincian Unit Sepeda (${r.selectedBikes.length} Unit):</span>
            ${r.selectedBikes.map((sb, i) => `<div class="text-[11px]">${i + 1}. <strong>${escHtml(sb.bikeName)}</strong> <span class="app-muted">(${escHtml(sb.bikeType || "Sepeda")})</span></div>`).join("")}
           </div>`
        : "";

    modal.innerHTML = `
        <div class="app-card border rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl" onclick="event.stopPropagation()">
            <div class="px-5 py-3.5 border-b gold-border flex items-center justify-between shrink-0">
                <div>
                    <h3 class="font-extrabold text-sm sm:text-base">Rincian Sewa Sepeda</h3>
                    <p class="text-[10px] app-muted">ID: ${escHtml(r.id)}</p>
                </div>
                <button type="button" onclick="document.getElementById('modal-gowes-rental-detail').classList.add('hide')" class="w-8 h-8 rounded-full app-btn-sec flex items-center justify-center text-xs"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
                <div class="flex items-center gap-3 app-card-soft border rounded-2xl p-3">
                    <img src="${r.bikeImage || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75'}" class="w-16 h-16 rounded-xl object-cover bg-black border gold-border shrink-0">
                    <div class="min-w-0 flex-1 space-y-0.5">
                        <strong class="font-extrabold text-sm block truncate">${escHtml(r.bikeName)}</strong>
                        <span class="text-[10px] app-muted block">${escHtml(r.durationLabel)} • ${r.quantity || 1} Unit</span>
                        <span class="text-xs font-bold text-emerald-600 block">${fmtRp(r.totalPrice)} ${r.isOffline ? `(${r.paymentMethod === "cash" ? "Cash" : "QRIS Kasir"})` : ""}</span>
                    </div>
                </div>
                ${bikesListHtml}
                <div class="app-card-soft border rounded-2xl p-3 space-y-1.5">
                    <div class="flex justify-between"><span class="app-muted">Penyewa:</span><strong class="font-bold">${escHtml(r.customerName || r.customerUsername)}${r.isOffline ? " (Walk-in)" : ` (@${escHtml(r.customerUsername)})`}</strong></div>
                    <div class="flex justify-between"><span class="app-muted">WhatsApp:</span><strong class="font-bold">${escHtml(r.customerPhone || "-")}</strong></div>
                    <div class="flex justify-between"><span class="app-muted">Jadwal:</span><strong class="font-bold text-emerald-600">${escHtml(r.startDate)} pukul ${escHtml(r.startTime)} WITA</strong></div>
                    <div class="flex justify-between"><span class="app-muted">Gerai Cabang:</span><strong class="font-bold">${escHtml(r.pickupLocation || "Shelter Utama")}</strong></div>
                    <div class="flex justify-between"><span class="app-muted">Jaminan:</span><strong class="font-bold">${r.ktpHeldAtShop ? "KTP Asli di Kasir" : "Foto KTP Terlampir"}</strong></div>
                    ${(r.handledBy && r.handledBy.name) ? `<div class="flex justify-between"><span class="app-muted">Petugas:</span><strong class="font-bold">${escHtml(r.handledBy.name)} (@${escHtml(r.handledBy.username || "")})</strong></div>` : (r.cashierName ? `<div class="flex justify-between"><span class="app-muted">Kasir Input:</span><strong class="font-bold">${escHtml(r.cashierName)}</strong></div>` : "")}
                    ${Number(r.lateFee || 0) > 0 ? `<div class="flex justify-between"><span class="app-muted">Denda Telat (${r.lateHours || 1} Jam):</span><strong class="font-bold text-red-500">${fmtRp(r.lateFee)}</strong></div>` : ""}
                    <div class="flex justify-between"><span class="app-muted">Status:</span><span class="font-extrabold text-emerald-600">${escHtml(r.status)}</span></div>
                </div>
                ${r.handoverOutPhoto ? `<div class="space-y-1"><span class="text-[10px] font-bold uppercase app-muted block">Foto Fisik Sepeda Saat Diambil:</span><img src="${r.handoverOutPhoto}" class="w-full h-36 object-contain rounded-xl bg-black border gold-border"></div>` : ""}
                ${r.handoverInPhoto ? `<div class="space-y-1"><span class="text-[10px] font-bold uppercase app-muted block">Foto Fisik Sepeda Saat Kembali:</span><img src="${r.handoverInPhoto}" class="w-full h-36 object-contain rounded-xl bg-black border gold-border"></div>` : ""}
                ${r.paymentProof ? `<div class="space-y-1"><span class="text-[10px] font-bold uppercase app-muted block">Bukti Pembayaran QRIS:</span><img src="${r.paymentProof}" class="w-full max-h-48 object-contain rounded-xl bg-black border gold-border"></div>` : ""}
            </div>
            <div class="px-5 py-3 border-t gold-border flex justify-between gap-2 shrink-0">
                <button type="button" onclick="document.getElementById('modal-gowes-rental-detail').classList.add('hide');openGowesReceiptModal('${esc(r.id)}');" class="px-4 py-2 rounded-xl bg-emerald-600/15 text-emerald-700 text-xs font-bold"><i class="fa-solid fa-receipt mr-1"></i>Struk / WA</button>
                <button type="button" onclick="document.getElementById('modal-gowes-rental-detail').classList.add('hide')" class="gowes-pill-btn px-6 py-2 rounded-xl text-xs">Tutup</button>
            </div>
        </div>
    `;

    modal.classList.remove("hide");
    if (typeof mrNavPush === "function") mrNavPush({ type: "modal", id: "modal-gowes-rental-detail" });
}

function applyGowesBookingVoucher() {
    const inp = document.getElementById("gw-book-voucher");
    const stat = document.getElementById("gw-book-voucher-status");
    const clr = document.getElementById("btn-gw-clear-voucher");
    const code = (inp && inp.value || "").trim();
    const selectedObjs = getSelectedBookingBikesObjects();
    if (!selectedObjs.length) return showToast("Pilih unit sepeda terlebih dahulu.", "error");
    const durVal = document.querySelector('input[name="gw_duration"]:checked')?.value || "2_hours";
    const rawTotal = selectedObjs.reduce((s, b) => s + Number(durVal === "6_hours" ? (b.price6Hours || 75000) : durVal === "full_day" ? (b.priceFullDay || 120000) : (b.price2Hours || 40000)), 0);

    if (typeof evaluateVoucherCode !== "function") return;
    const res = evaluateVoucherCode(code, "gowes", rawTotal);
    if (!res.ok) {
        if (stat) { stat.className = "text-[11px] font-semibold text-red-500"; stat.innerText = res.message; }
        return showToast(res.message, "error");
    }
    gowesBookingVoucherCode = res.code;
    gowesBookingVoucherDiscount = res.discount;
    if (inp) inp.value = res.code;
    if (clr) clr.classList.remove("hide");
    if (stat) { stat.className = "text-[11px] font-semibold text-emerald-600"; stat.innerText = `✓ ${res.message}`; }
    updateGowesBookingPriceCalc();
    showToast(res.message);
}

function clearGowesBookingVoucher() {
    gowesBookingVoucherCode = "";
    gowesBookingVoucherDiscount = 0;
    const inp = document.getElementById("gw-book-voucher"); if (inp) inp.value = "";
    const clr = document.getElementById("btn-gw-clear-voucher"); if (clr) clr.classList.add("hide");
    const stat = document.getElementById("gw-book-voucher-status"); if (stat) { stat.className = "hide text-[11px] font-semibold"; stat.innerText = ""; }
    updateGowesBookingPriceCalc();
}
