// =========================================================================
// LEMBARKU & TITIK GOWES — ADMIN, WORKSPACE & FLEET CONTROLLER (js/admin.js)
// Versi: V14.10 (Konten & Media Beranda Terpadu + Selective Zoom Foto)
// =========================================================================
let masterThemeCatFilter = "Pernikahan", masterThemeSearch = "", masterOrdersFilter = "all";
let tbPhotosDraft = { cover: "", pria: "", wanita: "", couple: "", g1: "", g2: "", g3: "" };
let pbTempUploadedImg = "";
let _soloFollowersSearch = "";
let _soloProjectSearch = "";
let _soloProjectTypeFilter = "all";
let _soloProjectDomainFilter = "all"; // 'all' | 'lembarku' | 'gowes'
let _masterAnalyticsDomain = "lembarku"; // 'lembarku' | 'gowes'
let _masterContentMediaTab = "banners";
let _masterWsSubPage = ""; // Drill-down sub-sheet per workspace
let _publicProjectsCache = {};
let _adminStockAudio = null;
let _adminStockPlayingUrl = "";

window._soloStatsViewState = {
    open: false,
    targetUsername: "",
    mode: "followers",
    masterCat: "user",
    projectCat: "proses",
    projectDomain: "all"
};

function _normAdminUserKey(uname) {
    const k = String(uname || "").trim().toLowerCase();
    const founderU = (typeof FOUNDER_USERNAME !== "undefined" && FOUNDER_USERNAME) ? FOUNDER_USERNAME : "kausar.af";
    return k === "master" ? founderU : k;
}

function _pushAdminNavStep(stepObj) {
    if (typeof mrNavPush === "function") {
        mrNavPush(stepObj);
    } else if (typeof pushBackGuard === "function") {
        pushBackGuard();
    }
}

function _adminStepBackOrClose(fallbackCloseFn) {
    if (Array.isArray(window._mrNavStack) && window._mrNavStack.length > 1) {
        try {
            history.back();
            return;
        } catch {}
    }
    if (typeof fallbackCloseFn === "function") fallbackCloseFn();
}

function stopAdminStockSongPreview() {
    if (_adminStockAudio) {
        _adminStockAudio.dataset.wantPlay = "0";
        _adminStockAudio.onerror = null;
        _adminStockAudio.onended = null;
        try { _adminStockAudio.pause(); } catch {}
        _adminStockAudio = null;
    }
    _adminStockPlayingUrl = "";
    document.querySelectorAll("[data-stock-play-btn]").forEach(btn => {
        btn.innerHTML = `<i class="fa-solid fa-play"></i>`;
    });
}

function toggleAdminStockSongPreview(idx, btnEl) {
    const item = (db.musicLibrary || [])[idx];
    if (!item || !item.url) return showToast("URL lagu tidak valid.", "error");
    const rawUrl = String(item.url).trim();

    if (_adminStockAudio && !_adminStockAudio.paused && _adminStockPlayingUrl === rawUrl) {
        stopAdminStockSongPreview();
        return;
    }

    stopAdminStockSongPreview();
    _adminStockPlayingUrl = rawUrl;
    if (btnEl) btnEl.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;

    const candidates = typeof getSafeAudioCandidates === "function"
        ? getSafeAudioCandidates(rawUrl)
        : (typeof getAudioUrlCandidates === "function" ? getAudioUrlCandidates(rawUrl) : [rawUrl]);

    const el = new Audio();
    el.preload = "auto";
    el.setAttribute("playsinline", "");
    el.onplaying = () => {
        if (btnEl && _adminStockPlayingUrl === rawUrl) {
            btnEl.innerHTML = `<i class="fa-solid fa-stop"></i>`;
        }
    };
    el.onended = () => stopAdminStockSongPreview();
    _adminStockAudio = el;

    if (typeof playAudioElementWithFallback === "function") {
        playAudioElementWithFallback(el, candidates, () => {
            stopAdminStockSongPreview();
            showToast("Gagal memutar lagu. Pastikan file audio valid.", "error");
        }, rawUrl);
    } else {
        el.src = candidates[0] || rawUrl;
        el.play().catch(() => {
            stopAdminStockSongPreview();
            showToast("Gagal memutar lagu.", "error");
        });
    }
}

// ================= 1. DASBOR PROFIL FOUNDER & WORKSPACE FULL-SCREEN =================
function renderMasterAdmin() {
    renderMasterHeaderStats();
}

function _formatInstagramMetric(num) {
    const n = Math.max(0, Number(num) || 0);
    if (n >= 1000) {
        const kVal = (n / 1000).toFixed(1).replace(/\.0$/, "");
        return `${kVal}K`;
    }
    return String(n);
}

function _formatMasterFollowersNum() {
    const allUsers = Array.isArray(db.users) ? db.users : [];
    const activeRealCount = allUsers.filter(u => u && u.role !== "master" && u.status === "Aktif").length;
    return _formatInstagramMetric(18300 + activeRealCount);
}

function _findMasterStatsBox() {
    const masterSec = document.getElementById("view-master-admin");
    if (!masterSec) return null;
    const existingWrap = masterSec.querySelector(".ig-master-stats-wrap");
    if (existingWrap) return existingWrap;
    const statUsersEl = masterSec.querySelector("#stat-users");
    if (statUsersEl && statUsersEl.parentElement && statUsersEl.parentElement.parentElement) {
        return statUsersEl.parentElement.parentElement;
    }
    return masterSec.querySelector(".grid.grid-cols-4");
}

function renderMasterHeaderStats() {
    const m = getCurrentUserObj(); if (!m) return;

    const bEl = document.getElementById("mprof-banner");
    if (bEl) bEl.style.backgroundImage = m.banner ? `url('${m.banner}')` : "";

    const aEl = document.getElementById("mprof-avatar");
    if (aEl) {
        aEl.src = m.avatar || DEFAULT_AVATAR;
        aEl.onclick = () => openExpandedAvatarLightbox(m.avatar || DEFAULT_AVATAR, m.name || m.username);
        aEl.classList.add("cursor-pointer", "active:scale-95", "transition");
    }

    const nEl = document.getElementById("mprof-name");
    if (nEl) nEl.innerText = m.name || "Founder";
    const uEl = document.getElementById("mprof-username");
    const mPriv = typeof getUserPrivacy === "function" ? getUserPrivacy(m) : { showUsername: true };
    if (uEl) uEl.innerHTML = mPriv.showUsername ? `@${escHtml(m.username)}` : `@${escHtml(m.username)} <span class="text-[9px] px-1.5 py-0.5 rounded-full app-btn-sec app-muted ml-1"><i class="fa-solid fa-eye-slash mr-0.5"></i>Disembunyikan</span>`;
    const bioEl = document.getElementById("mprof-bio");
    if (bioEl) bioEl.innerText = m.bio || "Founder Lembarku & Titik Gowes";

    const statsContainer = _findMasterStatsBox();
    if (statsContainer) {
        statsContainer.className = "ig-master-stats-wrap w-full md:w-auto md:min-w-[290px] mt-3 md:mt-0";
        const followingCount = (typeof _getFollowingListForUser === "function")
            ? _getFollowingListForUser(m).length
            : (Array.isArray(m.following) ? m.following.length : 0);
        
        const allInvs = Array.isArray(db.invitations) ? db.invitations : [];
        const allPfs = (Array.isArray(db.portfolios) ? db.portfolios : []).filter(p => !(typeof isSystemCoinOrder === "function" && isSystemCoinOrder(p) && p.status === "Aktif"));
        const allRentals = Array.isArray(db.gowesRentals) ? db.gowesRentals : [];
        const totalProjectsCount = allInvs.length + allPfs.length + allRentals.length;

        const pendingUsersCnt = (db.users || []).filter(u => u && u.role !== "master" && u.status !== "Aktif").length;
        const pendingLbk = [...allInvs, ...allPfs].filter(p => p && (p.status !== "Aktif" || p.pendingRevision)).length;
        const pendingGowes = allRentals.filter(r => r && (r.status === "Menunggu Pembayaran" || r.status === "Menunggu Verifikasi")).length;
        const totalPendingProj = pendingLbk + pendingGowes;

        statsContainer.innerHTML = `
            <div class="app-card-soft border rounded-2xl p-2 shadow-sm">
                <div class="grid grid-cols-3 divide-x divide-black/10 text-center">
                    <button type="button" onclick="openSoloFollowersModal('${esc(m.username)}')" class="py-2 px-1 rounded-xl hover:bg-black/5 active:scale-98 transition relative">
                        <span class="block text-sm sm:text-base font-extrabold tracking-tight">${escHtml(_formatMasterFollowersNum())}</span>
                        <span class="block text-[11px] app-muted font-medium">Followers</span>
                        ${pendingUsersCnt > 0 ? `<span class="absolute top-1 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-black text-[9px] font-extrabold flex items-center justify-center">${pendingUsersCnt}</span>` : ""}
                    </button>
                    <button type="button" onclick="openSoloFollowingModal('${esc(m.username)}')" class="py-2 px-1 rounded-xl hover:bg-black/5 active:scale-98 transition">
                        <span class="block text-sm sm:text-base font-extrabold tracking-tight">${escHtml(_formatInstagramMetric(followingCount))}</span>
                        <span class="block text-[11px] app-muted font-medium">Following</span>
                    </button>
                    <button type="button" onclick="openSoloProjectModal('${esc(m.username)}')" class="py-2 px-1 rounded-xl hover:bg-black/5 active:scale-98 transition relative">
                        <span class="block text-sm sm:text-base font-extrabold tracking-tight">${escHtml(_formatInstagramMetric(totalProjectsCount))}</span>
                        <span class="block text-[11px] app-muted font-medium">Project</span>
                        ${totalPendingProj > 0 ? `<span class="absolute top-1 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center">${totalPendingProj}</span>` : ""}
                    </button>
                </div>
            </div>
        `;
    }
}

function openMasterWorkspace(name, fromNav = false) {
    const curU = getCurrentUserObj();
    if (name === "chat") return openFullChatOverlay();
    if (name === "orders" && curU) return openSoloProjectModal(curU.username);
    if (name === "users_cabang" && curU) return openSoloFollowersModal(curU.username);

    let resolvedWs = name || "overview";
    let initSub = "";
    if (resolvedWs === "home_editor") {
        resolvedWs = "content_media";
        initSub = "banners";
    } else if (resolvedWs === "media") {
        resolvedWs = "content_media";
        initSub = "songs";
    }
    currentMasterWorkspace = resolvedWs;
    _masterWsSubPage = initSub;
    if (resolvedWs === "gowes_fleet" && typeof resetGowesFleetDrillDown === "function") {
        resetGowesFleetDrillDown();
    }
    pbTempUploadedImg = "";
    stopAdminStockSongPreview();

    renderMasterWorkspaceContent();
    const modal = document.getElementById("modal-master-workspace");
    if (modal) {
        modal.classList.remove("hide");
        const sc = modal.querySelector(".lbk-fs-scroll");
        if (sc) sc.scrollTop = 0;
    }
    if (!fromNav) {
        _pushAdminNavStep({ type: "workspace", name: currentMasterWorkspace });
    }
}

function openMasterWsSubPage(subKey) {
    stopAdminStockSongPreview();
    _masterWsSubPage = String(subKey || "");
    renderMasterWorkspaceContent();
    const sc = document.querySelector("#modal-master-workspace .lbk-fs-scroll");
    if (sc) sc.scrollTop = 0;
}

function handleMasterWorkspaceBackBtn() {
    if (currentMasterWorkspace === "gowes_fleet" && typeof handleGowesFleetStepBack === "function") {
        if (handleGowesFleetStepBack()) return true;
    }
    if (_masterWsSubPage) {
        stopAdminStockSongPreview();
        _masterWsSubPage = "";
        renderMasterWorkspaceContent();
        const sc = document.querySelector("#modal-master-workspace .lbk-fs-scroll");
        if (sc) sc.scrollTop = 0;
        return true;
    }
    closeMasterWorkspaceFullscreen();
    return false;
}

function closeMasterWorkspaceFullscreen(fromNav = false) {
    stopAdminStockSongPreview();
    _masterWsSubPage = "";
    if (typeof resetGowesFleetDrillDown === "function") resetGowesFleetDrillDown();
    document.getElementById("modal-master-workspace")?.classList.add("hide");
    if (!fromNav && Array.isArray(window._mrNavStack) && window._mrNavStack.length > 1) {
        const top = window._mrNavStack[window._mrNavStack.length - 1];
        if (top && top.type === "workspace") window._mrNavStack.pop();
    }
}

function switchMasterAnalyticsDomain(domain) {
    _masterAnalyticsDomain = domain || "lembarku";
    openMasterWsSubPage(_masterAnalyticsDomain);
}

function switchMasterContentMediaTab(tab) {
    stopAdminStockSongPreview();
    _masterContentMediaTab = tab || "banners";
    openMasterWsSubPage(tab === "media" ? "songs" : tab);
}

