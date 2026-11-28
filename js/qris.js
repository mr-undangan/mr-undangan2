// =========================================================================
// LEMBARKU — ENGINE QRIS DINAMIS DANA & KONFIRMASI PEMBAYARAN (js/qris.js)
// =========================================================================
let activePaymentState = {
    kind: "inv",
    id: null,
    basePrice: 0,
    origPrice: 0,
    voucherCode: "",
    voucherDiscount: 0,
    uniqueCode: 0,
    totalPay: 0,
    title: "",
    qrisDataUrl: ""
};
let tempPaymentProof = "";

// ================= 1. UTILITAS CRC16-CCITT & BUILDER QRIS DINAMIS =================
function computeCrc16Ccitt(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
            crc &= 0xFFFF;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
}

function parseEmvTags(payload) {
    const out = [];
    let i = 0;
    while (i + 4 <= payload.length) {
        const tag = payload.slice(i, i + 2);
        const len = parseInt(payload.slice(i + 2, i + 4), 10);
        if (isNaN(len) || i + 4 + len > payload.length) break;
        const val = payload.slice(i + 4, i + 4 + len);
        out.push({ tag, val });
        i += 4 + len;
    }
    return out;
}

function buildDynamicQrisString(staticStr, nominalRupiah) {
    const raw = String(staticStr || "").trim();
    if (!raw.startsWith("000201")) return "";
    const amt = Math.max(100, Math.round(Number(nominalRupiah) || 0));
    const amtStr = String(amt);

    const parsed = parseEmvTags(raw).filter(t => t.tag !== "63" && t.tag !== "54");
    const rebuilt = [];
    let inserted54 = false;

    for (const item of parsed) {
        if (item.tag === "01") {
            rebuilt.push({ tag: "01", val: "12" });
        } else {
            rebuilt.push(item);
        }
        if (item.tag === "53") {
            rebuilt.push({ tag: "54", val: amtStr });
            inserted54 = true;
        }
    }
    if (!inserted54) rebuilt.push({ tag: "54", val: amtStr });

    const body = rebuilt.map(t => `${t.tag}${String(t.val.length).padStart(2, "0")}${t.val}`).join("") + "6304";
    return body + computeCrc16Ccitt(body);
}

// ================= 2. PENGATURAN FOUNDER: BACA GAMBAR QRIS DANA =================
function toggleQrisModeFields() {
    const mode = document.getElementById("ms-qris-mode")?.value || "static";
    document.getElementById("ms-qris-dynamic-wrap")?.classList.toggle("hide", mode !== "dynamic");
    document.getElementById("ms-qris-static-wrap")?.classList.toggle("hide", mode === "dynamic");
}

async function decodeQrisFromImageInput(inp) {
    const file = inp.files[0]; if (!file) return; inp.value = "";
    showLoading("Membaca data QRIS DANA Bisnis...");
    try {
        await loadScriptOnce("https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js");
        const imgUrl = await new Promise((resolve) => {
            const r = new FileReader();
            r.onload = (e) => resolve(e.target.result);
            r.readAsDataURL(file);
        });
        const img = await new Promise((resolve) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.src = imgUrl;
        });
        const c = document.createElement("canvas");
        const maxS = 900;
        const sc = Math.min(1, maxS / Math.max(img.width, img.height));
        c.width = Math.round(img.width * sc);
        c.height = Math.round(img.height * sc);
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const code = window.jsQR ? window.jsQR(imgData.data, c.width, c.height) : null;
        hideLoading();
        if (code && code.data && code.data.startsWith("000201")) {
            document.getElementById("ms-qris-dyn-str").value = code.data;
            showToast("Berhasil membaca data QRIS DANA Bisnis! Klik Simpan Pembayaran.");
        } else {
            showToast("QRIS tidak terbaca dari foto. Pastikan foto QRIS jelas & tidak terpotong.", "error");
        }
    } catch {
        hideLoading();
        showToast("Gagal memproses gambar QRIS.", "error");
    }
}

