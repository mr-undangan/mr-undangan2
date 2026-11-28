// =========================================================================
// LEMBARKU — ENGINE UNDANGAN, 3D PAGE-TURN & PORTAL CLIENT (js/invitation.js)
// =========================================================================
let wizardState = {
    isEdit: false, adminDirectEdit: false, editInvId: null, isCabangBypass: false,
    category: "Pernikahan", theme: "Adat Kalimantan",
    photoSlots: [], couplePhoto: "", groomPhoto: "", bridePhoto: "",
    customAudioUrl: "", customAudioTitle: "", hiddenFields: [],
    sections: { sesi2: true, story: true, bank: true, music: true, closing: true }
};
let previewAudio = null, previewAudioToken = 0, invDraftSaveTimer = null;

function getDefaultOpeningText(cat, tObj = null) {
    if (cat === "Pernikahan") return {
        greeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
        quote: "\"Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.\" (QS. Ar-Rum: 21)"
    };
    if (cat === "Aqiqah") return {
        greeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
        quote: "Dengan memohon rahmat dan ridho Allah SWT, serta mengucap syukur atas kelahiran buah hati kami, kami mengundang Bapak/Ibu/Saudara/i untuk turut mendoakan dan menghadiri acara Tasyakuran Aqiqah putra/putri kami."
    };
    if (cat === "Ulang Tahun") return {
        greeting: "Halo Sahabat & Keluarga Tercinta!",
        quote: "Kebahagiaan akan terasa jauh lebih bermakna jika dirayakan bersama orang-orang tersayang. Dengan penuh sukacita kami mengundang Anda untuk hadir memeriahkan hari ulang tahun spesial ini."
    };
    if (cat === "Syukuran") {
        if (tObj && tObj.isKhitan) return {
            greeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
            quote: "Ya Allah, muliakanlah anak kami ini, panjangkanlah umurnya, terangilah hatinya, teguhkanlah imannya, dan jadikanlah ia anak yang sholeh serta berbakti kepada kedua orang tua. Aamiin."
        };
        const gr = (tObj && tObj.faith === "kristen") ? "Shalom / Damai Sejahtera" : (tObj && tObj.faith === "hindu_buddha") ? "Om Swastyastu / Namo Buddhaya" : "Assalamu'alaikum Warahmatullahi Wabarakatuh";
        return { greeting: gr, quote: "Dengan penuh rasa syukur atas segala limpahan rahmat dan karunia-Nya, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk berkenan hadir dalam acara syukuran dan doa bersama keluarga kami." };
    }
    return { greeting: "Salam Hangat & Hormat Kami", quote: "Dengan segala kerendahan hati, kami mengundang Bapak/Ibu/Saudara/i untuk meluangkan waktu dan berkenan hadir dalam rangkaian acara spesial yang akan kami selenggarakan." };
}

