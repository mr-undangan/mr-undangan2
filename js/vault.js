// =========================================================================
// LEMBARKU — SOROTAN ALBUM & BRANKAS RAHASIA ALA GALERI iPHONE (js/vault.js)
// =========================================================================
const vaultCache = {};
let activeVaultOwner = "";
let activeSecretAlbumId = "";
let pendingPinAlbum = null;
let pendingDriveAlbum = null;
let afTempCoverUrl = "";
let lightboxPhotos = [];
let lightboxIndex = 0;
let lightboxCanDelete = false;
let activeVaultInnerTab = "photos";

function formatShortUploadDate(ts) {
    if (!ts) return "";
    const d = new Date(Number(ts));
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "2-digit" });
}

async function loadUserVault(username, force = false) {
    const uname = String(username || "").toLowerCase();
    if (!uname) return null;
    if (!force && vaultCache[uname]) return vaultCache[uname];
    try {
        const tok = (typeof currentSessionToken !== "undefined" && currentSessionToken) ? currentSessionToken : "";
        const res = await fetch(`${CLOUD_API_URL}?action=get_vault&username=${encodeURIComponent(uname)}&token=${encodeURIComponent(tok)}&t=${Date.now()}`, { cache: "no-store" });
        const json = await res.json();
        if (json && json.ok && json.vault) {
            vaultCache[uname] = {
                albums: json.vault.albums || [],
                usedBytes: Number(json.vault.usedBytes || 0),
                isPro: !!json.isPro,
                limitBytes: Number(json.limitBytes || (2 * 1024 * 1024 * 1024))
            };
            return vaultCache[uname];
        }
    } catch {}
    return vaultCache[uname] || { albums: [], usedBytes: 0, isPro: false, limitBytes: 2 * 1024 * 1024 * 1024 };
}

// Sampul album bersih tanpa tombol edit di luar (pengaturan ada di dalam album / menu Drive)
async function renderProfileAlbumHighlights(containerId, countLblId, username) {
    const box = document.getElementById(containerId); if (!box) return;
    const uname = String(username || "").toLowerCase();
    activeVaultOwner = uname;

    if (!vaultCache[uname]) {
        box.innerHTML = buildAddHighlightTileHtml() + `<div class="highlight-box opacity-50"><div class="highlight-thumb flex items-center justify-center"><i class="fa-solid fa-circle-notch fa-spin app-accent"></i></div><span class="text-[10px] app-muted">Memuat...</span></div>`;
    }

    const v = await loadUserVault(uname, false);
    const albums = v.albums || [];
    const cntEl = document.getElementById(countLblId);
    if (cntEl) cntEl.innerText = `${albums.length} Album`;

    box.innerHTML = buildAddHighlightTileHtml() + albums.map(alb => {
        const isSecret = alb.type === "secret";
        const isLocked = !!(alb.pinEnabled && (alb.pin || alb.hasPin));
        const cov = alb.cover || (alb.photos && alb.photos[0] && alb.photos[0].url) || "";
        const inner = cov
            ? `<img src="${cov}" class="w-full h-full object-cover rounded-[0.95rem]">`
            : `<div class="w-full h-full rounded-[0.95rem] app-card-soft flex items-center justify-center text-2xl app-accent"><i class="fa-${isSecret ? "solid fa-vault" : "brands fa-google-drive"}"></i></div>`;
        const badgeIcon = isSecret
            ? (isLocked ? `<span class="absolute bottom-1 right-1 w-5 h-5 rounded-md bg-black/75 text-amber-300 text-[9px] flex items-center justify-center"><i class="fa-solid fa-lock"></i></span>` : `<span class="absolute bottom-1 right-1 w-5 h-5 rounded-md bg-black/70 text-white text-[9px] flex items-center justify-center"><i class="fa-solid fa-images"></i></span>`)
            : `<span class="absolute bottom-1 right-1 w-5 h-5 rounded-md bg-white/90 text-emerald-600 text-[9px] flex items-center justify-center shadow"><i class="fa-brands fa-google-drive"></i></span>`;

        return `
            <div class="highlight-box group relative" onclick="handleHighlightClick('${esc(uname)}','${esc(alb.id)}')">
                <div class="highlight-thumb">
                    ${inner}
                    ${badgeIcon}
                </div>
                <span class="text-[11px] font-semibold text-center w-full truncate leading-tight">${escHtml(alb.title)}</span>
            </div>
        `;
    }).join("");
}