// ================= 3. HALAMAN PEMBAYARAN / KONFIRMASI TERPADU =================
async function openUnifiedPayment(kind, docId) {
    const isPf = kind === "portfolio" || kind === "coin_topup" || kind === "pro_upgrade" || kind === "cv_edit_addon";
    const doc = isPf
        ? (db.portfolios || []).find(p => String(p.id) === String(docId))
        : (db.invitations || []).find(i => String(i.id) === String(docId));
    if (!doc) return showToast("Data pesanan tidak ditemukan.", "error");

    const isCoinOrPro = doc.docType === "coin_topup" || doc.docType === "pro_upgrade" || doc.docType === "cv_edit_addon";
    const resolvedKind = isCoinOrPro ? doc.docType : (isPf ? "portfolio" : "inv");
    const ms = db.masterSettings || {};
    const basePrice = Number(doc.price || (isPf ? 20000 : 99000));
    const origPrice = Number(doc.origPrice || 0);
    const useUnique = ms.qrisUniqueCode !== false;

    const existingDisc = isCoinOrPro ? 0 : Math.max(0, Number(doc.voucherDiscount || 0));
    const uniqueCode = useUnique ? (Number(doc.uniqueCode) || getDeterministicUniqueCode(doc.id)) : 0;
    const totalPay = Math.max(1000, basePrice - existingDisc) + uniqueCode;
    doc.uniqueCode = uniqueCode;
    doc.totalPay = totalPay;

    activePaymentState = {
        kind: resolvedKind,
        id: doc.id,
        basePrice,
        origPrice,
        voucherCode: isCoinOrPro ? "" : (doc.voucherCode || ""),
        voucherDiscount: existingDisc,
        uniqueCode,
        totalPay,
        title: doc.title || "Pesanan Berkas",
        qrisDataUrl: ""
    };
    tempPaymentProof = "";

    currentViewName = "payment";
    hideAllViews();
    document.getElementById("view-payment").classList.remove("hide");
    renderHeaderActions();
    pushBackGuard();

    const sendBtn = document.getElementById("btn-send-proof");
    if (sendBtn) sendBtn.onclick = submitPaymentProofUnified;

    const statusBadge = document.getElementById("pay-status-badge");
    const headTxt = document.getElementById("pay-heading-text");
    if (statusBadge) {
        statusBadge.className = "text-[11px] px-3 py-1 rounded-full app-accent-bg app-accent font-bold";
        statusBadge.innerText = doc.docType === "coin_topup"
            ? "TOP-UP COIN • QRIS DINAMIS"
            : doc.docType === "pro_upgrade"
                ? "UPGRADE AKUN PRO • QRIS DINAMIS"
                : doc.docType === "cv_edit_addon"
                    ? "TAMBAH +2X EDIT CV • QRIS DINAMIS"
                    : "STATUS: ● MENUNGGU KONFIRMASI";
    }
    if (headTxt) {
        headTxt.innerText = doc.docType === "coin_topup"
            ? "Isi Ulang Coin Lembarku"
            : doc.docType === "pro_upgrade"
                ? "Upgrade ke Akun PRO"
                : doc.docType === "cv_edit_addon"
                    ? "Tambah Kuota +2x Edit CV"
                    : "Pesanan Tersimpan!";
    }

    const prefixLbl = doc.docType === "coin_topup"
        ? "Top-Up Coin"
        : doc.docType === "pro_upgrade"
            ? "Upgrade PRO"
            : doc.docType === "cv_edit_addon"
                ? "Add-On +2x Edit CV"
                : isPf ? (doc.docType === "lamaran" ? "Surat Lamaran" : "CV") : "Undangan";
    document.getElementById("pay-item-name").innerText = `${prefixLbl} — ${doc.title}`;
    document.getElementById("pay-unique-hint").classList.toggle("hide", !useUnique);

    // Tampilkan input kode voucher hanya untuk pelanggan umum pada order reguler (bukan top-up coin/PRO)
    const vWrap = document.getElementById("pay-voucher-wrap");
    const vInp = document.getElementById("pay-voucher-code");
    const vStat = document.getElementById("pay-voucher-status");
    const vClr = document.getElementById("btn-pay-clear-voucher");
    if (vWrap) vWrap.classList.toggle("hide", isCoinOrPro);
    if (vInp) vInp.value = activePaymentState.voucherCode || "";
    if (vClr) vClr.classList.toggle("hide", !activePaymentState.voucherCode);
    if (vStat) {
        if (activePaymentState.voucherCode && activePaymentState.voucherDiscount > 0) {
            vStat.className = "text-[11px] font-semibold text-emerald-600";
            vStat.innerText = `✓ Voucher ${activePaymentState.voucherCode} aktif (-${fmtRp(activePaymentState.voucherDiscount)})`;
        } else {
            vStat.className = "hide text-[11px] font-semibold";
            vStat.innerText = "";
        }
    }

    _syncPaymentTotalsUI();

    document.getElementById("pay-banks-list").innerHTML = getMasterBanksList().map(b => {
        const lg = BANK_LOGOS[b.bank] || { bg: "#333", text: "#fff", label: b.bank };
        return `<div class="app-card-soft border rounded-2xl p-3 flex items-center justify-between gap-2"><div><span style="background:${lg.bg};color:${lg.text}" class="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold">${lg.label}</span><strong class="block text-sm font-mono pt-1">${escHtml(b.no)}</strong><span class="text-[11px] app-muted">a.n. ${escHtml(b.holder)}</span></div><button type="button" onclick="navigator.clipboard.writeText('${esc(b.no)}');showToast('Nomor rekening disalin!');" class="gold-pill-btn px-3 py-1.5 rounded-xl text-[11px]">Salin</button></div>`;
    }).join("");

    document.getElementById("pay-proof-preview").classList.add("hide");
    document.getElementById("pay-proof-input").value = "";
    await renderPaymentQrisCode(ms, totalPay);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function renderPaymentQrisCode(ms, totalPay) {
    const wrap = document.getElementById("pay-qris-canvas-wrap");
    const badge = document.getElementById("pay-qris-mode-badge");
    const isDynamic = ms.qrisMode === "dynamic" && ms.qrisDynamicString && ms.qrisDynamicString.startsWith("000201");

    if (isDynamic) {
        badge.innerText = `QRIS Dinamis DANA • ${fmtRp(totalPay)}`;
        wrap.innerHTML = `<div class="text-xs text-zinc-500"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>Membuat QRIS...</div>`;
        try {
            await loadScriptOnce("https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js");
            const dynStr = buildDynamicQrisString(ms.qrisDynamicString, totalPay);
            const dataUrl = await window.QRCode.toDataURL(dynStr, {
                width: 420,
                margin: 2,
                color: { dark: "#09090b", light: "#ffffff" }
            });
            activePaymentState.qrisDataUrl = dataUrl;
            wrap.innerHTML = `<img id="pay-qris-img" src="${dataUrl}" class="w-48 h-48 object-contain" alt="QRIS Dinamis">`;
            return;
        } catch {}
    }

    badge.innerText = "QRIS Resmi (Masukkan Nominal Sesuai Total)";
    const fallbackQris = ms.qrisImage || `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=LEMBARKU-${totalPay}`;
    activePaymentState.qrisDataUrl = fallbackQris;
    wrap.innerHTML = `<img id="pay-qris-img" src="${fallbackQris}" class="w-48 h-48 object-contain" alt="QRIS">`;
}

function copyPaymentNominal() {
    navigator.clipboard.writeText(String(activePaymentState.totalPay || 0));
    showToast(`Nominal ${fmtRp(activePaymentState.totalPay)} disalin!`);
}

function downloadCurrentQrisPng() {
    const src = activePaymentState.qrisDataUrl || document.getElementById("pay-qris-img")?.src;
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = `QRIS_Lembarku_${activePaymentState.totalPay || "bayar"}.png`;
    a.target = "_blank";
    a.click();
    showToast("Menyimpan gambar QRIS...");
}

async function previewPaymentProof(inp) {
    if (!inp.files[0]) return;
    showLoading("Memproses gambar bukti...");
    tempPaymentProof = await quickResizeImage(inp.files[0], 820, 0.82);
    hideLoading();
    const img = document.getElementById("pay-proof-preview");
    img.src = tempPaymentProof;
    img.classList.remove("hide");
}

async function submitPaymentProofUnified() {
    if (!tempPaymentProof) return showToast("Pilih gambar bukti transfer / screenshot pesanan terlebih dahulu.", "error");
    setBtnLoading("btn-send-proof", true, "Mengunggah...");
    const up = await apiAction({ action: "upload_media", dataUrl: tempPaymentProof, prefix: "proof" });
    const proofUrl = (up && up.ok && up.url) ? up.url : tempPaymentProof;

    if (activePaymentState.kind === "portfolio" || activePaymentState.kind === "coin_topup" || activePaymentState.kind === "pro_upgrade" || activePaymentState.kind === "cv_edit_addon") {
        const pf = (db.portfolios || []).find(p => String(p.id) === String(activePaymentState.id));
        if (pf) {
            await apiAction({
                action: "upsert_portfolio",
                portfolio: Object.assign({}, pf, {
                    paymentProof: proofUrl,
                    uniqueCode: activePaymentState.uniqueCode,
                    totalPay: activePaymentState.totalPay,
                    voucherCode: activePaymentState.voucherCode || "",
                    voucherDiscount: Number(activePaymentState.voucherDiscount || 0),
                    status: "Menunggu Verifikasi"
                })
            });
        }
    } else {
        const inv = (db.invitations || []).find(i => String(i.id) === String(activePaymentState.id));
        if (inv) {
            const allowShowcase = await showConfirm(
                "Tampilkan Sebagai Contoh Promosi?",
                "Apakah Anda bersedia jika undangan Anda ditampilkan sebagai contoh tema promosi di Beranda Lembarku? (Data tetap aman dan menarik untuk inspirasi tamu)",
                "fa-solid fa-wand-magic-sparkles",
                "Ya, Bersedia"
            );
            await apiAction({
                action: "upsert_invitation",
                invitation: Object.assign({}, inv, {
                    paymentProof: proofUrl,
                    uniqueCode: activePaymentState.uniqueCode,
                    totalPay: activePaymentState.totalPay,
                    voucherCode: activePaymentState.voucherCode || "",
                    voucherDiscount: Number(activePaymentState.voucherDiscount || 0),
                    allowShowcase: !!allowShowcase,
                    status: "Menunggu Verifikasi"
                })
            });
        }
    }

    setBtnLoading("btn-send-proof", false);
    showToast("Bukti / Screenshot terkirim! Admin segera mengonfirmasi.");
    routeDashboard();
}

// ================= 4. KODE VOUCHER & ORDER TOP-UP COIN / UPGRADE PRO VIA QRIS =================
function _syncPaymentTotalsUI() {
    const base = Number(activePaymentState.basePrice || 0);
    const orig = Number(activePaymentState.origPrice || 0);
    const disc = Number(activePaymentState.voucherDiscount || 0);
    const total = Number(activePaymentState.totalPay || 0);

    const finalEl = document.getElementById("pay-final-price");
    if (finalEl) finalEl.innerText = fmtRp(total);

    const origEl = document.getElementById("pay-orig-price");
    const discEl = document.getElementById("pay-disc-badge");
    if (disc > 0) {
        if (origEl) { origEl.innerText = fmtRp(base + Number(activePaymentState.uniqueCode || 0)); origEl.classList.remove("hide"); }
        if (discEl) { discEl.innerText = `VOUCHER -${fmtRp(disc)}`; discEl.classList.remove("hide"); }
    } else if (orig > base && base > 0) {
        const pct = Math.round(((orig - base) / orig) * 100);
        if (origEl) { origEl.innerText = fmtRp(orig); origEl.classList.remove("hide"); }
        if (discEl) { discEl.innerText = `HEMAT ${pct}%`; discEl.classList.remove("hide"); }
    } else {
        if (origEl) origEl.classList.add("hide");
        if (discEl) discEl.classList.add("hide");
    }
}

async function applyPaymentVoucher() {
    const inp = document.getElementById("pay-voucher-code");
    const stat = document.getElementById("pay-voucher-status");
    const clr = document.getElementById("btn-pay-clear-voucher");
    const rawCode = (inp && inp.value || "").trim();
    const scope = activePaymentState.kind === "portfolio" ? "pf" : activePaymentState.kind === "gowes_rental" ? "gowes" : "inv";

    if (typeof evaluateVoucherCode !== "function") return;
    const res = evaluateVoucherCode(rawCode, scope, activePaymentState.basePrice);
    if (!res.ok) {
        if (stat) {
            stat.className = "text-[11px] font-semibold text-red-500";
            stat.innerText = res.message;
        }
        return showToast(res.message, "error");
    }

    activePaymentState.voucherCode = res.code;
    activePaymentState.voucherDiscount = res.discount;
    activePaymentState.totalPay = res.finalPrice + Number(activePaymentState.uniqueCode || 0);
    if (inp) inp.value = res.code;
    if (clr) clr.classList.remove("hide");
    if (stat) {
        stat.className = "text-[11px] font-semibold text-emerald-600";
        stat.innerText = `✓ ${res.message}`;
    }
    _syncPaymentTotalsUI();
    await renderPaymentQrisCode(db.masterSettings || {}, activePaymentState.totalPay);
    showToast(res.message);
}

async function clearPaymentVoucher() {
    activePaymentState.voucherCode = "";
    activePaymentState.voucherDiscount = 0;
    activePaymentState.totalPay = Number(activePaymentState.basePrice || 0) + Number(activePaymentState.uniqueCode || 0);
    const inp = document.getElementById("pay-voucher-code");
    const stat = document.getElementById("pay-voucher-status");
    const clr = document.getElementById("btn-pay-clear-voucher");
    if (inp) inp.value = "";
    if (clr) clr.classList.add("hide");
    if (stat) { stat.className = "hide text-[11px] font-semibold"; stat.innerText = ""; }
    _syncPaymentTotalsUI();
    await renderPaymentQrisCode(db.masterSettings || {}, activePaymentState.totalPay);
    showToast("Voucher dibatalkan.", "info");
}

async function startCoinPackageQrisOrder(pkgId) {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u) {
        showToast("Silakan masuk akun terlebih dahulu.", "info");
        if (typeof openAuthModal === "function") openAuthModal();
        return;
    }
    if (u.role !== "cabang" && !u.isPro && u.role !== "master") {
        if (typeof openUpgradeProPromoModal === "function") openUpgradeProPromoModal(true);
        return;
    }
    const pkgs = typeof getCoinPackagesList === "function" ? getCoinPackagesList() : [];
    const pkg = pkgs.find(p => String(p.id) === String(pkgId)) || pkgs[0];
    if (!pkg) return showToast("Paket Coin tidak ditemukan.", "error");

    const totalCoins = Number(pkg.paidCoins || 0) + Number(pkg.bonusCoins || 0);
    const newId = Date.now();
    const uniqueCode = getDeterministicUniqueCode(newId);
    const orderDoc = {
        id: newId,
        createdAt: newId,
        owner: currentSessionUser,
        docType: "coin_topup",
        themeId: pkg.id,
        themeName: `${pkg.name} (${totalCoins} Coin)`,
        title: `Top-Up ${pkg.name} — ${totalCoins} Coin`,
        coinAmount: totalCoins,
        paidCoins: pkg.paidCoins,
        bonusCoins: pkg.bonusCoins,
        price: Number(pkg.price || 100000),
        origPrice: 0,
        uniqueCode,
        totalPay: Number(pkg.price || 100000) + uniqueCode,
        status: "Menunggu Pembayaran",
        paymentProof: "",
        fullName: u.name || u.username
    };

    showLoading("Menyiapkan QRIS Paket Coin...");
    const res = await apiAction({ action: "upsert_portfolio", portfolio: orderDoc });
    hideLoading();
    if (!res || !res.ok) return showToast((res && res.message) || "Gagal membuat pesanan Coin.", "error");

    if (!Array.isArray(db.portfolios)) db.portfolios = [];
    if (!db.portfolios.some(p => String(p.id) === String(orderDoc.id))) {
        db.portfolios.unshift(orderDoc);
        idbSet("db_snapshot", db);
    }
    if (typeof closeCabangCoinInfoModal === "function") closeCabangCoinInfoModal();
    openUnifiedPayment("coin_topup", orderDoc.id);
}