function getDefaultClosingText(cat) {
    if (cat === "Pernikahan") return { title: "Terima Kasih", text: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu bagi kedua mempelai. Atas kehadiran serta doa restunya, kami ucapkan terima kasih." };
    if (cat === "Aqiqah") return { title: "Jazakumullahu Khairan", text: "Atas kehadiran serta doa tulus Bapak/Ibu/Saudara/i untuk buah hati kami, kami mengucapkan terima kasih yang sebesar-besarnya. Semoga Allah SWT membalas kebaikan Anda berlipat ganda." };
    if (cat === "Ulang Tahun") return { title: "Sampai Jumpa di Hari Spesial!", text: "Kehadiran dan doa terbaik dari teman-teman dan keluarga akan menjadikan hari ulang tahun ini semakin berkesan dan penuh kebahagiaan. Terima kasih!" };
    if (cat === "Syukuran") return { title: "Terima Kasih & Doa Restu", text: "Suatu kehormatan dan kebahagiaan bagi keluarga kami apabila Bapak/Ibu/Saudara/i berkenan hadir memenuhi undangan syukuran ini. Atas doa dan kehadirannya kami haturkan terima kasih." };
    return { title: "Terima Kasih", text: "Demikian undangan ini kami sampaikan. Besar harapan kami atas kehadiran Bapak/Ibu/Saudara/i demi kelancaran dan kebersamaan acara ini." };
}

function getSafeAudioCandidates(rawUrl) {
    const cleanRaw = String(rawUrl || "").trim();
    if (!cleanRaw) return [];
    const list = [];
    if (typeof _audioBlobCache !== "undefined" && _audioBlobCache && _audioBlobCache.has(cleanRaw)) {
        const cached = _audioBlobCache.get(cleanRaw);
        if (cached) list.push(cached);
    }
    if (typeof getAudioUrlCandidates === "function") {
        getAudioUrlCandidates(cleanRaw).forEach((u) => {
            if (u && !list.includes(u)) list.push(u);
        });
    } else if (!list.includes(cleanRaw)) {
        list.push(cleanRaw);
    }
    return list;
}

function playAudioElementWithFallback(audioEl, candidates, onAllFail, rawUrl = "") {
    if (!audioEl || !candidates || !candidates.length) {
        if (onAllFail) onAllFail();
        return;
    }

    const cleanRaw = String(rawUrl || "").trim();
    const cachedBlob = (typeof _audioBlobCache !== "undefined" && _audioBlobCache && cleanRaw)
        ? _audioBlobCache.get(cleanRaw)
        : "";
    const orderedCandidates = cachedBlob && !candidates.includes(cachedBlob)
        ? [cachedBlob, ...candidates]
        : candidates;

    let idx = 0;
    let blobTried = false;
    let settled = false;

    audioEl.dataset.wantPlay = "1";

    const tryBlobOnce = async () => {
        if (settled || audioEl.dataset.wantPlay !== "1") return;
        if (blobTried || typeof fetchAudioAsBlobUrl !== "function") {
            if (onAllFail) onAllFail();
            return;
        }
        blobTried = true;
        const blobUrl = await fetchAudioAsBlobUrl(rawUrl, orderedCandidates);
        if (settled || audioEl.dataset.wantPlay !== "1") return;
        if (blobUrl) {
            audioEl.src = blobUrl;
            try { audioEl.load(); } catch {}
            const p = audioEl.play();
            if (p && typeof p.catch === "function") {
                p.catch((err) => {
                    if (settled || audioEl.dataset.wantPlay !== "1") return;
                    if (err && err.name === "NotAllowedError") return;
                    if (onAllFail) onAllFail();
                });
            }
        } else if (onAllFail) {
            onAllFail();
        }
    };

    const startCandidate = (targetIdx) => {
        if (settled || audioEl.dataset.wantPlay !== "1") return;
        idx = targetIdx;
        if (idx >= orderedCandidates.length) {
            tryBlobOnce();
            return;
        }
        const targetSrc = orderedCandidates[idx];
        if (audioEl.src !== targetSrc) {
            audioEl.src = targetSrc;
            try { audioEl.load(); } catch {}
        }
        const p = audioEl.play();
        if (p && typeof p.catch === "function") {
            p.catch((err) => {
                if (settled || audioEl.dataset.wantPlay !== "1") return;
                if (err && err.name === "NotAllowedError") return;
                if (idx + 1 < orderedCandidates.length) {
                    startCandidate(idx + 1);
                } else {
                    tryBlobOnce();
                }
            });
        }
    };

    const prevOnPlaying = audioEl.onplaying;
    audioEl.onplaying = (ev) => {
        settled = true;
        if (typeof prevOnPlaying === "function") prevOnPlaying(ev);
    };

    audioEl.onerror = () => {
        if (settled || audioEl.dataset.wantPlay !== "1") return;
        if (idx + 1 < orderedCandidates.length) {
            startCandidate(idx + 1);
        } else {
            tryBlobOnce();
        }
    };

    startCandidate(0);
}

// ================= 1. WIZARD UNDANGAN =================
function getSelectedThemeObj() { return findThemeObject(wizardState.category, wizardState.theme); }
function stopPreviewAudio() {
    previewAudioToken++;
    if (previewAudio) {
        previewAudio.dataset.wantPlay = "0";
        previewAudio.onerror = null;
        previewAudio.onplaying = null;
        try { previewAudio.pause(); } catch {}
        previewAudio = null;
    }
    const b = document.getElementById("btn-preview-song");
    if (b) b.innerHTML = `<i class="fa-solid fa-play mr-1"></i> Putar Preview`;
}
async function togglePreviewSelectedSong() {
    const rawUrl = wizardState.customAudioUrl || document.getElementById("f-preset-audio").value;
    if (!rawUrl) return showToast("Pilih stok lagu atau upload & potong lagu terlebih dahulu.", "info");
    if (previewAudio && !previewAudio.paused) return stopPreviewAudio();
    stopPreviewAudio();
    const myToken = previewAudioToken;
    const candidates = getSafeAudioCandidates(rawUrl);
    if (!candidates.length) return showToast("Lagu gagal dimuat.", "error");

    const b = document.getElementById("btn-preview-song");
    if (b) b.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Memuat...`;

    const el = new Audio();
    el.preload = "auto";
    el.setAttribute("playsinline", "");
    el.onplaying = () => {
        if (myToken !== previewAudioToken) return;
        const btn = document.getElementById("btn-preview-song");
        if (btn) btn.innerHTML = `<i class="fa-solid fa-stop mr-1"></i> Stop`;
    };
    el.onended = () => {
        if (myToken === previewAudioToken) stopPreviewAudio();
    };
    previewAudio = el;

    playAudioElementWithFallback(el, candidates, () => {
        if (myToken !== previewAudioToken) return;
        stopPreviewAudio();
        showToast("Gagal memutar audio. Pastikan file lagu valid & dapat diakses publik.", "error");
    }, rawUrl);
}
function populateMusicDropdown(selUrl = "") {
    const sel = document.getElementById("f-preset-audio"); if (!sel) return;
    sel.innerHTML = !db.musicLibrary.length
        ? `<option value="">-- Belum ada stok lagu (Upload & potong lagu di bawah) --</option>`
        : `<option value="">-- Pilih Stok Lagu Website --</option>` + db.musicLibrary.map(m => `<option value="${esc(m.url)}" ${m.url===selUrl?"selected":""}>🎵 [${escHtml(m.category)}] ${escHtml(m.title)}</option>`).join("");
}

const VENUE_PRESETS = ["Rumah Mempelai Wanita", "Rumah Mempelai Pria", "Gedung Serbaguna", "Hotel", ""];
function syncVenueDropdown(kind) {
    const sel = document.getElementById(`f-${kind}-venue-sel`);
    const inp = document.getElementById(`f-${kind}-venue`);
    if (!sel || !inp) return;
    if (sel.value === "__custom__") {
        inp.classList.remove("hide");
        if (VENUE_PRESETS.includes(inp.value)) inp.value = "";
        inp.focus();
    } else {
        inp.classList.add("hide");
        inp.value = sel.value;
    }
}
function setVenueDropdownValue(kind, val) {
    const sel = document.getElementById(`f-${kind}-venue-sel`);
    const inp = document.getElementById(`f-${kind}-venue`);
    if (!sel || !inp) return;
    const clean = String(val || "").trim();
    if (VENUE_PRESETS.includes(clean)) {
        sel.value = clean;
        inp.value = clean;
        inp.classList.add("hide");
    } else {
        sel.value = "__custom__";
        inp.value = clean;
        inp.classList.remove("hide");
    }
}
function getVenueFieldValue(kind) {
    const sel = document.getElementById(`f-${kind}-venue-sel`);
    const inp = document.getElementById(`f-${kind}-venue`);
    if (!sel || !inp) return "";
    return sel.value === "__custom__" ? inp.value.trim() : sel.value;
}

function getMainFieldSpecs(cat) {
    if (cat === "Pernikahan") return [
        { id:"f-title", label:"Nama Panggilan Pasangan (Wajib)", ph:"Nama panggilan Anda & pasangan", req:true, full:true },
        { id:"f-groom", label:"Nama Lengkap Mempelai Pria", ph:"Nama lengkap mempelai pria" },
        { id:"f-groom-ig", label:"Instagram Mempelai Pria (Opsional)", ph:"Username Instagram Anda" },
        { id:"f-groom-parents", label:"Nama Kedua Orang Tua Mempelai Pria", ph:"Nama kedua orang tua Anda", full:true },
        { id:"f-bride", label:"Nama Lengkap Mempelai Wanita", ph:"Nama lengkap mempelai wanita" },
        { id:"f-bride-ig", label:"Instagram Mempelai Wanita (Opsional)", ph:"Username Instagram pasangan" },
        { id:"f-bride-parents", label:"Nama Kedua Orang Tua Mempelai Wanita", ph:"Nama kedua orang tua pasangan Anda", full:true }
    ];
    if (cat === "Ulang Tahun") return [
        { id:"f-title", label:"Nama yang Berulang Tahun (Wajib)", ph:"Nama Anda / buah hati Anda", req:true },
        { id:"f-age", label:"Usia", ph:"Usia yang dirayakan" },
        { id:"f-groom-parents", label:"Nama Kedua Orang Tua / Pengundang", ph:"Nama kedua orang tua Anda", full:true }
    ];
    if (cat === "Aqiqah") return [
        { id:"f-title", label:"Nama Lengkap Anak (Wajib)", ph:"Nama lengkap buah hati Anda", req:true },
        { id:"f-age", label:"Tanggal Lahir Anak", ph:"Tanggal lahir buah hati Anda" },
        { id:"f-groom-parents", label:"Nama Kedua Orang Tua", ph:"Nama kedua orang tua Anda", full:true }
    ];
    return [
        { id:"f-title", label:"Judul Acara / Nama Anda (Wajib)", ph:"Judul acara atau nama Anda", req:true },
        { id:"f-sub", label:"Sub-Judul / Agenda Acara", ph:"Agenda singkat acara Anda" },
        { id:"f-groom-parents", label:"Hormat Kami / Nama Keluarga / Panitia", ph:"Nama keluarga atau panitia Anda", full:true }
    ];
}

function buildInlineCouplePhotoCard(key, title, desc, imgSrc, aspectRatio) {
    const fb = key === "groomPhoto" ? IMG("1507003211169-0a1dd7228f2d") : key === "bridePhoto" ? IMG("1534528741775-53994a69daeb") : IMG("1519741497674-611481863552");
    return `<div class="md:col-span-2 app-card border rounded-2xl p-3 flex items-center gap-3.5"><img src="${imgSrc || fb}" ${imgFbAttr(fb)} class="w-16 h-20 rounded-xl object-cover border gold-border shrink-0"><div class="flex-1 min-w-0"><strong class="text-xs block">${title}</strong><p class="text-[10px] app-muted mt-0.5">${desc}</p><label class="inline-block mt-2 px-3 py-1.5 rounded-lg gold-pill-btn text-[11px] cursor-pointer"><i class="fa-solid fa-crop-simple mr-1"></i>Upload &amp; Atur Foto<input type="file" accept="image/*" class="hide" onchange="pickCroppedCouplePhoto(this,'${key}',${aspectRatio})"></label></div></div>`;
}
function renderDynamicMainFields(prefill = {}) {
    const specs = getMainFieldSpecs(wizardState.category), tObj = getSelectedThemeObj();
    const box = document.getElementById("dynamic-main-fields"), hidBox = document.getElementById("dynamic-hidden-fields");
    let visibleHtml = "", hiddenHtml = "";
    specs.forEach(sp => {
        if (!sp.req && wizardState.hiddenFields.includes(sp.id)) {
            hiddenHtml += `<button type="button" onclick="restoreWizardField('${sp.id}')" class="px-2.5 py-1 rounded-lg app-btn-sec text-[10px] app-accent border gold-border font-semibold">+ ${sp.label}</button>`;
            return;
        }
        const val = prefill[sp.id] !== undefined ? prefill[sp.id] : "";
        const delBtn = sp.req ? "" : `<button type="button" onclick="removeWizardField('${sp.id}')" class="text-[10px] text-red-500 font-semibold hover:underline"><i class="fa-solid fa-xmark"></i> Hapus</button>`;
        const inp = `<input type="text" id="${sp.id}" value="${esc(val)}" placeholder="${esc(sp.ph||"")}" class="app-input" ${sp.req?"required":""}>`;
        visibleHtml += `<div class="${sp.full?"md:col-span-2":""}"><div class="flex justify-between items-center mb-1"><label class="app-label !mb-0 ${sp.req?"app-accent":""}">${sp.label}</label>${delBtn}</div>${inp}</div>`;
        if (wizardState.category === "Pernikahan" && tObj.coupleMode !== "combined") {
            const isPol = tObj.style === "kalimantan_story" || tObj.style === "editorial" || tObj.style === "premium_black";
            if (sp.id === "f-groom-parents") visibleHtml += buildInlineCouplePhotoCard("groomPhoto", isPol ? "Foto Mempelai Pria (4:5)" : "Foto Layar Penuh Mempelai Pria (9:16)", "Tampil di slide khusus Mempelai Pria.", wizardState.groomPhoto, isPol ? 4 / 5 : 9 / 16);
            if (sp.id === "f-bride-parents") visibleHtml += buildInlineCouplePhotoCard("bridePhoto", isPol ? "Foto Mempelai Wanita (4:5)" : "Foto Layar Penuh Mempelai Wanita (9:16)", "Tampil di slide khusus Mempelai Wanita.", wizardState.bridePhoto, isPol ? 4 / 5 : 9 / 16);
        }
    });
    if (wizardState.category === "Pernikahan" && tObj.coupleMode === "combined") {
        visibleHtml += buildInlineCouplePhotoCard("couplePhoto", "Foto Berdua Mempelai (Tema Digabung)", "Tampil penuh elegan di atas nama kedua mempelai.", wizardState.couplePhoto, 4 / 5);
    }
    box.innerHTML = visibleHtml;
    if (hiddenHtml) { hidBox.innerHTML = `<span class="text-[10px] app-muted self-center mr-1">Kolom dihapus:</span>` + hiddenHtml; hidBox.classList.remove("hide"); }
    else { hidBox.innerHTML = ""; hidBox.classList.add("hide"); }
}
function pickCroppedCouplePhoto(inp, key, ratio) {
    const file = inp.files[0]; if (!file) return; inp.value = "";
    const isTall = ratio < 0.7;
    openImageCropper(file, ratio, isTall ? "Atur Foto Mempelai (9:16)" : "Atur Foto Mempelai (4:5)", 720, isTall ? 1280 : 900, async (dataUrl) => {
        showLoading("Mengunggah foto mempelai...");
        const up = await apiAction({ action: "upload_media", dataUrl, prefix: key });
        hideLoading();
        if (up && up.ok && up.url) { const cur = captureCurrentMainValues(); wizardState[key] = up.url; renderDynamicMainFields(cur); showToast("Foto mempelai tersimpan!"); }
        else showToast("Gagal mengunggah foto.", "error");
    });
}
function captureCurrentMainValues() { const m = {}; getMainFieldSpecs(wizardState.category).forEach(sp => { const el = document.getElementById(sp.id); if (el) m[sp.id] = el.value; }); return m; }
function removeWizardField(id) { const cur = captureCurrentMainValues(); if (!wizardState.hiddenFields.includes(id)) wizardState.hiddenFields.push(id); renderDynamicMainFields(cur); }
function restoreWizardField(id) { const cur = captureCurrentMainValues(); wizardState.hiddenFields = wizardState.hiddenFields.filter(x => x !== id); renderDynamicMainFields(cur); }
function toggleWizardSection(sec, show) { wizardState.sections[sec] = show; const el = document.getElementById(`sec-${sec}`); if (el) el.classList.toggle("hide", !show); renderWizardRestoreBar(); }
function renderWizardRestoreBar() {
    const names = { sesi2:"Sesi 2 / Resepsi", story:"Kisah Momen", bank:"Amplop Digital", music:"Backsound Musik", closing:"Ucapan Penutup" };
    const off = Object.keys(names).filter(k => !wizardState.sections[k]);
    const bar = document.getElementById("wizard-restore-bar"), pills = document.getElementById("wizard-restore-pills");
    if (!off.length) { bar.classList.add("hide"); return; }
    bar.classList.remove("hide");
    pills.innerHTML = off.map(k => `<button type="button" onclick="toggleWizardSection('${k}',true)" class="px-3 py-1 rounded-full app-card border text-[11px] app-accent font-bold">+ Tampilkan ${names[k]}</button>`).join("");
}

function startCreateInvitation(isCabang = false, preCat = null, preTheme = null) {
    if (isCabang) { const cab = getCurrentUserObj(); if (!cab || (cab.quota || 0) <= 0) return showToast("Saldo Coin habis! Hubungi Founder untuk isi ulang Coin.", "error"); }
    currentViewName = "wizard";
    const initCat = preCat || "Pernikahan";
    const activeList = getMergedThemes(initCat, false);
    const initTheme = preTheme || (activeList[0] && activeList[0].name) || "Adat Kalimantan";
    wizardState = {
        isEdit: false, adminDirectEdit: false, editInvId: null, isCabangBypass: isCabang,
        category: initCat, theme: initTheme, photoSlots: [],
        couplePhoto: IMG("1519741497674-611481863552"),
        groomPhoto: "./assets/model-pria.jpg",
        bridePhoto: "./assets/model-wanita.jpg",
        customAudioUrl: "", customAudioTitle: "", hiddenFields: [],
        sections: { sesi2: true, story: true, bank: true, music: true, closing: true }
    };
    hideAllViews(); document.getElementById("view-wizard").classList.remove("hide");
    document.getElementById("wiz-heading").innerText = isCabang ? "Buat Undangan Klien Instan (Saldo Coin)" : "Buat Undangan Digital Baru";
    document.getElementById("btn-submit-inv").innerText = isCabang ? "Buat & Aktifkan (Potong Coin)" : "Ajukan Undangan";
    document.getElementById("btn-change-theme-step").classList.remove("hide");
    renderHeaderActions(); pushBackGuard(); renderWizardStep1();
    if (preCat && preTheme) selectWizardTheme(preTheme);
    else setWizardStep(1);
}

function setWizardStep(s) {
    stopPreviewAudio();
    document.getElementById("wiz-step-1").classList.toggle("hide", s !== 1);
    document.getElementById("wiz-step-2").classList.toggle("hide", s !== 2);
    document.getElementById("wiz-subheading").innerText = `Langkah ${s} dari 2`;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderWizardStep1() {
    document.getElementById("wiz-cat-buttons").innerHTML = Object.keys(THEME_CATALOG).map(c => `<button type="button" onclick="wizardState.category='${c}';wizardState.theme=(getMergedThemes('${c}',false)[0]?.name||'');renderWizardStep1();" class="p-3 rounded-2xl border text-xs font-bold transition ${wizardState.category===c?"gold-pill-btn shadow":"app-card-soft"}">${c}</button>`).join("");
    document.getElementById("wiz-cat-selected-name").innerText = wizardState.category;
    const themes = getMergedThemes(wizardState.category, false);
    document.getElementById("wiz-theme-cards").innerHTML = themes.map(t => {
        const isSel = wizardState.theme === t.name;
        return `
            <div class="group rounded-2xl overflow-hidden border-2 ${isSel ? "border-blue-500 shadow-lg" : "border-black/15"} bg-black flex flex-col">
                ${buildMiniCoverCardHtml(wizardState.category, t, false)}
                ${wizardState.isCabangBypass
                    ? `<div class="px-2.5 py-2 bg-[#111115] text-white border-t border-white/10 flex items-center justify-between gap-1">
                        <span class="text-[10px] font-bold truncate">${escHtml(t.name)}</span>
                        <span class="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-400 shrink-0">${typeof buildGoldLembarkuCoinHtml === "function" ? buildGoldLembarkuCoinHtml("sm") : ""}${getThemeCoinCost(wizardState.category, t)} Coin</span>
                       </div>`
                    : buildPriceStripHtml(t, true)}
                <div class="grid grid-cols-2 gap-1.5 p-2 bg-[#16161b]">
                    <button type="button" onclick="openThemeLivePreview('${esc(wizardState.category)}','${esc(t.name)}')" class="py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold border border-white/20"><i class="fa-regular fa-eye mr-1"></i>Lihat Ini</button>
                    <button type="button" onclick="selectWizardTheme('${esc(t.name)}')" class="py-2 rounded-xl gold-pill-btn text-[11px] shadow">Pilih</button>
                </div>
            </div>
        `;
    }).join("");
}

function selectWizardTheme(name) {
    const prevTheme = wizardState.theme;
    wizardState.theme = name;
    const tObj = getSelectedThemeObj();
    const pr = getThemePricing(tObj);
    const coinCost = getThemeCoinCost(wizardState.category, tObj);
    wizardState.coinCost = coinCost;

    if (wizardState.isCabangBypass) {
        const cab = getCurrentUserObj();
        const bal = Number((cab && cab.quota) || 0);
        if (bal < coinCost) {
            wizardState.theme = prevTheme;
            showToast(`Saldo Coin belum cukup! Tema "${name}" butuh ${coinCost} Coin, saldo Anda ${bal} Coin.`, "error");
            return;
        }
        const hEl = document.getElementById("wiz-heading");
        const btnEl = document.getElementById("btn-submit-inv");
        if (hEl) hEl.innerText = `Buat Undangan Klien Instan (-${coinCost} Coin)`;
        if (btnEl) btnEl.innerText = `Buat & Aktifkan (-${coinCost} Coin)`;
    }

    document.getElementById("form-badge-cat").innerText = wizardState.category;
    document.getElementById("form-badge-theme").innerText = name;
    document.getElementById("form-badge-price").innerText = wizardState.isCabangBypass ? `${coinCost} Coin` : fmtRp(pr.price);

    const curU = getCurrentUserObj();
    const isProUser = !!(curU && curU.role === "user" && curU.isPro && !wizardState.isEdit && !wizardState.isCabangBypass);
    const proWrap = document.getElementById("wiz-pro-paymode-wrap");
    if (proWrap) {
        proWrap.classList.toggle("hide", !isProUser);
        if (isProUser) {
            const bal = Number(curU.quota || 0);
            const balEl = document.getElementById("wiz-pro-coin-bal");
            const optEl = document.getElementById("wiz-pro-coin-opt-lbl");
            if (balEl) balEl.innerText = `Saldo Anda: ${bal} Coin`;
            if (optEl) optEl.innerText = `Potong ${coinCost} Coin`;
            const coinRad = document.querySelector('input[name="wiz_pro_paymode"][value="coin"]');
            const normRad = document.querySelector('input[name="wiz_pro_paymode"][value="normal"]');
            if (coinRad && normRad) {
                if (bal >= coinCost) { coinRad.checked = true; } else { normRad.checked = true; }
            }
            onWizardProPayModeChange();
        }
    }
    wizardState.hiddenFields = [];
    wizardState.sections = { sesi2: wizardState.category === "Pernikahan", story: wizardState.category === "Pernikahan", bank: true, music: true, closing: true };
    document.getElementById("toggle-countdown").checked = true; document.getElementById("toggle-wishes").checked = true;
    document.getElementById("label-sesi-1").innerText = wizardState.category === "Pernikahan" ? "Sesi 1: Akad Nikah (Wajib)" : `Waktu & Tempat ${wizardState.category} (Wajib)`;
    const defOpen = getDefaultOpeningText(wizardState.category, tObj), defClose = getDefaultClosingText(wizardState.category);
    document.getElementById("f-opening-greeting").value = defOpen.greeting;
    document.getElementById("f-opening-quote").value = defOpen.quote;
    document.getElementById("f-closing-title").value = defClose.title;
    document.getElementById("f-closing-text").value = defClose.text;
    setVenueDropdownValue("akad", "Rumah Mempelai Wanita");
    setVenueDropdownValue("resepsi", "Gedung Serbaguna");
    renderDynamicMainFields();
    ["sesi2","story","bank","music","closing"].forEach(k => toggleWizardSection(k, wizardState.sections[k]));
    if (!wizardState.isEdit) {
        document.getElementById("story-rows-container").innerHTML = ""; addStoryFieldRow("Perkenalan", "2022", "Awal pertemuan kami hingga hari bahagia.");
        document.getElementById("bank-rows-container").innerHTML = ""; addBankFieldRow("BCA", "", "");
        const safeCover = (tObj.demoPhotos && tObj.demoPhotos.cover) || (tObj.img && tObj.img.startsWith("http") ? tObj.img : IMG("1519741497674-611481863552"));
        wizardState.photoSlots = [safeCover, IMG("1519741497674-611481863552"), IMG("1511285560929-80b456fea0bc"), IMG("1522673607200-164d1b6ce486")];
        try {
            const sd = JSON.parse(localStorage.getItem(DRAFT_INV_KEY) || "null");
            if (sd && sd.category === wizardState.category && sd.title) {
                const elT = document.getElementById("f-title"); if (elT && !elT.value) elT.value = sd.title;
            }
        } catch {}
    }
    renderPhotoSlots();
    populateMusicDropdown(tObj.defaultAudio || "");
    bindInvFormAutoSave();
    setWizardStep(2);
}

function onWizardProPayModeChange() {
    const mode = document.querySelector('input[name="wiz_pro_paymode"]:checked')?.value || "normal";
    const coinCost = getThemeCoinCost(wizardState.category, getSelectedThemeObj());
    const pr = getThemePricing(getSelectedThemeObj());
    const btnEl = document.getElementById("btn-submit-inv");
    const priceEl = document.getElementById("form-badge-price");
    if (mode === "coin") {
        if (btnEl) btnEl.innerText = `Buat & Aktifkan (-${coinCost} Coin)`;
        if (priceEl) priceEl.innerText = `${coinCost} Coin`;
    } else {
        if (btnEl) btnEl.innerText = "Ajukan Undangan";
        if (priceEl) priceEl.innerText = fmtRp(pr.price);
    }
}

function bindInvFormAutoSave() {
    const form = document.getElementById("full-invitation-form");
    if (!form || wizardState.isEdit) return;
    form.oninput = () => {
        clearTimeout(invDraftSaveTimer);
        invDraftSaveTimer = setTimeout(() => {
            try {
                const title = document.getElementById("f-title")?.value || "";
                if (title) localStorage.setItem(DRAFT_INV_KEY, JSON.stringify({ category: wizardState.category, title }));
            } catch {}
        }, 700);
    };
}

function renderPhotoSlots() {
    document.getElementById("photo-upload-slots").innerHTML = wizardState.photoSlots.map((src, i) => `<div class="app-card border rounded-2xl p-2 text-center space-y-1.5 relative">${i>0?`<button type="button" onclick="wizardState.photoSlots.splice(${i},1);renderPhotoSlots();" class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 text-white text-[10px]"><i class="fa-solid fa-xmark"></i></button>`:""}<span class="text-[10px] font-bold app-accent block">${i===0?"★ Sampul Utama (9:16)":"Polaroid #"+i}</span><img src="${src}" class="w-full h-24 object-cover rounded-xl"><label class="block app-btn-sec py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"><i class="fa-solid fa-crop-simple mr-1"></i>Pilih &amp; Crop<input type="file" accept="image/*" class="hide" onchange="pickCroppedInvPhoto(this,${i})"></label></div>`).join("");
}
function addGalleryPhotoSlot() { wizardState.photoSlots.push(IMG("1522673607200-164d1b6ce486")); renderPhotoSlots(); }
function pickCroppedInvPhoto(inp, idx) {
    const file = inp.files[0]; if (!file) return; inp.value = "";
    const isCover = idx === 0;
    openImageCropper(file, isCover ? 9 / 16 : 4 / 5, isCover ? "Atur Foto Sampul Utama (9:16)" : "Atur Foto Polaroid Galeri (4:5)", isCover ? 720 : 680, isCover ? 1280 : 850, async (dataUrl) => {
        showLoading("Mengunggah foto...");
        const up = await apiAction({ action: "upload_media", dataUrl, prefix: isCover ? "cover" : "gal" });
        hideLoading();
        if (up && up.ok && up.url) { wizardState.photoSlots[idx] = up.url; renderPhotoSlots(); showToast("Foto tersimpan sesuai potongan!"); }
        else showToast("Gagal mengunggah foto.", "error");
    });
}
function addStoryFieldRow(t="",y="",d="") {
    const div = document.createElement("div"); div.className = "grid sm:grid-cols-3 gap-2 app-card p-2.5 rounded-xl border story-row";
    div.innerHTML = `<input type="text" placeholder="Judul momen" value="${esc(t)}" class="st-t app-input !py-2"><input type="text" placeholder="Tahun" value="${esc(y)}" class="st-y app-input !py-2"><div class="flex gap-1.5"><input type="text" placeholder="Cerita singkat Anda" value="${esc(d)}" class="st-d app-input !py-2 flex-1"><button type="button" onclick="this.closest('.story-row').remove()" class="px-2.5 bg-red-600/15 text-red-500 rounded-xl text-xs"><i class="fa-solid fa-trash"></i></button></div>`;
    document.getElementById("story-rows-container").appendChild(div);
}
function addBankFieldRow(bk="BCA",no="",h="") {
    const div = document.createElement("div"); div.className = "grid sm:grid-cols-3 gap-2 app-card p-2.5 rounded-xl border bank-row";
    div.innerHTML = `<select class="bk-n app-input !py-2 font-bold">${Object.keys(BANK_LOGOS).map(k=>`<option value="${k}" ${k===bk?"selected":""}>${k}</option>`).join("")}</select><input type="text" placeholder="No. Rekening Anda" value="${esc(no)}" class="bk-no app-input !py-2"><div class="flex gap-1.5"><input type="text" placeholder="Atas nama Anda" value="${esc(h)}" class="bk-h app-input !py-2 flex-1"><button type="button" onclick="this.closest('.bank-row').remove()" class="px-2.5 bg-red-600/15 text-red-500 rounded-xl text-xs"><i class="fa-solid fa-trash"></i></button></div>`;
    document.getElementById("bank-rows-container").appendChild(div);
}
function autoFillDemoData() {
    const d = buildDemoInvitation(wizardState.category, wizardState.theme);
    const setV = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ""; };
    setV("f-opening-greeting", d.greeting); setV("f-opening-quote", d.introText);
    setV("f-title", d.title); setV("f-groom", d.groomName); setV("f-groom-ig", d.groomIg); setV("f-groom-parents", d.groomParents);
    setV("f-bride", d.brideName); setV("f-bride-ig", d.brideIg); setV("f-bride-parents", d.brideParents);
    setV("f-age", d.age || d.birthDate); setV("f-sub", d.subTitle);
    setVenueDropdownValue("akad", d.akadVenue); setV("f-akad-address", d.akadAddress); setV("f-akad-date", d.akadDate); setV("f-akad-time", d.akadTime); setV("f-akad-map", d.akadMap);
    setVenueDropdownValue("resepsi", d.resepsiVenue); setV("f-resepsi-address", d.resepsiAddress); setV("f-resepsi-date", d.resepsiDate); setV("f-resepsi-time", d.resepsiTime); setV("f-resepsi-map", d.resepsiMap);
    setV("f-closing-title", d.closingTitle); setV("f-closing-text", d.closingText);
    showToast("Contoh data terisi!", "info");
}

function openEditInvitation(invId, isAdminDirect = false) {
    const inv = db.invitations.find(i => String(i.id) === String(invId));
    if (!inv) return showToast("Undangan tidak ditemukan.", "error");
    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    const isStaffDirect = !!(isAdminDirect && curU && (curU.role === "master" || curU.role === "administrasi"));
    const isCabangDirect = !!(isAdminDirect && curU && curU.role === "cabang");
    const editRule = typeof getProjectEditRuleInfo === "function" ? getProjectEditRuleInfo(inv, isCabangDirect) : { isExpired: false, editsLeft: 2 - (inv.editCount || 0) };

    if (!isStaffDirect) {
        if (editRule.isExpired) return showToast("Masa edit undangan (maksimal 3 minggu / 21 hari) sudah habis.", "error");
        if (!isCabangDirect) {
            if (inv.status !== "Aktif") return showToast("Undangan baru bisa direvisi setelah disetujui Admin.", "error");
            if (editRule.editsLeft <= 0) return showToast("Kuota revisi maksimal (2 kali) sudah habis.", "error");
        }
    }
    currentViewName = "wizard";
    wizardState = {
        isEdit: true, adminDirectEdit: !!isAdminDirect, editInvId: inv.id, isCabangBypass: false,
        category: inv.category, theme: inv.theme,
        photoSlots: [...(inv.photos || [])], couplePhoto: inv.couplePhoto || IMG("1519741497674-611481863552"),
        groomPhoto: inv.groomPhoto || "./assets/model-pria.jpg", bridePhoto: inv.bridePhoto || "./assets/model-wanita.jpg",
        customAudioUrl: inv.audioUrl || "", customAudioTitle: inv.audioTitle || "", hiddenFields: inv.hiddenFields || [],
        sections: Object.assign({ sesi2: !!inv.resepsiVenue || !!inv.resepsiDate, story: !!(inv.stories && inv.stories.length), bank: !!(inv.banks && inv.banks.length), music: !!inv.audioUrl, closing: inv.closingText !== "" }, inv.sections || {})
    };
    hideAllViews(); document.getElementById("view-wizard").classList.remove("hide");
    renderHeaderActions(); pushBackGuard();
    const pr = getThemePricing(getSelectedThemeObj());
    document.getElementById("wiz-heading").innerText = isAdminDirect
        ? `Edit Langsung (Tanpa Limit) — ${inv.title}`
        : `Ajukan Revisi ke-${(inv.editCount || 0) + 1} (Sisa Kuota: ${2 - (inv.editCount || 0)}x)`;
    document.getElementById("btn-submit-inv").innerText = isAdminDirect ? "Simpan Perubahan Langsung" : `Kirim Revisi ke-${(inv.editCount || 0) + 1}`;
    document.getElementById("btn-change-theme-step").classList.toggle("hide", !isAdminDirect);
    document.getElementById("form-badge-cat").innerText = inv.category; document.getElementById("form-badge-theme").innerText = inv.theme;
    document.getElementById("form-badge-price").innerText = fmtRp(inv.price || pr.price);
    const defOpen = getDefaultOpeningText(inv.category, getSelectedThemeObj()), defClose = getDefaultClosingText(inv.category);
    const setV = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ""; };
    setV("f-opening-greeting", inv.greeting || defOpen.greeting); setV("f-opening-quote", inv.introText || defOpen.quote);
    renderDynamicMainFields({ "f-title":inv.title, "f-groom":inv.groomName, "f-groom-ig":inv.groomIg, "f-groom-parents":inv.groomParents, "f-bride":inv.brideName, "f-bride-ig":inv.brideIg, "f-bride-parents":inv.brideParents, "f-age":inv.age||inv.birthDate, "f-sub":inv.subTitle });
    ["sesi2","story","bank","music","closing"].forEach(k => toggleWizardSection(k, wizardState.sections[k]));
    document.getElementById("toggle-countdown").checked = inv.showCountdown !== false; document.getElementById("toggle-wishes").checked = inv.showWishes !== false;
    setVenueDropdownValue("akad", inv.akadVenue || ""); setV("f-akad-address", inv.akadAddress); setV("f-akad-date", inv.akadDate); setV("f-akad-time", inv.akadTime); setV("f-akad-map", inv.akadMap);
    setVenueDropdownValue("resepsi", inv.resepsiVenue || ""); setV("f-resepsi-address", inv.resepsiAddress); setV("f-resepsi-date", inv.resepsiDate); setV("f-resepsi-time", inv.resepsiTime); setV("f-resepsi-map", inv.resepsiMap);
    setV("f-closing-title", inv.closingTitle || defClose.title); setV("f-closing-text", inv.closingText !== undefined ? inv.closingText : defClose.text);
    document.getElementById("story-rows-container").innerHTML = ""; (inv.stories||[]).forEach(s => addStoryFieldRow(s.title, s.year, s.desc));
    document.getElementById("bank-rows-container").innerHTML = ""; (inv.banks||[]).forEach(b => addBankFieldRow(b.bank, b.no, b.holder));
    renderPhotoSlots(); populateMusicDropdown(inv.audioUrl); setWizardStep(2);
}

async function saveInvitationDraft(e) {
    e.preventDefault(); stopPreviewAudio(); setBtnLoading("btn-submit-inv", true, "Mengirim...");
    const getV = (id) => { const el = document.getElementById(id); return (el && !wizardState.hiddenFields.includes(id)) ? el.value.trim() : ""; };
    const s = wizardState.sections, pr = getThemePricing(getSelectedThemeObj()), curU = getCurrentUserObj();
    const cabBrand = (curU && curU.role === "cabang") ? ((curU.brandName && curU.brandName.trim()) ? curU.brandName.trim() : curU.name) : "";

    const selectedAudioUrl = s.music ? (wizardState.customAudioUrl || document.getElementById("f-preset-audio").value) : "";
    const payload = {
        category: wizardState.category, theme: wizardState.theme,
        price: pr.price, origPrice: pr.origPrice, brandName: cabBrand,
        greeting: document.getElementById("f-opening-greeting").value.trim(),
        introText: document.getElementById("f-opening-quote").value.trim(),
        title: getV("f-title"), groomName: getV("f-groom"), groomIg: getV("f-groom-ig"), groomParents: getV("f-groom-parents"),
        brideName: getV("f-bride"), brideIg: getV("f-bride-ig"), brideParents: getV("f-bride-parents"), age: getV("f-age"), birthDate: getV("f-age"), subTitle: getV("f-sub"),
        couplePhoto: wizardState.couplePhoto, groomPhoto: wizardState.groomPhoto, bridePhoto: wizardState.bridePhoto,
        akadVenue: getVenueFieldValue("akad"), akadAddress: getV("f-akad-address"), akadDate: getV("f-akad-date"), akadTime: getV("f-akad-time"), akadMap: getV("f-akad-map"),
        resepsiVenue: s.sesi2 ? getVenueFieldValue("resepsi") : "", resepsiAddress: s.sesi2 ? getV("f-resepsi-address") : "",
        resepsiDate: s.sesi2 ? getV("f-resepsi-date") : "", resepsiTime: s.sesi2 ? getV("f-resepsi-time") : "", resepsiMap: s.sesi2 ? getV("f-resepsi-map") : "",
        stories: s.story ? Array.from(document.querySelectorAll(".story-row")).map(r=>({title:r.querySelector(".st-t").value.trim(),year:r.querySelector(".st-y").value.trim(),desc:r.querySelector(".st-d").value.trim()})).filter(x=>x.title) : [],
        banks: s.bank ? Array.from(document.querySelectorAll(".bank-row")).map(r=>({bank:r.querySelector(".bk-n").value,no:r.querySelector(".bk-no").value.trim(),holder:r.querySelector(".bk-h").value.trim()})).filter(x=>x.no) : [],
        photos: [...wizardState.photoSlots],
        audioUrl: selectedAudioUrl,
        audioTitle: wizardState.customAudioTitle || "",
        closingTitle: s.closing ? getV("f-closing-title") : "", closingText: s.closing ? getV("f-closing-text") : "",
        hiddenFields: [...wizardState.hiddenFields], sections: Object.assign({}, s),
        showCountdown: document.getElementById("toggle-countdown").checked, showWishes: document.getElementById("toggle-wishes").checked
    };

    if (wizardState.isEdit) {
        if (wizardState.adminDirectEdit) {
            const orig = db.invitations.find(i => String(i.id) === String(wizardState.editInvId));
            const res = await apiAction({
                action: "upsert_invitation",
                invitation: Object.assign({}, orig, payload, { brandName: (orig && orig.brandName) || payload.brandName }),
                adminActionLog: `Mengedit langsung undangan "${payload.title}" (@${orig ? orig.owner : ""})`
            });
            setBtnLoading("btn-submit-inv", false);
            if (!res || !res.ok) return showToast((res && res.message) || "Gagal menyimpan perubahan.", "error");
            showToast("Perubahan undangan langsung tersimpan & aktif!");
            return routeDashboard();
        }
        const res = await apiAction({ action: "submit_revision", id: wizardState.editInvId, revision: payload });
        setBtnLoading("btn-submit-inv", false);
        if (!res || !res.ok) return showToast((res && res.message) || "Gagal mengajukan revisi.", "error");
        showToast("Revisi terkirim! Menunggu persetujuan Admin.");
        return routeDashboard();
    }

    const coinCost = getThemeCoinCost(wizardState.category, getSelectedThemeObj());
    const proWantsCoin = !!(curU && curU.role === "user" && curU.isPro && !wizardState.isCabangBypass && (document.querySelector('input[name="wiz_pro_paymode"]:checked')?.value === "coin"));
    const useCoinInstant = wizardState.isCabangBypass || proWantsCoin;

    let beforeQuota = 0;
    if (useCoinInstant) {
        const uNow = getCurrentUserObj();
        beforeQuota = Number((uNow && uNow.quota) || 0);
        if (beforeQuota < coinCost) {
            setBtnLoading("btn-submit-inv", false);
            return showToast(`Saldo Coin tidak cukup! Butuh ${coinCost} Coin, saldo Anda ${beforeQuota} Coin. Silakan beli paket Coin dulu.`, "error");
        }
    }

    const genKey = Math.random().toString(36).slice(2, 10);
    const newId = Date.now();
    const newInv = {
        id: newId, createdAt: newId, owner: currentSessionUser, clientKey: genKey,
        status: useCoinInstant ? "Aktif" : "Menunggu Pembayaran",
        coinCost: useCoinInstant ? coinCost : 0,
        editCount: 0, uniqueCode: getDeterministicUniqueCode(newId),
        paymentProof: "", guests: ["Tamu Kehormatan"], sentGuests: [], waTemplate: "", wishes: [], ...payload
    };
    newInv.totalPay = Number(newInv.price || 99000) + newInv.uniqueCode;

    const resInv = await apiAction({
        action: "upsert_invitation",
        invitation: newInv,
        deductQuotaFrom: useCoinInstant ? currentSessionUser : "",
        deductQuotaAmount: useCoinInstant ? coinCost : 0
    });
    if (!resInv || !resInv.ok) {
        setBtnLoading("btn-submit-inv", false);
        return showToast((resInv && resInv.message) || "Gagal menyimpan undangan.", "error");
    }

    if (useCoinInstant) {
        const expectedQuota = Math.max(0, beforeQuota - coinCost);
        const uAfter = getCurrentUserObj();
        if (uAfter) {
            const fixedU = Object.assign({}, uAfter, { quota: expectedQuota });
            if (typeof recordCoinMutation === "function") {
                recordCoinMutation(fixedU, -coinCost, `Undangan: ${payload.title || wizardState.theme}`, `${wizardState.category} • ${wizardState.theme}`, expectedQuota);
            }
            await apiAction({ action: "upsert_user", oldUsername: uAfter.username, user: fixedU });
            if (typeof ensureUserInLocalDb === "function") ensureUserInLocalDb(fixedU);
        }
    }

    setBtnLoading("btn-submit-inv", false);
    if (!Array.isArray(db.invitations)) db.invitations = [];
    if (!db.invitations.some(i => String(i.id) === String(newInv.id))) {
        db.invitations.unshift(newInv);
        idbSet("db_snapshot", db);
    }
    try { localStorage.removeItem(DRAFT_INV_KEY); } catch {}
    if (useCoinInstant) {
        showToast(wizardState.isCabangBypass
            ? `Undangan klien langsung AKTIF (-${coinCost} Coin)! Klik Link Klien untuk portal tamu.`
            : `Undangan PRO langsung AKTIF (-${coinCost} Coin)! Siap dibagikan ke tamu.`);
        return routeDashboard();
    }
    openUnifiedPayment("inv", newInv.id);
}

// ================= 2. DAFTAR TAMU & PORTAL MANDIRI CLIENT CABANG =================
let activeGlId = null, guestFilterMode = "all", guestSyncTimer = null;
let sharePayload = { invId: null, guestName: "", text: "", url: "", img: "", title: "", confirmedSent: false };
let activeClientShare = { url: "", waText: "" };

function getActiveGuestListInvitation() {
    if (clientPortalState.active && clientPortalState.invitation) return clientPortalState.invitation;
    return db.invitations.find(i => String(i.id) === String(activeGlId)) || null;
}

async function openClientPortalShareModal(invId) {
    const inv = db.invitations.find(i => String(i.id) === String(invId)); if (!inv) return;
    if (!inv.clientKey) {
        const newKey = Math.random().toString(36).slice(2, 10);
        inv.clientKey = newKey;
        showLoading("Membuat kunci akses portal klien...");
        await apiAction({ action: "sync_guests", id: inv.id, setClientKey: newKey });
        hideLoading();
    }
    const brand = getInvBrandInfo(inv);
    const portalUrl = `${getCleanBaseUrl()}?client=${inv.id}&key=${encodeURIComponent(inv.clientKey)}`;
    const waText = `Halo Kak! Undangan digital *${inv.title}* sudah aktif 🎉\n\nSilakan buka tautan khusus ini untuk melihat preview undangan, input daftar tamu (satu per satu atau massal), dan bagikan ke WhatsApp:\n${portalUrl}\n\n_${brand.waFooter}_`;
    activeClientShare = { url: portalUrl, waText };
    document.getElementById("cp-modal-inv-title").innerText = `${inv.title} (${inv.category})`;
    document.getElementById("cp-link-input").value = portalUrl;
    document.getElementById("cp-wa-preview").value = waText;
    document.getElementById("modal-client-portal").classList.remove("hide");
    pushBackGuard();
}
function copyClientPortalLinkOnly() { navigator.clipboard.writeText(activeClientShare.url); showToast("Tautan Portal Tamu Klien disalin!"); }
function openClientPortalDirect() { if (activeClientShare.url) window.open(activeClientShare.url, "_blank"); }
function sendClientPortalViaWA() { window.open(`https://wa.me/?text=${encodeURIComponent(activeClientShare.waText)}`, "_blank"); document.getElementById("modal-client-portal").classList.add("hide"); }

function openClientPortalView(inv, brandName) {
    const cleanBrand = String(brandName || inv.brandName || "Mitra Cabang").trim();
    clientPortalState = { active: true, invId: inv.id, key: inv.clientKey || "", brandName: cleanBrand, invitation: inv };
    activeGlId = inv.id; currentViewName = "guestlist"; guestFilterMode = "all";
    if (!Array.isArray(inv.guests)) inv.guests = [];
    if (!Array.isArray(inv.sentGuests)) inv.sentGuests = [];
    hideAllViews(); document.getElementById("view-guestlist").classList.remove("hide");
    document.getElementById("gl-client-portal-banner").classList.remove("hide");
    document.getElementById("gl-back-btn").classList.add("hide");

    const kopEl = document.getElementById("gl-portal-kop-badge");
    if (kopEl) kopEl.innerText = `${cleanBrand.toUpperCase()} • POWERED BY LEMBARKU`;
    document.getElementById("gl-portal-brand-title").innerText = `Undangan: ${inv.title}`;

    const brand = getInvBrandInfo(Object.assign({}, inv, { brandName: cleanBrand }));
    document.getElementById("gl-search-input").value = "";
    document.getElementById("gl-wa-template").value = inv.waTemplate || DEFAULT_WA_TEMPLATE.replace("[BRAND_FOOTER]", brand.waFooter);
    document.getElementById("gl-bulk-panel").classList.add("hide");
    document.getElementById("gl-template-panel").classList.add("hide");
    renderHeaderActions(); setGuestFilter("all"); renderGuestListStatsAndRows();
}
function previewActiveClientInv() { const inv = getActiveGuestListInvitation(); if (inv) openGuestViewWithObject(inv, "Tamu Kehormatan", false); }

function openGuestListManager(id) {
    activeGlId = id; currentViewName = "guestlist"; guestFilterMode = "all";
    const inv = db.invitations.find(i => String(i.id) === String(id)); if (!inv) return;
    if (!Array.isArray(inv.guests)) inv.guests = [];
    if (!Array.isArray(inv.sentGuests)) inv.sentGuests = [];
    const brand = getInvBrandInfo(inv);
    hideAllViews(); document.getElementById("view-guestlist").classList.remove("hide");
    document.getElementById("gl-client-portal-banner").classList.add("hide");
    document.getElementById("gl-back-btn").classList.remove("hide");
    document.getElementById("gl-search-input").value = "";
    document.getElementById("gl-wa-template").value = inv.waTemplate || DEFAULT_WA_TEMPLATE.replace("[BRAND_FOOTER]", brand.waFooter);
    document.getElementById("gl-bulk-panel").classList.add("hide");
    document.getElementById("gl-template-panel").classList.add("hide");
    renderHeaderActions(); pushBackGuard(); setGuestFilter("all"); renderGuestListStatsAndRows();
}
function toggleGuestPanel(id) {
    ["gl-bulk-panel", "gl-template-panel"].forEach(pid => {
        const el = document.getElementById(pid);
        if (pid === id) el.classList.toggle("hide"); else el.classList.add("hide");
    });
}
function setGuestFilter(mode) {
    guestFilterMode = mode;
    document.querySelectorAll(".gl-f-btn").forEach(b => {
        const active = b.dataset.f === mode;
        b.className = `gl-f-btn px-3 py-1.5 rounded-xl text-[11px] font-bold ${active ? "gold-pill-btn" : "app-btn-sec"}`;
    });
    renderGuestListRows();
}
function scheduleGuestCloudSync(inv) {
    if (!clientPortalState.active) idbSet("db_snapshot", db);
    clearTimeout(guestSyncTimer);
    guestSyncTimer = setTimeout(() => {
        apiAction({
            action: "sync_guests", id: inv.id, guests: inv.guests,
            sentGuests: inv.sentGuests || [], waTemplate: inv.waTemplate || "",
            fromClientPortal: clientPortalState.active, clientKey: clientPortalState.key || ""
        });
    }, 350);
}
function renderGuestListStatsAndRows() {
    const inv = getActiveGuestListInvitation(); if (!inv) return;
    const wishes = inv.wishes || [];
    document.getElementById("rsvp-hadir").innerText = wishes.filter(w => w.rsvp === "Hadir").length;
    document.getElementById("rsvp-tidak").innerText = wishes.filter(w => w.rsvp === "Tidak Hadir").length;
    document.getElementById("rsvp-netral").innerText = wishes.filter(w => w.rsvp !== "Hadir" && w.rsvp !== "Tidak Hadir").length;
    renderGuestListRows();
}
function renderGuestListRows() {
    const inv = getActiveGuestListInvitation(); if (!inv) return;
    if (!Array.isArray(inv.guests)) inv.guests = [];
    if (!Array.isArray(inv.sentGuests)) inv.sentGuests = [];
    const sentSet = new Set(inv.sentGuests.map(s => String(s).toLowerCase()));
    const q = (document.getElementById("gl-search-input")?.value || "").trim().toLowerCase();
    const sentCount = inv.guests.filter(g => sentSet.has(String(g).toLowerCase())).length;
    document.getElementById("gl-inv-subtitle").innerText = `${inv.title} • ${inv.guests.length} Tamu (${sentCount} Terkirim)`;

    const rows = inv.guests.map((g, idx) => ({ name: g, idx, isSent: sentSet.has(String(g).toLowerCase()) }))
        .filter(item => (!q || item.name.toLowerCase().includes(q)) && (guestFilterMode === "all" || (guestFilterMode === "sent" && item.isSent) || (guestFilterMode === "unsent" && !item.isSent)));

    const box = document.getElementById("gl-rows-container");
    if (!rows.length) {
        box.innerHTML = `<p class="text-xs app-muted text-center py-8 app-card-soft rounded-2xl border border-dashed">${inv.guests.length ? "Tidak ada tamu yang cocok dengan filter." : "Belum ada daftar tamu. Tambahkan nama tamu di atas."}</p>`;
        return;
    }
    box.innerHTML = rows.map(item => `
        <div class="app-card-soft border rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors duration-300 ${item.isSent ? "guest-sent-row" : ""}">
            <div class="flex items-center gap-2.5 flex-1 min-w-0">
                <span class="w-6 h-6 rounded-full shrink-0 text-[11px] font-bold flex items-center justify-center ${item.isSent ? "bg-emerald-500 text-white" : "app-accent-bg app-accent"}">${item.isSent ? "✓" : item.idx + 1}</span>
                <input type="text" value="${esc(item.name)}" onchange="updateGuestName(${item.idx},this.value)" class="bg-transparent text-xs font-bold focus:outline-none flex-1 min-w-0">
                ${item.isSent ? `<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-bold whitespace-nowrap">✓ Terkirim</span>` : ""}
            </div>
            <div class="flex flex-wrap gap-1.5">
                <button onclick="openGuestView(${inv.id},'${esc(item.name)}')" class="px-2.5 py-1.5 rounded-lg app-btn-sec text-[11px] font-semibold">Lihat</button>
                <button onclick="copyUniqueGuestUrl(${inv.id},'${esc(item.name)}')" class="px-2.5 py-1.5 rounded-lg app-card border text-[11px] app-accent font-semibold">Salin</button>
                <button onclick="openSocialShareModal(${inv.id},'${esc(item.name)}')" class="${item.isSent ? "bg-emerald-600 text-white font-bold" : "gold-pill-btn"} px-3 py-1.5 rounded-lg text-[11px]"><i class="fa-solid fa-paper-plane mr-1"></i>${item.isSent ? "Kirim Lagi" : "Kirim"}</button>
                <button onclick="deleteGuestItem(${item.idx})" class="px-2.5 py-1.5 rounded-lg bg-red-600/15 text-red-500 text-[11px]"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join("");
}
function addGuestToInvitation(e) {
    if (e) e.preventDefault();
    const inp = document.getElementById("gl-new-name"), name = inp.value.trim(); if (!name) return;
    const inv = getActiveGuestListInvitation(); if (!inv) return;
    if (!Array.isArray(inv.guests)) inv.guests = [];
    inv.guests.unshift(name); inp.value = "";
    renderGuestListRows(); scheduleGuestCloudSync(inv); showToast(`"${name}" ditambahkan!`);
}
function addBulkGuests() {
    const ta = document.getElementById("gl-bulk-textarea"), names = ta.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (!names.length) return showToast("Tempel minimal 1 nama tamu terlebih dahulu.", "error");
    const inv = getActiveGuestListInvitation(); if (!inv) return;
    if (!Array.isArray(inv.guests)) inv.guests = [];
    inv.guests = [...names, ...inv.guests]; ta.value = "";
    document.getElementById("gl-bulk-panel").classList.add("hide");
    renderGuestListRows(); scheduleGuestCloudSync(inv); showToast(`${names.length} tamu sekaligus berhasil ditambahkan!`);
}
function saveWaTemplate() {
    const inv = getActiveGuestListInvitation(); if (!inv) return;
    const brand = getInvBrandInfo(inv);
    inv.waTemplate = document.getElementById("gl-wa-template").value.trim() || DEFAULT_WA_TEMPLATE.replace("[BRAND_FOOTER]", brand.waFooter);
    document.getElementById("gl-template-panel").classList.add("hide");
    scheduleGuestCloudSync(inv); showToast("Template pesan WhatsApp disimpan!");
}
function resetWaTemplate() {
    const inv = getActiveGuestListInvitation(), brand = getInvBrandInfo(inv);
    document.getElementById("gl-wa-template").value = DEFAULT_WA_TEMPLATE.replace("[BRAND_FOOTER]", brand.waFooter);
    showToast("Template dikembalikan ke default.", "info");
}
function updateGuestName(i, v) {
    const inv = getActiveGuestListInvitation(); if (!inv) return;
    const oldName = inv.guests[i], newName = v.trim(); if (!newName) return;
    inv.guests[i] = newName;
    if (Array.isArray(inv.sentGuests)) inv.sentGuests = inv.sentGuests.map(s => s.toLowerCase() === String(oldName).toLowerCase() ? newName : s);
    scheduleGuestCloudSync(inv);
}
function deleteGuestItem(i) {
    const inv = getActiveGuestListInvitation(); if (!inv) return;
    const removed = inv.guests.splice(i, 1)[0];
    if (Array.isArray(inv.sentGuests)) inv.sentGuests = inv.sentGuests.filter(s => s.toLowerCase() !== String(removed).toLowerCase());
    renderGuestListRows(); scheduleGuestCloudSync(inv);
}
function markGuestAsSent(invId, guestName) {
    const inv = (clientPortalState.active && clientPortalState.invitation) ? clientPortalState.invitation : db.invitations.find(x => String(x.id) === String(invId));
    if (!inv) return;
    if (!Array.isArray(inv.sentGuests)) inv.sentGuests = [];
    if (!inv.sentGuests.some(s => s.toLowerCase() === String(guestName).toLowerCase())) {
        inv.sentGuests.push(guestName);
        if (currentViewName === "guestlist" && String(activeGlId) === String(invId)) renderGuestListRows();
        scheduleGuestCloudSync(inv);
    }
}
const buildGuestUrl = (id, g) => `${getCleanBaseUrl()}?inv=${id}&to=${encodeURIComponent(g)}`;
function formatWaMessage(inv, guestName, url) {
    const brand = getInvBrandInfo(inv);
    const tpl = (inv.waTemplate && inv.waTemplate.trim()) ? inv.waTemplate : DEFAULT_WA_TEMPLATE;
    return tpl.replace(/\[NAMA_TAMU\]/g, guestName).replace(/\[JUDUL\]/g, inv.title || "Acara Spesial").replace(/\[LINK\]/g, url).replace(/\[BRAND_FOOTER\]/g, brand.waFooter);
}
function copyUniqueGuestUrl(id, g) { navigator.clipboard.writeText(buildGuestUrl(id, g)); markGuestAsSent(id, g); showToast(`Tautan untuk ${g} disalin & ditandai Terkirim!`); }

function openSocialShareModal(id, g) {
    const inv = (clientPortalState.active && clientPortalState.invitation) ? clientPortalState.invitation : db.invitations.find(i => String(i.id) === String(id));
    if (!inv) return;
    const url = buildGuestUrl(id, g), coverImg = (inv.photos && inv.photos[0]) || "./lembarku-logo.png";
    const text = formatWaMessage(inv, g, url);
    sharePayload = { invId: id, guestName: g, text, url, img: coverImg, title: `Undangan ${inv.title}`, confirmedSent: false };
    document.getElementById("share-cover-preview").src = coverImg;
    document.getElementById("share-target-guest").innerText = g;
    document.getElementById("share-preview-text").value = text;
    document.getElementById("modal-share-sosmed").classList.remove("hide");
    pushBackGuard();
}

function cancelSocialShareModal() {
    document.getElementById("modal-share-sosmed").classList.add("hide");
    if (!sharePayload.confirmedSent) {
        showToast("Pengiriman dibatalkan — status tamu tetap belum terkirim.", "info");
    }
}

async function launchNativeShareWithPhoto() {
    if (!navigator.share) return launchSocialShare("wa");
    setBtnLoading("btn-share-native", true, "Menyiapkan foto...");
    try {
        let shareObj = { title: sharePayload.title, text: sharePayload.text };
        if (sharePayload.img && navigator.canShare) {
            const resp = await fetch(sharePayload.img), blob = await resp.blob();
            const file = new File([blob], "undangan-sampul.jpg", { type: blob.type || "image/jpeg" });
            if (navigator.canShare({ files: [file] })) shareObj.files = [file];
        }
        await navigator.share(shareObj);
        sharePayload.confirmedSent = true;
        markGuestAsSent(sharePayload.invId, sharePayload.guestName);
        document.getElementById("modal-share-sosmed").classList.add("hide");
        showToast(`Undangan untuk ${sharePayload.guestName} ditandai Terkirim!`);
    } catch (err) {
        if (err && err.name === "AbortError") {
            showToast("Berbagi dibatalkan — status tamu tidak berubah.", "info");
        } else {
            launchSocialShare("wa");
        }
    } finally {
        setBtnLoading("btn-share-native", false);
    }
}

function launchSocialShare(p) {
    const enc = encodeURIComponent(sharePayload.text);
    sharePayload.confirmedSent = true;
    markGuestAsSent(sharePayload.invId, sharePayload.guestName);
    if (p === "wa") window.open(`https://wa.me/?text=${enc}`, "_blank");
    else if (p === "tg") window.open(`https://t.me/share/url?url=${encodeURIComponent(sharePayload.url)}&text=${enc}`, "_blank");
    else { navigator.clipboard.writeText(sharePayload.text); showToast("Teks & tautan disalin! Silakan Paste di Instagram/Messenger."); }
    document.getElementById("modal-share-sosmed").classList.add("hide");
}

// ================= 3. GUEST VIEW =================
let activeGuestInv = null, guestAudio = null, guestAudioCandidates = [], guestAudioRawUrl = "", guestAudioStarted = false;
let cdInterval = null, tempWishPhoto = "";
let polaroidPhotos = [], polaroidIndex = 0, wishAutoTimer = null, wishScrollPaused = false;
let promoShownThisView = false, promoTouchStartY = 0, activeThemeTransitionPref = "random", scrollRafId = null;

function randScrubType() {
    const types = ["up", "left", "right", "zoom", "tilt-l", "tilt-r", "blur", "flip-x"];
    return types[Math.floor(Math.random() * types.length)];
}
function parseDateParts(str) {
    const d = new Date(str);
    if (isNaN(d)) return { day:"Minggu", num:"21", monthYear:"Februari 2027", full:str||"Minggu, 21 Februari 2027" };
    return { day:d.toLocaleDateString("id-ID",{weekday:"long"}), num:String(d.getDate()).padStart(2,"0"), monthYear:d.toLocaleDateString("id-ID",{month:"long",year:"numeric"}), full:d.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"}) };
}

function buildDemoInvitation(cat, themeName) {
    const t = findThemeObject(cat, themeName);
    const dm = t.demoData || {};
    const cov = getThemeCoverPair(cat, t);
    const pPria = getThemeSlotPair(t, "pria", "pria.jpg", IMG("1507003211169-0a1dd7228f2d"));
    const pWanita = getThemeSlotPair(t, "wanita", "wanita.jpg", IMG("1534528741775-53994a69daeb"));
    const pCouple = getThemeSlotPair(t, "couple", "cover.jpg", cov.fb);
    const g1 = getThemeSlotPair(t, "g1", "1.jpg", IMG("1519741497674-611481863552"));
    const g2 = getThemeSlotPair(t, "g2", "2.jpg", IMG("1511285560929-80b456fea0bc"));
    const g3 = getThemeSlotPair(t, "g3", "3.jpg", IMG("1522673607200-164d1b6ce486"));
    const defOpen = getDefaultOpeningText(cat, t), defClose = getDefaultClosingText(cat);

    const base = {
        id:"demo", category:cat, theme:t.name, showCountdown:true, showWishes:true,
        greeting:defOpen.greeting, introText:defOpen.quote, closingTitle:defClose.title, closingText:defClose.text,
        couplePhoto:pCouple.src, couplePhotoFb:pCouple.fb,
        groomPhoto:pPria.src, groomPhotoFb:pPria.fb,
        bridePhoto:pWanita.src, bridePhotoFb:pWanita.fb,
        photos:[cov.src, g1.src, g2.src, g3.src], photosFb:[cov.fb, g1.fb, g2.fb, g3.fb],
        audioUrl: t.defaultAudio || (db.musicLibrary[0] && db.musicLibrary[0].url) || "",
        banks:[{bank:"BCA",no:"8830918273",holder:"Keluarga Penyelenggara"}],
        wishes:[
            {id:1,name:"Bapak Budi & Keluarga",rsvp:"Hadir",msg:"Selamat menempuh hidup baru, semoga menjadi keluarga yang sakinah, mawaddah, warahmah!",photo:null,time:"16:30",replies:[]},
            {id:2,name:"Sahabat Kampus",rsvp:"Hadir",msg:"MasyaAllah keren banget undangannya! Semoga acaranya berjalan lancar.",photo:null,time:"16:45",replies:[]}
        ]
    };
    if (cat === "Pernikahan") return {
        ...base,
        title: dm.title || "Aqila & Fauzi",
        groomName: dm.groom || "Fauzi Ramadhan, S.T.", groomIg:"@fauzi.id",
        groomParents: dm.gparents || "Putra Bapak H. Hendra & Ibu Hj. Aminah",
        brideName: dm.bride || "Aqila Putri, S.E.", brideIg:"@aqila.id",
        brideParents: dm.bparents || "Putri Bapak H. Syamsul & Ibu Hj. Rahmawati",
        akadVenue: dm.venue || "Rumah Mempelai Wanita", akadAddress: dm.address || "Jl. Slamet Riyadi No. 1, Samarinda",
        akadDate: dm.date || "2027-02-20", akadTime:"09:00 - 11:00 WITA", akadMap:"https://maps.google.com",
        resepsiVenue: dm.venue || "Gedung Serbaguna", resepsiAddress: dm.address || "Jl. Mulawarman No. 171, Samarinda",
        resepsiDate: dm.date || "2027-02-21", resepsiTime:"11:00 - 15:00 WITA", resepsiMap:"https://maps.google.com",
        stories:[{title:"Perkenalan",year:"2021",desc:"Pertemuan awal kami di kampus yang menumbuhkan rasa saling menghargai."},{title:"Lamaran",year:"2026",desc:"Mengikat janji suci dengan restu hangat dari kedua orang tua."}]
    };
    if (cat === "Ulang Tahun") return { ...base, title:dm.title||"Arsyilla Fadillah", age:"10 Tahun", groomParents:dm.gparents||"Putri Bapak Fadli & Ibu Rina", akadVenue:dm.venue||"Rumah Mempelai Wanita", akadAddress:dm.address||"Jl. A. Yani No. 25, Samarinda", akadDate:dm.date||"2027-03-14", akadTime:"15.00 WITA - Selesai", akadMap:"https://maps.google.com" };
    if (cat === "Aqiqah") return { ...base, title:dm.title||"Ahmad Fathallah", birthDate:"10 November 2026", groomParents:dm.gparents||"Bapak Fathan & Ibu Nadia", akadVenue:dm.venue||"Kediaman Keluarga", akadAddress:dm.address||"Perumahan Bumi Asri Blok B2 No. 12, Samarinda", akadDate:dm.date||"2027-01-18", akadTime:"10.00 WITA - Selesai", akadMap:"https://maps.google.com" };
    if (cat === "Syukuran") {
        if (t.isKhitan) return { ...base, title:dm.title||"Walimatul Khitan — Muhammad Al-Fatih", groomParents:dm.gparents||"Bapak H. Kurniawan & Ibu Hj. Rahmawati", subTitle:dm.groom||"Semoga menjadi anak yang sholeh & berbakti", akadVenue:dm.venue||"Kediaman Keluarga", akadAddress:dm.address||"Jl. Ahmad Yani No. 88, Samarinda", akadDate:dm.date||"2027-01-30", akadTime:"10.00 WITA - Selesai", akadMap:"https://maps.google.com" };
        return { ...base, title:dm.title||"Syukuran Pindah Rumah", groomParents:dm.gparents||"Ardilla Fhatiyyah & Keluarga", akadVenue:dm.venue||"Kediaman Baru", akadAddress:dm.address||"Jl. Juanda Indah Blok F/7, Samarinda", akadDate:dm.date||"2027-01-25", akadTime:"11.00 WITA - Selesai", akadMap:"https://maps.google.com" };
    }
    return { ...base, title:dm.title||t.demoTitle||"Acara Spesial", subTitle:dm.groom||t.demoSub||"Silaturahmi", groomParents:dm.gparents||t.demoOrg||"Panitia", akadVenue:dm.venue||"Gedung Serbaguna", akadAddress:dm.address||"Jl. Jenderal Sudirman No. 10, Samarinda", akadDate:dm.date||"2027-02-10", akadTime:"19.30 WITA - Selesai", akadMap:"https://maps.google.com" };
}

function openThemeLivePreview(cat, themeName, isDirectDemoLink = false) {
    openGuestViewWithObject(buildDemoInvitation(cat, themeName), "Tamu Kehormatan", isDirectDemoLink);
}

async function openGuestView(invId, guestName = "Tamu Kehormatan") {
    let inv = (clientPortalState.active && clientPortalState.invitation && String(clientPortalState.invitation.id) === String(invId))
        ? clientPortalState.invitation
        : (db.invitations || []).find(i => String(i.id) === String(invId));
    if (!inv && invId && invId !== "demo") {
        showLoading("Memuat undangan...");
        inv = await fetchSingleInvitationFast(invId);
        hideLoading();
    }
    if (!inv) return showToast("Data undangan tidak ditemukan.", "error");
    openGuestViewWithObject(inv, guestName, false);
}

function usePreviewedThemeNow() {
    if (!activeGuestInv) return;
    const cat = activeGuestInv.category || "Pernikahan", theme = activeGuestInv.theme || "Adat Kalimantan";
    closeGuestInvitation();
    if (currentSessionUser && getCurrentUserObj()) {
        startCreateInvitation(getCurrentUserObj().role === "cabang", cat, theme);
        showToast(`Tema "${theme}" dipilih! Silakan isi data acara Anda.`);
    } else {
        window.pendingActionAfterLogin = { type: "inv", cat, theme };
        if (typeof openAuthModal === "function") openAuthModal();
        showToast(`Masuk / daftar dulu untuk langsung membuat undangan tema "${theme}"!`, "info");
    }
}

function sharePreviewedInvitationDemo() {
    if (!activeGuestInv) return;
    const cat = activeGuestInv.category || "Pernikahan";
    const theme = activeGuestInv.theme || "Adat Kalimantan";
    const url = `${getCleanBaseUrl()}?demo=${encodeURIComponent(cat)}&theme=${encodeURIComponent(theme)}`;
    const title = `Contoh Undangan ${cat} — ${theme}`;
    const text = `Lihat contoh desain undangan digital *${theme}* (${cat}) di Lembarku ✨\nBisa langsung dibuka & dicoba di sini:\n${url}`;
    if (typeof openDemoSocialShare === "function") {
        openDemoSocialShare({ title, text, url, subtitle: `Contoh Undangan • ${cat} — ${theme}` });
    } else {
        navigator.clipboard?.writeText(url);
        showToast("Link contoh undangan disalin!");
    }
}

// ================= SMART AUTO-FRAMING POSISI KEPALA FOTO UNDANGAN =================
let _sharedFaceDetector = null;
function _getBrowserFaceDetector() {
    if (_sharedFaceDetector !== null) return _sharedFaceDetector;
    try {
        if (typeof window !== "undefined" && "FaceDetector" in window) {
            _sharedFaceDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
            return _sharedFaceDetector;
        }
    } catch {}
    _sharedFaceDetector = false;
    return false;
}

function _applyRatioFallbackPosition(img) {
    if (!img || !img.naturalWidth || !img.naturalHeight) return;
    const natRatio = img.naturalWidth / img.naturalHeight;
    const rect = img.getBoundingClientRect();
    const boxRatio = (rect.width > 0 && rect.height > 0) ? (rect.width / rect.height) : 1;
    // Jika foto lebih vertikal dibanding kotaknya (misal potret orang di lingkaran/polaroid), geser ke atas agar kepala aman
    if (natRatio < boxRatio * 0.92) {
        img.style.objectPosition = "50% 14%";
    } else if (natRatio <= 1.15) {
        img.style.objectPosition = "50% 18%";
    } else {
        img.style.objectPosition = "50% 22%";
    }
}

async function autoFramePortraitImage(img) {
    if (!img || img.dataset.smartFramed === "1") return;
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) return;
    img.dataset.smartFramed = "1";
    _applyRatioFallbackPosition(img);

    const detector = _getBrowserFaceDetector();
    if (!detector) return;

    try {
        const faces = await detector.detect(img);
        if (!Array.isArray(faces) || !faces.length) return;
        let minTop = Infinity, maxBottom = 0, sumCenterX = 0;
        faces.forEach(f => {
            const bb = f.boundingBox || {};
            if (typeof bb.top === "number") {
                minTop = Math.min(minTop, bb.top);
                maxBottom = Math.max(maxBottom, bb.top + (bb.height || 0));
                sumCenterX += (bb.left || 0) + (bb.width || 0) * 0.5;
            }
        });
        if (!isFinite(minTop) || maxBottom <= 0) return;
        const avgX = sumCenterX / faces.length;
        const faceHeight = Math.max(1, maxBottom - minTop);
        // Beri ruang di atas kepala (~35% tinggi wajah) agar rambut & dahi utuh
        const idealTopY = Math.max(0, minTop - faceHeight * 0.38);
        const pctX = Math.max(22, Math.min(78, Math.round((avgX / img.naturalWidth) * 100)));
        const pctY = Math.max(4, Math.min(44, Math.round((idealTopY / img.naturalHeight) * 100)));
        img.style.objectPosition = `${pctX}% ${pctY}%`;
    } catch {
        // Fallback aman bila gambar lintas-origin tanpa CORS
        _applyRatioFallbackPosition(img);
    }
}

function runSmartPortraitFraming(rootEl) {
    const scope = rootEl || document.getElementById("gv-dynamic-root");
    if (!scope) return;
    scope.querySelectorAll("img.inv-portrait-smart").forEach(img => {
        if (img.complete && img.naturalWidth) {
            autoFramePortraitImage(img);
        } else if (!img.dataset.smartBound) {
            img.dataset.smartBound = "1";
            img.addEventListener("load", () => autoFramePortraitImage(img), { once: true });
        }
    });
}

function wrapPaperTurnLeaf(innerHtml, hintLabel = "Geser ➔ Buka Lembaran") {
    return `<div class="pt-stage"><div class="pt-sticky"><div class="pt-leaf">${innerHtml}<div class="pt-paper-shade"></div><span class="pt-edge-hint"><i class="fa-solid fa-book-open mr-1"></i>${hintLabel}</span></div></div></div>`;
}

function buildAmbientShadowLayer(tObj, preset) {
    const mode = (tObj.ornament === "batik" || tObj.ornament === "jawa" || tObj.ornament === "sulawesi" || (preset && preset.ambient === "batik")) ? "batik"
        : (tObj.ornament === "none") ? "none" : "leaf";
    if (mode === "none") return "";
    if (mode === "batik") {
        return `<div class="ambient-bg-layer" style="color:var(--th-accent);"><div class="ambient-batik-drift">${SVG_BATIK_SHADOW}</div></div>`;
    }
    return `<div class="ambient-bg-layer" style="color:var(--th-accent);"><div class="ambient-leaf-a">${SVG_LEAF_SHADOW}</div><div class="ambient-leaf-b">${SVG_LEAF_SHADOW}</div></div>`;
}

function syncGuestMusicBtnState(isPlaying) {
    const btn = document.getElementById("gv-music-btn");
    const icon = btn ? btn.querySelector("i") : null;
    if (icon) icon.classList.toggle("spin-slow", !!isPlaying);
    if (btn) btn.style.opacity = isPlaying ? "1" : "0.65";
}

function setupGuestInvitationAudio(audioUrl) {
    if (guestAudio) {
        guestAudio.dataset.wantPlay = "0";
        guestAudio.onerror = null;
        guestAudio.onplay = null;
        guestAudio.onpause = null;
        try { guestAudio.pause(); } catch {}
        guestAudio = null;
    }
    document.getElementById("gv-hidden-audio-el")?.remove();
    guestAudioRawUrl = String(audioUrl || "").trim();
    guestAudioCandidates = getSafeAudioCandidates(guestAudioRawUrl);
    guestAudioStarted = false;
    syncGuestMusicBtnState(false);

    if (!guestAudioCandidates.length) return;

    const el = document.createElement("audio");
    el.id = "gv-hidden-audio-el";
    el.src = guestAudioCandidates[0];
    el.loop = true;
    el.preload = "auto";
    el.autoplay = false;
    el.setAttribute("playsinline", "");
    el.style.display = "none";
    el.onplay = () => syncGuestMusicBtnState(true);
    el.onpause = () => syncGuestMusicBtnState(false);
    document.body.appendChild(el);
    guestAudio = el;
    try { el.load(); } catch {}

    if (typeof preloadAudioInBackground === "function" && guestAudioRawUrl) {
        preloadAudioInBackground(guestAudioRawUrl);
    }
}

function openGuestViewWithObject(inv, guestName, isDirectLink = false) {
    activeGuestInv = inv; promoShownThisView = false;
    document.getElementById("gv-download-promo")?.classList.add("hide");
    document.getElementById("gv-reading-progress").style.width = "0%";

    const effectiveAudio = inv.audioUrl || (db.musicLibrary && db.musicLibrary[0] && db.musicLibrary[0].url) || "";
    setupGuestInvitationAudio(effectiveAudio);

    const tObj = findThemeObject(inv.category, inv.theme);
    const preset = VISUAL_PRESETS[tObj.preset] || VISUAL_PRESETS["dark-gold"];
    const brand = getInvBrandInfo(inv);
    activeThemeTransitionPref = tObj.transition || "random";

    const extraCls = [
        preset.extra || "",
        tObj.ornament === "batik" ? "batik-pattern" : tObj.ornament === "linen" ? "linen-pattern" : "",
        tObj.photoFilter === "mono" ? "photo-filter-mono" : tObj.photoFilter === "vintage" ? "photo-filter-vintage" : ""
    ].filter(Boolean).join(" ");

    const w = document.getElementById("guest-theme-wrapper");
    w.className = `w-full max-w-[430px] mx-auto min-h-screen shadow-[0_0_60px_rgba(0,0,0,0.9)] relative overflow-x-hidden ${extraCls}`;
    for (const [k, v] of Object.entries(preset.vars)) w.style.setProperty(k, v);

    if (tObj.customColors) {
        if (tObj.customColors.bg) w.style.setProperty("--th-bg", tObj.customColors.bg);
        if (tObj.customColors.card) w.style.setProperty("--th-card-bg", tObj.customColors.card);
        if (tObj.customColors.text) w.style.setProperty("--th-text", tObj.customColors.text);
        if (tObj.customColors.accent) { w.style.setProperty("--th-accent", tObj.customColors.accent); w.style.setProperty("--th-btn-bg", tObj.customColors.accent); }
    }
    if (tObj.font) w.style.setProperty("--th-font-heading", tObj.font);
    if (tObj.frame === "sharp") w.style.setProperty("--th-card-radius", "0.35rem");
    else if (tObj.frame === "glass") { w.style.setProperty("--th-card-bg", "rgba(255,255,255,0.14)"); w.style.setProperty("--th-backdrop", "blur(14px)"); }

    const countdownTargetDate = (inv.category === "Pernikahan" && inv.resepsiDate) ? inv.resepsiDate : inv.akadDate;
    const dp = parseDateParts(inv.akadDate);
    const dpResepsi = parseDateParts(inv.resepsiDate || inv.akadDate);
    const coverDateFull = (inv.category === "Pernikahan" && inv.resepsiDate) ? dpResepsi.full : dp.full;

    const mainPhoto = (inv.photos && inv.photos[0]) || tObj.img;
    const mainPhotoFb = (inv.photosFb && inv.photosFb[0]) || tObj.img || IMG("1519741497674-611481863552");
    const styleKey = tObj.layout || tObj.style || "";
    const isPremiumBlack = styleKey === "premium_black";
    const isStoryEditorial = styleKey === "kalimantan_story" || styleKey === "editorial";
    const isCombinedCouple = (inv.category === "Pernikahan" && tObj.coupleMode === "combined" && (inv.groomName || inv.brideName));
    const defOpen = getDefaultOpeningText(inv.category, tObj);
    const openingGreeting = inv.greeting || defOpen.greeting;
    const openingQuote = inv.introText || defOpen.quote;

    document.getElementById("gv-music-btn").classList.toggle("hide", !effectiveAudio);
    const demoBarEl = document.getElementById("gv-demo-actions-bar");
    if (demoBarEl) demoBarEl.classList.toggle("hide", inv.id !== "demo");
    const useBtnEl = document.getElementById("gv-use-theme-btn");
    if (useBtnEl) useBtnEl.classList.toggle("hide", inv.id !== "demo");
    const shareBtnEl = document.getElementById("gv-share-demo-btn");
    if (shareBtnEl) shareBtnEl.classList.toggle("hide", inv.id !== "demo");

    const safeTitle = escHtml(inv.title || "");
    const safeAge = escHtml(inv.age || "");
    let coverDecor = "", coverTitleHtml = "", coverBtnLabel = `<i class="fa-solid fa-envelope-open-text"></i> Buka Undangan`;
    if (isPremiumBlack || tObj.ornament === "floral_mono") {
        coverDecor = `<div class="absolute top-0 inset-x-0 z-20">${SVG_ROSES_MONO}</div><div class="absolute bottom-0 inset-x-0 z-20 rotate-180">${SVG_ROSES_MONO}</div>`;
        coverTitleHtml = `<h1 class="font-script text-6xl text-white mt-2 drop-shadow-lg leading-tight">${safeTitle.replace(/&amp;/, "<br>&amp;")}</h1>`;
        coverBtnLabel = `<i class="fa-solid fa-chevron-right text-[10px]"></i> BUKA UNDANGAN`;
    } else if (styleKey === "jawa" || tObj.ornament === "jawa") {
        coverDecor = `<div class="pt-4 relative z-20">${SVG_GUNUNGAN_JAWA}</div>`;
        coverTitleHtml = `<span class="text-[11px] uppercase tracking-[0.3em] text-amber-300 font-bold">The Wedding Of</span><h1 class="th-heading text-5xl text-amber-300 mt-1">${safeTitle}</h1>`;
    } else if (styleKey === "sulawesi" || tObj.ornament === "sulawesi") {
        coverDecor = `<div class="absolute inset-y-0 left-0 w-3 sulawesi-border z-20"></div><div class="absolute inset-y-0 right-0 w-3 sulawesi-border z-20"></div><div class="pt-4 relative z-20">${SVG_RUMAH_SULAWESI}</div>`;
        coverTitleHtml = `<span class="text-[10px] uppercase tracking-[0.3em] text-yellow-300 font-bold">The Wedding Of</span><h1 class="th-heading text-5xl text-yellow-300 mt-1">${safeTitle}</h1>`;
    } else if (styleKey === "batik") {
        coverDecor = `<div class="absolute top-0 inset-x-0 h-20 batik-pattern border-b-2 border-amber-400/60 rounded-b-[45%] z-10"></div><div class="absolute bottom-0 inset-x-0 h-20 batik-pattern border-t-2 border-amber-400/60 rounded-t-[45%] z-10"></div>`;
        coverTitleHtml = `<span class="text-[10px] uppercase tracking-[0.35em] text-amber-300 font-bold">HAPPY WEDDING • SAVE THE DATE</span><h1 class="th-heading text-5xl text-amber-300 mt-2">${safeTitle}</h1>`;
    } else {
        const badgeTxt = inv.category === "Pernikahan" ? "THE WEDDING OF" : inv.category === "Ulang Tahun" ? "BIRTHDAY INVITATION" : inv.category === "Aqiqah" ? "TASYAKURAN AQIQAH" : inv.category === "Syukuran" ? (tObj.isKhitan ? "WALIMATUL KHITAN" : "UNDANGAN SYUKURAN") : "UNDANGAN RESMI";
        coverTitleHtml = `<span class="text-[10px] uppercase tracking-[0.32em] text-amber-200 font-semibold">${badgeTxt}</span><h1 class="th-heading text-5xl md:text-6xl text-white mt-2 drop-shadow-lg">${safeTitle}</h1>${inv.age?`<span class="inline-block mt-1 px-4 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-bold">${inv.category==="Ulang Tahun"?"Ke - "+safeAge:safeAge}</span>`:""}`;
    }

    const coverHtml = `
        <div id="gv-cover-stage" class="fixed inset-0 z-50 max-w-[430px] mx-auto overflow-hidden bg-black flex flex-col justify-between">
            <div class="curtain-l absolute inset-0 pointer-events-none" style="clip-path:inset(0 49.8% 0 0);"><img src="${mainPhoto}" ${imgFbAttr(mainPhotoFb)} class="inv-photo inv-portrait-smart w-full h-full object-cover"><div class="absolute inset-0" style="background:${preset.coverOverlay}"></div></div>
            <div class="curtain-r absolute inset-0 pointer-events-none" style="clip-path:inset(0 0 0 49.8%);"><img src="${mainPhoto}" ${imgFbAttr(mainPhotoFb)} class="inv-photo inv-portrait-smart w-full h-full object-cover"><div class="absolute inset-0" style="background:${preset.coverOverlay}"></div></div>
            ${coverDecor}
            <div class="cover-inner relative z-20 flex-1 flex flex-col justify-between p-7 text-center text-white">
                <div class="pt-4"><span class="text-[9px] uppercase tracking-[0.35em] text-white/80 font-semibold">${escHtml(brand.topLabel)}</span></div>
                <div class="my-auto py-4 space-y-2">${coverTitleHtml}<p class="text-xs tracking-[0.2em] uppercase text-white/90 font-semibold pt-1">${escHtml(coverDateFull)}</p></div>
                <div class="space-y-4 pb-8">
                    <div class="bg-black/45 backdrop-blur-md border border-white/25 rounded-2xl p-4 space-y-1">
                        <p class="text-[10px] text-white/75 uppercase tracking-wider">Kepada Yth. Bapak/Ibu/Saudara/i</p>
                        <h2 class="text-base font-bold ${isPremiumBlack?"text-white":"text-amber-200"} tracking-wide">${escHtml(guestName)}</h2>
                        <p class="text-[10px] text-white/65">di Tempat</p>
                    </div>
                    <button onclick="unlockInvitationWithRandomFx()" class="${isPremiumBlack?"bg-white text-black font-extrabold rounded-full":"th-btn-primary"} px-8 py-3.5 text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-2xl border border-white/20">
                        ${coverBtnLabel}
                    </button>
                </div>
            </div>
        </div>
    `;

    const ambientShadowHtml = buildAmbientShadowLayer(tObj, preset);
    const fixedBackdropHtml = isStoryEditorial ? `<div class="sticky top-0 w-full h-screen -mb-[100vh] pointer-events-none overflow-hidden z-0"><img src="${mainPhoto}" ${imgFbAttr(mainPhotoFb)} class="inv-photo w-full h-full object-cover object-center opacity-50"><div class="absolute inset-0" style="background:${styleKey==="kalimantan_story"?"linear-gradient(180deg, rgba(118,16,24,0.68) 0%, rgba(84,10,16,0.78) 55%, rgba(48,4,8,0.92) 100%)":"linear-gradient(180deg, rgba(12,12,15,0.68) 0%, rgba(12,12,15,0.84) 100%)"};"></div></div>` : "";

    const openingSectionHtml = `
        <section class="relative z-10 min-h-[82vh] flex flex-col justify-center items-center text-center px-7 py-14 space-y-5">
            <div class="th-card p-7 space-y-4 w-full">
                ${(inv.category==="Pernikahan" || inv.category==="Aqiqah" || tObj.ornament==="islami" || (inv.category==="Syukuran" && tObj.faith==="islami")) ? `<p class="font-arab text-2xl th-accent">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>` : `<i class="fa-solid fa-sparkles text-xl th-accent"></i>`}
                <h3 class="font-serif-ed text-base font-bold th-accent tracking-wide">${escHtml(openingGreeting)}</h3>
                <p class="text-xs leading-relaxed opacity-90 italic">${escHtml(openingQuote)}</p>
                <div class="w-16 h-[1px] bg-current opacity-30 mx-auto pt-1"></div>
                <p class="text-[10px] uppercase tracking-[0.25em] opacity-70">Gulir ke bawah <i class="fa-solid fa-angles-down ml-1 animate-bounce"></i></p>
            </div>
        </section>
    `;

    let coupleSlidesHtml = "", bodyInner = "";
    if (inv.category === "Pernikahan") {
        const gImg = inv.groomPhoto || "./assets/model-pria.jpg", gFb = inv.groomPhotoFb || IMG("1507003211169-0a1dd7228f2d");
        const bImg = inv.bridePhoto || "./assets/model-wanita.jpg", bFb = inv.bridePhotoFb || IMG("1534528741775-53994a69daeb");
        const gShort = (inv.groomName || "Mempelai Pria").split(" ")[0], bShort = (inv.brideName || "Mempelai Wanita").split(" ")[0];
        const gIgClean = (inv.groomIg || "").replace(/^@/, ""), bIgClean = (inv.brideIg || "").replace(/^@/, "");

        if (isCombinedCouple) {
            const cImg = inv.couplePhoto || mainPhoto, cFb = inv.couplePhotoFb || mainPhotoFb;
            const combinedInner = `
                <div class="w-full h-full flex flex-col bg-[var(--th-bg)]">
                    <div class="relative w-full h-[54vh] overflow-hidden shrink-0">
                        <img src="${cImg}" ${imgFbAttr(cFb)} class="inv-photo inv-portrait-smart w-full h-full object-cover">
                        <div class="absolute inset-x-0 bottom-0 h-28" style="background:linear-gradient(to top, var(--th-bg) 8%, transparent 100%);"></div>
                    </div>
                    <div class="flex-1 px-7 pb-12 -mt-6 relative z-10 text-center space-y-3 flex flex-col justify-center">
                        ${(styleKey==="jawa"||tObj.ornament==="jawa")?`<div class="scale-75 -my-4">${SVG_GUNUNGAN_JAWA}</div>`:""}
                        ${inv.brideName?`<div class="space-y-0.5"><h2 class="th-heading text-4xl">${escHtml(inv.brideName)}</h2>${inv.brideParents?`<p class="text-[11px] opacity-80">${escHtml(inv.brideParents)}</p>`:""}</div>`:""}
                        ${(inv.groomName&&inv.brideName)?`<div class="th-heading text-3xl leading-none">&amp;</div>`:""}
                        ${inv.groomName?`<div class="space-y-0.5"><h2 class="th-heading text-4xl">${escHtml(inv.groomName)}</h2>${inv.groomParents?`<p class="text-[11px] opacity-80">${escHtml(inv.groomParents)}</p>`:""}</div>`:""}
                    </div>
                </div>
            `;
            coupleSlidesHtml = `<div class="scrub-el" data-scrub="${randScrubType()}">${wrapPaperTurnLeaf(combinedInner, "Geser ➔ Buka Isi Undangan")}</div>`;
        } else if (inv.groomName || inv.brideName) {
            let leaf1Html = "", slide2Html = "";
            if (isPremiumBlack) {
                leaf1Html = `<div class="w-full h-full flex flex-col justify-center items-center text-center px-7 py-12 space-y-5 bg-[#070709] relative">${SVG_ROSES_MONO}<div class="w-48 h-48 rounded-full overflow-hidden border-2 border-white/75 shadow-2xl"><img src="${gImg}" ${imgFbAttr(gFb)} class="inv-photo inv-portrait-smart w-full h-full object-cover"></div><span class="text-[10px] uppercase tracking-[0.35em] text-zinc-400 font-bold">The Groom</span><h2 class="font-script text-5xl text-white">${escHtml(inv.groomName)}</h2>${inv.groomParents?`<p class="text-xs text-zinc-300 max-w-xs leading-relaxed">${escHtml(inv.groomParents)}</p>`:""}${gIgClean?`<a href="https://instagram.com/${encodeURIComponent(gIgClean)}" target="_blank" class="px-4 py-1.5 rounded-full border border-white/30 text-[11px] text-white"><i class="fa-brands fa-instagram mr-1.5"></i>@${escHtml(gIgClean)}</a>`:""}</div>`;
                slide2Html = `<section class="min-h-screen flex flex-col justify-center items-center text-center px-7 py-14 space-y-5 bg-[#070709] relative"><div class="scrub-el w-48 h-48 rounded-full overflow-hidden border-2 border-white/75 shadow-2xl" data-scrub="zoom"><img src="${bImg}" ${imgFbAttr(bFb)} class="inv-photo inv-portrait-smart w-full h-full object-cover"></div><span class="scrub-el text-[10px] uppercase tracking-[0.35em] text-zinc-400 font-bold" data-scrub="up">The Bride</span><h2 class="scrub-el font-script text-5xl text-white" data-scrub="blur">${escHtml(inv.brideName)}</h2>${inv.brideParents?`<p class="scrub-el text-xs text-zinc-300 max-w-xs leading-relaxed" data-scrub="up">${escHtml(inv.brideParents)}</p>`:""}${bIgClean?`<a href="https://instagram.com/${encodeURIComponent(bIgClean)}" target="_blank" class="px-4 py-1.5 rounded-full border border-white/30 text-[11px] text-white"><i class="fa-brands fa-instagram mr-1.5"></i>@${escHtml(bIgClean)}</a>`:""}</section>`;
            } else if (isStoryEditorial) {
                leaf1Html = `<div class="w-full h-full flex flex-col justify-center px-6 py-10 space-y-5 bg-[var(--th-bg)]"><div class="relative text-center py-1"><span class="font-serif-ed text-7xl opacity-20 absolute inset-0 flex items-center justify-center pointer-events-none">&amp;</span><h2 class="font-serif-ed text-3xl text-white tracking-wide relative z-10 leading-tight">Groom &amp; Bride</h2></div><div class="relative w-[80%] mr-auto -rotate-2"><div class="editorial-polaroid"><div class="aspect-[4/5] w-full overflow-hidden bg-black"><img src="${gImg}" ${imgFbAttr(gFb)} class="inv-photo inv-portrait-smart w-full h-full object-cover"></div>${gIgClean?`<div class="mt-2.5 text-center text-xs font-semibold text-zinc-800"><i class="fa-brands fa-instagram mr-1"></i>${escHtml(gIgClean)}</div>`:`<div class="mt-2.5 text-center text-[11px] font-semibold text-zinc-500 tracking-widest uppercase">The Groom</div>`}</div><span class="font-script text-4xl text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)] absolute -right-4 bottom-12 rotate-2">${escHtml(gShort)}</span></div><div class="text-left space-y-1 px-1"><h3 class="font-serif-ed text-3xl font-bold th-accent">${escHtml(inv.groomName)}</h3>${inv.groomParents?`<p class="text-xs text-white/90 leading-relaxed max-w-xs">${escHtml(inv.groomParents)}</p>`:""}</div></div>`;
                slide2Html = `<section class="min-h-screen flex flex-col justify-center px-6 py-12 space-y-6"><div class="scrub-el text-center" data-scrub="zoom"><span class="font-serif-ed text-5xl text-white/75">&amp;</span></div><div class="scrub-el relative w-[82%] ml-auto rotate-2" data-scrub="${randScrubType()}"><div class="editorial-polaroid"><div class="aspect-[4/5] w-full overflow-hidden bg-black"><img src="${bImg}" ${imgFbAttr(bFb)} class="inv-photo inv-portrait-smart w-full h-full object-cover"></div>${bIgClean?`<a href="https://instagram.com/${encodeURIComponent(bIgClean)}" target="_blank" class="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-800"><i class="fa-brands fa-instagram text-sm"></i>${escHtml(bIgClean)}</a>`:`<div class="mt-3 text-center text-[11px] font-semibold text-zinc-500 tracking-widest uppercase">The Bride</div>`}</div><span class="font-script text-4xl text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)] absolute -left-4 bottom-12 -rotate-2">${escHtml(bShort)}</span></div><div class="scrub-el text-right space-y-1 pt-2 px-1" data-scrub="right"><h3 class="font-serif-ed text-4xl font-bold th-accent">${escHtml(inv.brideName)}</h3>${inv.brideParents?`<p class="text-xs text-white/90 leading-relaxed max-w-xs ml-auto">${escHtml(inv.brideParents)}</p>`:""}</div></section>`;
            } else {
                leaf1Html = `<div class="relative w-full h-full flex flex-col justify-end overflow-hidden bg-black"><img src="${gImg}" ${imgFbAttr(gFb)} class="inv-photo inv-portrait-smart absolute inset-0 w-full h-full object-cover"><div class="absolute inset-0" style="background:linear-gradient(to top, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.85) 26%, rgba(255,255,255,0.18) 54%, transparent 72%);"></div><div class="relative z-10 px-7 pb-14 pt-20 text-center text-zinc-900 space-y-1.5"><span class="text-[10px] uppercase tracking-[0.3em] text-amber-700 font-extrabold block">Mempelai Pria</span><h2 class="text-4xl font-bold text-zinc-900" style="font-family:var(--th-font-heading);">${escHtml(inv.groomName)}</h2>${inv.groomParents?`<p class="text-xs text-zinc-700 font-medium max-w-xs mx-auto leading-relaxed">${escHtml(inv.groomParents)}</p>`:""}</div></div>`;
                slide2Html = `<section class="relative w-full min-h-screen flex flex-col justify-end overflow-hidden bg-black"><img src="${bImg}" ${imgFbAttr(bFb)} class="inv-photo inv-portrait-smart absolute inset-0 w-full h-full object-cover"><div class="absolute inset-0" style="background:linear-gradient(to top, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.85) 26%, rgba(255,255,255,0.18) 54%, transparent 72%);"></div><div class="scrub-el relative z-10 px-7 pb-14 pt-20 text-center text-zinc-900 space-y-1.5" data-scrub="up"><span class="text-[10px] uppercase tracking-[0.3em] text-amber-700 font-extrabold block">Mempelai Wanita</span><h2 class="text-4xl font-bold text-zinc-900" style="font-family:var(--th-font-heading);">${escHtml(inv.brideName)}</h2>${inv.brideParents?`<p class="text-xs text-zinc-700 font-medium max-w-xs mx-auto leading-relaxed">${escHtml(inv.brideParents)}</p>`:""}</div></section>`;
            }
            coupleSlidesHtml = `<div class="relative z-10"><div class="scrub-el" data-scrub="${randScrubType()}">${wrapPaperTurnLeaf(leaf1Html, "Geser ➔ Mempelai Wanita")}</div><div class="pt-reveal-target">${slide2Html}</div></div>`;
        }

        const scheduleHtml = isPremiumBlack ? `
            ${inv.showCountdown !== false ? buildCountdownOnly(dpResepsi, "Menuju Hari Resepsi") : ""}
            <section class="scrub-el pb-white-card p-6 text-center space-y-5 relative overflow-hidden" data-scrub="${randScrubType()}">
                <div class="space-y-2.5">
                    <span class="scrub-el font-script text-xl text-zinc-600 block -mb-2" data-scrub="up">Detail Acara</span>
                    <h3 class="scrub-el font-script text-4xl text-zinc-900" data-scrub="zoom">Akad Nikah</h3>
                    ${inv.akadVenue ? `<p class="scrub-el text-xs font-bold text-zinc-800" data-scrub="left">${escHtml(inv.akadVenue)}</p>` : ""}
                    <p class="scrub-el text-[11px] text-zinc-600 leading-relaxed max-w-xs mx-auto" data-scrub="right">${escHtml(inv.akadAddress)}</p>
                    <p class="scrub-el text-xs font-semibold text-zinc-700 pt-1" data-scrub="up">${dp.full}<br>${escHtml(inv.akadTime)}</p>
                    <div class="space-y-2 pt-2">
                        ${inv.akadMap ? `<button onclick="openEventMap('akad')" class="w-full py-2.5 rounded-full bg-zinc-950 text-white text-xs font-bold tracking-wider uppercase"><i class="fa-solid fa-location-dot mr-1.5"></i>MAP</button>` : ""}
                        <button onclick="saveEventToGoogleCalendar()" class="w-full py-2.5 rounded-full bg-white text-zinc-900 border border-zinc-900 text-xs font-bold tracking-wider uppercase"><i class="fa-regular fa-calendar-check mr-1.5"></i>CALENDAR</button>
                    </div>
                </div>
                ${(inv.resepsiVenue || inv.resepsiDate) ? `
                    <div class="w-16 h-[1.5px] bg-zinc-800 mx-auto my-2"></div>
                    <div class="space-y-2.5">
                        <h3 class="scrub-el font-script text-4xl text-zinc-900" data-scrub="zoom">Resepsi</h3>
                        ${inv.resepsiVenue ? `<p class="scrub-el text-xs font-bold text-zinc-800" data-scrub="right">${escHtml(inv.resepsiVenue)}</p>` : ""}
                        <p class="scrub-el text-[11px] text-zinc-600 leading-relaxed max-w-xs mx-auto" data-scrub="left">${escHtml(inv.resepsiAddress)}</p>
                        <p class="scrub-el text-xs font-semibold text-zinc-700 pt-1" data-scrub="up">${dpResepsi.full}<br>${escHtml(inv.resepsiTime)}</p>
                        ${inv.resepsiMap ? `<div class="pt-2"><button onclick="openEventMap('resepsi')" class="w-full py-2.5 rounded-full bg-zinc-950 text-white text-xs font-bold tracking-wider uppercase"><i class="fa-solid fa-location-dot mr-1.5"></i>MAP</button></div>` : ""}
                    </div>
                ` : ""}
            </section>
        ` : isStoryEditorial ? `
            <section class="scrub-el arch-tall-card px-6 pt-16 pb-10 text-center text-white space-y-6" data-scrub="${randScrubType()}">
                ${inv.showCountdown !== false ? `<div class="scrub-el space-y-4" data-scrub="zoom"><div class="leading-none"><span class="font-script text-4xl text-white block -mb-2">Count</span><span class="font-serif-ed text-3xl text-white tracking-wide">the Date</span></div><div class="grid grid-cols-4 gap-2 pt-1"><div><span id="cd-days" class="font-serif-ed text-3xl block">00</span><span class="text-[11px] text-white/80">Hari</span></div><div><span id="cd-hours" class="font-serif-ed text-3xl block">00</span><span class="text-[11px] text-white/80">Jam</span></div><div><span id="cd-mins" class="font-serif-ed text-3xl block">00</span><span class="text-[11px] text-white/80">Menit</span></div><div><span id="cd-secs" class="font-serif-ed text-3xl block">00</span><span class="text-[11px] text-white/80">Detik</span></div></div><button onclick="saveEventToGoogleCalendar()" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/65 hover:bg-black/80 border border-white/20 text-xs font-semibold text-white"><i class="fa-regular fa-calendar-check"></i> Simpan di Kalender</button></div><div class="w-[1.5px] h-20 mx-auto bg-gradient-to-b from-amber-200/90 via-amber-300/60 to-transparent"></div>` : ""}
                <div class="scrub-el space-y-2.5" data-scrub="${randScrubType()}"><h3 class="font-serif-ed text-2xl tracking-[0.14em] th-accent uppercase">Akad Nikah</h3><p class="text-sm font-medium">${dp.full}</p><p class="text-xs text-white/90">${escHtml(inv.akadTime)}</p>${inv.akadVenue ? `<p class="text-[11px] tracking-[0.2em] uppercase text-white/75 pt-2 font-semibold">Bertempat Di</p><p class="text-xs font-semibold">${escHtml(inv.akadVenue)}</p>` : ""}<p class="text-xs text-white/85 leading-relaxed">${escHtml(inv.akadAddress)}</p>${inv.akadMap?`<div class="pt-2"><button onclick="openEventMap('akad')" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/65 hover:bg-black/80 border border-white/20 text-xs font-semibold text-white"><i class="fa-solid fa-location-dot"></i> Google Maps</button></div>`:""}</div>
                ${(inv.resepsiVenue || inv.resepsiDate) ? `<div class="w-16 h-[1px] bg-amber-200/35 mx-auto my-2"></div><div class="scrub-el space-y-2.5" data-scrub="${randScrubType()}"><h3 class="font-serif-ed text-2xl tracking-[0.14em] th-accent uppercase">Resepsi</h3><p class="text-sm font-medium">${dpResepsi.full}</p><p class="text-xs text-white/90">${escHtml(inv.resepsiTime)}</p>${inv.resepsiVenue ? `<p class="text-xs font-semibold pt-1">${escHtml(inv.resepsiVenue)}</p>` : ""}<p class="text-xs text-white/85 leading-relaxed">${escHtml(inv.resepsiAddress)}</p>${inv.resepsiMap?`<div class="pt-2"><button onclick="openEventMap('resepsi')" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/65 hover:bg-black/80 border border-white/20 text-xs font-semibold text-white"><i class="fa-solid fa-location-dot"></i> Google Maps</button></div>`:""}</div>` : ""}
            </section>
        ` : styleKey === "sulawesi" ? `
            ${inv.showCountdown !== false ? buildCountdownOnly(dpResepsi, "Menuju Hari Resepsi") : ""}
            <section class="scrub-el th-card p-5 space-y-4 text-center relative overflow-hidden" data-scrub="${randScrubType()}"><div class="absolute inset-y-0 left-0 w-2 sulawesi-border"></div><div class="absolute inset-y-0 right-0 w-2 sulawesi-border"></div>${SVG_RUMAH_SULAWESI}<h2 class="th-heading text-3xl">Rangkaian Acara</h2><div class="grid grid-cols-3 items-center gap-2 py-2 border-y border-current/20"><div class="text-[11px] space-y-1"><strong class="th-accent block">Akad Nikah</strong><span>${escHtml(inv.akadTime)}</span><span class="block opacity-80">${escHtml(inv.akadVenue || "")}</span></div><div class="border-x border-current/30 px-1 py-2"><span class="text-[10px] uppercase block">${dpResepsi.day}</span><span class="text-3xl font-extrabold th-accent block leading-none my-1">${dpResepsi.num}</span><span class="text-[9px] uppercase">${dpResepsi.monthYear}</span></div><div class="text-[11px] space-y-1"><strong class="th-accent block">${(inv.resepsiVenue||inv.resepsiDate)?"Resepsi":"Lokasi"}</strong><span>${escHtml(inv.resepsiTime||inv.akadTime)}</span><span class="block opacity-80">${escHtml(inv.resepsiVenue||inv.akadAddress)}</span></div></div><p class="text-[11px] opacity-85">${escHtml(inv.resepsiAddress||inv.akadAddress)}</p><div class="flex gap-2">${inv.akadMap?`<button onclick="openEventMap('akad')" class="flex-1 th-btn-primary py-2.5 text-xs uppercase">MAP</button>`:""}<button onclick="saveEventToGoogleCalendar()" class="flex-1 th-btn-outline py-2.5 text-xs uppercase">CALENDAR</button></div></section>
        ` : buildCountdownAndLoc(inv, dp, styleKey === "jawa", dpResepsi);

        const storyHtml = (inv.stories && inv.stories.length) ? (isPremiumBlack
            ? `<section class="scrub-el th-card p-6 text-center space-y-4 relative overflow-hidden" data-scrub="${randScrubType()}"><div class="scrub-el w-28 h-28 mx-auto rounded-full overflow-hidden border border-white/60" data-scrub="zoom"><img src="${mainPhoto}" ${imgFbAttr(mainPhotoFb)} class="inv-photo inv-portrait-smart w-full h-full object-cover"></div><h2 class="scrub-el font-script text-4xl text-white" data-scrub="blur">Our Love Story</h2><div class="space-y-4">${inv.stories.map(s => `<div class="scrub-el space-y-1" data-scrub="${randScrubType()}"><h4 class="font-serif-ed text-lg font-bold text-white">${escHtml(s.title)}</h4>${s.year?`<span class="text-[11px] text-zinc-400 font-semibold block">${escHtml(s.year)}</span>`:""}<p class="text-xs text-zinc-300 leading-relaxed">${escHtml(s.desc)}</p></div>`).join("")}</div></section>`
            : `<section class="scrub-el th-card p-6 text-center space-y-4" data-scrub="${randScrubType()}"><h2 class="th-heading text-3xl">Our Love Story</h2><div class="space-y-3 text-left">${inv.stories.map(s=>`<div class="scrub-el border-l-2 th-border-accent pl-3" data-scrub="${randScrubType()}"><h4 class="font-bold text-xs th-accent">${escHtml(s.title)}${s.year?` (${escHtml(s.year)})`:""}</h4><p class="text-xs opacity-85">${escHtml(s.desc)}</p></div>`).join("")}</div></section>`) : "";

        bodyInner = `${scheduleHtml}${storyHtml}`;
    } else if (inv.category === "Syukuran") {
        const sym = tObj.faith === "islami" ? `<p class="font-arab text-3xl th-accent">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>` : tObj.faith === "kristen" ? `<i class="fa-solid fa-cross text-2xl th-accent"></i>` : tObj.faith === "hindu_buddha" ? `<i class="fa-solid fa-spa text-2xl th-accent"></i>` : `<i class="fa-solid fa-leaf text-xl th-accent"></i>`;
        bodyInner = `<section class="scrub-el bg-white/95 text-zinc-900 rounded-2xl border-2 th-border-accent p-6 text-center space-y-4 shadow-xl" data-scrub="${randScrubType()}"><div class="border th-border-accent rounded-xl p-5 space-y-3.5"><span class="text-[10px] uppercase tracking-[0.25em] th-accent font-extrabold">${tObj.isKhitan?"Walimatul Khitan":"Undangan Syukuran"}</span><h1 class="th-heading text-3xl font-bold">${escHtml(inv.title)}</h1>${inv.subTitle?`<p class="text-xs text-zinc-600 italic">${escHtml(inv.subTitle)}</p>`:""}${sym}<div class="bg-amber-50/60 border th-border-accent rounded-xl p-3.5 text-left text-xs space-y-1 text-zinc-800"><div class="grid grid-cols-[70px_10px_1fr]"><strong>Hari</strong><span>:</span><span>${dp.day}</span></div><div class="grid grid-cols-[70px_10px_1fr]"><strong>Tanggal</strong><span>:</span><span>${dp.num} ${dp.monthYear}</span></div><div class="grid grid-cols-[70px_10px_1fr]"><strong>Pukul</strong><span>:</span><span>${escHtml(inv.akadTime)}</span></div><div class="grid grid-cols-[70px_10px_1fr]"><strong>Tempat</strong><span>:</span><span>${escHtml([inv.akadVenue, inv.akadAddress].filter(Boolean).join(", "))}</span></div></div>${inv.groomParents?`<div class="text-xs pt-1"><p class="text-zinc-500">Hormat kami,</p><h4 class="font-bold text-sm th-accent">${escHtml(inv.groomParents)}</h4></div>`:""}<div class="flex gap-2 pt-2">${inv.akadMap?`<button onclick="openEventMap('akad')" class="flex-1 th-btn-primary py-2.5 text-xs">Peta Lokasi</button>`:""}<button onclick="saveEventToGoogleCalendar()" class="flex-1 th-btn-outline py-2.5 text-xs">Kalender</button></div></div></section>${inv.showCountdown!==false?buildCountdownOnly(dp):""}`;
    } else if (inv.category === "Ulang Tahun") {
        bodyInner = `<section class="scrub-el bg-white/95 text-zinc-800 rounded-3xl border-2 th-border-accent p-6 text-center space-y-4 shadow-xl" data-scrub="${randScrubType()}"><div class="scrub-el w-36 h-36 mx-auto rounded-full overflow-hidden border-4 th-border-accent shadow-lg" data-scrub="zoom"><img src="${mainPhoto}" ${imgFbAttr(mainPhotoFb)} class="inv-photo inv-portrait-smart w-full h-full object-cover"></div><div class="inline-block px-6 py-2 rounded-full bg-black/5 border th-border-accent"><h2 class="font-cute text-2xl font-bold th-accent">${escHtml(inv.title)}</h2>${inv.age?`<span class="text-xs font-bold text-zinc-700 block">Ke - ${escHtml(inv.age)}</span>`:""}</div>${inv.groomParents?`<p class="text-xs text-zinc-600">${escHtml(inv.groomParents)}</p>`:""}<div class="grid grid-cols-3 items-center gap-2 max-w-xs mx-auto"><div class="border-y-2 th-border-accent py-1.5 text-xs font-bold text-zinc-700">${dp.day}</div><div class="font-cute text-4xl font-bold th-accent">${dp.num}</div><div class="border-y-2 th-border-accent py-1.5 text-[11px] font-bold text-zinc-700">${escHtml((inv.akadTime||"").split(" ")[0])}</div></div><p class="text-sm font-bold th-accent">${dp.monthYear}</p></section>${buildCountdownAndLoc(inv, dp)}`;
    } else if (inv.category === "Aqiqah") {
        bodyInner = `<section class="scrub-el bg-white/95 text-zinc-800 rounded-t-[160px] rounded-b-3xl border-2 th-border-accent p-6 pt-10 text-center space-y-4 shadow-xl" data-scrub="${randScrubType()}"><h2 class="th-heading text-4xl leading-tight">Tasyakuran<br>Aqiqah</h2><div class="scrub-el w-36 h-36 mx-auto rounded-full overflow-hidden scalloped-frame my-2" data-scrub="zoom"><img src="${mainPhoto}" ${imgFbAttr(mainPhotoFb)} class="inv-photo inv-portrait-smart w-full h-full object-cover"></div><div><h3 class="text-2xl font-extrabold th-accent">${escHtml(inv.title)}</h3>${inv.birthDate?`<p class="text-[11px] text-zinc-500">Lahir: ${escHtml(inv.birthDate)}</p>`:""}</div><div class="bg-amber-50/50 border th-border-accent rounded-2xl p-3.5 grid grid-cols-[90px_1fr] items-center gap-3 text-left"><div class="text-center border-r th-border-accent pr-2"><span class="text-[10px] font-bold uppercase text-zinc-500 block">${dp.day}</span><span class="text-3xl font-extrabold th-accent leading-none my-1 block">${dp.num}</span><span class="text-[10px] font-bold uppercase text-zinc-700">${dp.monthYear}</span></div><div class="space-y-1.5 text-[11px] text-zinc-700"><p><i class="fa-regular fa-clock th-accent mr-1"></i><strong>${escHtml(inv.akadTime)}</strong></p><p><i class="fa-solid fa-location-dot th-accent mr-1"></i>${escHtml([inv.akadVenue, inv.akadAddress].filter(Boolean).join(", "))}</p></div></div>${inv.groomParents?`<div class="text-xs"><p class="text-[11px] text-zinc-500">Kami yang berbahagia:</p><p class="font-bold th-accent text-sm">${escHtml(inv.groomParents)}</p></div>`:""}</section>${buildCountdownAndLoc(inv, dp)}`;
    } else {
        bodyInner = `<section class="scrub-el th-card p-6 text-center space-y-3" data-scrub="${randScrubType()}"><h2 class="th-heading text-3xl font-extrabold">${escHtml(inv.title)}</h2>${inv.subTitle?`<p class="text-xs font-bold opacity-85 uppercase">${escHtml(inv.subTitle)}</p>`:""}${inv.groomParents?`<p class="text-xs font-semibold th-accent pt-1">${escHtml(inv.groomParents)}</p>`:""}</section>${buildCountdownAndLoc(inv, dp)}`;
    }

    const closingText = inv.closingText !== undefined ? inv.closingText : getDefaultClosingText(inv.category).text;
    const closingTitle = inv.closingTitle || getDefaultClosingText(inv.category).title;
    const closingHtml = (inv.sections?.closing !== false && closingText) ? `<section class="scrub-el th-card p-7 text-center space-y-4" data-scrub="${randScrubType()}"><div class="scrub-el w-20 h-20 mx-auto rounded-full overflow-hidden border border-white/40 shadow-lg" data-scrub="zoom"><img src="${mainPhoto}" ${imgFbAttr(mainPhotoFb)} class="inv-photo inv-portrait-smart w-full h-full object-cover"></div><h2 class="th-heading text-4xl leading-snug">${escHtml(closingTitle)}</h2><p class="text-xs leading-relaxed opacity-90">${escHtml(closingText)}</p><div class="pt-2 border-t border-current/15"><span class="text-[10px] uppercase tracking-[0.25em] opacity-70 block">Kami yang berbahagia</span><h4 class="th-heading text-3xl mt-1">${escHtml(inv.title)}</h4></div></section>` : "";

    const bankHtml = (inv.banks && inv.banks.length) ? `<section class="scrub-el th-card p-6 space-y-3 text-center" data-scrub="${randScrubType()}"><h2 class="th-heading text-3xl">Amplop Digital</h2><div class="space-y-2.5 text-left">${inv.banks.map(b => { const lg = BANK_LOGOS[b.bank] || { bg:"#333", text:"#fff", label:b.bank }; return `<div class="scrub-el bg-black/15 border border-white/15 rounded-2xl p-3.5 flex items-center justify-between gap-2" data-scrub="${randScrubType()}"><div><span style="background:${lg.bg};color:${lg.text}" class="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold">${lg.label}</span><p class="text-sm font-mono font-bold pt-1">${escHtml(b.no)}</p><p class="text-[11px] opacity-75">a.n. ${escHtml(b.holder)}</p></div><button onclick="navigator.clipboard.writeText('${esc(b.no)}');showToast('Nomor rekening disalin!');" class="th-btn-primary px-3 py-1.5 text-[11px]">Salin</button></div>`; }).join("")}</div></section>` : "";

    const wishHtml = inv.showWishes !== false ? `<section class="scrub-el th-card p-5 space-y-4" data-scrub="${randScrubType()}"><div class="text-center"><h2 class="th-heading text-3xl">Ucapan &amp; Doa Tamu</h2><p class="text-[10px] opacity-70">Geser ke samping untuk membaca ucapan lainnya</p></div><div id="gv-wishes-feed" class="wishes-h-scroll"></div><form onsubmit="submitGuestWish(event)" class="bg-black/15 p-4 rounded-2xl border border-white/15 space-y-3"><input type="text" id="w-sender-name" value="${guestName!=="Tamu Kehormatan"?esc(guestName):""}" placeholder="Nama Anda" class="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-xs" required><textarea id="w-sender-msg" placeholder="Tulis ucapan & doa terbaik Anda..." class="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-xs h-20" required></textarea><div class="flex items-center justify-between text-xs"><span class="font-semibold">Kehadiran:</span><select id="w-sender-rsvp" class="p-2 bg-white/20 border border-white/20 rounded-xl text-xs font-bold"><option value="Hadir" class="text-black">✓ Hadir</option><option value="Tidak Hadir" class="text-black">✕ Tidak Hadir</option><option value="Netral" class="text-black">? Netral</option></select></div><div class="border border-dashed border-white/25 rounded-xl p-2 text-center"><label class="cursor-pointer text-xs th-accent font-semibold block"><i class="fa-solid fa-camera-retro mr-1"></i>Lampirkan foto momen bahagia<input type="file" accept="image/*" class="hide" onchange="previewGuestWishPhoto(this)"></label><img id="w-photo-preview" class="hide max-h-32 object-contain rounded-lg mx-auto mt-2"></div><button type="submit" id="btn-send-wish" class="w-full th-btn-primary py-2.5 text-xs uppercase">Kirim Ucapan &amp; Doa</button></form></section>` : "";

    polaroidPhotos = (inv.photos || []).slice(1).map((src, i) => ({ src, fb: (inv.photosFb && inv.photosFb[i+1]) || IMG("1519741497674-611481863552") }));
    polaroidIndex = 0;
    const galHtml = polaroidPhotos.length ? `<section class="scrub-el space-y-4 text-center pt-2" data-scrub="${randScrubType()}"><div><h2 class="th-heading text-3xl">Photo Gallery</h2><p class="text-[11px] opacity-75">Geser atau ketuk foto untuk membolak-balik lembaran Polaroid</p></div><div id="polaroid-gallery-stack" class="polaroid-stack"></div><div class="flex items-center justify-center gap-4"><button onclick="flipPolaroidCard(-1)" class="w-9 h-9 rounded-full th-btn-outline flex items-center justify-center text-xs"><i class="fa-solid fa-chevron-left"></i></button><span id="polaroid-counter" class="text-xs font-bold th-accent">1 / ${polaroidPhotos.length}</span><button onclick="flipPolaroidCard(1)" class="w-9 h-9 rounded-full th-btn-outline flex items-center justify-center text-xs"><i class="fa-solid fa-chevron-right"></i></button></div></section>` : "";

    const mainBodyWrapClass = isCombinedCouple ? "pt-reveal-target relative z-10 space-y-9 px-6 pt-8 pb-20" : "relative z-10 space-y-9 px-6 pt-4 pb-20";

    document.getElementById("gv-dynamic-root").innerHTML = `
        ${coverHtml}
        <div id="gv-main-body" class="hide relative">
            ${ambientShadowHtml}${fixedBackdropHtml}${openingSectionHtml}${coupleSlidesHtml}
            <div class="${mainBodyWrapClass}">
                ${bodyInner}${closingHtml}${bankHtml}${wishHtml}${galHtml}
                <footer class="text-center pt-6 border-t border-current/20 opacity-85 space-y-1">
                    <p class="text-xs font-bold">${escHtml(brand.footerMain)}</p>
                    ${brand.footerSub ? `<p class="text-[9px] uppercase tracking-widest">${escHtml(brand.footerSub)}</p>` : ""}
                    <p class="text-[10px] opacity-65 pt-2">Tarik ke bawah lagi untuk info buat berkasmu sendiri ✨</p>
                </footer>
            </div>
        </div>
    `;

    renderPolaroidStack(); renderGuestWishes();
    runSmartPortraitFraming(document.getElementById("gv-dynamic-root"));
    if (inv.showCountdown !== false) startCountdown(countdownTargetDate);
    const ov = document.getElementById("guest-invitation-overlay");
    ov.classList.remove("hide"); ov.style.overflowY = "hidden"; ov.scrollTo(0, 0);
    if (!isDirectLink) pushBackGuard();
    bindGuestScrollListeners();
}

function updateGuestScrollInteractiveEffects() {
    const ov = document.getElementById("guest-invitation-overlay");
    if (!ov || ov.classList.contains("hide")) return;
    const vh = ov.clientHeight || window.innerHeight;
    const maxScroll = Math.max(1, ov.scrollHeight - vh);
    const bar = document.getElementById("gv-reading-progress");
    if (bar) bar.style.width = `${Math.min(100, Math.max(0, (ov.scrollTop / maxScroll) * 100))}%`;

    ov.querySelectorAll(".pt-stage").forEach(stage => {
        const rect = stage.getBoundingClientRect();
        const travel = Math.max(1, stage.offsetHeight - vh);
        const p = Math.max(0, Math.min(1, -rect.top / travel));
        const leaf = stage.querySelector(".pt-leaf"), shade = stage.querySelector(".pt-paper-shade"), hint = stage.querySelector(".pt-edge-hint");
        if (leaf) {
            const op = p > 0.84 ? Math.max(0, 1 - (p - 0.84) / 0.16) : 1;
            leaf.style.transform = `rotateY(${-p * 112}deg) scale(${1 - p * 0.04})`;
            leaf.style.opacity = op;
            leaf.style.pointerEvents = p > 0.65 ? "none" : "auto";
        }
        if (shade) shade.style.opacity = Math.sin(p * Math.PI) * 0.9;
        if (hint) hint.style.opacity = Math.max(0, 1 - p * 4);
    });

    ov.querySelectorAll(".scrub-el").forEach(el => {
        const rect = el.getBoundingClientRect();
        const startY = vh * 0.96, endY = vh * 0.56;
        let t = Math.max(0, Math.min(1, (startY - rect.top) / Math.max(1, startY - endY)));
        const ease = 1 - Math.pow(1 - t, 2.2), inv = 1 - ease, mode = el.dataset.scrub || "up";
        el.style.opacity = String(0.08 + ease * 0.92);
        if (mode === "up") { el.style.transform = `translate3d(0,${inv * 44}px,0)`; el.style.filter = ""; }
        else if (mode === "left") { el.style.transform = `translate3d(${-inv * 46}px,${inv * 12}px,0)`; el.style.filter = ""; }
        else if (mode === "right") { el.style.transform = `translate3d(${inv * 46}px,${inv * 12}px,0)`; el.style.filter = ""; }
        else if (mode === "zoom") { el.style.transform = `scale(${0.86 + ease * 0.14})`; el.style.filter = ""; }
        else if (mode === "tilt-l") { el.style.transform = `translate3d(${-inv * 24}px,${inv * 30}px,0) rotate(${-inv * 5.5}deg)`; el.style.filter = ""; }
        else if (mode === "tilt-r") { el.style.transform = `translate3d(${inv * 24}px,${inv * 30}px,0) rotate(${inv * 5.5}deg)`; el.style.filter = ""; }
        else if (mode === "flip-x") { el.style.transform = `perspective(900px) rotateX(${inv * 24}deg) translate3d(0,${inv * 28}px,0)`; el.style.filter = ""; }
        else if (mode === "blur") { el.style.transform = `translate3d(0,${inv * 24}px,0) scale(${1.04 - ease * 0.04})`; el.style.filter = inv > 0.03 ? `blur(${(inv * 7).toFixed(1)}px)` : ""; }
    });
}

function bindGuestScrollListeners() {
    const ov = document.getElementById("guest-invitation-overlay");
    if (!ov || ov.dataset.scrollBound) return;
    ov.dataset.scrollBound = "1";
    ov.addEventListener("scroll", () => {
        if (scrollRafId) cancelAnimationFrame(scrollRafId);
        scrollRafId = requestAnimationFrame(updateGuestScrollInteractiveEffects);
    }, { passive: true });

    const isAtBottom = () => (ov.scrollTop + ov.clientHeight >= ov.scrollHeight - 18) && ov.scrollHeight > ov.clientHeight + 40;
    const maybeShowPromo = () => {
        if (promoShownThisView) return;
        const bodyEl = document.getElementById("gv-main-body");
        if (!bodyEl || bodyEl.classList.contains("hide")) return;
        promoShownThisView = true;
        document.getElementById("gv-download-promo")?.classList.remove("hide");
    };
    ov.addEventListener("touchstart", (e) => { promoTouchStartY = e.touches[0].clientY; }, { passive: true });
    ov.addEventListener("touchmove", (e) => { if (isAtBottom() && (promoTouchStartY - e.touches[0].clientY) > 32) maybeShowPromo(); }, { passive: true });
    ov.addEventListener("wheel", (e) => { if (e.deltaY > 15 && isAtBottom()) maybeShowPromo(); }, { passive: true });
}
function dismissDownloadPromo() { document.getElementById("gv-download-promo")?.classList.add("hide"); }

function renderPolaroidStack() {
    const stack = document.getElementById("polaroid-gallery-stack"); if (!stack || !polaroidPhotos.length) return;
    const total = polaroidPhotos.length, showCount = Math.min(4, total);
    let html = "";
    for (let offset = showCount - 1; offset >= 0; offset--) {
        const idx = (polaroidIndex + offset) % total, item = polaroidPhotos[idx];
        const rot = offset === 0 ? -1.2 : offset === 1 ? 4.8 : offset === 2 ? -5.2 : 7.5;
        const ty = offset * 7, tx = offset === 1 ? 6 : offset === 2 ? -6 : 0, sc = 1 - offset * 0.04;
        html += `<div class="polaroid-card" data-top="${offset===0?1:0}" onclick="${offset===0?"flipPolaroidCard(1)":""}" style="z-index:${showCount-offset};transform:translate3d(${tx}px,${ty}px,0) scale(${sc}) rotate(${rot}deg);opacity:${offset===3?0.65:1};"><img src="${item.src}" ${imgFbAttr(item.fb)} loading="lazy" class="inv-photo inv-portrait-smart"><div class="polaroid-cap">${escHtml(activeGuestInv.title)} • #${idx+1}</div></div>`;
    }
    stack.innerHTML = html;
    runSmartPortraitFraming(stack);
    const cnt = document.getElementById("polaroid-counter"); if (cnt) cnt.innerText = `${polaroidIndex + 1} / ${total}`;
    if (!stack.dataset.swipeBound) {
        stack.dataset.swipeBound = "1";
        let sx = 0;
        stack.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
        stack.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 36) flipPolaroidCard(dx < 0 ? 1 : -1); }, { passive: true });
    }
}
function flipPolaroidCard(dir) {
    const stack = document.getElementById("polaroid-gallery-stack"); if (!stack || polaroidPhotos.length < 2) return;
    const topCard = stack.querySelector('.polaroid-card[data-top="1"]');
    if (topCard) topCard.classList.add(dir > 0 ? "paper-flip-next" : "paper-flip-prev");
    setTimeout(() => { polaroidIndex = (polaroidIndex + dir + polaroidPhotos.length) % polaroidPhotos.length; renderPolaroidStack(); }, 460);
}
function startWishHorizontalAutoScroll() {
    if (wishAutoTimer) clearInterval(wishAutoTimer);
    const el = document.getElementById("gv-wishes-feed"); if (!el) return;
    if (!el.dataset.pauseBound) {
        el.dataset.pauseBound = "1";
        el.addEventListener("touchstart", () => { wishScrollPaused = true; }, { passive: true });
        el.addEventListener("touchend", () => { setTimeout(() => { wishScrollPaused = false; }, 2800); }, { passive: true });
        el.addEventListener("mouseenter", () => { wishScrollPaused = true; });
        el.addEventListener("mouseleave", () => { wishScrollPaused = false; });
        el.addEventListener("focusin", () => { wishScrollPaused = true; });
        el.addEventListener("focusout", () => { wishScrollPaused = false; });
    }
    wishAutoTimer = setInterval(() => {
        if (wishScrollPaused || !el || el.scrollWidth <= el.clientWidth + 4) return;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) el.scrollLeft = 0;
        else el.scrollLeft += 0.9;
    }, 28);
}