function buildMasterAnalyticsHtml() {
    const invs = db.invitations || [];
    const pfs = db.portfolios || [];
    const users = (db.users || []).filter(u => u.role !== "master");

    const invActive = invs.filter(i => i.status === "Aktif");
    const realPfs = pfs.filter(p => typeof isSystemCoinOrder !== "function" || !isSystemCoinOrder(p));
    const coinOrdersActive = pfs.filter(p => typeof isSystemCoinOrder === "function" && isSystemCoinOrder(p) && p.status === "Aktif");
    const cvActive = realPfs.filter(p => p.status === "Aktif" && p.docType !== "lamaran");
    const lamActive = realPfs.filter(p => p.status === "Aktif" && p.docType === "lamaran");

    const revInv = invActive.reduce((s, i) => s + Number(i.price || 99000), 0);
    const revPf = [...cvActive, ...lamActive].reduce((s, p) => s + Number(p.price || 20000), 0);
    const revCoinPro = coinOrdersActive.reduce((s, p) => s + Number(p.price || 0), 0);
    const totalRev = revInv + revPf + revCoinPro;

    const now = new Date();
    const months = [];
    for (let k = 5; k >= 0; k--) {
        const dt = new Date(now.getFullYear(), now.getMonth() - k, 1);
        months.push({
            key: `${dt.getFullYear()}-${dt.getMonth()}`,
            ymKey: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`,
            label: dt.toLocaleDateString("id-ID", { month: "short" }),
            orders: 0,
            rev: 0
        });
    }
    const allDocs = [...invs, ...pfs];
    allDocs.forEach(doc => {
        const ts = Number(doc.createdAt || doc.id || Date.now());
        const dt = new Date(ts);
        const mk = `${dt.getFullYear()}-${dt.getMonth()}`;
        const bucket = months.find(m => m.key === mk);
        if (bucket) {
            bucket.orders++;
            if (doc.status === "Aktif") bucket.rev += Number(doc.price || (doc.docType ? 20000 : 99000));
        }
    });
    const maxOrders = Math.max(1, ...months.map(m => m.orders));

    const cInv = invs.length, cCv = realPfs.filter(p => p.docType !== "lamaran").length, cLam = realPfs.filter(p => p.docType === "lamaran").length;
    const totalProd = Math.max(1, cInv + cCv + cLam);
    const circ = 2 * Math.PI * 38;
    const dInv = (cInv / totalProd) * circ;
    const dCv = (cCv / totalProd) * circ;
    const dLam = (cLam / totalProd) * circ;

    const uReg = users.filter(u => u.role === "user" && !u.isPro).length;
    const uPro = users.filter(u => u.isPro).length;
    const uCab = users.filter(u => u.role === "cabang").length;
    const uStaff = users.filter(u => u.role === "administrasi").length;
    const maxU = Math.max(1, uReg, uPro, uCab, uStaff);

    // Data Pemasangan & Pencopotan Aplikasi (PWA)
    const appSt = (db.appStats && typeof db.appStats === "object") ? db.appStats : {};
    const activeInstalled = Number(appSt.activeInstalled || 0);
    const totalInstalled = Number(appSt.totalInstalled || 0);
    const totalUninstalled = Number(appSt.totalUninstalled || 0);
    const appHistMap = {};
    (Array.isArray(appSt.history) ? appSt.history : []).forEach(h => {
        if (h && h.key) appHistMap[h.key] = h;
    });
    const pwaMonths = months.map(m => {
        const rec = appHistMap[m.ymKey] || { installs: 0, uninstalls: 0 };
        return {
            label: m.label,
            installs: Number(rec.installs || 0),
            uninstalls: Number(rec.uninstalls || 0)
        };
    });
    const maxPwa = Math.max(1, ...pwaMonths.map(x => Math.max(x.installs, x.uninstalls)));
    const retentionPct = totalInstalled > 0 ? Math.round((activeInstalled / totalInstalled) * 100) : 100;

    const pendingUsers = users.filter(u => u.status !== "Aktif");
    const logs = (db.adminLogs || []).slice(0, 6);

    return `<div class="space-y-5">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="app-card border rounded-2xl p-3.5 space-y-1 shadow-sm border-l-4 border-l-blue-500">
                <span class="text-[10px] app-muted font-bold uppercase block">Omzet Digital Aktif</span>
                <strong class="text-base sm:text-lg font-extrabold app-accent block truncate">${fmtRp(totalRev)}</strong>
                <span class="text-[10px] app-muted">${invActive.length} Undangan • ${cvActive.length + lamActive.length} CV/Lam</span>
            </div>
            <div class="app-card border rounded-2xl p-3.5 space-y-1 shadow-sm">
                <span class="text-[10px] app-muted font-bold uppercase block">Omzet Undangan</span>
                <strong class="text-base sm:text-lg font-extrabold block truncate">${fmtRp(revInv)}</strong>
                <span class="text-[10px] text-emerald-600 font-semibold">${invActive.length} aktif</span>
            </div>
            <div class="app-card border rounded-2xl p-3.5 space-y-1 shadow-sm">
                <span class="text-[10px] app-muted font-bold uppercase block">Omzet CV &amp; Lamaran</span>
                <strong class="text-base sm:text-lg font-extrabold block truncate">${fmtRp(revPf)}</strong>
                <span class="text-[10px] text-blue-600 font-semibold">${cvActive.length + lamActive.length} aktif</span>
            </div>
            <div class="app-card border rounded-2xl p-3.5 space-y-1 shadow-sm">
                <span class="text-[10px] app-muted font-bold uppercase block">Pendaftar Baru</span>
                <strong class="text-base sm:text-lg font-extrabold text-amber-500 block">${pendingUsers.length} Akun</strong>
                <span class="text-[10px] app-muted">Kelola di Followers</span>
            </div>
        </div>

        <div class="app-card border rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h4 class="text-xs font-extrabold uppercase app-accent"><i class="fa-solid fa-mobile-screen-button mr-1.5"></i>Statistik Install &amp; Uninstall Aplikasi (PWA)</h4>
                    <p class="text-[10px] app-muted mt-0.5">Pelacakan perangkat yang memasang ikon Lembarku dan yang terindikasi mencopot aplikasi</p>
                </div>
                <span class="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 font-extrabold">Retensi: ${retentionPct}%</span>
            </div>

            <div class="grid grid-cols-3 gap-2.5 text-center">
                <div class="app-card-soft border rounded-2xl p-3">
                    <span class="text-[10px] app-muted font-bold uppercase block">Aktif Terpasang</span>
                    <strong class="text-xl font-extrabold text-emerald-600 block mt-0.5">${activeInstalled}</strong>
                </div>
                <div class="app-card-soft border rounded-2xl p-3">
                    <span class="text-[10px] app-muted font-bold uppercase block">Total Install</span>
                    <strong class="text-xl font-extrabold text-blue-600 block mt-0.5">${totalInstalled}</strong>
                </div>
                <div class="app-card-soft border rounded-2xl p-3">
                    <span class="text-[10px] app-muted font-bold uppercase block">Uninstall</span>
                    <strong class="text-xl font-extrabold text-red-500 block mt-0.5">${totalUninstalled}</strong>
                </div>
            </div>

            <div class="space-y-2">
                <div class="flex items-center justify-between text-[10px] app-muted px-1">
                    <span>Tren 6 Bulan Terakhir</span>
                    <div class="flex items-center gap-3 font-bold">
                        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>Install</span>
                        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block"></span>Uninstall</span>
                    </div>
                </div>
                <div class="h-36 flex items-end justify-between gap-2 pt-3 px-2 app-card-soft border rounded-2xl pb-2">
                    ${pwaMonths.map(pm => {
                        const hIn = pm.installs > 0 ? Math.max(12, Math.round((pm.installs / maxPwa) * 100)) : 5;
                        const hUn = pm.uninstalls > 0 ? Math.max(12, Math.round((pm.uninstalls / maxPwa) * 100)) : 5;
                        return `<div class="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                            <div class="flex items-end gap-1 h-24 w-full justify-center">
                                <div class="w-3 sm:w-4 rounded-t-md bg-emerald-500 transition-all" style="height:${hIn}%" title="${pm.label} Install: ${pm.installs}"></div>
                                <div class="w-3 sm:w-4 rounded-t-md bg-red-500/85 transition-all" style="height:${hUn}%" title="${pm.label} Uninstall: ${pm.uninstalls}"></div>
                            </div>
                            <span class="text-[9.5px] font-bold">${pm.installs}/${pm.uninstalls}</span>
                            <span class="text-[9.5px] app-muted font-semibold">${pm.label}</span>
                        </div>`;
                    }).join("")}
                </div>
            </div>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
            <div class="app-card border rounded-3xl p-4 space-y-3 shadow-sm">
                <div class="flex items-center justify-between">
                    <h4 class="text-xs font-extrabold uppercase app-accent">Tren Pesanan (6 Bulan)</h4>
                    <span class="text-[10px] app-muted">Total: ${allDocs.length} berkas</span>
                </div>
                <div class="h-40 flex items-end justify-between gap-2 pt-4 px-1">
                    ${months.map(m => {
                        const hPct = Math.max(8, Math.round((m.orders / maxOrders) * 100));
                        return `<div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                            <span class="text-[10px] font-bold">${m.orders}</span>
                            <div class="w-full max-w-[34px] rounded-t-xl gold-gradient transition-all duration-500 shadow-sm" style="height:${hPct}%" title="${m.label}: ${m.orders} pesanan (${fmtRp(m.rev)})"></div>
                            <span class="text-[10px] app-muted font-semibold">${m.label}</span>
                        </div>`;
                    }).join("")}
                </div>
            </div>

            <div class="app-card border rounded-3xl p-4 space-y-4 shadow-sm">
                <h4 class="text-xs font-extrabold uppercase app-accent">Komposisi Produk &amp; Akun</h4>
                <div class="flex items-center gap-5">
                    <svg width="96" height="96" viewBox="0 0 96 96" class="shrink-0 -rotate-90">
                        <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(148,163,184,0.22)" stroke-width="12"/>
                        <circle cx="48" cy="48" r="38" fill="none" stroke="#eab308" stroke-width="12" stroke-dasharray="${dInv} ${circ}" stroke-dashoffset="0"/>
                        <circle cx="48" cy="48" r="38" fill="none" stroke="#3b82f6" stroke-width="12" stroke-dasharray="${dCv} ${circ}" stroke-dashoffset="${-dInv}"/>
                        <circle cx="48" cy="48" r="38" fill="none" stroke="#10b981" stroke-width="12" stroke-dasharray="${dLam} ${circ}" stroke-dashoffset="${-(dInv + dCv)}"/>
                    </svg>
                    <div class="flex-1 space-y-1.5 text-xs">
                        <div class="flex items-center justify-between"><span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>Undangan</span><strong>${cInv}</strong></div>
                        <div class="flex items-center justify-between"><span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>Curriculum Vitae</span><strong>${cCv}</strong></div>
                        <div class="flex items-center justify-between"><span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Surat Lamaran</span><strong>${cLam}</strong></div>
                    </div>
                </div>
                <div class="space-y-2 pt-2 border-t gold-border text-[11px]">
                    ${[
                        { lbl: "User Reguler", val: uReg, col: "bg-slate-400" },
                        { lbl: "Akun Pro (Centang Biru)", val: uPro, col: "bg-blue-500" },
                        { lbl: "Admin Cabang", val: uCab, col: "bg-amber-500" },
                        { lbl: "Tim Administrasi", val: uStaff, col: "bg-emerald-500" }
                    ].map(row => `<div class="space-y-0.5"><div class="flex justify-between"><span class="app-muted">${row.lbl}</span><strong>${row.val}</strong></div><div class="w-full h-1.5 rounded-full app-btn-sec overflow-hidden"><div class="h-full ${row.col} rounded-full" style="width:${Math.max(4, Math.round((row.val / maxU) * 100))}%"></div></div></div>`).join("")}
                </div>
            </div>
        </div>

        <div class="app-card border rounded-3xl p-4 space-y-2.5 shadow-sm">
            <h4 class="text-xs font-extrabold uppercase app-accent">Aktivitas Verifikasi &amp; Edit Terbaru</h4>
            ${logs.length ? logs.map(l => `<div class="app-card-soft border rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-[11px]"><div class="min-w-0"><strong class="app-accent">@${escHtml(l.actor)}</strong> <span class="text-[9px] uppercase px-1.5 py-0.5 rounded app-btn-sec font-bold mr-1">${escHtml(l.role)}</span><span>${escHtml(l.msg)}</span></div><span class="text-[10px] app-muted shrink-0">${escHtml(l.time)}</span></div>`).join("") : '<p class="text-xs app-muted">Belum ada catatan aktivitas verifikasi.</p>'}
        </div>
    </div>`;
}

// ================= 2. ROLE ADMINISTRASI & KARTU PROJECT LENGKAP =================
function isCabangOwnedDoc(item) {
    if (!item) return false;
    if (item.brandName && String(item.brandName).trim()) return true;
    const ownerObj = (db.users || []).find(u => _normAdminUserKey(u.username) === _normAdminUserKey(item.owner));
    return !!(ownerObj && ownerObj.role === "cabang");
}

function renderStaffAdmin() {
    const st = getCurrentUserObj(); if (!st) return;
    const avEl = document.getElementById("staff-avatar");
    if (avEl) {
        avEl.src = st.avatar || DEFAULT_AVATAR;
        avEl.onclick = () => openExpandedAvatarLightbox(st.avatar || DEFAULT_AVATAR, st.name || st.username);
        avEl.classList.add("cursor-pointer", "active:scale-95", "transition");
    }
    const nmEl = document.getElementById("staff-name"); if (nmEl) nmEl.innerText = st.name || "Tim Administrasi";
    const stPriv = typeof getUserPrivacy === "function" ? getUserPrivacy(st) : { showUsername: true };
    const usEl = document.getElementById("staff-username"); if (usEl) usEl.innerHTML = stPriv.showUsername ? `@${escHtml(st.username)}` : `@${escHtml(st.username)} <span class="text-[9px] px-1.5 py-0.5 rounded-full app-btn-sec app-muted ml-1"><i class="fa-solid fa-eye-slash mr-0.5"></i>Disembunyikan</span>`;

    if (typeof _mountProfileIgStats === "function") {
        _mountProfileIgStats("view-staff-admin", "staff-ig-stats-mount", st);
    }

    const userInvs = (db.invitations || []).filter(i => !isCabangOwnedDoc(i));
    const userPfs = (db.portfolios || []).filter(p => !isCabangOwnedDoc(p));
    const pendingLbk = userInvs.filter(i => i.status !== "Aktif").length + userPfs.filter(p => p.status !== "Aktif").length;

    const allRentals = Array.isArray(db.gowesRentals) ? db.gowesRentals : [];
    const pendingGowes = allRentals.filter(r => r.status === "Menunggu Pembayaran" || r.status === "Menunggu Verifikasi").length;

    const totalPending = pendingLbk + pendingGowes;
    const pbEl = document.getElementById("staff-pending-badge");
    if (pbEl) {
        pbEl.innerText = `${totalPending} Menunggu (${pendingLbk} Berkas, ${pendingGowes} Sepeda)`;
    }
    const liveOutCount = allRentals.filter(r => r && r.status === "Sedang Digunakan").length;
    const livePill = document.getElementById("staff-live-bikes-cnt");
    if (livePill) {
        livePill.innerText = String(liveOutCount);
        livePill.classList.toggle("hide", liveOutCount === 0);
    }
    if (typeof updateChatBadges === "function") updateChatBadges();
}

function buildFullOrderCardHtml(item, options = {}) {
    const isStaffMode = !!options.isStaffMode;
    const closeModalBeforeAction = !!options.closeModalBeforeAction;
    const preCloseJs = closeModalBeforeAction ? "closeSoloStatsModal();closeUserProfileModalCustom();" : "";

    if (typeof isSystemCoinOrder === "function" && isSystemCoinOrder(item)) {
        const isProUp = item.docType === "pro_upgrade";
        const isCvAddon = item.docType === "cv_edit_addon";
        const isDone = item.status === "Aktif";
        const priceInfo = item.totalPay ? `${fmtRp(item.totalPay)} (kode unik)` : fmtRp(item.price || 0);
        const badgeCls = isCvAddon ? "bg-purple-600 text-white" : isProUp ? "bg-blue-600 text-white" : "bg-amber-400 text-black";
        const badgeTxt = isCvAddon ? "TAMBAH +2X EDIT CV" : isProUp ? "UPGRADE AKUN PRO" : "TOP-UP COIN";
        const borderCls = isCvAddon ? "border-l-purple-500" : isProUp ? "border-l-blue-500" : "border-l-amber-500";
        const accLabel = isCvAddon ? "ACC +2x Edit CV" : isProUp ? "ACC PRO & Coin" : "ACC & Tambah Coin";
        const detailSub = isCvAddon
            ? `Nominal 50%: <strong class="app-accent">${priceInfo}</strong> • Target: <strong>${escHtml(item.targetTitle || "CV")}</strong>`
            : `Nominal: <strong class="app-accent">${priceInfo}</strong> • Coin Diterima: <strong class="text-amber-600">+${Number(item.coinAmount || 0)} Coin</strong>`;

        return `<div class="app-card border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm border-l-4 ${borderCls}">
            <div class="min-w-0 space-y-1">
                <div class="flex flex-wrap items-center gap-1.5">
                    <span class="text-[9px] px-2 py-0.5 rounded-full ${badgeCls} font-extrabold uppercase">${badgeTxt}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${isDone ? "bg-emerald-500/20 text-emerald-600" : "bg-amber-500/20 app-accent"}">● ${escHtml(item.status)}</span>
                    ${typeof formatHandledByBadgeHtml === "function" ? formatHandledByBadgeHtml(item) : ""}
                </div>
                <h4 class="font-bold text-sm mt-1 truncate">${escHtml(item.title)} <span class="text-xs app-muted font-normal">(@${escHtml(item.owner)})</span></h4>
                <p class="text-xs app-muted">${detailSub}</p>
            </div>
            <div class="flex flex-wrap gap-1.5">
                ${item.owner ? `<button type="button" onclick="${preCloseJs}openFullChatOverlay('${esc(item.owner)}')" class="px-3 py-1.5 rounded-xl bg-emerald-600/15 border border-emerald-500/40 text-emerald-600 text-xs font-bold"><i class="fa-solid fa-comments mr-1"></i>Chat</button>` : ""}
                ${item.paymentProof ? `<button type="button" onclick="viewOrderProof('pf',${item.id})" class="px-3 py-1.5 rounded-xl bg-blue-600/15 border border-blue-500/40 text-blue-600 text-xs font-bold">Bukti / SS</button>` : ""}
                <button type="button" onclick="if(typeof openLembarkuOrderReceiptModal==='function')openLembarkuOrderReceiptModal('pf',${item.id})" class="px-3 py-1.5 rounded-xl app-card-soft border text-xs font-bold"><i class="fa-solid fa-receipt mr-1"></i>Struk</button>
                ${!isDone
                    ? `<button type="button" onclick="approveCoinOrProOrder(${item.id},this)" class="gold-pill-btn px-4 py-1.5 rounded-xl text-xs">✓ ${accLabel}</button>`
                    : `<span class="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 text-xs font-extrabold">✓ Selesai</span>`}
                ${!isStaffMode ? `<button type="button" onclick="deleteOrderItem('pf',${item.id})" class="px-2.5 py-1.5 rounded-xl bg-red-600/15 text-red-500 text-xs"><i class="fa-solid fa-trash"></i></button>` : ""}
            </div>
        </div>`;
    }

    const isPf = item._kind === "pf";
    const hasRev = !!item.pendingRevision;
    const typeTag = isPf ? (item.docType === "lamaran" ? "SURAT LAMARAN" : "CV") : `UNDANGAN • ${escHtml(item.category)}`;
    const priceInfo = item.totalPay ? `${fmtRp(item.totalPay)} (kode unik)` : (item.price ? fmtRp(item.price) : "");

    return `<div class="app-card border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-[9px] px-2 py-0.5 rounded-full app-accent-bg app-accent font-extrabold">${typeTag}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${item.status==="Aktif"?"bg-emerald-500/20 text-emerald-600":"bg-amber-500/20 app-accent"}">● ${escHtml(item.status)}</span>
                ${hasRev ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 font-extrabold">REVISI MASUK</span>` : ""}
                ${typeof formatHandledByBadgeHtml === "function" ? formatHandledByBadgeHtml(item) : ""}
            </div>
            <h4 class="font-bold text-sm mt-1 truncate">${escHtml(item.title)} <span class="text-xs app-muted font-normal">(@${escHtml(item.owner)}${item.brandName ? ` • ${escHtml(item.brandName)}` : ""})</span></h4>
            <p class="text-xs app-muted">${escHtml(isPf ? (item.themeName || item.themeId) : item.theme)} ${priceInfo ? `• <strong class="app-accent">${priceInfo}</strong>` : ""} • Revisi: ${item.editCount || 0}/2</p>
        </div>
        <div class="flex flex-wrap gap-1.5">
            ${item.owner ? `<button type="button" onclick="${preCloseJs}openFullChatOverlay('${esc(item.owner)}')" class="px-3 py-1.5 rounded-xl bg-emerald-600/15 border border-emerald-500/40 text-emerald-600 text-xs font-bold" title="Kirim Pesan ke Pemilik Order"><i class="fa-solid fa-comments mr-1"></i>Chat</button>` : ""}
            ${item.paymentProof ? `<button type="button" onclick="viewOrderProof('${item._kind}',${item.id})" class="px-3 py-1.5 rounded-xl bg-blue-600/15 border border-blue-500/40 text-blue-600 text-xs font-bold">Bukti / SS</button>` : ""}
            <button type="button" onclick="if(typeof openLembarkuOrderReceiptModal==='function')openLembarkuOrderReceiptModal('${item._kind}',${item.id})" class="px-3 py-1.5 rounded-xl app-card-soft border text-xs font-bold"><i class="fa-solid fa-receipt mr-1"></i>Struk</button>
            <button type="button" onclick="${preCloseJs}${isPf ? `openEditPortfolio(${item.id},true)` : `openEditInvitation(${item.id},true)`}" class="px-3 py-1.5 rounded-xl app-card-soft border app-accent text-xs font-bold"><i class="fa-solid fa-pen mr-1"></i>Edit</button>
            ${hasRev ? `
                <button type="button" onclick="${preCloseJs}${isPf ? `openPortfolioDocPreview(${item.id},true)` : `previewPendingRevision(${item.id})`}" class="px-3 py-1.5 rounded-xl app-btn-sec text-xs font-bold">Cek Revisi</button>
                <button type="button" onclick="approveOrderRevision('${item._kind}',${item.id},this)" class="gold-pill-btn px-3.5 py-1.5 rounded-xl text-xs">✓ ACC Revisi</button>
                <button type="button" onclick="rejectOrderRevision('${item._kind}',${item.id},this)" class="px-3 py-1.5 rounded-xl bg-red-600/15 text-red-500 text-xs font-bold">Tolak</button>
            ` : `
                <button type="button" onclick="${preCloseJs}${isPf ? `openPortfolioDocPreview(${item.id},false)` : `openGuestView(${item.id},'Review Admin')`}" class="px-3 py-1.5 rounded-xl app-btn-sec text-xs font-bold">Lihat</button>
                ${item.status !== "Aktif"
                    ? `<button type="button" onclick="setOrderStatus('${item._kind}',${item.id},'Aktif',this)" class="gold-pill-btn px-4 py-1.5 rounded-xl text-xs">✓ Konfirmasi</button>`
                    : `<button type="button" onclick="setOrderStatus('${item._kind}',${item.id},'Menunggu Verifikasi',this)" class="px-3 py-1.5 rounded-xl bg-amber-600/15 app-accent text-xs font-bold">Tangguhkan</button>`}
            `}
            ${!isStaffMode ? `<button type="button" onclick="deleteOrderItem('${item._kind}',${item.id})" class="px-2.5 py-1.5 rounded-xl bg-red-600/15 text-red-500 text-xs"><i class="fa-solid fa-trash"></i></button>` : ""}
        </div>
    </div>`;
}

function buildUserOwnProjectCardHtml(doc, isCabangOwner = false) {
    const isPf = doc._kind === "pf";
    const isAktif = doc.status === "Aktif";
    const isPay = doc.status === "Menunggu Pembayaran";
    const rule = typeof getProjectEditRuleInfo === "function"
        ? getProjectEditRuleInfo(doc, isCabangOwner)
        : { isCv: isPf && doc.docType !== "lamaran", isExpired: false, daysLeft: 21, maxEdits: 2, editCount: doc.editCount || 0, editsLeft: Math.max(0, 2 - (doc.editCount || 0)), canEdit: isAktif, canBuyCvAddon: false, addonHalfPrice: 10000 };

    const editLbl = isCabangOwner
        ? (rule.isCv ? "Edit" : `Edit (${rule.daysLeft}hr)`)
        : (rule.isCv ? `Edit (${rule.editsLeft}x)` : `Edit (${rule.editsLeft}x • ${rule.daysLeft}hr)`);
    const typeTag = isPf ? (doc.docType === "lamaran" ? "SURAT LAMARAN" : "CV") : `UNDANGAN • ${escHtml(doc.category)}`;
    const preClose = "closeSoloStatsModal();closeUserProfileModalCustom();";

    let editBtnHtml = "";
    if (rule.isExpired) {
        editBtnHtml = `<button type="button" disabled class="px-3 py-1.5 rounded-xl app-btn-sec opacity-50 text-xs font-bold"><i class="fa-solid fa-lock mr-1"></i>Masa Edit Habis</button>`;
    } else if (rule.canEdit) {
        editBtnHtml = `<button type="button" onclick="${preClose}${isPf ? `openEditPortfolio(${doc.id},${isCabangOwner})` : `openEditInvitation(${doc.id},${isCabangOwner})`}" class="px-3 py-1.5 rounded-xl app-card-soft border app-accent text-xs font-bold"><i class="fa-solid fa-pen mr-1"></i>${editLbl}</button>`;
    } else if (rule.canBuyCvAddon) {
        editBtnHtml = `<button type="button" onclick="${preClose}requestCvExtraEditsOrder(${doc.id})" class="px-3 py-1.5 rounded-xl bg-amber-500/18 border border-amber-500/40 text-amber-700 text-xs font-extrabold"><i class="fa-solid fa-plus mr-1"></i>+2x Edit (${fmtRp(rule.addonHalfPrice)})</button>`;
    } else {
        editBtnHtml = `<button type="button" disabled class="px-3 py-1.5 rounded-xl app-btn-sec opacity-50 text-xs font-bold"><i class="fa-solid fa-lock mr-1"></i>Edit</button>`;
    }

    return `<div class="app-card border rounded-2xl p-4 space-y-3 shadow-sm">
        <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-[9px] px-2 py-0.5 rounded-full app-accent-bg app-accent font-extrabold">${typeTag}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${isAktif?"bg-emerald-500/20 text-emerald-600":"bg-amber-500/20 app-accent"}">● ${escHtml(doc.status)}</span>
                ${typeof formatHandledByBadgeHtml === "function" ? formatHandledByBadgeHtml(doc) : ""}
            </div>
            <h4 class="font-bold text-sm mt-1 truncate">${escHtml(doc.title)}</h4>
            <p class="text-xs app-muted">${escHtml(isPf ? (doc.themeName || doc.themeId) : doc.theme)} • Revisi: ${rule.editCount}/${rule.maxEdits}${!rule.isCv ? (rule.isExpired ? " • Batas 3 minggu habis" : ` • Sisa masa edit ${rule.daysLeft} hari`) : ""}</p>
        </div>
        <div class="flex flex-wrap gap-1.5">
            ${isPf
                ? `<button type="button" onclick="${preClose}openPortfolioDocPreview(${doc.id},false)" class="px-3 py-1.5 rounded-xl app-btn-sec text-xs font-bold"><i class="fa-regular fa-eye mr-1"></i>Lihat</button>`
                : (isAktif
                    ? `<button type="button" onclick="${preClose}openGuestView(${doc.id},'Tamu Kehormatan')" class="px-3 py-1.5 rounded-xl app-btn-sec text-xs font-bold"><i class="fa-regular fa-eye mr-1"></i>Lihat</button>`
                    : `<button type="button" disabled class="px-3 py-1.5 rounded-xl app-btn-sec opacity-50 text-xs font-bold"><i class="fa-solid fa-lock mr-1"></i>Lihat</button>`)}
            ${editBtnHtml}
            ${isAktif ? `<button type="button" onclick="if(typeof openLembarkuOrderReceiptModal==='function')openLembarkuOrderReceiptModal('${doc._kind}',${doc.id})" class="px-3 py-1.5 rounded-xl app-card-soft border text-xs font-bold"><i class="fa-solid fa-receipt mr-1"></i>Struk</button>` : ""}
            ${isPay
                ? `<button type="button" onclick="${preClose}openUnifiedPayment('${isPf ? "portfolio" : "inv"}',${doc.id})" class="gold-pill-btn px-3.5 py-1.5 rounded-xl text-xs"><i class="fa-solid fa-qrcode mr-1"></i>Konfirmasi</button>`
                : (isAktif && isPf
                    ? `<button type="button" onclick="${preClose}openSempurnakanModal(${doc.id})" class="gold-pill-btn px-3.5 py-1.5 rounded-xl text-xs"><i class="fa-solid fa-file-pdf mr-1"></i>Sempurnakan / PDF</button>`
                    : (isAktif && !isPf
                        ? `<button type="button" onclick="${preClose}openGuestListManager(${doc.id})" class="gold-pill-btn px-3.5 py-1.5 rounded-xl text-xs"><i class="fa-solid fa-share-nodes mr-1"></i>Tamu (${(doc.guests || []).length})</button>${isCabangOwner ? `<button type="button" onclick="${preClose}openClientPortalShareModal(${doc.id})" class="px-3 py-1.5 rounded-xl bg-blue-600/15 text-blue-600 text-xs font-bold">Link Klien</button>` : ""}`
                        : ""))}
        </div>
    </div>`;
}

function viewOrderProof(kind, id) {
    let rawUrl = "";
    let itemTitle = "Pesanan";
    let itemOwner = "-";

    if (kind === "gowes_rental") {
        const rental = (db.gowesRentals || []).find(r => String(r.id) === String(id));
        if (!rental || !rental.paymentProof) return showToast("Bukti transfer rental belum tersedia.", "info");
        rawUrl = String(rental.paymentProof).trim();
        itemTitle = `Rental: ${rental.bikeName}`;
        itemOwner = rental.customerUsername || "-";
    } else {
        const item = kind === "pf"
            ? (db.portfolios || []).find(p => String(p.id) === String(id))
            : (db.invitations || []).find(i => String(i.id) === String(id));
        if (!item || !item.paymentProof) return showToast("Bukti pembayaran belum tersedia.", "info");
        rawUrl = String(item.paymentProof || "").trim();
        itemTitle = item.title || "Pesanan";
        itemOwner = item.owner || "-";
    }

    const isSafeUrl = /^(https?:\/\/|data:image\/)/i.test(rawUrl);
    if (!isSafeUrl) return showToast("Format bukti pembayaran tidak valid.", "error");

    const modal = document.getElementById("modal-proof-viewer");
    const imgEl = document.getElementById("proof-viewer-img");
    const titleEl = document.getElementById("proof-viewer-title");
    const openLink = document.getElementById("proof-viewer-open-link");

    if (modal && imgEl) {
        if (titleEl) titleEl.innerText = `Bukti — ${itemTitle} (@${itemOwner})`;
        imgEl.src = rawUrl;
        if (openLink) {
            openLink.href = rawUrl;
            openLink.classList.toggle("hide", rawUrl.startsWith("data:"));
        }
        modal.classList.remove("hide");
        if (typeof attachSelectivePinchZoom === "function") {
            attachSelectivePinchZoom(document.getElementById("proof-zoom-stage"), imgEl);
        }
        _pushAdminNavStep({ type: "modal", id: "modal-proof-viewer" });
        return;
    }

    if (!rawUrl.startsWith("data:")) window.open(rawUrl, "_blank", "noopener,noreferrer");
}

function previewPendingRevision(id) {
    const inv = db.invitations.find(i => String(i.id) === String(id));
    if (inv && inv.pendingRevision) openGuestViewWithObject(Object.assign({}, inv, inv.pendingRevision), "Review Revisi");
}

async function setOrderStatus(kind, id, status, btn) {
    setBtnLoading(btn, true, "...");
    const hbMeta = typeof buildHandledByMeta === "function" ? buildHandledByMeta() : null;
    if (kind === "pf") {
        const pf = (db.portfolios || []).find(p => String(p.id) === String(id));
        if (pf) {
            const upd = Object.assign({}, pf, { status, handledBy: hbMeta || pf.handledBy });
            await apiAction({ action: "upsert_portfolio", portfolio: upd, adminActionLog: `Mengubah status ${pf.docType === "lamaran" ? "Lamaran" : "CV"} "${pf.title}" menjadi ${status}` });
            Object.assign(pf, upd);
        }
    } else {
        const inv = (db.invitations || []).find(i => String(i.id) === String(id));
        if (inv) {
            const upd = Object.assign({}, inv, { status, handledBy: hbMeta || inv.handledBy });
            await apiAction({ action: "upsert_invitation", invitation: upd, adminActionLog: `Mengubah status undangan "${inv.title}" menjadi ${status}` });
            Object.assign(inv, upd);
        }
    }
    refreshAfterAdminOrderAction(`Status berkas diperbarui: ${status}`);
}

async function approveCoinOrProOrder(orderId, btn) {
    const order = (db.portfolios || []).find(p => String(p.id) === String(orderId));
    if (!order) return showToast("Data pesanan tidak ditemukan.", "error");
    const hbMeta = typeof buildHandledByMeta === "function" ? buildHandledByMeta() : null;

    // A. ACC TAMBAH +2X EDIT CV (50% HARGA CV)
    if (order.docType === "cv_edit_addon") {
        const targetCv = (db.portfolios || []).find(p => String(p.id) === String(order.targetPfId));
        if (!targetCv) return showToast("Data CV tujuan tidak ditemukan.", "error");
        const addCount = Math.max(1, Math.round(Number(order.addEdits || 2)));
        const ok = await showConfirm(
            "ACC Tambahan +2x Edit CV",
            `Setujui pembayaran ${fmtRp(order.totalPay || order.price)} dari @${order.owner}? Batas revisi CV "${targetCv.title}" akan bertambah +${addCount}x.`,
            "fa-solid fa-pen-to-square",
            "Ya, Tambah +2x Edit"
        );
        if (!ok) return;

        setBtnLoading(btn, true, "Memproses...");
        const nextMaxEdits = Math.max(2, Number(targetCv.maxEdits || 2)) + addCount;
        const updCv = Object.assign({}, targetCv, { maxEdits: nextMaxEdits, handledBy: hbMeta || targetCv.handledBy });
        await apiAction({ action: "upsert_portfolio", portfolio: updCv, adminActionLog: `ACC +${addCount}x Edit CV "${targetCv.title}" (@${order.owner})` });
        Object.assign(targetCv, updCv);

        const updOrder = Object.assign({}, order, { status: "Aktif", approvedAt: Date.now(), handledBy: hbMeta });
        await apiAction({ action: "upsert_portfolio", portfolio: updOrder });
        Object.assign(order, updOrder);
        setBtnLoading(btn, false);
        refreshAfterAdminOrderAction(`Kuota edit CV "${targetCv.title}" ditambah +${addCount}x!`);
        return;
    }

    // B. ACC TOP-UP COIN ATAU UPGRADE PRO
    const isProUp = order.docType === "pro_upgrade";
    const coinsToAdd = Math.max(0, Math.round(Number(order.coinAmount || 0)));
    const buyerKey = _normAdminUserKey(order.owner);
    const buyer = (db.users || []).find(u => _normAdminUserKey(u.username) === buyerKey);
    if (!buyer) return showToast(`Akun pembeli @${order.owner} tidak ditemukan.`, "error");

    const confirmMsg = isProUp
        ? `Setujui Upgrade PRO untuk @${buyer.username}? Akun akan mendapat Centang Biru PRO dan +${coinsToAdd} Bonus Coin otomatis.`
        : `Setujui Top-Up +${coinsToAdd} Coin untuk @${buyer.username}? Saldo Coin langsung bertambah otomatis.`;
    if (!(await showConfirm(isProUp ? "ACC Upgrade PRO" : "ACC Top-Up Coin", confirmMsg, "fa-solid fa-coins", "Ya, Setujui"))) return;

    setBtnLoading(btn, true, "Memproses...");
    const nextQuota = Number(buyer.quota || 0) + coinsToAdd;
    const updatedBuyer = Object.assign({}, buyer, {
        quota: nextQuota,
        isPro: isProUp ? true : !!buyer.isPro
    });
    if (typeof recordCoinMutation === "function" && coinsToAdd > 0) {
        recordCoinMutation(
            updatedBuyer,
            coinsToAdd,
            isProUp ? "Bonus Coin Upgrade PRO" : `Top-Up QRIS: ${order.themeName || order.title}`,
            hbMeta ? `Disetujui oleh ${hbMeta.name}` : "Disetujui oleh Founder",
            nextQuota
        );
    }

    await apiAction({ action: "upsert_user", oldUsername: buyer.username, user: updatedBuyer });
    if (typeof ensureUserInLocalDb === "function") ensureUserInLocalDb(updatedBuyer);

    const updOrder = Object.assign({}, order, { status: "Aktif", approvedAt: Date.now(), handledBy: hbMeta });
    await apiAction({
        action: "upsert_portfolio",
        portfolio: updOrder,
        adminActionLog: isProUp
            ? `ACC Upgrade PRO +${coinsToAdd} Coin untuk @${buyer.username}`
            : `ACC Top-Up +${coinsToAdd} Coin untuk @${buyer.username}`
    });
    Object.assign(order, updOrder);
    setBtnLoading(btn, false);
    refreshAfterAdminOrderAction(isProUp
        ? `@${buyer.username} resmi PRO +${coinsToAdd} Coin!`
        : `+${coinsToAdd} Coin ditambahkan ke @${buyer.username}!`);
}

async function approveOrderRevision(kind, id, btn) {
    if (!(await showConfirm("Setujui Revisi", "Versi lama otomatis digantikan versi revisi terbaru. Lanjutkan?", "fa-solid fa-check-double", "Ya, Setujui"))) return;
    setBtnLoading(btn, true, "...");
    await apiAction({ action: kind === "pf" ? "approve_portfolio_revision" : "approve_revision", id });
    refreshAfterAdminOrderAction("Revisi disetujui & aktif!");
}

async function rejectOrderRevision(kind, id, btn) {
    setBtnLoading(btn, true, "...");
    await apiAction({ action: kind === "pf" ? "reject_portfolio_revision" : "reject_revision", id });
    refreshAfterAdminOrderAction("Revisi ditolak, kembali ke versi aktif.");
}

async function deleteOrderItem(kind, id) {
    if (!(await showConfirm("Hapus Proyek", "Hapus berkas ini secara permanen?", "fa-solid fa-trash", "Ya, Hapus"))) return;
    showLoading("Menghapus...");
    await apiAction({ action: kind === "pf" ? "delete_portfolio" : "delete_invitation", id });
    hideLoading();
    refreshAfterAdminOrderAction("Proyek dihapus.");
}

function refreshAfterAdminOrderAction(msg) {
    const u = getCurrentUserObj();
    if (u && u.role === "administrasi") renderStaffAdmin();
    else renderMasterHeaderStats();
    if (document.getElementById("modal-master-workspace") && !document.getElementById("modal-master-workspace").classList.contains("hide")) {
        renderMasterWorkspaceContent();
    }
    if (window._soloStatsViewState && window._soloStatsViewState.open) renderSoloStatsModal();
    if (typeof updateNotificationBellBadge === "function") updateNotificationBellBadge();
    showToast(msg);
}

// ================= 3. WORKSPACE FOUNDER FULL-SCREEN: TEMA, HARGA CV, BANNER & STOK MUSIK =================
function renderMasterThemesGridOnly() {
    const grid = document.getElementById("master-themes-grid");
    const countEl = document.getElementById("master-themes-count");
    if (!grid) return;

    let list = getMergedThemes(masterThemeCatFilter, true);
    if (masterThemeSearch.trim()) {
        const q = masterThemeSearch.trim().toLowerCase();
        list = list.filter(t => String(t.name || "").toLowerCase().includes(q));
    }

    if (countEl) countEl.innerText = String(list.length);

    if (!list.length) {
        grid.innerHTML = `<p class="text-xs app-muted text-center py-8 sm:col-span-2 lg:col-span-3 app-card rounded-2xl border border-dashed">Tidak ada tema yang cocok dengan pencarian "${escHtml(masterThemeSearch)}".</p>`;
        return;
    }

    grid.innerHTML = list.map(t => {
        const cov = getThemeCoverPair(t.cat, t), pr = getThemePricing(t);
        return `<div class="app-card border rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm ${t.isHidden ? "opacity-55 border-dashed" : ""}">
            <div class="flex gap-3 p-3">
                <img src="${cov.src}" ${imgFbAttr(cov.fb)} loading="lazy" class="w-16 h-24 rounded-xl object-cover border gold-border shrink-0 bg-black">
                <div class="flex-1 min-w-0 space-y-1">
                    <div class="flex items-center gap-1 flex-wrap">
                        ${t.isCustom ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-500 font-bold">KUSTOM</span>` : ""}
                        ${t.badge ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-extrabold">${escHtml(t.badge)}</span>` : ""}
                        ${t.isHidden ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-500 font-bold">DISEMBUNYIKAN</span>` : ""}
                    </div>
                    <h4 class="font-bold text-xs truncate">${escHtml(t.name)}</h4>
                    <div class="flex items-center justify-between gap-1 flex-wrap"><p class="text-[11px] font-extrabold app-accent">${pr.hasDisc ? `<span class="line-through app-muted font-normal mr-1">${fmtRp(pr.origPrice)}</span>` : ""}${fmtRp(pr.price)}</p><span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 text-[9.5px] font-extrabold">${typeof buildGoldLembarkuCoinHtml === "function" ? buildGoldLembarkuCoinHtml("sm") : ""}${pr.coinCost} Coin</span></div>
                    <p class="text-[10px] app-muted truncate">${(t.demoData && t.demoData.title) ? `Contoh: ${escHtml(t.demoData.title)}` : "Contoh bawaan"}</p>
                </div>
            </div>
            <div class="grid grid-cols-5 gap-1 p-2 border-t gold-border text-[10px] font-bold">
                <button onclick="openThemeLivePreview('${esc(t.cat)}','${esc(t.name)}')" class="py-1.5 rounded-lg app-btn-sec" title="Preview"><i class="fa-regular fa-eye"></i></button>
                <button onclick="openThemeBuilderModal('${esc(t.cat)}','${esc(t.name)}',false)" class="py-1.5 rounded-lg gold-pill-btn col-span-2"><i class="fa-solid fa-pen mr-1"></i>Edit</button>
                <button onclick="openThemeBuilderModal('${esc(t.cat)}','${esc(t.name)}',true)" class="py-1.5 rounded-lg bg-blue-500/15 text-blue-600" title="Duplikat"><i class="fa-regular fa-copy"></i></button>
                <button onclick="copyThemeDemoLink('${esc(t.cat)}','${esc(t.name)}')" class="py-1.5 rounded-lg bg-emerald-500/15 text-emerald-600" title="Salin Link Demo"><i class="fa-solid fa-link"></i></button>
            </div>
            <div class="px-2 pb-2">
                ${t.isCustom
                    ? `<button onclick="deleteCustomTheme('${esc(t.id)}','${esc(t.name)}')" class="w-full py-1.5 rounded-lg bg-red-600/15 text-red-500 text-[10px] font-bold"><i class="fa-solid fa-trash mr-1"></i>Hapus Permanen</button>`
                    : t.isHidden
                        ? `<button onclick="toggleHideBuiltInTheme('${esc(t.key)}',false)" class="w-full py-1.5 rounded-lg bg-emerald-600/15 text-emerald-600 text-[10px] font-bold">Pulihkan Tema</button>`
                        : `<button onclick="toggleHideBuiltInTheme('${esc(t.key)}',true)" class="w-full py-1.5 rounded-lg bg-red-600/10 text-red-500 text-[10px] font-bold">Sembunyikan</button>`}
            </div>
        </div>`;
    }).join("");
}

function renderMasterWorkspaceContent() {
    const box = document.getElementById("master-workspace-body"); if (!box) return;
    const titleEl = document.getElementById("master-active-panel-title");
    const subEl = document.getElementById("master-active-panel-sub");

    // 1. GRAFIK & ANALITIK BISNIS (DRILL-DOWN 2 LEMBAR)
    if (currentMasterWorkspace === "overview") {
        if (!_masterWsSubPage) {
            if (titleEl) titleEl.innerText = "Grafik & Analitik Bisnis";
            if (subEl) subEl.innerText = "Pilih unit bisnis untuk melihat laporan lengkap";
            box.innerHTML = `
                <div class="max-w-2xl mx-auto space-y-2.5">
                    <p class="text-xs app-muted px-1">Pilih laporan analitik yang ingin dibuka:</p>
                    <button type="button" onclick="openMasterWsSubPage('lembarku')" class="menu-row-card">
                        <span class="menu-row-ic"><i class="fa-solid fa-file-pdf"></i></span>
                        <div class="flex-1 min-w-0">
                            <strong class="text-xs sm:text-sm block">Analitik Bisnis Lembarku &amp; PWA</strong>
                            <span class="text-[10.5px] app-muted block">Omzet undangan, CV/Lamaran, Top-Up Coin &amp; statistik install aplikasi</span>
                        </div>
                        <i class="fa-solid fa-chevron-right text-[10px] app-muted shrink-0"></i>
                    </button>
                    <button type="button" onclick="openMasterWsSubPage('gowes')" class="menu-row-card">
                        <span class="menu-row-ic !bg-emerald-500/15 !text-emerald-600"><i class="fa-solid fa-bicycle"></i></span>
                        <div class="flex-1 min-w-0">
                            <strong class="text-xs sm:text-sm block">Analitik Rental Titik Gowes</strong>
                            <span class="text-[10.5px] app-muted block">Omzet rental (Cash &amp; QRIS), okupansi armada &amp; tren sewa bulanan</span>
                        </div>
                        <i class="fa-solid fa-chevron-right text-[10px] app-muted shrink-0"></i>
                    </button>
                </div>
            `;
            return;
        }
        if (_masterWsSubPage === "gowes") {
            if (titleEl) titleEl.innerText = "Analitik Titik Gowes";
            if (subEl) subEl.innerText = "Omzet sewa sepeda, okupansi & unit terlaris";
            box.innerHTML = typeof buildGowesAnalyticsDashboardHtml === "function" ? buildGowesAnalyticsDashboardHtml() : buildMasterAnalyticsHtml();
            return;
        }
        if (titleEl) titleEl.innerText = "Analitik Lembarku & PWA";
        if (subEl) subEl.innerText = "Omzet digital, tren pesanan & retensi aplikasi";
        box.innerHTML = buildMasterAnalyticsHtml();
        return;
    }

    // 2. KELOLA GERAI & ARMADA GOWES (DRILL-DOWN DARI js/gowes-admin.js)
    if (currentMasterWorkspace === "gowes_fleet") {
        if (typeof renderGowesFleetWorkspaceHtml === "function") {
            box.innerHTML = renderGowesFleetWorkspaceHtml();
        }
        return;
    }

    // 3. KELOLA TEMA, HARGA, COIN & VOUCHER (DRILL-DOWN 4 LEMBAR TERPISAH)
    if (currentMasterWorkspace === "themes") {
        if (!_masterWsSubPage) {
            if (titleEl) titleEl.innerText = "Kelola Tema, Harga & Promo";
            if (subEl) subEl.innerText = "Pilih kategori pengaturan di bawah ini";
            const vCount = (typeof getVouchersList === "function" ? getVouchersList() : []).length;
            const pCount = (typeof getCoinPackagesList === "function" ? getCoinPackagesList() : []).length;
            box.innerHTML = `
                <div class="max-w-2xl mx-auto space-y-2.5">
                    <p class="text-xs app-muted px-1">Setiap pengaturan terbuka di lembarnya sendiri agar rapi dan fokus:</p>
                    <button type="button" onclick="openMasterWsSubPage('inv_themes')" class="menu-row-card">
                        <span class="menu-row-ic"><i class="fa-solid fa-envelope-open-text"></i></span>
                        <div class="flex-1 min-w-0">
                            <strong class="text-xs sm:text-sm block">Tema Undangan Digital</strong>
                            <span class="text-[10.5px] app-muted block">Foto template, nama contoh, harga eceran &amp; tarif Coin per tema</span>
                        </div>
                        <i class="fa-solid fa-chevron-right text-[10px] app-muted shrink-0"></i>
                    </button>
                    <button type="button" onclick="openMasterWsSubPage('pf_themes')" class="menu-row-card">
                        <span class="menu-row-ic !bg-emerald-500/15 !text-emerald-600"><i class="fa-solid fa-id-card"></i></span>
                        <div class="flex-1 min-w-0">
                            <strong class="text-xs sm:text-sm block">Desain CV &amp; Surat Lamaran</strong>
                            <span class="text-[10.5px] app-muted block">Atur harga coret, harga jual &amp; tarif Coin untuk 12 desain</span>
                        </div>
                        <i class="fa-solid fa-chevron-right text-[10px] app-muted shrink-0"></i>
                    </button>
                    <button type="button" onclick="openMasterWsSubPage('coin_pro')" class="menu-row-card">
                        <span class="menu-row-ic !bg-amber-500/15 !text-amber-600"><i class="fa-solid fa-coins"></i></span>
                        <div class="flex-1 min-w-0">
                            <strong class="text-xs sm:text-sm block">Pricelist Coin &amp; Harga Upgrade PRO</strong>
                            <span class="text-[10.5px] app-muted block">${pCount} paket isi ulang Coin &amp; biaya/bonus Upgrade PRO</span>
                        </div>
                        <i class="fa-solid fa-chevron-right text-[10px] app-muted shrink-0"></i>
                    </button>
                    <button type="button" onclick="openMasterWsSubPage('vouchers')" class="menu-row-card">
                        <span class="menu-row-ic !bg-purple-500/15 !text-purple-600"><i class="fa-solid fa-ticket"></i></span>
                        <div class="flex-1 min-w-0">
                            <strong class="text-xs sm:text-sm block">Kode Voucher &amp; Diskon Musiman</strong>
                            <span class="text-[10.5px] app-muted block">${vCount} kode kupon promo untuk pelanggan umum &amp; Titik Gowes</span>
                        </div>
                        <i class="fa-solid fa-chevron-right text-[10px] app-muted shrink-0"></i>
                    </button>
                </div>
            `;
            return;
        }

        // LEMBAR ANAK 3A: PRICELIST COIN & UPGRADE PRO
        if (_masterWsSubPage === "coin_pro") {
            if (titleEl) titleEl.innerText = "Pricelist Coin & Upgrade PRO";
            if (subEl) subEl.innerText = "Atur harga paket Coin, bonus & biaya Upgrade PRO";
            const pkgs = typeof getCoinPackagesList === "function" ? getCoinPackagesList() : [];
            const proCfg = typeof getProUpgradeConfig === "function" ? getProUpgradeConfig() : { price: 49000, bonusCoins: 5 };
            box.innerHTML = `<div class="space-y-4">
                <div class="app-card border rounded-3xl p-4 sm:p-5 space-y-3 shadow-sm">
                    <div class="flex items-center gap-2.5 border-b gold-border pb-2.5">
                        <span class="w-9 h-9 rounded-2xl bg-blue-600/15 text-blue-600 flex items-center justify-center text-base shrink-0"><i class="fa-solid fa-circle-check"></i></span>
                        <div>
                            <h4 class="font-extrabold text-sm">Pengaturan Upgrade Akun PRO (User Biasa)</h4>
                            <p class="text-[10.5px] app-muted">Biaya sekali bayar &amp; Bonus Coin Perdana saat user biasa upgrade ke PRO.</p>
                        </div>
                    </div>
                    <div class="grid sm:grid-cols-2 gap-3">
                        <div>
                            <label class="app-label">Harga Upgrade PRO (Rp)</label>
                            <input type="number" id="mpro-price" value="${proCfg.price}" step="1000" min="1000" class="app-input font-extrabold">
                        </div>
                        <div>
                            <label class="app-label text-amber-600">Bonus Coin Perdana (Coin)</label>
                            <input type="number" id="mpro-bonus-coins" value="${proCfg.bonusCoins}" step="1" min="0" class="app-input font-extrabold text-amber-600">
                        </div>
                    </div>
                </div>

                <div class="app-card border rounded-3xl p-4 sm:p-5 space-y-3 shadow-sm">
                    <div class="flex flex-wrap items-center justify-between gap-2 border-b gold-border pb-2.5">
                        <div class="flex items-center gap-2.5">
                            ${typeof buildGoldLembarkuCoinHtml === "function" ? buildGoldLembarkuCoinHtml("md") : ""}
                            <div>
                                <h4 class="font-extrabold text-sm">Pricelist Paket Isi Ulang Coin</h4>
                                <p class="text-[10.5px] app-muted">Ubah harga, Coin dasar, bonus, atau tambah paket baru sesuai kebutuhan.</p>
                            </div>
                        </div>
                        <button type="button" onclick="addMasterCoinPackageRow()" class="px-3 py-1.5 rounded-xl app-card-soft border app-accent text-xs font-bold"><i class="fa-solid fa-plus mr-1"></i>Tambah Paket</button>
                    </div>
                    <div id="master-coin-pkgs-grid" class="grid sm:grid-cols-2 gap-3">
                        ${pkgs.map((pk, idx) => _buildMasterCoinPkgRowHtml(pk, idx)).join("")}
                    </div>
                    <div class="flex justify-end pt-1">
                        <button type="button" id="btn-save-coin-pkgs" onclick="saveMasterCoinPackages(this)" class="gold-pill-btn px-6 py-2.5 rounded-xl text-xs uppercase shadow">Simpan Pricelist Coin &amp; PRO</button>
                    </div>
                </div>
            </div>`;
            return;
        }

        // LEMBAR ANAK 3B: KODE VOUCHER PROMO
        if (_masterWsSubPage === "vouchers") {
            if (titleEl) titleEl.innerText = "Kode Voucher & Diskon";
            if (subEl) subEl.innerText = "Kelola kupon promo musiman untuk pelanggan umum";
            const vouchers = typeof getVouchersList === "function" ? getVouchersList() : [];
            const scopeLabels = { all: "Semua Layanan", inv: "Undangan Digital", pf: "CV & Lamaran", gowes: "Titik Gowes" };
            box.innerHTML = `<div class="grid md:grid-cols-2 gap-5">
                <form onsubmit="savePromoVoucherForm(event)" class="app-card border rounded-3xl p-4 sm:p-5 space-y-3 shadow-sm h-fit">
                    <div class="flex items-center justify-between border-b gold-border pb-2">
                        <h4 class="font-extrabold text-sm app-accent"><i class="fa-solid fa-ticket mr-1.5"></i>Buat / Edit Kode Voucher</h4>
                        <button type="button" onclick="resetPromoVoucherForm()" class="text-[11px] app-muted hover:underline">Reset</button>
                    </div>
                    <input type="hidden" id="vch-id">
                    <div class="grid grid-cols-2 gap-2.5">
                        <div>
                            <label class="app-label">Kode Kupon</label>
                            <input type="text" id="vch-code" placeholder="NIKAH2027" class="app-input uppercase font-extrabold" required>
                        </div>
                        <div>
                            <label class="app-label">Berlaku Untuk</label>
                            <select id="vch-scope" class="app-input font-bold">
                                <option value="all">Semua Layanan</option>
                                <option value="inv">Undangan Digital</option>
                                <option value="pf">CV &amp; Surat Lamaran</option>
                                <option value="gowes">Titik Gowes</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2.5">
                        <div>
                            <label class="app-label">Jenis Potongan</label>
                            <select id="vch-type" class="app-input font-bold">
                                <option value="fixed">Potongan Rupiah (Rp)</option>
                                <option value="percent">Persentase (%)</option>
                            </select>
                        </div>
                        <div>
                            <label class="app-label">Nilai Potongan</label>
                            <input type="number" id="vch-value" value="15000" min="1" class="app-input font-extrabold" required>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2.5">
                        <div>
                            <label class="app-label">Kuota Pemakaian (0=Bebas)</label>
                            <input type="number" id="vch-max-uses" value="50" min="0" class="app-input">
                        </div>
                        <div>
                            <label class="app-label">Berlaku Sampai</label>
                            <input type="date" id="vch-expires" value="2027-12-31" class="app-input">
                        </div>
                    </div>
                    <div>
                        <label class="app-label">Keterangan Promo (Opsional)</label>
                        <input type="text" id="vch-label" placeholder="Misal: Promo Spesial Akhir Tahun" class="app-input">
                    </div>
                    <label class="flex items-center gap-2 text-xs font-bold cursor-pointer">
                        <input type="checkbox" id="vch-active" checked class="w-4 h-4 accent-blue-600"> Voucher Aktif
                    </label>
                    <button type="submit" id="btn-save-vch" class="w-full gold-pill-btn py-2.5 rounded-xl text-xs uppercase shadow">Simpan Voucher</button>
                </form>

                <div class="space-y-2.5">
                    <h4 class="font-bold text-xs app-accent uppercase">Daftar Voucher (${vouchers.length})</h4>
                    ${vouchers.length ? vouchers.map((v, i) => `
                        <div class="app-card border rounded-2xl p-3.5 shadow-sm space-y-2 ${v.active === false ? "opacity-60" : ""}">
                            <div class="flex items-start justify-between gap-2">
                                <div class="min-w-0">
                                    <div class="flex items-center gap-1.5 flex-wrap">
                                        <span class="px-2.5 py-0.5 rounded-lg bg-purple-600/15 text-purple-600 font-mono font-extrabold text-xs">${escHtml(v.code)}</span>
                                        <span class="text-[9px] px-2 py-0.5 rounded-full font-bold ${v.active !== false ? "bg-emerald-500/15 text-emerald-600" : "bg-zinc-500/20 app-muted"}">${v.active !== false ? "AKTIF" : "NONAKTIF"}</span>
                                    </div>
                                    <p class="text-xs font-bold mt-1">${v.type === "percent" ? `Diskon ${v.value}%` : `Potongan ${fmtRp(v.value)}`} • ${escHtml(scopeLabels[v.scope] || "Semua")}</p>
                                    <p class="text-[10px] app-muted">${escHtml(v.label || "Promo")} • s/d ${escHtml(v.expiresAt || "Selamanya")}${Number(v.maxUses || 0) > 0 ? ` • Kuota: ${v.usedCount || 0}/${v.maxUses}` : ""}</p>
                                </div>
                                <div class="flex items-center gap-1 shrink-0">
                                    <button type="button" onclick="editPromoVoucherItem(${i})" class="px-2.5 py-1.5 rounded-lg app-btn-sec text-[10px] font-bold">Edit</button>
                                    <button type="button" onclick="deletePromoVoucherItem(${i})" class="px-2 py-1.5 rounded-lg bg-red-600/15 text-red-500 text-[10px]"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                        </div>
                    `).join("") : '<p class="text-xs app-muted app-card border border-dashed rounded-2xl p-6 text-center">Belum ada kode voucher promo.</p>'}
                </div>
            </div>`;
            return;
        }

        // LEMBAR ANAK 3C: DESAIN CV & SURAT LAMARAN
        if (_masterWsSubPage === "pf_themes") {
            if (titleEl) titleEl.innerText = "Desain CV & Surat Lamaran";
            if (subEl) subEl.innerText = "Atur harga coret, harga jual & Coin Cabang";
            const allPf = [
                ...PORTFOLIO_CATALOG.cv.map(x => Object.assign({}, getPortfolioThemeObj("cv", x.id), { _dt: "cv" })),
                ...PORTFOLIO_CATALOG.lamaran.map(x => Object.assign({}, getPortfolioThemeObj("lamaran", x.id), { _dt: "lamaran" }))
            ];
            box.innerHTML = `<div class="space-y-4">
                <p class="text-xs app-muted">Atur harga normal (coret), harga jual eceran, dan <strong>besaran Coin</strong> untuk tiap desain CV &amp; Surat Lamaran:</p>
                <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">${allPf.map(p => `
                    <div class="app-card border rounded-2xl p-3.5 space-y-2.5 shadow-sm">
                        <div class="flex items-center justify-between gap-2">
                            <div><span class="text-[9px] px-2 py-0.5 rounded-full app-accent-bg app-accent font-extrabold uppercase">${p._dt === "lamaran" ? "Lamaran" : "CV"}</span><h4 class="font-bold text-xs mt-1">${escHtml(p.name)}</h4></div>
                            <button type="button" onclick="openPortfolioDemoPreview('${p._dt}','${p.id}')" class="px-2.5 py-1 rounded-lg app-btn-sec text-[10px] font-bold"><i class="fa-regular fa-eye"></i></button>
                        </div>
                        <div class="grid grid-cols-3 gap-2">
                            <div><label class="text-[10px] app-muted block">Harga Coret</label><input type="number" id="cvp-orig-${p.id}" value="${p.origPrice||35000}" step="1000" class="app-input !py-1.5 text-xs"></div>
                            <div><label class="text-[10px] app-muted block">Harga Jual</label><input type="number" id="cvp-sell-${p.id}" value="${p.price||20000}" step="1000" class="app-input !py-1.5 text-xs font-bold"></div>
                            <div><label class="text-[10px] text-amber-600 font-bold block">Coin</label><input type="number" id="cvp-coin-${p.id}" value="${getPortfolioCoinCost(p._dt, p)}" min="1" step="1" class="app-input !py-1.5 text-xs font-extrabold text-amber-600"></div>
                        </div>
                        <button type="button" onclick="saveCvThemePrice('${p.id}','${p._dt}',this)" class="w-full gold-pill-btn py-1.5 rounded-xl text-[11px]">Simpan Harga &amp; Coin</button>
                    </div>
                `).join("")}</div>
            </div>`;
            return;
        }

        // LEMBAR ANAK 3D: TEMA UNDANGAN DIGITAL
        if (titleEl) titleEl.innerText = "Tema Undangan Digital";
        if (subEl) subEl.innerText = "Edit desain, foto template, harga & besaran Coin";
        const invCats = Object.keys(THEME_CATALOG);
        if (!invCats.includes(masterThemeCatFilter)) masterThemeCatFilter = invCats[0];
        box.innerHTML = `<div class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2.5">
                <div class="flex flex-wrap gap-1.5">${invCats.map(c => `<button type="button" onclick="masterThemeCatFilter='${c}';renderMasterWorkspaceContent();" class="px-3 py-1.5 rounded-xl text-[11px] font-bold ${masterThemeCatFilter===c?"gold-pill-btn":"app-btn-sec"}">${c}</button>`).join("")}</div>
                <button type="button" onclick="openThemeBuilderModal(null,null,false)" class="gold-pill-btn px-4 py-2 rounded-xl text-xs shadow"><i class="fa-solid fa-plus mr-1"></i>Buat Tema Baru</button>
            </div>
            <div class="flex flex-col sm:flex-row gap-2 items-center justify-between">
                <input type="text" id="master-theme-search-inp" value="${esc(masterThemeSearch)}" oninput="masterThemeSearch=this.value;renderMasterThemesGridOnly();" placeholder="Cari nama tema..." class="app-input !py-2 sm:max-w-xs">
                <span class="text-[11px] app-muted"><strong id="master-themes-count">0</strong> tema di ${escHtml(masterThemeCatFilter)} • Klik <strong>Edit</strong> untuk atur foto, harga &amp; Coin.</span>
            </div>
            <div id="master-themes-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"></div>
        </div>`;
        renderMasterThemesGridOnly();
        return;
    }

    // 4. KONTEN & MEDIA BERANDA (DRILL-DOWN 3 LEMBAR TERPISAH)
    if (currentMasterWorkspace === "content_media" || currentMasterWorkspace === "home_editor" || currentMasterWorkspace === "media") {
        const banners = db.promoBanners || [];
        const songs = db.musicLibrary || [];
        const testis = db.testimonials || [];

        if (!_masterWsSubPage) {
            if (titleEl) titleEl.innerText = "Konten & Media Beranda";
            if (subEl) subEl.innerText = "Pilih bagian konten beranda yang ingin diatur";
            box.innerHTML = `
                <div class="max-w-2xl mx-auto space-y-2.5">
                    <p class="text-xs app-muted px-1">Pilih konten yang ingin dikelola pada lembar tersendiri:</p>
                    <button type="button" onclick="openMasterWsSubPage('banners')" class="menu-row-card">
                        <span class="menu-row-ic"><i class="fa-solid fa-rectangle-ad"></i></span>
                        <div class="flex-1 min-w-0">
                            <strong class="text-xs sm:text-sm block">Banner Promosi Beranda (12:4.4)</strong>
                            <span class="text-[10.5px] app-muted block">${banners.length} slide banner promosi aktif</span>
                        </div>
                        <i class="fa-solid fa-chevron-right text-[10px] app-muted shrink-0"></i>
                    </button>
                    <button type="button" onclick="openMasterWsSubPage('songs')" class="menu-row-card">
                        <span class="menu-row-ic !bg-emerald-500/15 !text-emerald-600"><i class="fa-solid fa-music"></i></span>
                        <div class="flex-1 min-w-0">
                            <strong class="text-xs sm:text-sm block">Stok Lagu Website</strong>
                            <span class="text-[10.5px] app-muted block">${songs.length} lagu tersedia untuk backsound undangan</span>
                        </div>
                        <i class="fa-solid fa-chevron-right text-[10px] app-muted shrink-0"></i>
                    </button>
                    <button type="button" onclick="openMasterWsSubPage('testimonials')" class="menu-row-card">
                        <span class="menu-row-ic !bg-amber-500/15 !text-amber-600"><i class="fa-solid fa-star"></i></span>
                        <div class="flex-1 min-w-0">
                            <strong class="text-xs sm:text-sm block">Testimoni Pelanggan Beranda</strong>
                            <span class="text-[10.5px] app-muted block">${testis.length} ulasan tampil di slideshow beranda</span>
                        </div>
                        <i class="fa-solid fa-chevron-right text-[10px] app-muted shrink-0"></i>
                    </button>
                </div>
            `;
            return;
        }

        if (_masterWsSubPage === "banners") {
            if (titleEl) titleEl.innerText = "Banner Promosi Beranda";
            if (subEl) subEl.innerText = `${banners.length} slide banner rasio 12:4.4`;
            box.innerHTML = `<div class="grid md:grid-cols-2 gap-6">
                <form onsubmit="savePromoBannerForm(event)" class="app-card p-4 rounded-3xl border space-y-2.5 shadow-sm">
                    <div class="flex justify-between items-center">
                        <h4 class="font-bold text-sm app-accent">Edit Banner Promosi (Rasio 12 : 4.4 Full)</h4>
                        <button type="button" onclick="resetPromoBannerForm()" class="text-[11px] app-muted hover:underline">Reset</button>
                    </div>
                    <input type="hidden" id="pb-id">
                    <div class="w-full rounded-xl overflow-hidden border gold-border bg-black" style="aspect-ratio:12/4.4;">
                        <img id="pb-preview-img" src="${(banners[0] && banners[0].img) || IMG("1519741497674-611481863552")}" class="w-full h-full object-cover">
                    </div>
                    <label class="block gold-pill-btn py-2 rounded-xl text-center cursor-pointer text-xs"><i class="fa-solid fa-crop-simple mr-1"></i>Pilih &amp; Crop Foto Banner (12 : 4.4)<input type="file" accept="image/*" class="hide" onchange="pickCroppedPromoBanner(this)"></label>
                    <div class="grid grid-cols-2 gap-2">
                        <input type="text" id="pb-badge" placeholder="Label (PROMO SPESIAL)" class="app-input">
                        <input type="text" id="pb-cta" placeholder="Teks Tombol (Lihat Promo)" class="app-input">
                    </div>
                    <input type="text" id="pb-title" placeholder="Judul Promosi Menarik" class="app-input" required>
                    <input type="text" id="pb-sub" placeholder="Penjelasan singkat promosi..." class="app-input" required>
                    <select id="pb-target" class="app-input">
                        <option value="sec-undangan">Arahkan ke Etalase Undangan</option>
                        <option value="sec-portofolio">Arahkan ke Etalase CV &amp; Lamaran</option>
                        <option value="sec-sertifikat">Arahkan ke Etalase Sertifikat</option>
                        <option value="gowes">Arahkan ke Layanan Titik Gowes</option>
                        <option value="login">Arahkan ke Popup Daftar / Masuk</option>
                        <option value="chat">Arahkan ke Live Chat Admin</option>
                    </select>
                    <input type="url" id="pb-img-url" oninput="if(this.value.startsWith('http'))document.getElementById('pb-preview-img').src=this.value;" placeholder="Atau tempel URL foto banner (https://...)" class="app-input">
                    <button type="submit" id="btn-save-pb" class="w-full gold-pill-btn py-2.5 rounded-xl text-xs">Simpan Banner Promosi</button>
                </form>
                <div class="space-y-2.5">
                    <h4 class="font-bold text-xs app-accent uppercase">Daftar Slide Banner Aktif (${banners.length})</h4>
                    ${banners.map((b, i) => `<div class="app-card border rounded-2xl p-2.5 flex items-center gap-3 shadow-sm">
                        <img src="${b.img}" class="w-24 h-10 rounded-lg object-cover bg-black shrink-0">
                        <div class="flex-1 min-w-0"><strong class="text-xs block truncate">${escHtml(b.title)}</strong><span class="text-[10px] app-muted block truncate">${escHtml(b.badge || "Promo")} • ${escHtml(b.subtitle || "")}</span></div>
                        <button type="button" onclick="editPromoBannerItem(${i})" class="px-2.5 py-1 rounded app-btn-sec text-[10px] font-bold">Edit</button>
                        <button type="button" onclick="deletePromoBannerItem(${i})" class="px-2.5 py-1 rounded bg-red-600/15 text-[10px] text-red-500"><i class="fa-solid fa-trash"></i></button>
                    </div>`).join("")}
                </div>
            </div>`;
            return;
        }

        if (_masterWsSubPage === "songs") {
            if (titleEl) titleEl.innerText = "Stok Lagu Website";
            if (subEl) subEl.innerText = `${songs.length} lagu backsound undangan`;
            box.innerHTML = `<div class="max-w-2xl mx-auto space-y-4">
                <div class="app-card p-4 rounded-3xl border space-y-3 shadow-sm">
                    <div class="flex items-center justify-between">
                        <h4 class="font-bold text-sm app-accent"><i class="fa-solid fa-music mr-1.5"></i>Tambah Lagu Baru</h4>
                        <span class="text-[10px] app-muted font-semibold">${songs.length} Lagu</span>
                    </div>
                    <label class="block gold-pill-btn py-3 px-4 rounded-2xl text-center cursor-pointer text-xs shadow-md">
                        <i class="fa-solid fa-upload mr-1.5"></i>Upload File Musik dari Perangkat (MP3/WAV/M4A)
                        <input type="file" accept="audio/*" class="hide" onchange="openAudioCropperFromInput(this,'library')">
                    </label>
                    <p class="text-[10px] app-muted leading-relaxed">Lagu dari perangkat Anda bisa langsung dipotong bagian terbaiknya (30–90 dtk), dikompresi otomatis ke MP3 ringan, dan tersimpan ke Google Drive Stok Lagu.</p>

                    <form onsubmit="addStockSong(event)" class="pt-2.5 border-t gold-border space-y-2">
                        <span class="text-[10px] font-bold uppercase app-muted block">Atau Tambah Manual via Link MP3:</span>
                        <div class="grid grid-cols-2 gap-2">
                            <input type="text" id="song-title" placeholder="Judul Lagu" class="app-input !py-2 text-xs" required>
                            <input type="text" id="song-cat" placeholder="Kategori (Pernikahan)" class="app-input !py-2 text-xs" required>
                        </div>
                        <input type="url" id="song-url" placeholder="Link MP3 (https://.../lagu.mp3)" class="app-input !py-2 text-xs" required>
                        <button id="btn-add-song" class="w-full app-btn-sec py-2 rounded-xl text-xs font-bold">+ Tambah dari Link</button>
                    </form>
                </div>

                <div class="space-y-2">${songs.map((m, i) => `
                    <div class="app-card border rounded-2xl p-3 flex justify-between items-center gap-2 text-xs shadow-sm">
                        <button type="button" data-stock-play-btn="${i}" onclick="toggleAdminStockSongPreview(${i},this)" class="w-8 h-8 rounded-full app-accent-bg border gold-border app-accent flex items-center justify-center shrink-0 text-[11px]" title="Putar Preview">
                            <i class="fa-solid fa-play"></i>
                        </button>
                        <div class="flex-1 min-w-0">
                            <strong class="block truncate">${escHtml(m.title)}</strong>
                            <span class="block text-[10px] app-accent truncate">${escHtml(m.category)}</span>
                        </div>
                        <button type="button" onclick="delStockSong(${i})" class="w-8 h-8 rounded-xl bg-red-600/12 text-red-500 flex items-center justify-center shrink-0" title="Hapus Lagu"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `).join("") || '<p class="text-xs app-muted text-center py-4">Belum ada stok lagu.</p>'}</div>
            </div>`;
            return;
        }

        if (titleEl) titleEl.innerText = "Testimoni Pelanggan";
        if (subEl) subEl.innerText = `${testis.length} ulasan aktif di Beranda`;
        box.innerHTML = `<div class="max-w-2xl mx-auto space-y-4">
            <form onsubmit="addTestimonial(event)" class="app-card p-4 rounded-3xl border space-y-2.5 shadow-sm">
                <h4 class="font-bold text-sm app-accent"><i class="fa-solid fa-star mr-1.5"></i>Tambah Testimoni Beranda</h4>
                <input type="text" id="t-name" placeholder="Nama Pelanggan" class="app-input" required>
                <input type="text" id="t-cat" placeholder="Kategori (Undangan / CV & Lamaran / Titik Gowes)" class="app-input" required>
                <textarea id="t-text" placeholder="Isi testimoni..." class="app-input h-20" required></textarea>
                <button id="btn-add-testi" class="w-full gold-pill-btn py-2.5 rounded-xl text-xs">+ Tampilkan di Slideshow</button>
            </form>
            <div class="space-y-2">${testis.map((t, i) => `<div class="app-card border rounded-2xl p-3 flex justify-between items-center text-xs gap-2 shadow-sm"><div><strong>${escHtml(t.name)}</strong> <span class="text-[10px] app-accent">(${escHtml(t.category)})</span><p class="text-[11px] app-muted mt-0.5">${escHtml(t.text)}</p></div><button onclick="delTestimonial(${i})" class="text-red-500 px-2"><i class="fa-solid fa-trash"></i></button></div>`).join("")}</div>
        </div>`;
        return;
    }
}

function _buildMasterCoinPkgRowHtml(pk, idx) {
    const totalC = Number(pk.paidCoins || 0) + Number(pk.bonusCoins || 0);
    const eff = Math.round(Number(pk.price || 0) / Math.max(1, totalC));
    return `
        <div class="app-card-soft border rounded-2xl p-3.5 space-y-2.5 coin-pkg-row" data-pkg-id="${esc(pk.id || ("pkg_" + idx))}">
            <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-extrabold uppercase text-amber-600">Paket #${idx + 1} • ${totalC} Coin (${fmtRp(eff)}/Coin)</span>
                <button type="button" onclick="removeMasterCoinPackageRow(this)" class="w-6 h-6 rounded-lg bg-red-600/15 text-red-500 text-[10px]" title="Hapus Paket"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div><label class="text-[10px] app-muted block">Nama Paket</label><input type="text" value="${esc(pk.name || "")}" class="cpk-name app-input !py-1.5 text-xs font-bold"></div>
                <div><label class="text-[10px] app-muted block">Label (Opsional)</label><input type="text" value="${esc(pk.badge || "")}" placeholder="TERLARIS" class="cpk-badge app-input !py-1.5 text-xs"></div>
            </div>
            <div class="grid grid-cols-3 gap-2">
                <div><label class="text-[10px] app-muted block">Harga (Rp)</label><input type="number" value="${pk.price || 100000}" step="10000" min="1000" class="cpk-price app-input !py-1.5 text-xs font-bold"></div>
                <div><label class="text-[10px] app-muted block">Coin Dasar</label><input type="number" value="${pk.paidCoins || 20}" min="1" class="cpk-paid app-input !py-1.5 text-xs font-bold text-amber-600"></div>
                <div><label class="text-[10px] app-muted block">Bonus Coin</label><input type="number" value="${pk.bonusCoins || 0}" min="0" class="cpk-bonus app-input !py-1.5 text-xs font-bold text-emerald-600"></div>
            </div>
        </div>
    `;
}

function addMasterCoinPackageRow() {
    const grid = document.getElementById("master-coin-pkgs-grid"); if (!grid) return;
    const idx = grid.querySelectorAll(".coin-pkg-row").length;
    const div = document.createElement("div");
    div.innerHTML = _buildMasterCoinPkgRowHtml({ id: "pkg_" + Date.now(), name: "Paket Baru", badge: "", price: 150000, paidCoins: 30, bonusCoins: 3 }, idx);
    grid.appendChild(div.firstElementChild);
}

function removeMasterCoinPackageRow(btn) {
    const rows = document.querySelectorAll(".coin-pkg-row");
    if (rows.length <= 1) return showToast("Minimal harus menyisakan 1 paket Coin.", "info");
    btn.closest(".coin-pkg-row")?.remove();
}

function resetPromoVoucherForm() {
    ["vch-id", "vch-code", "vch-label"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    const tEl = document.getElementById("vch-type"); if (tEl) tEl.value = "fixed";
    const sEl = document.getElementById("vch-scope"); if (sEl) sEl.value = "all";
    const vEl = document.getElementById("vch-value"); if (vEl) vEl.value = "15000";
    const mEl = document.getElementById("vch-max-uses"); if (mEl) mEl.value = "50";
    const eEl = document.getElementById("vch-expires"); if (eEl) eEl.value = "2027-12-31";
    const aEl = document.getElementById("vch-active"); if (aEl) aEl.checked = true;
}

function editPromoVoucherItem(idx) {
    const v = (typeof getVouchersList === "function" ? getVouchersList() : [])[idx];
    if (!v) return;
    document.getElementById("vch-id").value = v.id || "";
    document.getElementById("vch-code").value = v.code || "";
    document.getElementById("vch-scope").value = v.scope || "all";
    document.getElementById("vch-type").value = v.type || "fixed";
    document.getElementById("vch-value").value = v.value || 10000;
    document.getElementById("vch-max-uses").value = v.maxUses || 0;
    document.getElementById("vch-expires").value = v.expiresAt || "2027-12-31";
    document.getElementById("vch-label").value = v.label || "";
    document.getElementById("vch-active").checked = v.active !== false;
    showToast(`Mengedit voucher ${v.code}`, "info");
}

async function savePromoVoucherForm(e) {
    e.preventDefault();
    const idVal = (document.getElementById("vch-id")?.value || "").trim();
    const code = (document.getElementById("vch-code")?.value || "").trim().toUpperCase().replace(/\s+/g, "");
    if (!code) return showToast("Kode voucher wajib diisi.", "error");

    const list = [...(typeof getVouchersList === "function" ? getVouchersList() : [])];
    const existing = list.find(x => String(x.id) === idVal);
    const item = {
        id: idVal || ("vch_" + Date.now()),
        code,
        scope: document.getElementById("vch-scope")?.value || "all",
        type: document.getElementById("vch-type")?.value || "fixed",
        value: Math.max(1, Math.round(Number(document.getElementById("vch-value")?.value || 10000))),
        maxUses: Math.max(0, Math.round(Number(document.getElementById("vch-max-uses")?.value || 0))),
        usedCount: existing ? Number(existing.usedCount || 0) : 0,
        expiresAt: (document.getElementById("vch-expires")?.value || "").trim(),
        label: (document.getElementById("vch-label")?.value || "").trim(),
        active: !!document.getElementById("vch-active")?.checked
    };

    const idx = list.findIndex(x => String(x.id) === String(item.id) || String(x.code || "").toUpperCase() === code);
    if (idx >= 0) list[idx] = item; else list.unshift(item);

    setBtnLoading("btn-save-vch", true, "Menyimpan...");
    const nextMs = Object.assign({}, db.masterSettings || {}, { vouchers: list });
    db.masterSettings = nextMs;
    idbSet("db_snapshot", db);
    await apiAction({ action: "update_section", section: "masterSettings", value: nextMs });
    setBtnLoading("btn-save-vch", false);
    renderMasterWorkspaceContent();
    showToast(`Voucher ${code} tersimpan permanen!`);
}

async function deletePromoVoucherItem(idx) {
    const list = [...(typeof getVouchersList === "function" ? getVouchersList() : [])];
    if (!list[idx]) return;
    if (!(await showConfirm("Hapus Voucher", `Hapus kode voucher "${list[idx].code}"?`, "fa-solid fa-trash", "Ya, Hapus"))) return;
    list.splice(idx, 1);
    const nextMs = Object.assign({}, db.masterSettings || {}, { vouchers: list });
    db.masterSettings = nextMs;
    idbSet("db_snapshot", db);
    showLoading("Menghapus voucher...");
    await apiAction({ action: "update_section", section: "masterSettings", value: nextMs });
    hideLoading();
    renderMasterWorkspaceContent();
    showToast("Voucher dihapus.", "info");
}

// ================= 4. BERANDA PROFIL PUBLIK & DETAIL TERPISAH =================
function openExpandedAvatarLightbox(imgSrc, labelText = "") {
    const src = imgSrc || DEFAULT_AVATAR;
    let box = document.getElementById("expanded-avatar-overlay");
    if (!box) {
        box = document.createElement("div");
        box.id = "expanded-avatar-overlay";
        box.className = "hide fixed inset-0 z-[150] bg-black/95 flex flex-col items-center justify-center p-4";
        box.onclick = function () { closeExpandedAvatarLightbox(); };
        document.body.appendChild(box);
    }
    box.innerHTML = `
        <button type="button" onclick="closeExpandedAvatarLightbox()" class="fixed top-5 right-5 z-20 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center text-base hover:bg-white/25"><i class="fa-solid fa-xmark"></i></button>
        <div id="avatar-zoom-stage" data-pinch-zoom="1" onclick="event.stopPropagation();" class="selective-zoom-stage w-full max-w-lg flex flex-col items-center justify-center gap-3 overflow-hidden p-2">
            <img id="avatar-zoom-img" src="${src}" alt="Foto Profil" class="selective-zoom-target w-full max-h-[75vh] object-contain rounded-3xl border-2 border-white/25 shadow-2xl bg-zinc-900">
            ${labelText ? `<span class="text-xs text-white/85 font-semibold">${escHtml(labelText)} • Cubit / ketuk 2x untuk zoom</span>` : `<span class="text-[10px] text-white/70">Cubit / ketuk 2x untuk zoom</span>`}
        </div>
    `;
    box.classList.remove("hide");
    if (typeof attachSelectivePinchZoom === "function") {
        attachSelectivePinchZoom(document.getElementById("avatar-zoom-stage"), document.getElementById("avatar-zoom-img"));
    }
    _pushAdminNavStep({ type: "avatar_lightbox" });
}

function closeExpandedAvatarLightbox() {
    const box = document.getElementById("expanded-avatar-overlay");
    if (box) box.classList.add("hide");
    if (Array.isArray(window._mrNavStack) && window._mrNavStack.length > 1) {
        const top = window._mrNavStack[window._mrNavStack.length - 1];
        if (top && top.type === "avatar_lightbox") window._mrNavStack.pop();
    }
}

function _ensureSoloStatsModal() {
    let mod = document.getElementById("solo-profile-stats-modal");
    if (!mod) {
        mod = document.createElement("div");
        mod.id = "solo-profile-stats-modal";
        mod.className = "hide fixed inset-0 z-[145] bg-[var(--app-bg)] flex flex-col overflow-hidden";
        mod.innerHTML = `
            <div class="lbk-fs-header px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
                <div class="flex items-center gap-2.5 min-w-0">
                    <button type="button" onclick="_adminStepBackOrClose(closeSoloStatsModal)" class="w-9 h-9 rounded-full app-btn-sec flex items-center justify-center text-xs shrink-0 active:scale-95 transition" title="Kembali">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <div class="min-w-0">
                        <h3 id="solo-stats-title" class="font-extrabold text-base sm:text-lg truncate">Detail</h3>
                        <p id="solo-stats-sub" class="text-[10px] app-muted truncate"></p>
                    </div>
                </div>
                <button type="button" onclick="closeSoloStatsModal()" class="px-4 py-1.5 rounded-full app-btn-sec text-xs font-bold shrink-0">Selesai</button>
            </div>
            <div id="solo-stats-subbar" class="px-4 py-2.5 border-b gold-border flex gap-2 overflow-x-auto no-scrollbar shrink-0 app-card hide"></div>
            <div id="solo-stats-body" class="lbk-fs-scroll p-4 space-y-3 max-w-3xl w-full mx-auto pb-20"></div>
        `;
        document.body.appendChild(mod);
    }
    return mod;
}

function closeSoloStatsModal() {
    window._soloStatsViewState.open = false;
    _soloFollowersSearch = "";
    _soloProjectSearch = "";
    _soloProjectTypeFilter = "all";
    _soloProjectDomainFilter = "all";
    const mod = document.getElementById("solo-profile-stats-modal");
    if (mod) mod.classList.add("hide");
}

window._restoreSoloStatsFromNav = function (stepObj) {
    if (!stepObj || !stepObj.targetUsername) return;
    window._soloStatsViewState = {
        open: true,
        targetUsername: _normAdminUserKey(stepObj.targetUsername),
        mode: stepObj.mode || "followers",
        masterCat: stepObj.masterCat || "user",
        projectCat: stepObj.projectCat || "proses",
        projectDomain: stepObj.projectDomain || "all"
    };
    _soloProjectDomainFilter = window._soloStatsViewState.projectDomain;
    const mod = _ensureSoloStatsModal();
    renderSoloStatsModal();
    mod.classList.remove("hide");
};

function _openUserFromStatsList(uname) {
    const clean = _normAdminUserKey(uname);
    if (!clean) return;
    closeSoloStatsModal();
    viewUserProfileModal(clean, false);
}

function _renderSoloAccountCard(uItem, isFounderOwner = false) {
    const defAv = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "./lembarku-logo.png";
    const proCheck = uItem.isPro ? `<i class="fa-solid fa-circle-check text-blue-500 text-xs shrink-0" title="Akun Pro"></i>` : "";
    const roleLabel = uItem.role === "cabang" ? "Cabang" : uItem.role === "administrasi" ? "Administrasi" : uItem.role === "master" ? "Founder" : "User";
    const isPending = uItem.status && uItem.status !== "Aktif";

    const founderActionsHtml = isFounderOwner ? `
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2 border-t gold-border">
            <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
                ${isPending ? `<button type="button" onclick="event.stopPropagation();approveUserRealTime('${esc(uItem.username)}',this)" class="gold-pill-btn px-2.5 py-1 rounded-lg text-[10px] font-bold">✓ ACC Akun</button>` : ""}
                ${uItem.role !== "administrasi" ? `<button type="button" onclick="event.stopPropagation();toggleUserProQuick('${esc(uItem.username)}',this)" class="px-2.5 py-1 rounded-lg ${uItem.isPro ? "bg-blue-600 text-white" : "app-btn-sec"} text-[10px] font-bold">${uItem.isPro ? "PRO ✓" : "+ Pro"}</button>` : ""}
                ${uItem.role === "cabang" ? `<span class="inline-flex items-center gap-1 text-amber-600 font-extrabold px-1">${typeof buildGoldLembarkuCoinHtml === "function" ? buildGoldLembarkuCoinHtml("sm") : ""}${uItem.quota || 0} Coin</span><button type="button" onclick="event.stopPropagation();topUpCabangRealTime('${esc(uItem.username)}',20,this)" class="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">+20</button><button type="button" onclick="event.stopPropagation();topUpCabangRealTime('${esc(uItem.username)}',55,this)" class="px-2 py-1 rounded-lg gold-pill-btn text-[10px]">+55</button><button type="button" onclick="event.stopPropagation();topUpCabangRealTime('${esc(uItem.username)}',115,this)" class="px-2 py-1 rounded-lg bg-amber-600 text-white text-[10px] font-bold">+115</button>` : ""}
            </div>
            <div class="flex items-center gap-1.5 ml-auto">
                <button type="button" onclick="event.stopPropagation();openMasterUserModal('${esc(uItem.username)}')" class="px-3 py-1 rounded-lg app-card-soft border text-[11px] font-bold"><i class="fa-solid fa-pen mr-1"></i>Edit</button>
                <button type="button" onclick="event.stopPropagation();deleteUserRealTime('${esc(uItem.username)}')" class="px-2.5 py-1 rounded-lg bg-red-600/15 text-red-500 text-[11px] font-bold" title="Hapus Akun"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    ` : "";

    return `
        <div onclick="_openUserFromStatsList('${esc(uItem.username)}')" class="app-card border rounded-3xl p-3.5 shadow-sm cursor-pointer hover:brightness-95 active:scale-[0.99] transition">
            <div class="flex items-center gap-3">
                <div class="relative shrink-0"><img src="${uItem.avatar || defAv}" class="w-11 h-11 rounded-full object-cover border gold-border bg-zinc-800">${typeof buildOnlineDotHtml === "function" ? buildOnlineDotHtml(uItem, "sm") : ""}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 min-w-0">
                        <strong class="text-xs sm:text-sm font-bold truncate">${escHtml(uItem.name || uItem.username)}</strong>
                        ${proCheck}
                        <span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${uItem.role==="cabang"?"bg-blue-500/20 text-blue-600":uItem.role==="administrasi"?"bg-emerald-500/20 text-emerald-600":"bg-zinc-500/20 app-muted"}">${escHtml(roleLabel)}</span>
                        ${isPending ? `<span class="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 font-extrabold">Menunggu</span>` : ""}
                    </div>
                    <p class="text-[11px] app-muted truncate">${(typeof canSeeUserHandle !== "function" || canSeeUserHandle(uItem)) ? `@${escHtml(uItem.username)}` : escHtml(roleLabel)}${uItem.role === "cabang" && uItem.brandName ? ` • ${escHtml(uItem.brandName)}` : ""}</p>
                </div>
                <i class="fa-solid fa-chevron-right text-xs app-muted shrink-0"></i>
            </div>
            ${founderActionsHtml}
        </div>
    `;
}

function openSoloFollowersModal(targetUsername, fromNav = false) {
    const tKey = _normAdminUserKey(targetUsername);
    const targetObj = (db.users || []).find(u => _normAdminUserKey(u.username) === tKey);
    if (!targetObj) return;
    if (targetObj.role === "cabang") return;

    window._soloStatsViewState = {
        open: true,
        targetUsername: tKey,
        mode: "followers",
        masterCat: "user",
        projectCat: "proses",
        projectDomain: "all"
    };
    _soloFollowersSearch = "";
    const mod = _ensureSoloStatsModal();
    renderSoloStatsModal();
    mod.classList.remove("hide");
    if (!fromNav) _pushAdminNavStep({ type: "solo_stats", targetUsername: tKey, mode: "followers", masterCat: "user", projectCat: "proses", projectDomain: "all" });
}

function openSoloFollowingModal(targetUsername, fromNav = false) {
    const tKey = _normAdminUserKey(targetUsername);
    const targetObj = (db.users || []).find(u => _normAdminUserKey(u.username) === tKey);
    if (!targetObj) return;

    window._soloStatsViewState = {
        open: true,
        targetUsername: tKey,
        mode: "following",
        masterCat: "user",
        projectCat: "proses",
        projectDomain: "all"
    };
    const mod = _ensureSoloStatsModal();
    renderSoloStatsModal();
    mod.classList.remove("hide");
    if (!fromNav) _pushAdminNavStep({ type: "solo_stats", targetUsername: tKey, mode: "following", masterCat: "user", projectCat: "proses", projectDomain: "all" });
}

function openSoloProjectModal(targetUsername, fromNav = false) {
    const tKey = _normAdminUserKey(targetUsername);
    const targetObj = (db.users || []).find(u => _normAdminUserKey(u.username) === tKey);
    if (!targetObj) return;

    window._soloStatsViewState = {
        open: true,
        targetUsername: tKey,
        mode: "project",
        masterCat: "user",
        projectCat: "proses",
        projectDomain: "all"
    };
    _soloProjectSearch = "";
    _soloProjectTypeFilter = "all";
    _soloProjectDomainFilter = "all";
    const mod = _ensureSoloStatsModal();
    renderSoloStatsModal();
    mod.classList.remove("hide");
    if (!fromNav) _pushAdminNavStep({ type: "solo_stats", targetUsername: tKey, mode: "project", masterCat: "user", projectCat: "proses", projectDomain: "all" });
}

function _syncTopSoloStatsNavState() {
    if (!Array.isArray(window._mrNavStack) || !window._mrNavStack.length) return;
    const top = window._mrNavStack[window._mrNavStack.length - 1];
    if (top && top.type === "solo_stats") {
        top.masterCat = window._soloStatsViewState.masterCat;
        top.projectCat = window._soloStatsViewState.projectCat;
        top.projectDomain = window._soloStatsViewState.projectDomain;
    }
}

function setSoloMasterCat(cat) {
    window._soloStatsViewState.masterCat = cat;
    _syncTopSoloStatsNavState();
    renderSoloStatsModal();
}

function setSoloProjectCat(cat) {
    window._soloStatsViewState.projectCat = cat;
    _syncTopSoloStatsNavState();
    renderSoloStatsModal();
}

function setSoloProjectDomainFilter(domain) {
    _soloProjectDomainFilter = domain || "all";
    window._soloStatsViewState.projectDomain = _soloProjectDomainFilter;
    _syncTopSoloStatsNavState();
    renderSoloStatsModal();
}

function setSoloProjectTypeFilter(f) {
    _soloProjectTypeFilter = f;
    renderSoloStatsModal();
}

function _buildPublicReadOnlyProjectCardHtml(doc) {
    const isPf = doc._kind === "pf";
    const isAktif = doc.status === "Aktif";
    const typeTag = isPf ? (doc.docType === "lamaran" ? "SURAT LAMARAN" : "CV") : `UNDANGAN • ${escHtml(doc.category)}`;
    const preClose = "closeSoloStatsModal();closeUserProfileModalCustom();";

    return `<div class="app-card border rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
        <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-[9px] px-2 py-0.5 rounded-full app-accent-bg app-accent font-extrabold">${typeTag}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${isAktif?"bg-emerald-500/20 text-emerald-600":"bg-amber-500/20 app-accent"}">● ${escHtml(doc.status || "Aktif")}</span>
            </div>
            <h4 class="font-bold text-sm mt-1 truncate">${escHtml(doc.title || "Project")}</h4>
            <p class="text-xs app-muted truncate">${escHtml(isPf ? (doc.themeName || doc.themeId) : doc.theme)}</p>
        </div>
        ${isAktif ? `<button type="button" onclick="${preClose}${isPf ? `openPortfolioDocPreview(${doc.id},false)` : `openGuestView(${doc.id},'Tamu Kehormatan')`}" class="px-3.5 py-1.5 rounded-xl app-btn-sec text-xs font-bold shrink-0"><i class="fa-regular fa-eye mr-1"></i>Lihat</button>` : ""}
    </div>`;
}

// ================= 5. RENDER MODAL SOLO STATS (3 TAB FILTER TERPADU) =================
function renderSoloStatsModal() {
    const st = window._soloStatsViewState;
    const targetObj = (db.users || []).find(u => _normAdminUserKey(u.username) === _normAdminUserKey(st.targetUsername));
    if (!targetObj) return;

    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    const isSelf = !!(curU && _normAdminUserKey(curU.username) === _normAdminUserKey(targetObj.username));
    const isMasterProfile = targetObj.role === "master";

    const titleEl = document.getElementById("solo-stats-title");
    const subEl = document.getElementById("solo-stats-sub");
    const subBar = document.getElementById("solo-stats-subbar");
    const bodyEl = document.getElementById("solo-stats-body");

    const canSeeTargetU = typeof canSeeUserHandle !== "function" || canSeeUserHandle(targetObj);
    if (subEl) subEl.innerText = canSeeTargetU ? `${targetObj.name || targetObj.username} (@${targetObj.username})` : `${targetObj.name || "Pengguna"}`;
    if (subBar) { subBar.classList.add("hide"); subBar.innerHTML = ""; }
    if (!bodyEl) return;

    // A. MODE FOLLOWERS
    if (st.mode === "followers") {
        if (titleEl) titleEl.innerText = "Followers";

        if (!isSelf && curU && curU.role !== "master" && curU.role !== "administrasi") {
            const priv = typeof getUserPrivacy === "function" ? getUserPrivacy(targetObj) : { showFollowers: true };
            if (!priv.showFollowers) {
                bodyEl.innerHTML = `
                    <div class="app-card border rounded-3xl p-8 text-center space-y-2 mt-4">
                        <i class="fa-solid fa-user-lock text-3xl app-accent"></i>
                        <h4 class="font-extrabold text-sm">Daftar Followers Disembunyikan</h4>
                        <p class="text-xs app-muted">Pengguna ini memilih untuk merahasiakan daftar pengikutnya.</p>
                    </div>
                `;
                return;
            }
        }

        if (isMasterProfile && isSelf) {
            const allNonMaster = (db.users || []).filter(u => u && u.role !== "master");
            const catMap = {
                user: allNonMaster.filter(u => u.role === "user"),
                administrasi: allNonMaster.filter(u => u.role === "administrasi"),
                cabang: allNonMaster.filter(u => u.role === "cabang")
            };
            const activeCat = catMap[st.masterCat] ? st.masterCat : "user";
            let usersInCat = catMap[activeCat] || [];

            if (_soloFollowersSearch.trim()) {
                const q = _soloFollowersSearch.trim().toLowerCase();
                usersInCat = usersInCat.filter(u =>
                    String(u.name || "").toLowerCase().includes(q) ||
                    String(u.username || "").toLowerCase().includes(q) ||
                    String(u.brandName || "").toLowerCase().includes(q)
                );
            }

            if (subBar) {
                subBar.classList.remove("hide");
                subBar.innerHTML = `
                    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar w-full">
                        <button type="button" onclick="setSoloMasterCat('user')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeCat === "user" ? "gold-pill-btn" : "app-btn-sec"}">User (${catMap.user.length})</button>
                        <button type="button" onclick="setSoloMasterCat('administrasi')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeCat === "administrasi" ? "gold-pill-btn" : "app-btn-sec"}">Administrasi (${catMap.administrasi.length})</button>
                        <button type="button" onclick="setSoloMasterCat('cabang')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeCat === "cabang" ? "gold-pill-btn" : "app-btn-sec"}">Cabang (${catMap.cabang.length})</button>
                    </div>
                `;
            }

            const headerActionsHtml = `
                <div class="space-y-2.5 mb-2">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <input type="text" id="solo-fol-search" value="${esc(_soloFollowersSearch)}" oninput="_soloFollowersSearch=this.value;renderSoloStatsModal();" placeholder="Cari ${activeCat}..." class="app-input !py-2 text-xs flex-1 min-w-[200px]">
                        <div class="flex gap-1.5 shrink-0">
                            <button type="button" onclick="openMasterUserModal(null,'${activeCat}')" class="gold-pill-btn px-3.5 py-2 rounded-xl text-xs shadow"><i class="fa-solid fa-user-plus mr-1"></i>+ ${activeCat.toUpperCase()}</button>
                        </div>
                    </div>
                </div>
            `;

            bodyEl.innerHTML = headerActionsHtml + (usersInCat.length
                ? usersInCat.map(u => _renderSoloAccountCard(u, true)).join("")
                : `<div class="app-card border border-dashed rounded-3xl p-8 text-center text-xs app-muted">Tidak ada akun ${activeCat} yang cocok.</div>`);
            return;
        }

        const fKeys = (typeof _getFollowersListForUser === "function")
            ? _getFollowersListForUser(targetObj)
            : (Array.isArray(targetObj.followers) ? targetObj.followers : []);
        const followerObjs = fKeys.map(k => (db.users || []).find(u => _normAdminUserKey(u.username) === _normAdminUserKey(k)) || { username: k, name: k, role: "user", avatar: DEFAULT_AVATAR });
        bodyEl.innerHTML = followerObjs.length
            ? followerObjs.map(u => _renderSoloAccountCard(u, false)).join("")
            : `<div class="app-card border border-dashed rounded-3xl p-8 text-center text-xs app-muted">Belum ada followers.</div>`;
        return;
    }

    // B. MODE FOLLOWING
    if (st.mode === "following") {
        if (titleEl) titleEl.innerText = "Following";

        if (!isSelf && curU && curU.role !== "master" && curU.role !== "administrasi") {
            const priv = typeof getUserPrivacy === "function" ? getUserPrivacy(targetObj) : { showFollowing: true };
            if (!priv.showFollowing) {
                bodyEl.innerHTML = `
                    <div class="app-card border rounded-3xl p-8 text-center space-y-2 mt-4">
                        <i class="fa-solid fa-user-lock text-3xl app-accent"></i>
                        <h4 class="font-extrabold text-sm">Daftar Following Disembunyikan</h4>
                        <p class="text-xs app-muted">Pengguna ini memilih untuk merahasiakan akun yang diikutinya.</p>
                    </div>
                `;
                return;
            }
        }

        const gKeys = (typeof _getFollowingListForUser === "function")
            ? _getFollowingListForUser(targetObj)
            : (Array.isArray(targetObj.following) ? targetObj.following : []);
        const followingObjs = gKeys.map(k => (db.users || []).find(u => _normAdminUserKey(u.username) === _normAdminUserKey(k)) || { username: k, name: k, role: "user", avatar: DEFAULT_AVATAR });
        bodyEl.innerHTML = followingObjs.length
            ? followingObjs.map(u => _renderSoloAccountCard(u, false)).join("")
            : `<div class="app-card border border-dashed rounded-3xl p-8 text-center text-xs app-muted">Belum mengikuti akun mana pun.</div>`;
        return;
    }

    // C. MODE PROJECT (PEMISAHAN 3 TAB FILTER: SEMUA | LEMBARKU | TITIK GOWES)
    if (titleEl) titleEl.innerText = "Project & Transaksi";

    const isStaffScope = targetObj.role === "master" || targetObj.role === "administrasi";
    const isStaffViewer = !!(curU && (curU.role === "master" || curU.role === "administrasi"));
    const isAdminOnlyViewer = !!(curU && curU.role === "administrasi");

    // Ambil dokumen Lembarku
    let lbkDocs = (typeof _getProjectsForUser === "function") ? _getProjectsForUser(targetObj) : [];
    if (isAdminOnlyViewer) {
        lbkDocs = lbkDocs.filter(x => !isCabangOwnedDoc(x));
    }

    // Ambil transaksi sewa Titik Gowes
    let gowesDocs = [];
    if (isStaffScope && isStaffViewer) {
        gowesDocs = Array.isArray(db.gowesRentals) ? db.gowesRentals : [];
    } else {
        const uKey = _normAdminUserKey(targetObj.username);
        gowesDocs = (Array.isArray(db.gowesRentals) ? db.gowesRentals : []).filter(
            r => _normAdminUserKey(r.customerUsername) === uKey
        );
    }

    const taggedLbk = lbkDocs.map(d => Object.assign({}, d, { _domain: "lembarku" }));
    const taggedGowes = gowesDocs.map(r => Object.assign({}, r, { _domain: "gowes", _kind: "gowes_rental" }));

    // Terapkan Filter Domain: 'all' | 'lembarku' | 'gowes'
    let domainFilteredItems = [];
    if (_soloProjectDomainFilter === "lembarku") {
        domainFilteredItems = [...taggedLbk];
    } else if (_soloProjectDomainFilter === "gowes") {
        domainFilteredItems = [...taggedGowes];
    } else {
        domainFilteredItems = [...taggedLbk, ...taggedGowes];
    }

    // Terapkan Filter Tipe Dokumen Lembarku
    if (_soloProjectTypeFilter === "inv") {
        domainFilteredItems = domainFilteredItems.filter(p => p._kind === "inv");
    } else if (_soloProjectTypeFilter === "pf") {
        domainFilteredItems = domainFilteredItems.filter(p => p._kind === "pf");
    }

    // Terapkan Pencarian Teks
    if (_soloProjectSearch.trim()) {
        const q = _soloProjectSearch.trim().toLowerCase();
        domainFilteredItems = domainFilteredItems.filter(p => {
            const t = String(p.title || p.bikeName || "").toLowerCase();
            const o = String(p.owner || p.customerUsername || "").toLowerCase();
            const b = String(p.brandName || "").toLowerCase();
            return t.includes(q) || o.includes(q) || b.includes(q);
        });
    }

    // Pemisahan Status Proses/Verifikasi vs Aktif/Selesai
    const isGowesProcess = (r) => r.status === "Menunggu Pembayaran" || r.status === "Menunggu Verifikasi" || r.status === "Terkonfirmasi" || r.status === "Sedang Digunakan";
    const isLbkProcess = (p) => p.status !== "Aktif" || !!p.pendingRevision;

    const prosesList = domainFilteredItems.filter(item => item._domain === "gowes" ? isGowesProcess(item) : isLbkProcess(item));
    const aktifList = domainFilteredItems.filter(item => item._domain === "gowes" ? !isGowesProcess(item) : !isLbkProcess(item));

    const pCat = st.projectCat === "aktif" ? "aktif" : "proses";
    const shownList = pCat === "aktif" ? aktifList : prosesList;

    if (isStaffScope && isStaffViewer) {
        if (subBar) {
            subBar.classList.remove("hide");
            const countLbk = taggedLbk.length;
            const countGws = taggedGowes.length;
            const countAll = countLbk + countGws;

            subBar.innerHTML = `
                <div class="flex flex-col gap-2 w-full">
                    <!-- 1. Pemisah Domain: Semua | Lembarku | Titik Gowes -->
                    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        <button type="button" onclick="setSoloProjectDomainFilter('all')" class="px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${_soloProjectDomainFilter === 'all' ? 'gold-pill-btn shadow' : 'app-btn-sec'}">
                            Semua Layanan (${countAll})
                        </button>
                        <button type="button" onclick="setSoloProjectDomainFilter('lembarku')" class="px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${_soloProjectDomainFilter === 'lembarku' ? 'gold-pill-btn shadow' : 'app-btn-sec'}">
                            <i class="fa-solid fa-file-pdf mr-1"></i>Berkas Lembarku (${countLbk})
                        </button>
                        <button type="button" onclick="setSoloProjectDomainFilter('gowes')" class="px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${_soloProjectDomainFilter === 'gowes' ? 'gowes-pill-btn shadow' : 'app-btn-sec'}">
                            <i class="fa-solid fa-bicycle mr-1"></i>Titik Gowes (${countGws})
                        </button>
                    </div>

                    <!-- 2. Pemisah Status Transaksi: Proses vs Aktif/Selesai -->
                    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t gold-border">
                        <button type="button" onclick="setSoloProjectCat('proses')" class="px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap ${pCat === 'proses' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/40' : 'app-btn-sec'}">
                            ● Antrean / Proses (${prosesList.length})
                        </button>
                        <button type="button" onclick="setSoloProjectCat('aktif')" class="px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap ${pCat === 'aktif' ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40' : 'app-btn-sec'}">
                            ✓ Aktif / Selesai (${aktifList.length})
                        </button>
                    </div>
                </div>
            `;
        }

        const typeFilterControls = _soloProjectDomainFilter !== "gowes" ? `
            <div class="flex gap-1.5 overflow-x-auto shrink-0">
                <button type="button" onclick="setSoloProjectTypeFilter('all')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold ${_soloProjectTypeFilter==='all'?'gold-pill-btn':'app-btn-sec'}">Semua</button>
                <button type="button" onclick="setSoloProjectTypeFilter('inv')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold ${_soloProjectTypeFilter==='inv'?'gold-pill-btn':'app-btn-sec'}">Undangan</button>
                <button type="button" onclick="setSoloProjectTypeFilter('pf')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold ${_soloProjectTypeFilter==='pf'?'gold-pill-btn':'app-btn-sec'}">CV &amp; Lamaran</button>
            </div>
        ` : "";

        const gowesScheduleStrip = (_soloProjectDomainFilter === "gowes" && typeof buildGowesTodayScheduleBoardHtml === "function")
            ? `<div class="mb-3">${buildGowesTodayScheduleBoardHtml()}</div>`
            : "";

        const controlsHtml = `
            ${gowesScheduleStrip}
            <div class="space-y-2 mb-2">
                <div class="flex flex-col sm:flex-row gap-2">
                    <input type="text" value="${esc(_soloProjectSearch)}" oninput="_soloProjectSearch=this.value;renderSoloStatsModal();" placeholder="Cari pesanan berkas atau booking sepeda..." class="app-input !py-2 text-xs flex-1">
                    ${typeFilterControls}
                </div>
            </div>
        `;

        bodyEl.innerHTML = controlsHtml + (shownList.length
            ? shownList.map(doc => {
                if (doc._domain === "gowes") {
                    return typeof buildGowesOrderCardHtml === "function"
                        ? buildGowesOrderCardHtml(doc, { isStaffMode: isAdminOnlyViewer, closeModalBeforeAction: true })
                        : `<div class="p-3 app-card border rounded-xl">${doc.bikeName}</div>`;
                }
                return buildFullOrderCardHtml(doc, {
                    isStaffMode: isAdminOnlyViewer,
                    closeModalBeforeAction: true
                });
            }).join("")
            : `<div class="app-card border border-dashed rounded-3xl p-8 text-center text-xs app-muted">Tidak ada proyek atau booking sepeda pada status ini.</div>`);
        return;
    }

    if (isStaffViewer) {
        bodyEl.innerHTML = domainFilteredItems.length
            ? domainFilteredItems.map(doc => {
                if (doc._domain === "gowes") {
                    return typeof buildGowesOrderCardHtml === "function"
                        ? buildGowesOrderCardHtml(doc, { isStaffMode: isAdminOnlyViewer, closeModalBeforeAction: true })
                        : `<div class="p-3 app-card border rounded-xl">${doc.bikeName}</div>`;
                }
                return buildFullOrderCardHtml(doc, {
                    isStaffMode: isAdminOnlyViewer,
                    closeModalBeforeAction: true
                });
            }).join("")
            : `<div class="app-card border border-dashed rounded-3xl p-8 text-center text-xs app-muted">Belum ada project yang dibuat.</div>`;
        return;
    }

    if (isSelf) {
        bodyEl.innerHTML = domainFilteredItems.length
            ? domainFilteredItems.map(doc => {
                if (doc._domain === "gowes") {
                    return typeof buildUserRentalCardHtml === "function"
                        ? buildUserRentalCardHtml(doc)
                        : `<div class="p-3 app-card border rounded-xl">${doc.bikeName}</div>`;
                }
                return buildUserOwnProjectCardHtml(doc, curU.role === "cabang");
            }).join("")
            : `<div class="app-card border border-dashed rounded-3xl p-8 text-center text-xs app-muted">Belum ada project yang dibuat.</div>`;
        return;
    }

    // Pengunjung Publik: Periksa Privasi Postingan/Dokumen
    if (targetObj.role !== "cabang") {
        const priv = typeof getUserPrivacy === "function" ? getUserPrivacy(targetObj) : { showProjects: true };
        if (!priv.showProjects) {
            bodyEl.innerHTML = `
                <div class="app-card border rounded-3xl p-8 text-center space-y-2 mt-4">
                    <i class="fa-solid fa-lock text-3xl app-accent"></i>
                    <h4 class="font-extrabold text-sm">Daftar Project Disembunyikan</h4>
                    <p class="text-xs app-muted">Pengguna ini memilih untuk merahasiakan postingan dokumen dari publik.</p>
                </div>
            `;
            return;
        }
    }

    const publicActiveProj = lbkDocs.filter(p => p && p.status === "Aktif");
    bodyEl.innerHTML = publicActiveProj.length
        ? publicActiveProj.map(_buildPublicReadOnlyProjectCardHtml).join("")
        : `<div class="app-card border border-dashed rounded-3xl p-8 text-center text-xs app-muted">Belum ada project publik aktif.</div>`;
}

function viewUserProfileModal(username, fromNav = false) {
    const cleanU = _normAdminUserKey(username);
    const u = (db.users || []).find(x => _normAdminUserKey(x.username) === cleanU);
    if (!u) return showToast("Akun tidak ditemukan.", "error");

    const modal = document.getElementById("modal-view-user-profile");
    if (!modal) return;

    modal.style.cssText = "display:flex !important;position:fixed !important;inset:0 !important;width:100vw !important;height:100vh !important;max-width:100vw !important;max-height:100vh !important;padding:0 !important;margin:0 !important;z-index:135 !important;background:var(--app-bg,#f2f2f7) !important;opacity:1 !important;visibility:visible !important;";

    const cardBox = modal.querySelector(".app-card");
    if (cardBox) {
        cardBox.style.cssText = "display:flex !important;flex-direction:column !important;width:100% !important;height:100% !important;max-width:100% !important;max-height:100% !important;border-radius:0 !important;border:none !important;padding:0 !important;margin:0 !important;background:var(--app-bg,#f2f2f7) !important;";
    }

    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    const isSelf = !!(curU && _normAdminUserKey(curU.username) === cleanU);
    const isMasterProfile = u.role === "master";
    const isCabangProfile = u.role === "cabang";

    const isBlocked = typeof isUserBlockedByMe === "function" && isUserBlockedByMe(cleanU);
    const isBlockedByTarget = !!u.blockedViewer;

    let followersCount = 0;
    if (isMasterProfile) {
        followersCount = _formatMasterFollowersNum();
    } else if (typeof _getFollowersListForUser === "function") {
        followersCount = _formatInstagramMetric(_getFollowersListForUser(u).length);
    } else {
        followersCount = _formatInstagramMetric(Array.isArray(u.followers) ? u.followers.length : 0);
    }

    const followingCount = (typeof _getFollowingListForUser === "function")
        ? _getFollowingListForUser(u).length
        : (Array.isArray(u.following) ? u.following.length : 0);

    const projectCount = (typeof _getProjectsForUser === "function")
        ? _getProjectsForUser(u).length
        : 0;

    const isMasterViewer = !!(curU && curU.role === "master");
    const isLockedMasterView = isMasterProfile && !isSelf;

    const canFollowThis = !isSelf && curU && !isBlocked && !isBlockedByTarget;
    const curFollowingList = (curU && typeof _getFollowingListForUser === "function")
        ? _getFollowingListForUser(curU)
        : (curU && Array.isArray(curU.following) ? curU.following.map(_normAdminUserKey) : []);
    const isFollowingThis = canFollowThis && curFollowingList.includes(cleanU);

    const avatarSrc = u.avatar || DEFAULT_AVATAR;
    const bannerStyle = u.banner ? `background-image:url('${u.banner}');` : "";
    const proBadgeHtml = u.isPro ? `<i class="fa-solid fa-circle-check text-blue-500 text-sm"></i>` : "";
    const roleBadgeHtml = u.role === "master"
        ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-extrabold uppercase">FOUNDER</span>`
        : u.role === "administrasi"
            ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-extrabold uppercase">ADMINISTRASI</span>`
            : u.role === "cabang"
                ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 font-extrabold uppercase">CABANG</span>`
                : "";

    const onlineDotProfile = typeof buildOnlineDotHtml === "function" ? buildOnlineDotHtml(u, "lg") : "";
    const presenceText = typeof getUserPresenceText === "function" ? getUserPresenceText(u) : "";
    const presenceBadgeHtml = presenceText
        ? `<div class="pt-0.5"><span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${presenceText === "Online" ? "bg-emerald-500/15 text-emerald-600" : "app-card-soft app-muted border"}">${presenceText === "Online" ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Online' : escHtml(presenceText)}</span></div>`
        : "";

    const priv = typeof getUserPrivacy === "function" ? getUserPrivacy(u) : { showContact: false, allowDirectChat: true };

    const contactHtml = (!isLockedMasterView && priv.showContact && (u.phone || u.address)) ? `
        <div class="flex flex-wrap gap-3 text-xs app-muted pt-1">
            ${u.phone ? `<span><i class="fa-solid fa-phone app-accent mr-1"></i>${escHtml(u.phone)}</span>` : ""}
            ${u.address ? `<span><i class="fa-solid fa-location-dot app-accent mr-1"></i>${escHtml(u.address)}</span>` : ""}
        </div>
    ` : "";

    const targetFollowsMe = !!(curU && typeof _getFollowingListForUser === "function" && _getFollowingListForUser(u).includes(_normAdminUserKey(curU.username)));
    const followBtnLabel = isFollowingThis ? "Following" : (targetFollowsMe ? "Ikuti Balik" : "Follow");
    const followBtnHtml = canFollowThis
        ? `<button type="button" onclick="toggleFollowTargetUser('${esc(cleanU)}')" class="w-full py-2.5 rounded-2xl text-xs font-extrabold transition shadow-sm ${isFollowingThis ? "app-btn-sec border" : "gold-pill-btn"}">
            <i class="fa-solid ${isFollowingThis ? "fa-user-check" : "fa-user-plus"} mr-1.5"></i>${followBtnLabel}
           </button>`
        : "";

    const canSeeProfileHandle = typeof canSeeUserHandle !== "function" || canSeeUserHandle(u);

    let followersColHtml = "", followingColHtml = "", projectColHtml = "", gridColsClass = "grid-cols-3";
    if (isLockedMasterView) {
        // Profil Master saat dilihat orang lain: hanya lihat angka & Follow (semua tombol lain dikunci)
        followersColHtml = `<div class="py-2 px-1 text-center select-none">
            <span class="block text-sm sm:text-base font-extrabold tracking-tight">${escHtml(String(followersCount))}</span>
            <span class="block text-[11px] app-muted font-medium">Followers</span>
        </div>`;
        followingColHtml = `<div class="py-2 px-1 text-center select-none">
            <span class="block text-sm sm:text-base font-extrabold tracking-tight">${escHtml(_formatInstagramMetric(followingCount))}</span>
            <span class="block text-[11px] app-muted font-medium">Following</span>
        </div>`;
        projectColHtml = `<div class="py-2 px-1 text-center select-none">
            <span class="block text-sm sm:text-base font-extrabold tracking-tight">${escHtml(_formatInstagramMetric(projectCount))}</span>
            <span class="block text-[11px] app-muted font-medium">Project</span>
        </div>`;
        gridColsClass = "grid-cols-3";
    } else {
        const coinColHtml = isCabangProfile
            ? `<button type="button" onclick="if(typeof openCabangCoinInfoModal==='function')openCabangCoinInfoModal('${esc(cleanU)}')" class="py-2 px-1 text-center rounded-xl hover:bg-amber-500/10 active:scale-98 transition">
                <span class="inline-flex items-center justify-center gap-1.5 text-sm sm:text-base font-extrabold tracking-tight text-amber-600">${typeof buildGoldLembarkuCoinHtml === "function" ? buildGoldLembarkuCoinHtml("sm") : ""}${escHtml(String(u.quota || 0))}</span>
                <span class="block text-[11px] app-muted font-semibold mt-0.5">Coin <i class="fa-solid fa-circle-info text-[9px] text-amber-500 ml-0.5"></i></span>
            </button>`
            : "";

        followersColHtml = isCabangProfile
            ? coinColHtml
            : `<button type="button" onclick="openSoloFollowersModal('${esc(cleanU)}')" class="py-2 px-1 text-center rounded-xl hover:bg-black/5 active:scale-98 transition">
                <span class="block text-sm sm:text-base font-extrabold tracking-tight">${escHtml(String(followersCount))}</span>
                <span class="block text-[11px] app-muted font-medium">Followers</span>
            </button>`;

        followingColHtml = isCabangProfile
            ? ""
            : `<button type="button" onclick="openSoloFollowingModal('${esc(cleanU)}')" class="py-2 px-1 text-center rounded-xl hover:bg-black/5 active:scale-98 transition">
                <span class="block text-sm sm:text-base font-extrabold tracking-tight">${escHtml(_formatInstagramMetric(followingCount))}</span>
                <span class="block text-[11px] app-muted font-medium">Following</span>
            </button>`;

        projectColHtml = `<button type="button" onclick="openSoloProjectModal('${esc(cleanU)}')" class="py-2 px-1 text-center rounded-xl hover:bg-black/5 active:scale-98 transition">
            <span class="block text-sm sm:text-base font-extrabold tracking-tight">${escHtml(_formatInstagramMetric(projectCount))}</span>
            <span class="block text-[11px] app-muted font-medium">Project</span>
        </button>`;
        gridColsClass = isCabangProfile ? "grid-cols-2" : "grid-cols-3";
    }

    // Panel Kirim Bonus Coin Langsung dari Founder (hanya untuk akun penerima Coin: User PRO & Admin Cabang)
    let masterBonusCoinPanelHtml = "";
    if (isMasterViewer && !isSelf) {
        const canReceiveCoins = isCabangProfile || (u.role === "user" && !!u.isPro);
        if (canReceiveCoins) {
            const tierLabel = isCabangProfile ? "ADMIN CABANG" : "USER PRO";
            masterBonusCoinPanelHtml = `
                <div class="app-card border-2 border-amber-400/55 rounded-3xl p-4 space-y-3 shadow-sm bg-gradient-to-br from-amber-500/10 via-transparent to-transparent">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            ${typeof buildGoldLembarkuCoinHtml === "function" ? buildGoldLembarkuCoinHtml("md") : ""}
                            <div>
                                <span class="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-600">${tierLabel} • PENERIMA COIN</span>
                                <h4 class="font-extrabold text-xs sm:text-sm mt-0.5">Kirim Bonus Coin dari Founder</h4>
                            </div>
                        </div>
                        <div class="text-right shrink-0">
                            <span class="text-[9.5px] app-muted block">Saldo Saat Ini</span>
                            <strong class="text-sm font-extrabold text-amber-600">${Number(u.quota || 0)} Coin</strong>
                        </div>
                    </div>
                    <div class="grid grid-cols-4 gap-1.5">
                        <button type="button" onclick="sendFounderBonusCoinFromProfile('${esc(cleanU)}',5,this)" class="py-1.5 rounded-xl app-card-soft border border-amber-400/40 text-amber-600 text-xs font-extrabold hover:brightness-95">+5</button>
                        <button type="button" onclick="sendFounderBonusCoinFromProfile('${esc(cleanU)}',10,this)" class="py-1.5 rounded-xl app-card-soft border border-amber-400/40 text-amber-600 text-xs font-extrabold hover:brightness-95">+10</button>
                        <button type="button" onclick="sendFounderBonusCoinFromProfile('${esc(cleanU)}',20,this)" class="py-1.5 rounded-xl app-card-soft border border-amber-400/40 text-amber-600 text-xs font-extrabold hover:brightness-95">+20</button>
                        <button type="button" onclick="sendFounderBonusCoinFromProfile('${esc(cleanU)}',50,this)" class="py-1.5 rounded-xl app-card-soft border border-amber-400/40 text-amber-600 text-xs font-extrabold hover:brightness-95">+50</button>
                    </div>
                    <div class="flex gap-2">
                        <input type="number" id="mvp-bonus-coin-inp" min="1" step="1" placeholder="Jumlah Coin bebas..." class="app-input !py-2 text-xs font-bold flex-1">
                        <button type="button" id="btn-mvp-send-bonus-coin" onclick="sendFounderBonusCoinFromProfile('${esc(cleanU)}',null,this)" class="gold-pill-btn px-4 py-2 rounded-xl text-xs shadow shrink-0"><i class="fa-solid fa-gift mr-1"></i>Kirim Coin</button>
                    </div>
                    <p class="text-[10px] app-muted">Tercatat otomatis di Riwayat Mutasi penerima sebagai <strong>"Bonus dari Founder"</strong> + notifikasi lonceng.</p>
                </div>
            `;
        } else if (u.role === "user" && !u.isPro) {
            masterBonusCoinPanelHtml = `
                <div class="app-card border border-dashed rounded-3xl p-3.5 flex items-center justify-between gap-3">
                    <div class="min-w-0">
                        <strong class="text-xs block">Akun Belum PRO (Belum Menerima Coin)</strong>
                        <span class="text-[10px] app-muted block">Aktifkan status PRO dulu agar akun ini dapat menerima Bonus Coin.</span>
                    </div>
                    <button type="button" onclick="toggleUserProQuick('${esc(cleanU)}',this,true)" class="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[11px] font-bold shrink-0">+ Aktifkan PRO</button>
                </div>
            `;
        }
    }

    const canBlock = !isSelf && !isLockedMasterView && curU && curU.role !== "cabang" && u.role !== "master";
    const blockBtnHtml = canBlock ? `
        <button type="button" onclick="toggleBlockTargetUser('${esc(cleanU)}')" class="w-full py-2 rounded-2xl text-xs font-bold transition border ${isBlocked ? "bg-red-600/15 text-red-500 border-red-500/40" : "app-btn-sec"}">
            <i class="fa-solid ${isBlocked ? "fa-unlock" : "fa-ban"} mr-1.5"></i>${isBlocked ? "Buka Blokir Pengguna" : "Blokir Pengguna"}
        </button>
    ` : "";

    const canChat = !isSelf && !isLockedMasterView && curU && !isBlocked && !isBlockedByTarget && (curU.role === "master" || curU.role === "administrasi" || priv.allowDirectChat);

    const bodyEl = document.getElementById("mvp-body");
    if (bodyEl) {
        bodyEl.className = "lbk-fs-scroll";
        bodyEl.innerHTML = `
            <div class="w-full max-w-xl mx-auto p-4 space-y-4 pb-20">
                <div class="app-card rounded-3xl border overflow-hidden shadow-sm relative">
                    <div class="h-32 md:h-40 bg-gradient-to-r from-zinc-700 to-zinc-900 bg-cover bg-center relative" style="${bannerStyle}">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15"></div>
                    </div>
                    <div class="px-5 pb-5 relative text-center md:text-left">
                        <div class="flex flex-col md:flex-row items-center md:items-end gap-3 -mt-11 relative z-10">
                            <div class="relative shrink-0">
                                <img src="${avatarSrc}" onclick="openExpandedAvatarLightbox('${esc(avatarSrc)}','${esc(u.name || u.username)}')" class="w-20 h-20 rounded-full object-cover border-4 border-[var(--app-card)] shadow-lg bg-zinc-800 cursor-pointer active:scale-95 transition" alt="Avatar">
                                ${onlineDotProfile}
                            </div>
                            <div class="min-w-0">
                                <h2 class="text-lg font-extrabold flex items-center justify-center md:justify-start gap-1.5 mt-1">
                                    <span>${escHtml(u.name || u.username)}</span>
                                    ${proBadgeHtml}
                                    ${roleBadgeHtml}
                                </h2>
                                ${canSeeProfileHandle ? `<p class="text-xs app-accent font-semibold">@${escHtml(u.username)}</p>` : ""}
                                ${presenceBadgeHtml}
                                ${u.bio ? `<p class="text-xs app-muted mt-1 leading-relaxed max-w-md">${escHtml(u.bio)}</p>` : ""}
                                ${contactHtml}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="app-card border rounded-3xl p-3 shadow-sm space-y-3">
                    <div class="grid ${gridColsClass} divide-x divide-black/10 text-center">
                        ${followersColHtml}
                        ${followingColHtml}
                        ${projectColHtml}
                    </div>
                    ${followBtnHtml}
                </div>

                ${masterBonusCoinPanelHtml}

                ${canChat ? `<div class="pt-1">
                    <button type="button" onclick="closeUserProfileModalCustom();if(typeof openFullChatOverlay==='function')openFullChatOverlay('${esc(cleanU)}');" class="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-2">
                        <i class="fa-solid fa-comments"></i> Kirim Pesan ke ${escHtml(canSeeProfileHandle ? "@" + u.username : (u.name || "Pengguna"))}
                    </button>
                </div>` : ""}

                ${blockBtnHtml}
            </div>
        `;
    }

    const headerBar = modal.querySelector(".border-b");
    if (headerBar) {
        headerBar.className = "lbk-fs-header px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0";
        headerBar.innerHTML = `
            <div class="flex items-center gap-2.5 min-w-0">
                <button type="button" onclick="_adminStepBackOrClose(closeUserProfileModalCustom)" class="w-9 h-9 rounded-full app-btn-sec flex items-center justify-center text-xs shrink-0 active:scale-95 transition" title="Kembali">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <div class="min-w-0">
                    <h3 class="font-extrabold text-base truncate">${escHtml(u.name || u.username)}</h3>
                    <p class="text-[10px] app-muted truncate">Profil Pengguna</p>
                </div>
            </div>
            <button type="button" onclick="closeUserProfileModalCustom()" class="px-4 py-1.5 rounded-full app-btn-sec text-xs font-bold shrink-0">Selesai</button>
        `;
    }

    modal.classList.remove("hide");
    if (!fromNav) _pushAdminNavStep({ type: "user_profile", username: cleanU });
}

function closeUserProfileModalCustom() {
    closeSoloStatsModal();
    closeExpandedAvatarLightbox();
    const modal = document.getElementById("modal-view-user-profile");
    if (modal) {
        modal.style.cssText = "";
        modal.classList.add("hide");
    }
}

// ================= 6. AKUN KENDALI CEPAT (PRO, TOPUP, EDIT & HAPUS) =================
async function toggleUserProQuick(uname, btn, reopenModal = false) {
    const u = (db.users || []).find(x => _normAdminUserKey(x.username) === _normAdminUserKey(uname)); if (!u) return;
    setBtnLoading(btn, true, "...");
    const nextPro = !u.isPro;
    await apiAction({ action: "upsert_user", oldUsername: u.username, user: Object.assign({}, u, { isPro: nextPro }) });
    renderMasterHeaderStats();
    if (window._soloStatsViewState && window._soloStatsViewState.open) renderSoloStatsModal();
    if (reopenModal) viewUserProfileModal(u.username, true);
    showToast(nextPro ? `@${u.username} ditingkatkan ke Akun PRO (Centang Biru)!` : `Status Pro @${u.username} dinonaktifkan.`, "info");
}

function openMasterUserModal(username = null, defaultRole = "user") {
    const isEdit = !!username, u = isEdit ? db.users.find(x => _normAdminUserKey(x.username) === _normAdminUserKey(username)) : null;
    document.getElementById("mmu-title").innerText = isEdit ? `Edit Akun @${u.username}` : `Tambah ${defaultRole === "cabang" ? "Admin Cabang" : defaultRole === "administrasi" ? "Tim Administrasi" : "User"}`;
    document.getElementById("mmu-old-username").value = isEdit ? u.username : "";
    document.getElementById("mmu-role").value = isEdit ? u.role : defaultRole;
    document.getElementById("mmu-status").value = isEdit ? u.status : "Aktif";
    document.getElementById("mmu-name").value = isEdit ? u.name : "";
    document.getElementById("mmu-username").value = isEdit ? u.username : "";
    document.getElementById("mmu-password").value = isEdit ? "" : "";
    document.getElementById("mmu-phone").value = isEdit ? (u.phone || "") : "";
    document.getElementById("mmu-address").value = isEdit ? (u.address || "") : "";
    document.getElementById("mmu-is-pro").checked = isEdit ? !!u.isPro : false;
    document.getElementById("mmu-brand").value = isEdit ? (u.brandName || "") : "";
    document.getElementById("mmu-quota").value = isEdit ? (u.quota || 0) : 5;
    document.getElementById("mmu-quota-wrap").classList.toggle("hide", document.getElementById("mmu-role").value !== "cabang");
    document.getElementById("modal-master-user").classList.remove("hide");
    _pushAdminNavStep({ type: "modal", id: "modal-master-user" });
}

async function submitMasterUserModal(e) {
    e.preventDefault(); setBtnLoading("btn-mmu-save", true, "Menyimpan...");
    const oldU = document.getElementById("mmu-old-username").value;
    const roleVal = document.getElementById("mmu-role").value;
    const payload = {
        role: roleVal, status: document.getElementById("mmu-status").value,
        isPro: document.getElementById("mmu-is-pro").checked,
        name: document.getElementById("mmu-name").value.trim(),
        username: document.getElementById("mmu-username").value.trim().toLowerCase(),
        password: document.getElementById("mmu-password").value.trim(),
        phone: document.getElementById("mmu-phone").value.trim(),
        address: document.getElementById("mmu-address").value.trim(),
        brandName: roleVal === "cabang" ? document.getElementById("mmu-brand").value.trim() : "",
        quota: parseInt(document.getElementById("mmu-quota").value) || 0
    };
    const res = await apiAction({ action: "upsert_user", oldUsername: oldU || payload.username, user: payload });
    setBtnLoading("btn-mmu-save", false);
    if (!res || !res.ok) return showToast((res && res.message) || "Gagal menyimpan akun.", "error");
    document.getElementById("modal-master-user").classList.add("hide");
    if (typeof _mrDropTopModalById === "function") _mrDropTopModalById("modal-master-user");
    renderMasterHeaderStats();
    if (window._soloStatsViewState && window._soloStatsViewState.open) renderSoloStatsModal();
    showToast("Akun berhasil disimpan!");
}

async function approveUserRealTime(uname, btn) {
    const u = db.users.find(x => _normAdminUserKey(x.username) === _normAdminUserKey(uname)); if (!u) return;
    setBtnLoading(btn, true, "...");
    await apiAction({ action: "upsert_user", oldUsername: u.username, user: Object.assign({}, u, { status: "Aktif" }) });
    renderMasterHeaderStats();
    if (window._soloStatsViewState && window._soloStatsViewState.open) renderSoloStatsModal();
    showToast(`Akun @${u.username} aktif!`);
}

async function deleteUserRealTime(uname) {
    if (!(await showConfirm("Hapus Akun", `Hapus akun @${uname} secara permanen?`, "fa-solid fa-trash", "Ya, Hapus"))) return;
    showLoading("Menghapus...");
    await apiAction({ action: "delete_user", username: uname });
    hideLoading();
    renderMasterHeaderStats();
    if (window._soloStatsViewState && window._soloStatsViewState.open) renderSoloStatsModal();
    showToast("Akun dihapus.", "info");
}

async function topUpCabangRealTime(uname, amt, btn, reopenModal = false) {
    setBtnLoading(btn, true, "...");
    const targetU = (db.users || []).find(u => _normAdminUserKey(u.username) === _normAdminUserKey(uname));
    const beforeBal = Number((targetU && targetU.quota) || 0);
    await apiAction({ action: "topup_quota", username: uname, amount: amt });
    const freshU = (db.users || []).find(u => _normAdminUserKey(u.username) === _normAdminUserKey(uname)) || targetU;
    if (freshU && typeof recordCoinMutation === "function") {
        const afterBal = Number(freshU.quota || (beforeBal + amt));
        const updatedU = Object.assign({}, freshU, { quota: afterBal });
        recordCoinMutation(updatedU, amt, "Top-Up Coin dari Founder", "Penambahan saldo langsung oleh Founder", afterBal);
        await apiAction({ action: "upsert_user", oldUsername: freshU.username, user: updatedU });
    }
    renderMasterHeaderStats();
    if (window._soloStatsViewState && window._soloStatsViewState.open) renderSoloStatsModal();
    if (reopenModal) viewUserProfileModal(uname, true);
    showToast(`+${amt} Coin ditambahkan!`);
}

async function sendFounderBonusCoinFromProfile(uname, presetAmt = null, btnEl = null) {
    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!curU || curU.role !== "master") return showToast("Hanya Founder yang dapat mengirim Bonus Coin.", "error");

    const cleanU = _normAdminUserKey(uname);
    const targetU = (db.users || []).find(u => _normAdminUserKey(u.username) === cleanU);
    if (!targetU) return showToast("Akun penerima tidak ditemukan.", "error");
    if (targetU.role !== "cabang" && !(targetU.role === "user" && targetU.isPro)) {
        return showToast("Hanya akun User PRO atau Admin Cabang yang dapat menerima Coin.", "error");
    }

    const inpEl = document.getElementById("mvp-bonus-coin-inp");
    const amt = presetAmt !== null
        ? Math.round(Number(presetAmt || 0))
        : Math.round(Number((inpEl && inpEl.value) || 0));
    if (!amt || amt <= 0) return showToast("Masukkan jumlah Coin yang valid (minimal 1).", "error");

    const ok = await showConfirm(
        "Kirim Bonus Coin",
        `Kirim bonus +${amt} Coin ke ${targetU.name || targetU.username} (@${targetU.username})? Tercatat di riwayat transaksi sebagai "Bonus dari Founder".`,
        "fa-solid fa-gift",
        `Kirim +${amt} Coin`
    );
    if (!ok) return;

    if (btnEl) setBtnLoading(btnEl, true, "Mengirim...");
    const beforeBal = Number(targetU.quota || 0);
    const afterBal = beforeBal + amt;
    const updatedU = Object.assign({}, targetU, { quota: afterBal });
    if (typeof recordCoinMutation === "function") {
        recordCoinMutation(updatedU, amt, "Bonus dari Founder", "Bonus Coin langsung dari Founder", afterBal);
    }

    const res = await apiAction({ action: "upsert_user", oldUsername: targetU.username, user: updatedU });
    if (btnEl) setBtnLoading(btnEl, false);
    if (!res || !res.ok) return showToast((res && res.message) || "Gagal mengirim Bonus Coin.", "error");

    if (typeof ensureUserInLocalDb === "function") ensureUserInLocalDb(updatedU);
    if (inpEl) inpEl.value = "";
    renderMasterHeaderStats();
    viewUserProfileModal(cleanU, true);
    showToast(`Bonus +${amt} Coin terkirim ke @${targetU.username}!`);
}

// ================= 7. BANNER PROMOSI & HARGA CV =================
function pickCroppedPromoBanner(inp) {
    const file = inp.files[0]; if (!file) return; inp.value = "";
    openImageCropper(file, 12 / 4.4, "Crop Banner Promosi (12 : 4.4)", 1200, 440, async (dataUrl) => {
        showLoading("Mengunggah banner promosi...");
        const up = await apiAction({ action: "upload_media", dataUrl, prefix: "promo_banner" });
        hideLoading();
        if (up && up.ok && up.url) {
            pbTempUploadedImg = up.url;
            document.getElementById("pb-preview-img").src = up.url;
            document.getElementById("pb-img-url").value = up.url;
            showToast("Foto banner siap disimpan!");
        } else showToast("Gagal mengunggah foto.", "error");
    });
}

function resetPromoBannerForm() {
    pbTempUploadedImg = "";
    ["pb-id","pb-badge","pb-cta","pb-title","pb-sub","pb-img-url"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    document.getElementById("pb-preview-img").src = IMG("1519741497674-611481863552");
}

async function savePromoBannerForm(e) {
    e.preventDefault(); setBtnLoading("btn-save-pb", true, "Menyimpan...");
    const idVal = document.getElementById("pb-id").value;
    const tgt = document.getElementById("pb-target").value;
    const img = pbTempUploadedImg || document.getElementById("pb-img-url").value.trim() || document.getElementById("pb-preview-img").src || IMG("1519741497674-611481863552");
    const slide = {
        id: idVal ? Number(idVal) : Date.now(),
        badge: document.getElementById("pb-badge").value.trim() || "PROMO",
        ctaText: document.getElementById("pb-cta").value.trim() || "Lihat Promo",
        title: document.getElementById("pb-title").value.trim(),
        subtitle: document.getElementById("pb-sub").value.trim(),
        targetType: (tgt === "login" || tgt === "chat" || tgt === "gowes") ? tgt : "section",
        targetSection: (tgt === "login" || tgt === "chat" || tgt === "gowes") ? "" : tgt,
        img
    };
    const list = [...(db.promoBanners || [])];
    const idx = list.findIndex(x => String(x.id) === String(slide.id));
    if (idx >= 0) list[idx] = slide; else list.push(slide);
    db.promoBanners = list;
    idbSet("db_snapshot", db);
    const res = await apiAction({ action: "update_section", section: "promoBanners", value: list });
    setBtnLoading("btn-save-pb", false);
    if (res && res.ok) { pbTempUploadedImg = ""; renderMasterWorkspaceContent(); showToast("Banner promosi beranda tersimpan permanen!"); }
    else showToast("Gagal menyimpan banner.", "error");
}

function editPromoBannerItem(i) {
    const b = (db.promoBanners || [])[i]; if (!b) return;
    pbTempUploadedImg = "";
    document.getElementById("pb-id").value = b.id;
    document.getElementById("pb-badge").value = b.badge || "";
    document.getElementById("pb-cta").value = b.ctaText || "";
    document.getElementById("pb-title").value = b.title || "";
    document.getElementById("pb-sub").value = b.subtitle || "";
    document.getElementById("pb-target").value = (b.targetType === "login" || b.targetType === "chat" || b.targetType === "gowes") ? b.targetType : (b.targetSection || "sec-undangan");
    document.getElementById("pb-img-url").value = b.img || "";
    document.getElementById("pb-preview-img").src = b.img || IMG("1519741497674-611481863552");
    showToast(`Mengedit banner "${b.title}"`, "info");
}

async function deletePromoBannerItem(i) {
    if ((db.promoBanners || []).length <= 1) return showToast("Minimal harus menyisakan 1 banner promosi.", "info");
    const list = [...(db.promoBanners || [])]; list.splice(i, 1);
    db.promoBanners = list;
    showLoading("Menghapus banner..."); await apiAction({ action: "update_section", section: "promoBanners", value: list });
    hideLoading(); renderMasterWorkspaceContent();
}

async function saveCvThemePrice(themeId, docTypeOrBtn, maybeBtn) {
    const btn = typeof docTypeOrBtn === "string" ? maybeBtn : docTypeOrBtn;
    const docType = typeof docTypeOrBtn === "string" ? docTypeOrBtn : (String(themeId || "").startsWith("lam_") ? "lamaran" : "cv");
    const origPrice = Number(document.getElementById(`cvp-orig-${themeId}`)?.value || 0);
    const price = Number(document.getElementById(`cvp-sell-${themeId}`)?.value || 20000);
    const defaultCoin = docType === "lamaran" ? 2 : 3;
    const coinCost = Math.max(1, Math.round(Number(document.getElementById(`cvp-coin-${themeId}`)?.value || defaultCoin)));
    setBtnLoading(btn, true, "...");
    const ov = Object.assign({}, db.cvPriceOverrides || {});
    ov[themeId] = { origPrice, price, coinCost };
    db.cvPriceOverrides = ov;
    idbSet("db_snapshot", db);
    await apiAction({ action: "update_section", section: "cvPriceOverrides", value: ov });
    setBtnLoading(btn, false);
    showToast(`Harga & tarif ${coinCost} Coin diperbarui permanen!`);
}

async function saveMasterCoinPackages(btn) {
    const rows = Array.from(document.querySelectorAll(".coin-pkg-row"));
    if (!rows.length) return;
    const coinPackages = rows.map((row, idx) => ({
        id: row.dataset.pkgId || ("pkg_" + idx),
        name: (row.querySelector(".cpk-name")?.value || "").trim() || ("Paket " + (idx + 1)),
        badge: (row.querySelector(".cpk-badge")?.value || "").trim(),
        price: Math.max(1000, Math.round(Number(row.querySelector(".cpk-price")?.value || 100000))),
        paidCoins: Math.max(1, Math.round(Number(row.querySelector(".cpk-paid")?.value || 20))),
        bonusCoins: Math.max(0, Math.round(Number(row.querySelector(".cpk-bonus")?.value || 0)))
    }));
    const proUpgradePrice = Math.max(1000, Math.round(Number(document.getElementById("mpro-price")?.value || 49000)));
    const proUpgradeBonusCoins = Math.max(0, Math.round(Number(document.getElementById("mpro-bonus-coins")?.value || 5)));

    setBtnLoading(btn, true, "Menyimpan...");
    const nextMs = Object.assign({}, db.masterSettings || {}, {
        coinPackages,
        proUpgradePrice,
        proUpgradeBonusCoins
    });
    db.masterSettings = nextMs;
    idbSet("db_snapshot", db);
    await apiAction({ action: "update_section", section: "masterSettings", value: nextMs });
    setBtnLoading(btn, false);
    renderMasterWorkspaceContent();
    showToast("Pricelist Coin & Harga Upgrade PRO tersimpan permanen!");
}

// ================= 8. VISUAL THEME BUILDER =================
function copyThemeDemoLink(cat, themeName) {
    navigator.clipboard.writeText(`${getCleanBaseUrl()}?demo=${encodeURIComponent(cat)}&theme=${encodeURIComponent(themeName)}`);
    showToast(`Link Demo "${themeName}" disalin!`);
}

function switchThemeBuilderTab(tab) {
    ["design", "photos", "demo"].forEach(k => document.getElementById(`tb-pane-${k}`)?.classList.toggle("hide", k !== tab));
    document.querySelectorAll(".tb-tab-btn").forEach(b => b.className = `tb-tab-btn px-3.5 py-1.5 rounded-xl text-xs font-bold ${b.dataset.tbt === tab ? "gold-pill-btn" : "app-btn-sec"}`);
    if (tab === "photos") renderThemeBuilderPhotoSlots();
}

function renderThemeBuilderPhotoSlots() {
    const slots = [
        { key:"cover", label:"★ Sampul Utama (9:16)", fb:IMG("1519741497674-611481863552") },
        { key:"pria", label:"Mempelai Pria (4:5)", fb:"./assets/model-pria.jpg" },
        { key:"wanita", label:"Mempelai Wanita (4:5)", fb:"./assets/model-wanita.jpg" },
        { key:"couple", label:"Foto Berdua Digabung (4:5)", fb:IMG("1515934751635-c81c6bc9a2d8") },
        { key:"g1", label:"Galeri Polaroid #1", fb:IMG("1519741497674-611481863552") },
        { key:"g2", label:"Galeri Polaroid #2", fb:IMG("1511285560929-80b456fea0bc") },
        { key:"g3", label:"Galeri Polaroid #3", fb:IMG("1522673607200-164d1b6ce486") }
    ];
    const grid = document.getElementById("tb-photo-slots-grid"); if (!grid) return;
    grid.innerHTML = slots.map(s => {
        const cur = tbPhotosDraft[s.key] || "";
        return `<div class="app-card-soft border rounded-2xl p-2.5 text-center space-y-2 relative">
            ${cur ? `<button type="button" onclick="clearThemeBuilderPhoto('${s.key}')" class="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 text-white text-[10px]" title="Reset"><i class="fa-solid fa-rotate-left"></i></button>` : ""}
            <span class="text-[10px] font-bold app-accent block truncate">${s.label}</span>
            <img src="${cur || s.fb}" ${imgFbAttr(IMG("1519741497674-611481863552"))} class="w-full h-28 object-cover rounded-xl bg-black border gold-border">
            <label class="block gold-pill-btn py-1.5 rounded-lg text-[10px] cursor-pointer"><i class="fa-solid fa-crop-simple mr-1"></i>${cur?"Ganti Foto":"Upload Foto"}<input type="file" accept="image/*" class="hide" onchange="pickThemeBuilderPhoto(this,'${s.key}')"></label>
        </div>`;
    }).join("");
}

function clearThemeBuilderPhoto(slotKey) {
    tbPhotosDraft[slotKey] = "";
    renderThemeBuilderPhotoSlots();
    if (slotKey === "cover") document.getElementById("tb-live-img").src = IMG("1519741497674-611481863552");
}

function pickThemeBuilderPhoto(inp, slotKey) {
    const file = inp.files[0]; if (!file) return; inp.value = "";
    const isCover = slotKey === "cover";
    openImageCropper(file, isCover ? 9 / 16 : 4 / 5, isCover ? "Sampul Utama Tema (9:16)" : `Foto Template (${slotKey})`, isCover ? 720 : 640, isCover ? 1280 : 800, async (dataUrl) => {
        showLoading("Mengunggah foto template...");
        const up = await apiAction({ action: "upload_media", dataUrl, prefix: `tpl_${slotKey}` });
        hideLoading();
        if (up && up.ok && up.url) {
            tbPhotosDraft[slotKey] = up.url;
            if (isCover) document.getElementById("tb-live-img").src = up.url;
            renderThemeBuilderPhotoSlots();
            showToast("Foto template siap! Klik Simpan Tema.");
        } else showToast("Gagal mengunggah foto.", "error");
    });
}

function openThemeBuilderModal(cat = null, themeName = null, isDuplicate = false) {
    const isEdit = !!(cat && themeName), tObj = isEdit ? findThemeObject(cat, themeName) : null;
    const preset = (tObj && VISUAL_PRESETS[tObj.preset]) || VISUAL_PRESETS["dark-gold"];
    const c = (tObj && tObj.customColors) || {}, dp = (tObj && tObj.demoPhotos) || {}, dm = (tObj && tObj.demoData) || {};
    const activeCat = (tObj && tObj.cat) || (THEME_CATALOG[masterThemeCatFilter] ? masterThemeCatFilter : "Pernikahan");
    const baseDemo = typeof buildDemoInvitation === "function" ? buildDemoInvitation(activeCat, (tObj && tObj.name) || "") : {};

    tbPhotosDraft = { cover: dp.cover || (tObj && tObj.customCover) || (tObj && tObj.isCustom && tObj.img ? tObj.img : ""), pria: dp.pria || "", wanita: dp.wanita || "", couple: dp.couple || "", g1: dp.g1 || "", g2: dp.g2 || "", g3: dp.g3 || "" };

    document.getElementById("tb-modal-title").innerText = isDuplicate ? `Duplikat Tema: ${themeName}` : isEdit ? `Edit Tema: ${themeName}` : "Buat Tema Baru";
    document.getElementById("tb-id").value = (!isDuplicate && tObj && tObj.isCustom) ? tObj.id : "";
    document.getElementById("tb-orig-key").value = (!isDuplicate && tObj && !tObj.isCustom) ? tObj.key : "";
    document.getElementById("tb-cat").value = activeCat;
    document.getElementById("tb-cat").disabled = (!isDuplicate && isEdit && tObj && !tObj.isCustom);
    document.getElementById("tb-name").value = isDuplicate ? `${tObj.name} (Copy)` : (tObj ? tObj.name : "");
    document.getElementById("tb-name").readOnly = (!isDuplicate && isEdit && tObj && !tObj.isCustom);
    document.getElementById("tb-badge").value = (tObj && tObj.badge) || "";
    document.getElementById("tb-orig-price").value = (tObj && tObj.origPrice) ? tObj.origPrice : 175000;
    document.getElementById("tb-price").value = (tObj && tObj.price) ? tObj.price : 99000;
    const tbCoinEl = document.getElementById("tb-coin-cost");
    if (tbCoinEl) tbCoinEl.value = getThemeCoinCost(activeCat, tObj);

    const layoutVal = (tObj && (tObj.layout || tObj.style || tObj.coupleMode)) || "kalimantan_story";
    document.getElementById("tb-layout").value = ["kalimantan_story","premium_black","split","combined","sulawesi","classic_card"].includes(layoutVal) ? layoutVal : "kalimantan_story";
    document.getElementById("tb-frame").value = (tObj && tObj.frame) || "arch";
    document.getElementById("tb-transition").value = (tObj && tObj.transition) || "random";
    document.getElementById("tb-ornament").value = (tObj && tObj.ornament) || "leaf";
    document.getElementById("tb-photo-filter").value = (tObj && tObj.photoFilter) || "none";
    document.getElementById("tb-font").value = (tObj && tObj.font) || preset.vars["--th-font-heading"] || "'Playfair Display',serif";

    const cleanHex = (val, fb) => (val && /^#[0-9a-f]{6}$/i.test(val)) ? val : fb;
    document.getElementById("tb-c-bg").value = cleanHex(c.bg || preset.vars["--th-bg"], "#0a0a0a");
    document.getElementById("tb-c-card").value = cleanHex(c.card, "#18181b");
    document.getElementById("tb-c-text").value = cleanHex(c.text || preset.vars["--th-text"], "#f8fafc");
    document.getElementById("tb-c-accent").value = cleanHex(c.accent || preset.vars["--th-accent"], "#eab308");

    document.getElementById("tb-demo-title").value = dm.title || baseDemo.title || "Aqila & Fauzi";
    document.getElementById("tb-demo-groom").value = dm.groom || baseDemo.groomName || baseDemo.subTitle || "Fauzi Ramadhan, S.T.";
    document.getElementById("tb-demo-gparents").value = dm.gparents || baseDemo.groomParents || "Putra Bapak H. Hendra & Ibu Hj. Aminah";
    document.getElementById("tb-demo-bride").value = dm.bride || baseDemo.brideName || "Aqila Putri, S.E.";
    document.getElementById("tb-demo-bparents").value = dm.bparents || baseDemo.brideParents || "Putri Bapak H. Syamsul & Ibu Hj. Rahmawati";
    document.getElementById("tb-demo-date").value = dm.date || baseDemo.akadDate || "2027-02-21";
    document.getElementById("tb-demo-venue").value = dm.venue || baseDemo.akadVenue || "Gedung Serbaguna";
    document.getElementById("tb-demo-address").value = dm.address || baseDemo.akadAddress || "Jl. Mulawarman No. 171, Samarinda";

    document.getElementById("tb-default-audio").innerHTML = `<option value="">-- Tanpa Lagu Bawaan --</option>` + (db.musicLibrary || []).map(m => `<option value="${esc(m.url)}" ${(tObj && tObj.defaultAudio === m.url) ? "selected" : ""}>🎵 [${escHtml(m.category)}] ${escHtml(m.title)}</option>`).join("");

    const cov = tObj ? getThemeCoverPair(tObj.cat, tObj) : { src: IMG("1519741497674-611481863552"), fb: IMG("1519741497674-611481863552") };
    const liveImg = document.getElementById("tb-live-img");
    liveImg.dataset.fb = cov.fb;
    liveImg.onerror = function() { if (this.dataset.fb && this.src !== this.dataset.fb) { this.src = this.dataset.fb; this.dataset.fb = ""; } };
    liveImg.src = tbPhotosDraft.cover || cov.src;

    switchThemeBuilderTab("design"); updateThemeBuilderPreview();
    document.getElementById("modal-theme-builder").classList.remove("hide");
    _pushAdminNavStep({ type: "modal", id: "modal-theme-builder" });
}

function closeThemeBuilderModal() {
    document.getElementById("modal-theme-builder").classList.add("hide");
    if (typeof _mrDropTopModalById === "function") _mrDropTopModalById("modal-theme-builder");
}

function applyQuickColorPalette(key) {
    const map = { maroon:{bg:"#5c0a12",card:"#4a080f",text:"#fdf6ec",accent:"#f3d285"}, black:{bg:"#070709",card:"#121216",text:"#f4f4f5",accent:"#ffffff"}, emerald:{bg:"#04362a",card:"#074738",text:"#ecfdf5",accent:"#facc15"}, ivory:{bg:"#f7f4ef",card:"#ffffff",text:"#3b352f",accent:"#8c7658"}, navy:{bg:"#172433",card:"#1f3146",text:"#f1f5f9",accent:"#dbeafe"} };
    const p = map[key]; if (!p) return;
    document.getElementById("tb-c-bg").value = p.bg; document.getElementById("tb-c-card").value = p.card; document.getElementById("tb-c-text").value = p.text; document.getElementById("tb-c-accent").value = p.accent;
    updateThemeBuilderPreview();
}

function updateThemeBuilderPreview() {
    const demoTitle = document.getElementById("tb-demo-title").value.trim() || "Aqila & Fauzi";
    const badge = document.getElementById("tb-badge").value, font = document.getElementById("tb-font").value;
    const bg = document.getElementById("tb-c-bg").value, accent = document.getElementById("tb-c-accent").value;
    const filter = document.getElementById("tb-photo-filter").value;
    const origP = Number(document.getElementById("tb-orig-price").value || 0), price = Number(document.getElementById("tb-price").value || 0);
    document.getElementById("tb-live-card").style.backgroundColor = bg;
    document.getElementById("tb-live-img").style.filter = filter === "mono" ? "grayscale(100%) contrast(1.08)" : filter === "vintage" ? "sepia(24%)" : "none";
    const bEl = document.getElementById("tb-live-badge"); bEl.innerText = badge; bEl.classList.toggle("hide", !badge);
    const tEl = document.getElementById("tb-live-title"); tEl.innerText = demoTitle; tEl.style.fontFamily = font; tEl.style.color = accent;
    const btnEl = document.getElementById("tb-live-btn"); btnEl.style.background = accent; btnEl.style.color = (["#ffffff","#f3d285","#eab308","#facc15","#dbeafe"].includes(accent.toLowerCase())) ? "#111" : "#fff";
    const hasDisc = origP > price && price > 0;
    document.getElementById("tb-live-price-row").innerHTML = hasDisc ? `<span class="line-through opacity-65 text-[9px] mr-1">${fmtRp(origP)}</span><span>${fmtRp(price)}</span>` : `<span>${fmtRp(price || 99000)}</span>`;
}

async function submitVisualThemeBuilder(e) {
    e.preventDefault();
    const idVal = document.getElementById("tb-id").value, origKey = document.getElementById("tb-orig-key").value;
    const cat = document.getElementById("tb-cat").value, name = document.getElementById("tb-name").value.trim();
    if (!name) return showToast("Nama tema wajib diisi.", "error");
    const layout = document.getElementById("tb-layout").value;
    const cleanDemoPhotos = {}; Object.keys(tbPhotosDraft).forEach(k => { if (tbPhotosDraft[k]) cleanDemoPhotos[k] = tbPhotosDraft[k]; });
    const demoData = { title:document.getElementById("tb-demo-title").value.trim(), groom:document.getElementById("tb-demo-groom").value.trim(), gparents:document.getElementById("tb-demo-gparents").value.trim(), bride:document.getElementById("tb-demo-bride").value.trim(), bparents:document.getElementById("tb-demo-bparents").value.trim(), date:document.getElementById("tb-demo-date").value.trim(), venue:document.getElementById("tb-demo-venue").value.trim(), address:document.getElementById("tb-demo-address").value.trim() };
    const themeData = {
        category: cat, name, badge: document.getElementById("tb-badge").value,
        origPrice: Number(document.getElementById("tb-orig-price").value || 0), price: Number(document.getElementById("tb-price").value || 99000),
        coinCost: Math.max(1, Math.round(Number(document.getElementById("tb-coin-cost")?.value || (cat === "Pernikahan" ? 12 : 7)))),
        layout, style: layout, coupleMode: (layout === "combined") ? "combined" : "split",
        frame: document.getElementById("tb-frame").value, transition: document.getElementById("tb-transition").value,
        ornament: document.getElementById("tb-ornament").value, photoFilter: document.getElementById("tb-photo-filter").value,
        font: document.getElementById("tb-font").value, defaultAudio: document.getElementById("tb-default-audio").value,
        customColors: { bg: document.getElementById("tb-c-bg").value, card: document.getElementById("tb-c-card").value, text: document.getElementById("tb-c-text").value, accent: document.getElementById("tb-c-accent").value },
        demoPhotos: cleanDemoPhotos, demoData, customCover: cleanDemoPhotos.cover || ""
    };
    setBtnLoading("btn-tb-save", true, "Menyimpan...");
    if (origKey) {
        const ov = Object.assign({}, db.themeOverrides || {});
        ov[origKey] = Object.assign({}, deepCloneSafe(ov[origKey] || {}), themeData);
        db.themeOverrides = ov;
        idbSet("db_snapshot", db);
        await apiAction({ action: "update_section", section: "themeOverrides", value: ov });
    } else {
        const list = [...(db.customThemes || [])];
        themeData.img = cleanDemoPhotos.cover || IMG("1519741497674-611481863552");
        if (idVal) { const idx = list.findIndex(x => String(x.id) === String(idVal)); if (idx >= 0) list[idx] = Object.assign({}, list[idx], themeData, { id: list[idx].id }); else list.unshift(Object.assign({ id: Date.now() }, themeData)); }
        else list.unshift(Object.assign({ id: Date.now() }, themeData));
        db.customThemes = list;
        idbSet("db_snapshot", db);
        await apiAction({ action: "update_section", section: "customThemes", value: list });
    }
    setBtnLoading("btn-tb-save", false); closeThemeBuilderModal(); renderMasterHeaderStats(); renderMasterWorkspaceContent();
    showToast(`Tema "${name}" tersimpan permanen!`);
}

async function deleteCustomTheme(id, name) {
    if (!(await showConfirm("Hapus Tema", `Hapus permanen tema "${name}"?`, "fa-solid fa-trash", "Ya, Hapus"))) return;
    showLoading("Menghapus..."); await apiAction({ action: "update_section", section: "customThemes", value: (db.customThemes || []).filter(t => String(t.id) !== String(id)) });
    hideLoading(); renderMasterWorkspaceContent(); showToast("Tema dihapus.", "info");
}

async function toggleHideBuiltInTheme(key, hideIt) {
    showLoading("Memperbarui...");
    let hid = [...(db.hiddenThemes || [])];
    if (hideIt && !hid.includes(key)) hid.push(key);
    if (!hideIt) hid = hid.filter(k => k !== key);
    await apiAction({ action: "update_section", section: "hiddenThemes", value: hid });
    hideLoading(); renderMasterWorkspaceContent(); showToast(hideIt ? "Tema disembunyikan." : "Tema dipulihkan!");
}

// ================= 9. REKENING, QRIS DANA, MUSIK & TESTIMONI =================
function addMasterBankRow(bk = "BCA", no = "", holder = "") {
    const box = document.getElementById("ms-banks-container"); if (!box) return;
    const div = document.createElement("div"); div.className = "app-card-soft border rounded-xl p-2.5 space-y-2 ms-bank-row";
    div.innerHTML = `<div class="flex gap-1.5 items-center"><select class="ms-bk app-input !py-1.5 font-bold flex-1">${Object.keys(BANK_LOGOS).map(k => `<option value="${k}" ${k===bk?"selected":""}>${k}</option>`).join("")}</select><button type="button" onclick="removeMasterBankRow(this)" class="px-2.5 py-1.5 rounded-lg bg-red-600/15 text-red-500 text-xs"><i class="fa-solid fa-trash"></i></button></div><input type="text" value="${esc(no)}" placeholder="No. Rekening / DANA" class="ms-no app-input !py-1.5"><input type="text" value="${esc(holder)}" placeholder="Atas Nama" class="ms-ho app-input !py-1.5">`;
    box.appendChild(div);
}

function removeMasterBankRow(btn) {
    if (document.querySelectorAll(".ms-bank-row").length <= 1) return showToast("Minimal harus menyisakan 1 rekening.", "info");
    btn.closest(".ms-bank-row").remove();
}

async function uploadMasterQRIS(inp) {
    if (!inp.files[0]) return;
    showLoading("Mengunggah QRIS...");
    const b64 = await quickResizeImage(inp.files[0], 540);
    const up = await apiAction({ action: "upload_media", dataUrl: b64, prefix: "qris" });
    if (up && up.ok && up.url) {
        await apiAction({ action: "update_section", section: "masterSettings", value: Object.assign({}, db.masterSettings, { qrisImage: up.url }) });
        document.getElementById("ms-qris-prev").src = up.url;
        showToast("Gambar QRIS Tetap diperbarui!");
    } else showToast("Gagal mengunggah QRIS.", "error");
    hideLoading();
}

async function saveMasterSettings() {
    const banks = Array.from(document.querySelectorAll(".ms-bank-row")).map(r => ({
        bank: r.querySelector(".ms-bk").value, no: r.querySelector(".ms-no").value.trim(), holder: r.querySelector(".ms-ho").value.trim()
    })).filter(b => b.no);
    if (!banks.length) return showToast("Isi minimal 1 nomor rekening.", "error");
    const qrisMode = document.getElementById("ms-qris-mode").value;
    const qrisDynamicString = document.getElementById("ms-qris-dyn-str").value.trim();
    if (qrisMode === "dynamic" && !qrisDynamicString.startsWith("000201")) {
        return showToast("Untuk QRIS Dinamis, unggah foto QRIS DANA Bisnis atau tempel teks datanya dulu.", "error");
    }
    setBtnLoading("btn-save-qris", true, "Menyimpan...");
    await apiAction({
        action: "update_section", section: "masterSettings",
        value: Object.assign({}, db.masterSettings, {
            banks, bankName: banks[0].bank, bankNo: banks[0].no, bankHolder: banks[0].holder,
            priceText: document.getElementById("ms-p").value.trim(),
            qrisMode, qrisDynamicString, qrisUniqueCode: document.getElementById("ms-qris-unique").checked
        })
    });
    setBtnLoading("btn-save-qris", false);
    toggleSlideMenu(false);
    showToast(`Pembayaran tersimpan (Mode: ${qrisMode === "dynamic" ? "QRIS Dinamis DANA" : "QRIS Tetap"})!`);
}

function exportDB() {
    const a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    a.download = "backup_lembarku.json";
    a.click();
}

async function addStockSong(e) {
    e.preventDefault();
    setBtnLoading("btn-add-song", true, "Menyimpan...");
    const list = [...(db.musicLibrary || []), {
        id: Date.now(),
        title: document.getElementById("song-title").value.trim(),
        category: document.getElementById("song-cat").value.trim(),
        url: document.getElementById("song-url").value.trim()
    }];
    db.musicLibrary = list;
    await apiAction({ action: "update_section", section: "musicLibrary", value: list });
    setBtnLoading("btn-add-song", false);
    document.getElementById("song-title").value = "";
    document.getElementById("song-url").value = "";
    renderMasterWorkspaceContent();
    showToast("Lagu ditambahkan!");
}

async function delStockSong(i) {
    stopAdminStockSongPreview();
    const list = [...db.musicLibrary];
    list.splice(i, 1);
    db.musicLibrary = list;
    showLoading("Menghapus...");
    await apiAction({ action: "update_section", section: "musicLibrary", value: list });
    hideLoading();
    renderMasterWorkspaceContent();
}

async function addTestimonial(e) {
    e.preventDefault();
    setBtnLoading("btn-add-testi", true, "Menyimpan...");
    const list = [{
        id: Date.now(),
        name: document.getElementById("t-name").value.trim(),
        category: document.getElementById("t-cat").value.trim(),
        rating: 5,
        text: document.getElementById("t-text").value.trim()
    }, ...(db.testimonials || [])];
    db.testimonials = list;
    await apiAction({ action: "update_section", section: "testimonials", value: list });
    setBtnLoading("btn-add-testi", false);
    document.getElementById("t-name").value = "";
    document.getElementById("t-cat").value = "";
    document.getElementById("t-text").value = "";
    renderMasterWorkspaceContent();
    showToast("Testimoni ditambahkan!");
}

async function delTestimonial(i) {
    const list = [...db.testimonials];
    list.splice(i, 1);
    db.testimonials = list;
    showLoading("Menghapus...");
    await apiAction({ action: "update_section", section: "testimonials", value: list });
    hideLoading();
    renderMasterWorkspaceContent();
}