async function startProUpgradeQrisOrder() {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u) {
        if (typeof closeUpgradeProPromoModal === "function") closeUpgradeProPromoModal();
        if (typeof openAuthModal === "function") openAuthModal();
        return;
    }
    if (u.isPro) {
        if (typeof closeUpgradeProPromoModal === "function") closeUpgradeProPromoModal();
        return showToast("Akun Anda sudah berstatus PRO!", "info");
    }
    const proCfg = typeof getProUpgradeConfig === "function" ? getProUpgradeConfig() : { price: 49000, bonusCoins: 5 };
    const newId = Date.now();
    const uniqueCode = getDeterministicUniqueCode(newId);
    const orderDoc = {
        id: newId,
        createdAt: newId,
        owner: currentSessionUser,
        docType: "pro_upgrade",
        themeId: "pro_membership",
        themeName: `Akun PRO + Bonus ${proCfg.bonusCoins} Coin`,
        title: `Upgrade Akun PRO (+${proCfg.bonusCoins} Bonus Coin)`,
        coinAmount: Number(proCfg.bonusCoins || 0),
        price: Number(proCfg.price || 49000),
        origPrice: 0,
        uniqueCode,
        totalPay: Number(proCfg.price || 49000) + uniqueCode,
        status: "Menunggu Pembayaran",
        paymentProof: "",
        fullName: u.name || u.username
    };

    showLoading("Menyiapkan QRIS Upgrade PRO...");
    const res = await apiAction({ action: "upsert_portfolio", portfolio: orderDoc });
    hideLoading();
    if (!res || !res.ok) return showToast((res && res.message) || "Gagal membuat pesanan Upgrade PRO.", "error");

    if (!Array.isArray(db.portfolios)) db.portfolios = [];
    if (!db.portfolios.some(p => String(p.id) === String(orderDoc.id))) {
        db.portfolios.unshift(orderDoc);
        idbSet("db_snapshot", db);
    }
    if (typeof closeUpgradeProPromoModal === "function") closeUpgradeProPromoModal();
    openUnifiedPayment("pro_upgrade", orderDoc.id);
}