function buildCountdownOnly(dp, label = "Menuju Hari Acara") {
    return `<section class="scrub-el th-card p-5 text-center space-y-3" data-scrub="zoom"><span class="text-[10px] uppercase tracking-[0.2em] th-accent font-bold">${label}</span><div class="grid grid-cols-4 gap-2"><div class="bg-black/15 border border-white/15 p-2 rounded-xl"><span id="cd-days" class="text-xl font-bold th-accent">00</span><span class="block text-[9px] uppercase">Hari</span></div><div class="bg-black/15 border border-white/15 p-2 rounded-xl"><span id="cd-hours" class="text-xl font-bold th-accent">00</span><span class="block text-[9px] uppercase">Jam</span></div><div class="bg-black/15 border border-white/15 p-2 rounded-xl"><span id="cd-mins" class="text-xl font-bold th-accent">00</span><span class="block text-[9px] uppercase">Menit</span></div><div class="bg-black/15 border border-white/15 p-2 rounded-xl"><span id="cd-secs" class="text-xl font-bold th-accent">00</span><span class="block text-[9px] uppercase">Detik</span></div></div></section>`;
}
function buildCountdownAndLoc(inv, dp, isJawa = false, dpRes = null) {
    const cdLbl = (inv.category === "Pernikahan" && inv.resepsiDate) ? "Menuju Hari Resepsi" : "Menuju Hari Acara";
    const cd = inv.showCountdown !== false ? buildCountdownOnly(dpRes || dp, cdLbl) : "";
    const res = (inv.resepsiVenue || inv.resepsiDate) ? `<div class="scrub-el th-card p-5 space-y-2 text-center" data-scrub="${randScrubType()}"><h3 class="th-heading text-3xl">Resepsi</h3>${inv.resepsiVenue ? `<h4 class="font-bold text-sm">${escHtml(inv.resepsiVenue)}</h4>` : ""}<p class="text-xs opacity-80">${escHtml(inv.resepsiAddress)}</p><p class="text-xs font-bold">${(dpRes||dp).full} • ${escHtml(inv.resepsiTime)}</p>${inv.resepsiMap?`<button onclick="openEventMap('resepsi')" class="w-full th-btn-primary py-2.5 text-xs uppercase mt-2">Buka Map Resepsi</button>`:""}</div>` : "";
    const jawaBar = isJawa ? `<div class="w-full h-1 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent my-1"></div>` : "";
    return `${cd}<section class="space-y-4">${jawaBar}<div class="scrub-el th-card p-5 space-y-2 text-center" data-scrub="${randScrubType()}"><h3 class="th-heading text-3xl">${inv.category==="Pernikahan"?"Akad Nikah":"Lokasi Acara"}</h3>${inv.akadVenue ? `<h4 class="font-bold text-sm">${escHtml(inv.akadVenue)}</h4>` : ""}<p class="text-xs opacity-80">${escHtml(inv.akadAddress)}</p><p class="text-xs font-bold">${dp.full} • ${escHtml(inv.akadTime)}</p><div class="flex gap-2 pt-2">${inv.akadMap?`<button onclick="openEventMap('akad')" class="flex-1 th-btn-primary py-2.5 text-xs uppercase">MAP</button>`:""}<button onclick="saveEventToGoogleCalendar()" class="flex-1 th-btn-outline py-2.5 text-xs uppercase">CALENDAR</button></div></div>${res}</section>`;
}