function buildAddHighlightTileHtml() {
    return `
        <div class="highlight-box" onclick="openAddAlbumChoiceModal()">
            <div class="highlight-thumb border-dashed flex flex-col items-center justify-center app-card-soft">
                <i class="fa-solid fa-plus text-xl app-accent"></i>
                <span class="text-[9px] font-bold app-muted mt-0.5">Baru</span>
            </div>
            <span class="text-[11px] font-bold app-accent text-center w-full truncate">Tambah</span>
        </div>
    `;
}

function openAddAlbumChoiceModal() {
    document.getElementById("modal-add-album-choice").classList.remove("hide");
    if (typeof pushBackGuard === "function") pushBackGuard();
}

function openAlbumFormModal(type, editAlb = null) {
    document.getElementById("modal-add-album-choice").classList.add("hide");
    const isSecret = type === "secret";
    const curU = getCurrentUserObj();
    const isMaster = curU && curU.role === "master";
    const hasExistingPin = !!(isSecret && editAlb && editAlb.pinEnabled && (editAlb.pin || editAlb.hasPin) && !isMaster);

    afTempCoverUrl = editAlb ? (editAlb.cover || "") : "";
    document.getElementById("af-title-head").innerText = editAlb
        ? `Pengaturan ${isSecret ? "Album Rahasia" : "Album Drive"}`
        : (isSecret ? "Buat Album Rahasia Baru" : "Tautkan Link Google Drive");
    document.getElementById("af-id").value = editAlb ? editAlb.id : "";
    document.getElementById("af-type").value = type;
    document.getElementById("af-cover-prev").src = afTempCoverUrl || "./lembarku-logo.png";
    document.getElementById("af-name").value = editAlb ? (editAlb.title || "") : "";
    document.getElementById("af-drive-url").value = editAlb ? (editAlb.driveUrl || "") : "";

    document.getElementById("af-drive-wrap").classList.toggle("hide", isSecret);
    document.getElementById("af-drive-url").required = !isSecret;
    document.getElementById("af-pin-wrap").classList.toggle("hide", !isSecret);

    const oldPinWrap = document.getElementById("af-old-pin-wrap");
    const oldPinInp = document.getElementById("af-old-pin-val");
    if (oldPinWrap && oldPinInp) {
        oldPinWrap.classList.toggle("hide", !hasExistingPin);
        oldPinInp.value = "";
        oldPinInp.required = hasExistingPin;
    }

    const pinOn = !!(isSecret && editAlb && editAlb.pinEnabled);
    document.getElementById("af-pin-toggle").checked = pinOn;
    document.getElementById("af-pin-input-box").classList.toggle("hide", !pinOn);
    document.getElementById("af-pin-val").value = (pinOn && isMaster && editAlb && editAlb.pin) ? editAlb.pin : "";

    const delBtn = document.getElementById("btn-af-delete");
    if (delBtn) delBtn.classList.toggle("hide", !editAlb);

    document.getElementById("modal-album-form").classList.remove("hide");
    if (typeof pushBackGuard === "function") pushBackGuard();
}

function openEditAlbumById(uname, albId) {
    const v = vaultCache[String(uname || "").toLowerCase()]; if (!v) return;
    const alb = (v.albums || []).find(a => String(a.id) === String(albId));
    if (!alb) return;
    activeVaultOwner = String(uname || "").toLowerCase();
    activeSecretAlbumId = alb.id;
    openAlbumFormModal(alb.type || "drive", alb);
}

function pickAlbumCoverFile(inp) {
    const file = inp.files[0]; if (!file) return; inp.value = "";
    openImageCropper(file, 1, "Atur Sampul Album (1:1)", 480, 480, async (dataUrl) => {
        showLoading("Mengunggah sampul album...");
        const up = await apiAction({ action: "upload_media", dataUrl, prefix: "alb_cov" });
        hideLoading();
        if (up && up.ok && up.url) {
            afTempCoverUrl = up.url;
            document.getElementById("af-cover-prev").src = up.url;
            showToast("Sampul album siap disimpan!");
        } else showToast("Gagal mengunggah sampul.", "error");
    });
}

async function submitVaultAlbumForm(e) {
    e.preventDefault();
    const type = document.getElementById("af-type").value;
    const id = document.getElementById("af-id").value;
    const title = document.getElementById("af-name").value.trim();
    const driveUrl = document.getElementById("af-drive-url").value.trim();
    const pinEnabled = type === "secret" && document.getElementById("af-pin-toggle").checked;
    const pin = pinEnabled ? document.getElementById("af-pin-val").value.trim() : "";
    const oldPin = (document.getElementById("af-old-pin-val")?.value || "").trim();

    if (!title) return showToast("Nama album wajib diisi.", "error");
    if (type === "drive" && !/^https?:\/\//i.test(driveUrl)) return showToast("Masukkan link folder Google Drive yang valid (diawali https://).", "error");
    if (pinEnabled && id && pin && !/^\d{4}$/.test(pin)) return showToast("PIN baru wajib terdiri dari 4 angka.", "error");
    if (pinEnabled && !id && !/^\d{4}$/.test(pin)) return showToast("PIN wajib terdiri dari 4 angka.", "error");

    const owner = (activeVaultOwner || currentSessionUser || "").toLowerCase();
    setBtnLoading("btn-af-save", true, "Menyimpan...");
    const res = await apiAction({
        action: "upsert_vault_album",
        username: owner,
        oldPin,
        album: { id: id || "", type, title, cover: afTempCoverUrl, driveUrl, pinEnabled, pin }
    });
    setBtnLoading("btn-af-save", false);

    if (res && res.ok && res.vault) {
        vaultCache[owner] = Object.assign(vaultCache[owner] || {}, res.vault);
        document.getElementById("modal-album-form").classList.add("hide");
        refreshCurrentHighlightsUI();
        if (type === "secret" && !document.getElementById("modal-secret-album").classList.contains("hide") && String(activeSecretAlbumId) === String(id)) {
            openSecretAlbumViewer(owner, id);
        }
        showToast("Pengaturan album tersimpan!");
    } else showToast((res && res.message) || "Gagal menyimpan album.", "error");
}

function refreshCurrentHighlightsUI() {
    if (currentViewName === "profile") renderProfileAlbumHighlights("prof-album-highlights", "prof-album-count-lbl", currentSessionUser);
    else if (currentViewName === "cabang") renderProfileAlbumHighlights("cabang-album-highlights", "cabang-album-count-lbl", currentSessionUser);
}

function handleHighlightClick(uname, albId) {
    const ownerKey = String(uname || "").toLowerCase();
    const v = vaultCache[ownerKey]; if (!v) return;
    const alb = (v.albums || []).find(a => String(a.id) === String(albId));
    if (!alb) return;

    const curU = getCurrentUserObj();
    const isOwner = curU && String(curU.username || "").toLowerCase() === ownerKey;
    const isMaster = curU && curU.role === "master";

    if (alb.type === "drive") {
        const modal = document.getElementById("modal-drive-album-actions");
        if (modal && (isOwner || isMaster)) {
            pendingDriveAlbum = { uname: ownerKey, alb };
            const covEl = document.getElementById("da-modal-cover");
            const titEl = document.getElementById("da-modal-title");
            const editBtn = document.getElementById("da-modal-edit-btn");
            if (covEl) covEl.src = alb.cover || "./lembarku-logo.png";
            if (titEl) titEl.innerText = alb.title || "Album Google Drive";
            if (editBtn) editBtn.classList.toggle("hide", !(isOwner || isMaster));
            modal.classList.remove("hide");
            if (typeof pushBackGuard === "function") pushBackGuard();
            return;
        }
        if (alb.driveUrl) window.open(alb.driveUrl, "_blank", "noopener,noreferrer");
        else showToast("Link Google Drive belum diisi.", "info");
        return;
    }

    const isLocked = !!(alb.pinEnabled && (alb.pin || alb.hasPin));
    if (isLocked && !isMaster) {
        pendingPinAlbum = { uname: ownerKey, alb };
        document.getElementById("pg-album-name").innerText = alb.title;
        const pinInp = document.getElementById("pg-pin-input");
        if (pinInp) pinInp.value = "";
        document.getElementById("modal-pin-gate").classList.remove("hide");
        setTimeout(() => pinInp?.focus(), 100);
        if (typeof pushBackGuard === "function") pushBackGuard();
        return;
    }
    openSecretAlbumViewer(ownerKey, alb.id);
}

function openSelectedDriveAlbumUrl() {
    const modal = document.getElementById("modal-drive-album-actions");
    if (modal) modal.classList.add("hide");
    if (!pendingDriveAlbum || !pendingDriveAlbum.alb) return;
    const url = String(pendingDriveAlbum.alb.driveUrl || "").trim();
    if (/^https?:\/\//i.test(url)) {
        window.open(url, "_blank", "noopener,noreferrer");
    } else {
        showToast("Link Google Drive belum diisi atau tidak valid.", "info");
    }
}

function editSelectedDriveAlbum() {
    const modal = document.getElementById("modal-drive-album-actions");
    if (modal) modal.classList.add("hide");
    if (!pendingDriveAlbum || !pendingDriveAlbum.alb) return;
    openEditAlbumById(pendingDriveAlbum.uname, pendingDriveAlbum.alb.id);
}

// Verifikasi PIN dilakukan langsung di server Google
async function verifySecretAlbumPin() {
    if (!pendingPinAlbum) return;
    const pinInp = document.getElementById("pg-pin-input");
    const inp = (pinInp?.value || "").trim();
    if (!inp) return showToast("Masukkan 4 angka PIN.", "error");

    const { uname, alb } = pendingPinAlbum;
    showLoading("Memverifikasi PIN...");
    const res = await apiAction({ action: "verify_vault_pin", username: uname, albumId: alb.id, pin: inp });
    hideLoading();

    if (res && res.ok) {
        pendingPinAlbum = null;
        if (pinInp) { pinInp.value = ""; pinInp.blur(); }
        document.getElementById("modal-pin-gate").classList.add("hide");
        openSecretAlbumViewer(uname, alb.id);
    } else {
        showToast((res && res.message) || "PIN salah! Coba lagi atau ajukan bantuan ke Founder.", "error");
        if (pinInp) pinInp.value = "";
    }
}

async function requestPinResetToMaster() {
    if (!pendingPinAlbum) return;
    const { uname, alb } = pendingPinAlbum;
    showLoading("Mengirim pengajuan lupa PIN ke Founder...");
    const res = await apiAction({ action: "request_pin_reset", username: uname, albumTitle: alb.title });
    hideLoading();
    document.getElementById("modal-pin-gate").classList.add("hide");
    if (res && res.ok) {
        showToast("Pengajuan lupa PIN terkirim ke Live Chat Founder!", "info");
        if (typeof openFullChatOverlay === "function") openFullChatOverlay("founder_private");
    } else showToast("Gagal mengirim pengajuan.", "error");
}

function switchVaultInnerTab(tab) {
    activeVaultInnerTab = tab;
    const isPhotos = tab === "photos";
    document.getElementById("sa-pane-photos")?.classList.toggle("hide", !isPhotos);
    document.getElementById("sa-pane-notes")?.classList.toggle("hide", isPhotos);
    document.getElementById("sa-upload-trigger")?.classList.toggle("hide", !isPhotos || !lightboxCanDelete);
    document.getElementById("sa-tab-photos").className = `px-3.5 py-1.5 rounded-full text-xs font-bold ${isPhotos ? "gold-pill-btn" : "app-btn-sec"}`;
    document.getElementById("sa-tab-notes").className = `px-3.5 py-1.5 rounded-full text-xs font-bold ${!isPhotos ? "gold-pill-btn" : "app-btn-sec"}`;
}

// Buka layar penuh ala Galeri iPhone + tanggal upload + catatan kecil rahasia
function openSecretAlbumViewer(uname, albId) {
    const v = vaultCache[uname.toLowerCase()]; if (!v) return;
    const alb = (v.albums || []).find(a => String(a.id) === String(albId));
    if (!alb) return;
    activeVaultOwner = uname.toLowerCase();
    activeSecretAlbumId = alb.id;

    const curU = getCurrentUserObj();
    const isOwner = curU && String(curU.username).toLowerCase() === activeVaultOwner;
    const isMaster = curU && curU.role === "master";
    lightboxCanDelete = isOwner || isMaster;

    const photos = alb.photos || [];
    const notes = alb.notes || [];
    lightboxPhotos = photos;
    const lockLabel = alb.pinEnabled ? (isMaster && alb.pin ? `PIN: ${alb.pin}` : "Terkunci PIN") : "Tanpa PIN";

    document.getElementById("sa-title").innerText = alb.title;
    document.getElementById("sa-sub").innerText = `${photos.length} foto • ${notes.length} catatan • ${lockLabel}`;
    document.getElementById("sa-notes-count").innerText = notes.length;
    document.getElementById("sa-gallery-delete-tip").classList.add("hide");
    document.getElementById("sa-upload-progress").classList.add("hide");
    document.getElementById("sa-btn-settings")?.classList.toggle("hide", !isOwner && !isMaster);
    document.getElementById("sa-note-composer")?.classList.toggle("hide", !isOwner && !isMaster);

    const used = Number(v.usedBytes || 0);
    const limit = Number(v.limitBytes || (2 * 1024 * 1024 * 1024));
    const isFull = !v.isPro && !isMaster && used >= limit;
    const barWrap = document.getElementById("sa-storage-bar-wrap");
    if (barWrap) {
        barWrap.classList.toggle("hide", !isFull);
        if (isFull) {
            document.getElementById("sa-storage-lbl").innerText = "Penyimpanan Album Penuh! Upgrade ke Pro untuk tanpa batas.";
            document.getElementById("sa-storage-pct").innerText = "PENUH";
            document.getElementById("sa-storage-fill").style.width = "100%";
            document.getElementById("sa-upgrade-pro-btn").classList.remove("hide");
        }
    }

    const grid = document.getElementById("sa-photos-grid");
    grid.innerHTML = !photos.length
        ? `<div class="col-span-full py-12 text-center text-xs app-muted app-card border border-dashed rounded-2xl">Belum ada foto di album ini. Ketuk <strong>+ Foto</strong> di atas untuk memindahkan foto dari galeri HP Anda.</div>`
        : photos.map((ph, idx) => {
            const dtStr = formatShortUploadDate(ph.uploadedAt || (String(ph.id || "").split("_")[1]));
            return `<div onclick="openSecretPhotoLightbox(${idx})" class="relative aspect-square rounded-lg overflow-hidden bg-zinc-900 cursor-pointer active:scale-95 transition-transform">
                <img src="${ph.url}" loading="lazy" class="w-full h-full object-cover">
                ${dtStr ? `<span class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/65 text-white text-[9px] font-semibold backdrop-blur-sm">${escHtml(dtStr)}</span>` : ""}
            </div>`;
        }).join("");

    renderSecretVaultNotesList(notes, lightboxCanDelete);
    switchVaultInnerTab(activeVaultInnerTab || "photos");
    document.getElementById("modal-secret-album").classList.remove("hide");
    if (typeof pushBackGuard === "function") pushBackGuard();
}

function renderSecretVaultNotesList(notes, canEdit) {
    const box = document.getElementById("sa-notes-list"); if (!box) return;
    if (!notes.length) {
        box.innerHTML = `<div class="app-card border border-dashed rounded-2xl p-6 text-center text-xs app-muted">Belum ada catatan kecil rahasia di album ini.</div>`;
        return;
    }
    box.innerHTML = notes.map((n, idx) => `
        <div class="app-card border rounded-2xl p-3.5 shadow-sm space-y-1.5">
            <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                    <h4 class="text-xs font-extrabold truncate">${escHtml(n.title || "Catatan Pribadi")}</h4>
                    <span class="text-[10px] app-muted">${formatShortUploadDate(n.updatedAt || n.createdAt)}</span>
                </div>
                ${canEdit ? `<button type="button" onclick="deleteSecretVaultNote(${idx})" class="px-2 py-1 rounded-lg bg-red-600/15 text-red-500 text-[10px] font-bold"><i class="fa-solid fa-trash"></i></button>` : ""}
            </div>
            <p class="text-xs leading-relaxed whitespace-pre-wrap break-words">${escHtml(n.body || "")}</p>
        </div>
    `).join("");
}

async function addSecretVaultNote() {
    const titleInp = document.getElementById("sa-note-title");
    const bodyInp = document.getElementById("sa-note-body");
    const title = (titleInp?.value || "").trim() || "Catatan Pribadi";
    const body = (bodyInp?.value || "").trim();
    if (!body) return showToast("Tulis isi catatan terlebih dahulu.", "error");

    const v = vaultCache[activeVaultOwner]; if (!v) return;
    const alb = (v.albums || []).find(a => String(a.id) === String(activeSecretAlbumId)); if (!alb) return;
    if (!Array.isArray(alb.notes)) alb.notes = [];

    const nextNotes = [{ id: "nt_" + Date.now(), title, body, createdAt: Date.now() }, ...alb.notes];
    setBtnLoading("btn-sa-add-note", true, "Menyimpan...");
    const res = await apiAction({ action: "save_vault_notes", username: activeVaultOwner, albumId: activeSecretAlbumId, notes: nextNotes });
    setBtnLoading("btn-sa-add-note", false);

    if (res && res.ok && res.vault) {
        vaultCache[activeVaultOwner] = Object.assign(vaultCache[activeVaultOwner] || {}, res.vault);
        if (titleInp) titleInp.value = "";
        if (bodyInp) bodyInp.value = "";
        openSecretAlbumViewer(activeVaultOwner, activeSecretAlbumId);
        switchVaultInnerTab("notes");
        showToast("Catatan rahasia tersimpan aman di Cloud!");
    } else {
        showToast((res && res.message) || "Gagal menyimpan catatan.", "error");
    }
}

async function deleteSecretVaultNote(idx) {
    if (!(await showConfirm("Hapus Catatan", "Hapus catatan kecil ini secara permanen?", "fa-solid fa-trash", "Ya, Hapus"))) return;
    const v = vaultCache[activeVaultOwner]; if (!v) return;
    const alb = (v.albums || []).find(a => String(a.id) === String(activeSecretAlbumId)); if (!alb) return;
    const nextNotes = [...(alb.notes || [])];
    nextNotes.splice(idx, 1);

    showLoading("Menghapus catatan...");
    const res = await apiAction({ action: "save_vault_notes", username: activeVaultOwner, albumId: activeSecretAlbumId, notes: nextNotes });
    hideLoading();
    if (res && res.ok && res.vault) {
        vaultCache[activeVaultOwner] = Object.assign(vaultCache[activeVaultOwner] || {}, res.vault);
        openSecretAlbumViewer(activeVaultOwner, activeSecretAlbumId);
        switchVaultInnerTab("notes");
        showToast("Catatan dihapus.", "info");
    }
}

function openSecretPhotoLightbox(idx) {
    if (!lightboxPhotos.length) return;
    lightboxIndex = Math.max(0, Math.min(lightboxPhotos.length - 1, idx));

    let lb = document.getElementById("ios-vault-lightbox");
    if (!lb) {
        lb = document.createElement("div");
        lb.id = "ios-vault-lightbox";
        lb.className = "fixed inset-0 z-[96] bg-black flex flex-col justify-center items-center ios-gallery-lightbox select-none";
        document.body.appendChild(lb);

        let sx = 0;
        let swipeBlocked = false;
        lb.addEventListener("touchstart", (e) => {
            const st = document.getElementById("vault-zoom-stage");
            const curSc = Number((st && st.dataset.zoomScale) || 1);
            if (e.touches.length > 1 || curSc > 1.05) { swipeBlocked = true; return; }
            swipeBlocked = false;
            sx = e.touches[0].clientX;
        }, { passive: true });
        lb.addEventListener("touchend", (e) => {
            if (swipeBlocked) return;
            const st = document.getElementById("vault-zoom-stage");
            const curSc = Number((st && st.dataset.zoomScale) || 1);
            if (curSc > 1.05) return;
            const dx = e.changedTouches[0].clientX - sx;
            if (Math.abs(dx) > 48) navSecretPhotoLightbox(dx < 0 ? 1 : -1);
        }, { passive: true });
    }

    renderSecretPhotoLightbox();
    lb.classList.remove("hide");
    if (typeof pushBackGuard === "function") pushBackGuard();
}

function renderSecretPhotoLightbox() {
    const lb = document.getElementById("ios-vault-lightbox");
    if (!lb || !lightboxPhotos.length) return closeSecretPhotoLightbox();
    const ph = lightboxPhotos[lightboxIndex];
    const dtStr = formatShortUploadDate(ph.uploadedAt || (String(ph.id || "").split("_")[1]));

    lb.innerHTML = `
        <button type="button" onclick="closeSecretPhotoLightbox()" class="fixed top-5 right-5 z-20 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center text-base hover:bg-white/25">
            <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="fixed top-6 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-white/12 backdrop-blur-md text-white text-xs font-semibold">
            ${lightboxIndex + 1} / ${lightboxPhotos.length} ${dtStr ? `• ${escHtml(dtStr)}` : ""}
        </div>
        <div id="vault-zoom-stage" data-pinch-zoom="1" class="selective-zoom-stage w-full h-full flex items-center justify-center p-2 overflow-hidden">
            <img id="vault-zoom-img" src="${ph.url}" class="selective-zoom-target max-w-full max-h-full object-contain transition-opacity duration-200">
        </div>
        ${lightboxPhotos.length > 1 ? `
            <button type="button" onclick="navSecretPhotoLightbox(-1)" class="fixed left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/12 backdrop-blur text-white flex items-center justify-center hover:bg-white/25"><i class="fa-solid fa-chevron-left"></i></button>
            <button type="button" onclick="navSecretPhotoLightbox(1)" class="fixed right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/12 backdrop-blur text-white flex items-center justify-center hover:bg-white/25"><i class="fa-solid fa-chevron-right"></i></button>
        ` : ""}
        ${lightboxCanDelete ? `
            <button type="button" onclick="deleteSecretAlbumPhoto('${esc(ph.id)}')" class="fixed bottom-6 left-6 z-20 w-11 h-11 rounded-full bg-red-600/85 backdrop-blur-md text-white flex items-center justify-center text-sm shadow-xl hover:bg-red-600" title="Hapus Foto">
                <i class="fa-solid fa-trash"></i>
            </button>
        ` : ""}
    `;
    if (typeof attachSelectivePinchZoom === "function") {
        attachSelectivePinchZoom(document.getElementById("vault-zoom-stage"), document.getElementById("vault-zoom-img"));
    }
}

function navSecretPhotoLightbox(dir) {
    if (lightboxPhotos.length < 2) return;
    lightboxIndex = (lightboxIndex + dir + lightboxPhotos.length) % lightboxPhotos.length;
    renderSecretPhotoLightbox();
}

function closeSecretPhotoLightbox() {
    document.getElementById("ios-vault-lightbox")?.classList.add("hide");
}

function editActiveSecretAlbum() {
    openEditAlbumById(activeVaultOwner, activeSecretAlbumId);
}

async function deleteActiveSecretAlbumFromSettings() {
    const targetAlbId = (document.getElementById("af-id")?.value || "").trim() || activeSecretAlbumId;
    const albType = (document.getElementById("af-type")?.value || "secret");
    if (!targetAlbId) return;

    const msg = albType === "drive"
        ? "Hapus tautan Album Google Drive ini dari profil Anda? (File asli di Google Drive tidak ikut terhapus)"
        : "Hapus album beserta seluruh foto dan catatan di dalamnya?";

    if (!(await showConfirm("Hapus Album", msg, "fa-solid fa-trash", "Ya, Hapus"))) return;
    showLoading("Menghapus album...");
    const owner = (activeVaultOwner || currentSessionUser || "").toLowerCase();
    const res = await apiAction({ action: "delete_vault_album", username: owner, albumId: targetAlbId });
    hideLoading();
    if (res && res.ok && res.vault) {
        vaultCache[owner] = Object.assign(vaultCache[owner] || {}, res.vault);
        document.getElementById("modal-album-form").classList.add("hide");
        document.getElementById("modal-drive-album-actions")?.classList.add("hide");
        if (albType === "secret") document.getElementById("modal-secret-album").classList.add("hide");
        refreshCurrentHighlightsUI();
        showToast("Album berhasil dihapus.", "info");
    } else {
        showToast((res && res.message) || "Gagal menghapus album.", "error");
    }
}

async function uploadPhotosToSecretAlbum(inp) {
    const files = Array.from(inp.files || []);
    inp.value = "";
    if (!files.length) return;

    const progBox = document.getElementById("sa-upload-progress");
    const progTxt = document.getElementById("sa-upload-progress-text");
    progBox.classList.remove("hide");

    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
        progTxt.innerText = `Memindahkan foto ${i + 1} dari ${files.length}...`;
        const b64 = await quickResizeImage(files[i], 1080, 0.82);
        const res = await apiAction({
            action: "add_vault_photo",
            username: activeVaultOwner,
            albumId: activeSecretAlbumId,
            dataUrl: b64
        });
        if (res && res.ok && res.vault) {
            vaultCache[activeVaultOwner] = Object.assign(vaultCache[activeVaultOwner] || {}, res.vault);
            successCount++;
        } else {
            showToast((res && res.message) || "Penyimpanan album penuh! Upgrade ke Pro untuk tanpa batas.", "error");
            break;
        }
    }
    progBox.classList.add("hide");
    if (successCount > 0) {
        openSecretAlbumViewer(activeVaultOwner, activeSecretAlbumId);
        refreshCurrentHighlightsUI();
        document.getElementById("sa-gallery-delete-tip").classList.remove("hide");
        showToast(`${successCount} foto aman tersimpan di Album Rahasia!`);
    }
}

async function deleteSecretAlbumPhoto(photoId) {
    if (!(await showConfirm("Hapus Foto", "Hapus foto ini dari Album Rahasia?", "fa-solid fa-trash", "Ya, Hapus"))) return;
    showLoading("Menghapus foto...");
    const res = await apiAction({ action: "delete_vault_photo", username: activeVaultOwner, albumId: activeSecretAlbumId, photoId });
    hideLoading();
    if (res && res.ok && res.vault) {
        vaultCache[activeVaultOwner] = Object.assign(vaultCache[activeVaultOwner] || {}, res.vault);
        closeSecretPhotoLightbox();
        openSecretAlbumViewer(activeVaultOwner, activeSecretAlbumId);
        refreshCurrentHighlightsUI();
        showToast("Foto dihapus.", "info");
    }
}

function askUpgradeProViaChat() {
    document.getElementById("modal-secret-album").classList.add("hide");
    if (typeof openFullChatOverlay === "function") {
        openFullChatOverlay("founder_private");
        setTimeout(() => {
            const inp = document.getElementById("chat-input-text");
            if (inp) { inp.value = "Halo Admin, saya ingin upgrade ke Akun PRO (Centang Biru & penyimpanan Album tanpa batas)."; inp.focus(); }
        }, 250);
    }
}