function unlockInvitationWithRandomFx() {
    const cover = document.getElementById("gv-cover-stage"), body = document.getElementById("gv-main-body"), ov = document.getElementById("guest-invitation-overlay");
    if (!cover || !body) return;
    body.classList.remove("hide");
    requestAnimationFrame(() => {
        body.classList.add("body-ready");
        const map = { pageturn:"fx-flipfade", curtain:"fx-curtain", lift:"fx-lift", zoomblur:"fx-zoomblur" };
        const effects = ["fx-flipfade", "fx-curtain", "fx-lift", "fx-zoomblur"];
        const chosen = map[activeThemeTransitionPref] || effects[Math.floor(Math.random() * effects.length)];
        cover.classList.add(chosen);
    });

    if (guestAudio && guestAudioCandidates.length) {
        guestAudio.muted = false;
        guestAudio.volume = 1;
        guestAudioStarted = true;
        playAudioElementWithFallback(guestAudio, guestAudioCandidates, () => {
            syncGuestMusicBtnState(false);
        }, guestAudioRawUrl);
    }

    setTimeout(() => {
        cover.classList.add("hide"); ov.style.overflowY = "auto"; ov.scrollTo(0, 0);
        updateGuestScrollInteractiveEffects(); startWishHorizontalAutoScroll();
    }, 2450);
}
function toggleGuestMusic() {
    if (!guestAudio || !guestAudioCandidates.length) return showToast("Musik belum diatur untuk undangan ini.", "info");
    if (guestAudio.paused) {
        guestAudio.muted = false;
        guestAudio.volume = 1;
        if (!guestAudioStarted || guestAudio.error) {
            guestAudioStarted = true;
            playAudioElementWithFallback(guestAudio, guestAudioCandidates, () => {
                syncGuestMusicBtnState(false);
                showToast("Audio gagal diputar dari sumber lagu ini.", "error");
            }, guestAudioRawUrl);
        } else {
            guestAudio.play().catch(() => {
                playAudioElementWithFallback(guestAudio, guestAudioCandidates, () => {
                    syncGuestMusicBtnState(false);
                    showToast("Audio gagal diputar dari sumber lagu ini.", "error");
                }, guestAudioRawUrl);
            });
        }
    } else {
        guestAudio.dataset.wantPlay = "0";
        guestAudio.pause();
    }
}
function closeGuestInvitation() {
    const ov = document.getElementById("guest-invitation-overlay");
    ov.classList.add("hide"); ov.style.overflowY = "auto"; dismissDownloadPromo();
    if (guestAudio) {
        guestAudio.dataset.wantPlay = "0";
        guestAudio.onerror = null;
        guestAudio.onplay = null;
        guestAudio.onpause = null;
        try { guestAudio.pause(); } catch {}
        guestAudio = null;
    }
    guestAudioCandidates = [];
    guestAudioRawUrl = "";
    guestAudioStarted = false;
    syncGuestMusicBtnState(false);
    document.getElementById("gv-hidden-audio-el")?.remove();
    if (cdInterval) clearInterval(cdInterval);
    if (wishAutoTimer) { clearInterval(wishAutoTimer); wishAutoTimer = null; }
    if (scrollRafId) { cancelAnimationFrame(scrollRafId); scrollRafId = null; }
    previewOpenCount++;
    if (previewOpenCount >= 2 && !currentSessionUser && typeof maybeShowLoginReminder === "function") setTimeout(maybeShowLoginReminder, 600);
    if (previewOpenCount >= 2 && currentSessionUser && typeof maybeShowUpgradeProPromoPopup === "function") setTimeout(maybeShowUpgradeProPromoPopup, 900);
}
function openEventMap(t) { window.open((t === "resepsi" ? activeGuestInv.resepsiMap : activeGuestInv.akadMap) || "https://maps.google.com", "_blank"); }
function saveEventToGoogleCalendar() {
    const targetD = (activeGuestInv.category === "Pernikahan" && activeGuestInv.resepsiDate) ? activeGuestInv.resepsiDate : activeGuestInv.akadDate;
    const d = (targetD || "2027-02-21").replace(/-/g, "");
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(activeGuestInv.title)}&dates=${d}T020000Z/${d}T060000Z&location=${encodeURIComponent(activeGuestInv.resepsiVenue || activeGuestInv.akadVenue || "")}`, "_blank");
}
function startCountdown(ds) {
    if (cdInterval) clearInterval(cdInterval);
    const target = new Date((ds || "2027-02-21") + "T09:00:00").getTime();
    const tick = () => {
        const el = document.getElementById("cd-days"); if (!el) return;
        const diff = Math.max(0, target - Date.now());
        el.innerText = String(Math.floor(diff/86400000)).padStart(2,"0");
        document.getElementById("cd-hours").innerText = String(Math.floor((diff/3600000)%24)).padStart(2,"0");
        document.getElementById("cd-mins").innerText = String(Math.floor((diff/60000)%60)).padStart(2,"0");
        document.getElementById("cd-secs").innerText = String(Math.floor((diff/1000)%60)).padStart(2,"0");
    };
    tick(); cdInterval = setInterval(tick, 1000);
}
async function previewGuestWishPhoto(inp) {
    if (!inp.files[0]) return; showLoading("Memproses foto...");
    const b64 = await quickResizeImage(inp.files[0], 640, 0.80);
    if (activeGuestInv.id !== "demo") { const up = await apiAction({ action:"upload_media", dataUrl:b64, prefix:"wish" }); tempWishPhoto = (up && up.ok && up.url) ? up.url : b64; }
    else tempWishPhoto = b64;
    hideLoading();
    const img = document.getElementById("w-photo-preview"); img.src = tempWishPhoto; img.classList.remove("hide");
}
async function submitGuestWish(e) {
    e.preventDefault(); setBtnLoading("btn-send-wish", true, "Mengirim...");
    const wish = { id:Date.now(), name:document.getElementById("w-sender-name").value.trim(), rsvp:document.getElementById("w-sender-rsvp").value, msg:document.getElementById("w-sender-msg").value.trim(), photo:tempWishPhoto||null, time:new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}), replies:[] };
    document.getElementById("w-sender-msg").value = ""; document.getElementById("w-photo-preview").classList.add("hide"); tempWishPhoto = "";
    if (activeGuestInv.id === "demo") { activeGuestInv.wishes.unshift(wish); setBtnLoading("btn-send-wish", false); renderGuestWishes(); return showToast("Ucapan ditambahkan di mode preview!"); }
    const res = await apiAction({ action:"add_wish", invId:activeGuestInv.id, wish });
    setBtnLoading("btn-send-wish", false);
    if (res && res.invitation) activeGuestInv = res.invitation;
    else { if (!activeGuestInv.wishes) activeGuestInv.wishes = []; activeGuestInv.wishes.unshift(wish); }
    renderGuestWishes(); showToast("Terima kasih atas ucapan & doa Anda!");
}
function renderGuestWishes() {
    const el = document.getElementById("gv-wishes-feed"); if (!el) return;

    const savedReplyDrafts = {};
    const prevScrollLeft = el.scrollLeft || 0;
    el.querySelectorAll('input[id^="rep-inp-"]').forEach((inp) => {
        if (inp.value) savedReplyDrafts[inp.id] = inp.value;
    });

    const list = activeGuestInv.wishes || [];
    el.innerHTML = !list.length ? `<p class="text-xs opacity-60 text-center w-full py-4">Jadilah yang pertama mengirim ucapan &amp; doa.</p>` : list.map(w => `
        <div class="wish-card-h text-left">
            <div class="space-y-2">
                <div class="flex justify-between items-start gap-2">
                    <div class="min-w-0"><span class="font-bold text-xs th-accent block truncate">${escHtml(w.name)}</span><span class="text-[9px] opacity-60">${escHtml(w.time||"")}</span></div>
                    <span class="text-[9px] px-2 py-0.5 rounded-full border border-current/25 font-bold whitespace-nowrap">${escHtml(w.rsvp)}</span>
                </div>
                <p class="text-xs opacity-90 leading-relaxed whitespace-normal break-words">${escHtml(w.msg)}</p>
                ${w.photo ? `<div class="wish-photo-box"><img src="${w.photo}" loading="lazy"></div>` : ""}
                ${(w.replies||[]).length ? `<div class="space-y-1 pl-2.5 border-l border-current/25">${w.replies.map(r=>`<div class="text-[10px] opacity-85"><strong>${escHtml(r.author)}:</strong> ${escHtml(r.text)}</div>`).join("")}</div>` : ""}
            </div>
            <div class="flex gap-1.5 pt-1">
                <input type="text" id="rep-inp-${w.id}" placeholder="Balas..." class="flex-1 px-2.5 py-1.5 bg-white/10 border border-white/15 rounded-lg text-[11px]">
                <button onclick="replyWish(${w.id},this)" class="th-btn-primary px-2.5 py-1 text-[10px]">Balas</button>
            </div>
        </div>
    `).join("");

    Object.keys(savedReplyDrafts).forEach((inpId) => {
        const target = document.getElementById(inpId);
        if (target) target.value = savedReplyDrafts[inpId];
    });
    if (prevScrollLeft > 0) el.scrollLeft = prevScrollLeft;
    startWishHorizontalAutoScroll();
}
async function replyWish(wishId, btn) {
    const inp = document.getElementById(`rep-inp-${wishId}`); if (!inp || !inp.value.trim()) return;
    setBtnLoading(btn, true, "...");
    const u = getCurrentUserObj(), reply = { author:(u&&u.name)||document.getElementById("w-sender-name").value||"Tamu", text:inp.value.trim() };
    inp.value = "";
    if (activeGuestInv.id === "demo") { const w = activeGuestInv.wishes.find(x => x.id === wishId); if (w) { if (!w.replies) w.replies = []; w.replies.push(reply); } return renderGuestWishes(); }
    const res = await apiAction({ action:"reply_wish", invId:activeGuestInv.id, wishId, reply });
    if (res && res.invitation) activeGuestInv = res.invitation;
    renderGuestWishes();
}
