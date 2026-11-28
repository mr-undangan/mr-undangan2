// =========================================================================
// LEMBARKU — LIVE CHAT, KONTAK BARU (+), PRIVASI, BLOKIR & NOTIFIKASI
// File: js/chat.js (V14.10)
// =========================================================================
const QUICK_REPLIES_STAFF = [
    "Halo Kak, ada yang bisa kami bantu?",
    "Pesanan Kakak sudah aktif ya! Silakan dicek di profil.",
    "Silakan lampirkan bukti transfer atau screenshot pesanan ya Kak.",
    "Revisi berkas sudah kami setujui & aktif kembali ya Kak!"
];

let tempChatAttachment = "";
let _chatContactMasterFilter = "all";
let _masterChatBoxTab = "private"; // "private" (Privat Founder) | "cs" (Pantau CS Tim Admin)
let _lastKnownChatCount = -1;
window.openedFromChatThread = null;
window._chatOriginView = null;

function isStaffUserObj(u) {
    return !!(u && (u.role === "master" || u.role === "administrasi"));
}

function _normChatKey(uname) {
    const k = String(uname || "").trim().toLowerCase();
    const founderU = (typeof FOUNDER_USERNAME !== "undefined" && FOUNDER_USERNAME) ? FOUNDER_USERNAME : "kausar.af";
    return k === "master" ? founderU : k;
}

function playSoftChatNotification() {
    try {
        if (navigator.vibrate) navigator.vibrate([70, 40, 70]);
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(740, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.23);
    } catch {}
}

function _pushChatNavStep(stepObj) {
    if (typeof mrNavPush === "function") {
        mrNavPush(stepObj);
    } else if (typeof pushBackGuard === "function") {
        pushBackGuard();
    }
}

// Dipanggil oleh pengendali navigasi terpusat di js/app.js saat tombol Back HP ditekan
window._restoreChatFromNav = function (stepObj) {
    const ov = document.getElementById("full-chat-overlay");
    if (!ov) return;
    document.body.style.overflow = "hidden";
    ov.classList.remove("hide");
    if (stepObj && stepObj.type === "chat_thread" && stepObj.threadUser) {
        activeMasterChatThread = _normChatKey(stepObj.threadUser);
    } else {
        activeMasterChatThread = null;
    }
    renderFullChatOverlay();
};

function _isFounderKey(uObjOrKey) {
    if (typeof uObjOrKey === "object" && uObjOrKey) return uObjOrKey.role === "master";
    const key = _normChatKey(uObjOrKey);
    if (!key) return false;
    if (key === _normChatKey(FOUNDER_USERNAME) || key.startsWith("founder__")) return true;
    const u = (db.users || []).find(x => _normChatKey(x.username) === key);
    return !!(u && u.role === "master");
}

function _isAdminStaffKey(uObjOrKey) {
    if (typeof uObjOrKey === "object" && uObjOrKey) return uObjOrKey.role === "administrasi";
    const key = _normChatKey(uObjOrKey);
    if (!key) return false;
    if (key === "admin_support") return true;
    const u = (db.users || []).find(x => _normChatKey(x.username) === key);
    return !!(u && u.role === "administrasi");
}

function _isStaffUserOrKey(uObjOrKey) {
    return _isFounderKey(uObjOrKey) || _isAdminStaffKey(uObjOrKey);
}

function _buildPeerDmThreadId(u1, u2) {
    const pair = [_normChatKey(u1), _normChatKey(u2)].sort();
    return `dm_${pair[0]}__${pair[1]}`;
}

function _buildFounderPrivateThreadId(userKey) {
    return `founder__${_normChatKey(userKey)}`;
}

function _extractFounderThreadUser(threadId) {
    const s = String(threadId || "");
    if (s.startsWith("founder__")) return _normChatKey(s.slice(9));
    return _normChatKey(s);
}

function setMasterChatBoxTab(tab) {
    _masterChatBoxTab = (tab === "cs") ? "cs" : "private";
    renderFullChatOverlay();
}

function getChatThreads() {
    const curU = getCurrentUserObj();
    const isMaster = !!(curU && curU.role === "master");
    const isAdminOnly = !!(curU && curU.role === "administrasi");

    // 1. MASTER ADMIN: Terpisah jelas antara Chat Privat Founder vs Pantau CS Tim Admin
    if (isMaster) {
        const map = {};
        const wantPrivate = _masterChatBoxTab !== "cs";

        (db.chats || []).forEach(c => {
            const rawThread = String(c.threadUser || c.sender || "tamu");
            if (rawThread.startsWith("dm_")) return;
            const isFounderThread = rawThread.startsWith("founder__");
            const cleanOwnerKey = isFounderThread ? _extractFounderThreadUser(rawThread) : _normChatKey(rawThread);
            const u = (db.users || []).find(x => _normChatKey(x.username) === cleanOwnerKey);
            const role = (u && u.role) || (cleanOwnerKey.startsWith("tamu_") ? "tamu" : "user");

            // Thread cabang, thread ber-prefix founder__, atau pesan khusus master masuk ke Privat Founder
            const belongsToPrivate = isFounderThread || role === "cabang" || c.channel === "founder_private";
            if (wantPrivate && !belongsToPrivate) return;
            if (!wantPrivate && belongsToPrivate) return;

            const mapKey = isFounderThread ? rawThread : cleanOwnerKey;
            if (!map[mapKey]) {
                map[mapKey] = {
                    threadUser: mapKey,
                    contactUsername: cleanOwnerKey,
                    displayName: (u && u.name) || c.senderName || cleanOwnerKey,
                    avatar: (u && u.avatar) || DEFAULT_AVATAR,
                    role,
                    isPrivateFounder: belongsToPrivate,
                    isPro: !!(u && u.isPro),
                    messages: [],
                    unread: 0,
                    lastTs: 0
                };
            }
            map[mapKey].messages.push(c);
            const isFromStaff = c.role === "master" || c.role === "administrasi";
            if (!c.readByMaster && !isFromStaff) map[mapKey].unread++;
            if ((c.ts || 0) >= map[mapKey].lastTs) map[mapKey].lastTs = c.ts || 0;
        });
        return Object.values(map).sort((a, b) => b.lastTs - a.lastTs);
    }

    // 2. TIM ADMINISTRASI (SHARED CS DESK): Semua admin 1, 2, dst melihat isi chat CS SAMA PERSIS untuk overshift,
    //    tapi TIDAK BISA melihat chat privat Founder (founder__* / cabang / master)!
    if (isAdminOnly) {
        const map = {};
        (db.chats || []).forEach(c => {
            const rawThread = String(c.threadUser || c.sender || "tamu");
            if (rawThread.startsWith("dm_") || rawThread.startsWith("founder__") || c.channel === "founder_private") return;
            const key = _normChatKey(rawThread);
            const u = (db.users || []).find(x => _normChatKey(x.username) === key);
            const role = (u && u.role) || (key.startsWith("tamu_") ? "tamu" : "user");
            if (role === "cabang" || role === "master") return;

            if (!map[key]) {
                map[key] = {
                    threadUser: key,
                    contactUsername: key,
                    displayName: (u && u.name) || c.senderName || key,
                    avatar: (u && u.avatar) || DEFAULT_AVATAR,
                    role,
                    isPro: !!(u && u.isPro),
                    messages: [],
                    unread: 0,
                    lastTs: 0
                };
            }
            map[key].messages.push(c);
            const isFromStaff = c.role === "master" || c.role === "administrasi";
            if (!c.readByMaster && !isFromStaff) map[key].unread++;
            if ((c.ts || 0) >= map[key].lastTs) map[key].lastTs = c.ts || 0;
        });
        return Object.values(map).sort((a, b) => b.lastTs - a.lastTs);
    }

    // 3. USER BIASA / ADMIN CABANG: Melihat thread CS Tim Administrasi, thread Privat Founder, dan DM teman yang diikuti
    const myKey = _normChatKey(currentSessionUser || guestChatId);
    const myFounderThread = _buildFounderPrivateThreadId(myKey);
    const map = {};

    (db.chats || []).forEach(c => {
        const rawThread = String(c.threadUser || "");
        let threadKey = "";
        let contactUname = "";
        let isFounderDirect = false;

        if (rawThread.startsWith("dm_")) {
            const parts = rawThread.slice(3).split("__");
            if (parts.length !== 2 || !parts.includes(myKey)) return;
            const other = parts[0] === myKey ? parts[1] : parts[0];
            threadKey = rawThread;
            contactUname = other;
        } else if (rawThread === myFounderThread || (curU && curU.role === "cabang" && _normChatKey(rawThread || c.sender) === myKey)) {
            threadKey = myFounderThread;
            contactUname = _normChatKey(FOUNDER_USERNAME);
            isFounderDirect = true;
        } else {
            if (_normChatKey(rawThread || c.sender) !== myKey) return;
            threadKey = "admin_support";
            contactUname = "admin_support";
        }

        if (!map[threadKey]) {
            const targetObj = (db.users || []).find(x => _normChatKey(x.username) === contactUname);
            const isSupport = threadKey === "admin_support";
            map[threadKey] = {
                threadUser: threadKey,
                contactUsername: contactUname,
                displayName: isFounderDirect
                    ? "Founder Lembarku (Privat)"
                    : isSupport
                        ? "Tim Administrasi (CS)"
                        : ((targetObj && targetObj.name) || contactUname),
                avatar: isFounderDirect
                    ? ((targetObj && targetObj.avatar) || "./lembarku-logo.png")
                    : isSupport
                        ? "./lembarku-logo.png"
                        : ((targetObj && targetObj.avatar) || DEFAULT_AVATAR),
                role: isFounderDirect ? "master" : isSupport ? "administrasi" : ((targetObj && targetObj.role) || "user"),
                isPro: !!(targetObj && targetObj.isPro),
                messages: [],
                unread: 0,
                lastTs: 0
            };
        }
        map[threadKey].messages.push(c);
        const isFromMe = _normChatKey(c.sender || "") === myKey || (!c.sender && c.role !== "master" && c.role !== "administrasi");
        if (!isFromMe && !c.readByUser) map[threadKey].unread++;
        if ((c.ts || 0) >= map[threadKey].lastTs) map[threadKey].lastTs = c.ts || 0;
    });

    return Object.values(map).sort((a, b) => b.lastTs - a.lastTs);
}

// Master dapat chat SELURUH user manapun; akun lain hanya Founder, Administrasi & yang sudah diikuti
function getAccessibleChatContacts() {
    const curU = getCurrentUserObj();
    if (!curU || !curU.username) return [];
    const myKey = _normChatKey(curU.username);
    const all = (db.users || []).filter(u => u && u.username && _normChatKey(u.username) !== myKey);

    if (curU.role === "master") {
        const isOn = (u) => typeof isUserOnlineNow === "function" && isUserOnlineNow(u);
        const rank = (role) => role === "administrasi" ? 0 : role === "cabang" ? 1 : 2;
        return all.sort((a, b) =>
            (Number(isOn(b)) - Number(isOn(a))) ||
            (rank(a.role) - rank(b.role)) ||
            String(a.name || a.username).localeCompare(String(b.name || b.username))
        );
    }

    const myBlocked = typeof getBlockedUsersList === "function" ? getBlockedUsersList(curU) : [];
    const myFollowing = typeof _getFollowingListForUser === "function"
        ? _getFollowingListForUser(curU)
        : (Array.isArray(curU.following) ? curU.following.map(_normChatKey) : []);

    const filtered = all.filter(u => {
        const uKey = _normChatKey(u.username);
        const isFounderOrAdmin = u.role === "master" || u.role === "administrasi";
        const isFollowed = myFollowing.includes(uKey);

        if (!isFounderOrAdmin && !isFollowed) return false;

        if (!isFounderOrAdmin) {
            if (myBlocked.includes(uKey) || u.blockedViewer) return false;
            if (!isStaffUserObj(curU)) {
                const priv = typeof getUserPrivacy === "function" ? getUserPrivacy(u) : { showInChatContacts: true };
                if (!priv.showInChatContacts) return false;
            }
        }
        return true;
    });

    const isOn = (u) => typeof isUserOnlineNow === "function" && isUserOnlineNow(u);
    const rank = (role) => role === "master" ? 0 : role === "administrasi" ? 1 : 2;
    return filtered.sort((a, b) =>
        (Number(isOn(b)) - Number(isOn(a))) ||
        (rank(a.role) - rank(b.role)) ||
        String(a.name || a.username).localeCompare(String(b.name || b.username))
    );
}

function setChatContactMasterFilter(f) {
    _chatContactMasterFilter = f || "all";
    renderChatContactsModalList();
}

function openChatContactsModal() {
    const curU = getCurrentUserObj();
    if (!curU) return showToast("Silakan masuk akun terlebih dahulu untuk melihat daftar kontak.", "info");
    _chatContactMasterFilter = "all";
    const sub = document.getElementById("cc-access-sub");
    if (sub) {
        sub.innerText = curU.role === "master"
            ? "Seluruh pengguna terdaftar (chat masuk ke kotak Privat Founder)"
            : "Founder (Privat), Tim Administrasi (CS) & akun yang Anda ikuti";
    }
    const inp = document.getElementById("cc-search-inp");
    if (inp) inp.value = "";
    renderChatContactsModalList();
    const mod = document.getElementById("modal-chat-contacts");
    if (mod) {
        mod.style.zIndex = "135";
        mod.classList.remove("hide");
    }
    _pushChatNavStep({ type: "modal", id: "modal-chat-contacts" });
}

function renderChatContactsModalList() {
    const box = document.getElementById("cc-contacts-list"); if (!box) return;
    const curU = getCurrentUserObj();
    const isMaster = !!(curU && curU.role === "master");
    const allContacts = getAccessibleChatContacts();

    const filterBox = document.getElementById("cc-master-filters");
    if (filterBox) {
        filterBox.classList.toggle("hide", !isMaster);
        if (isMaster) {
            const cntOnline = allContacts.filter(u => typeof isUserOnlineNow === "function" && isUserOnlineNow(u)).length;
            const cntCabang = allContacts.filter(u => u.role === "cabang").length;
            const cntPro = allContacts.filter(u => !!u.isPro).length;
            const pills = [
                { k: "all", l: `Semua (${allContacts.length})` },
                { k: "online", l: `● Online (${cntOnline})` },
                { k: "cabang", l: `Cabang (${cntCabang})` },
                { k: "pro", l: `PRO (${cntPro})` }
            ];
            filterBox.innerHTML = pills.map(p =>
                `<button type="button" onclick="setChatContactMasterFilter('${p.k}')" class="px-2.5 py-1 rounded-full text-[10.5px] font-bold whitespace-nowrap transition ${_chatContactMasterFilter === p.k ? "gold-pill-btn shadow-sm" : "app-btn-sec"}">${p.l}</button>`
            ).join("");
        }
    }

    const q = (document.getElementById("cc-search-inp")?.value || "").trim().toLowerCase().replace(/^@/, "");
    const contacts = allContacts.filter(u => {
        if (isMaster) {
            if (_chatContactMasterFilter === "online" && !(typeof isUserOnlineNow === "function" && isUserOnlineNow(u))) return false;
            if (_chatContactMasterFilter === "cabang" && u.role !== "cabang") return false;
            if (_chatContactMasterFilter === "pro" && !u.isPro) return false;
        }
        if (!q) return true;
        const canSeeHandle = typeof canSeeUserHandle === "function" ? canSeeUserHandle(u) : true;
        return String(u.name || "").toLowerCase().includes(q) ||
            (canSeeHandle && String(u.username || "").toLowerCase().includes(q));
    });

    if (!contacts.length) {
        box.innerHTML = `<p class="p-8 text-center text-xs app-muted">${isMaster ? "Tidak ada pengguna yang cocok dengan filter ini." : "Belum ada kontak yang cocok. Ikuti (Follow) pengguna terlebih dahulu untuk memunculkannya di daftar chat."}</p>`;
        return;
    }

    box.innerHTML = contacts.map(u => {
        const isAdminRole = u.role === "master" || u.role === "administrasi";
        const canSeeHandle = typeof canSeeUserHandle === "function" ? canSeeUserHandle(u) : true;
        const onlineDot = typeof buildOnlineDotHtml === "function" ? buildOnlineDotHtml(u, "md") : "";
        const presenceTxt = typeof getUserPresenceText === "function" ? getUserPresenceText(u) : "";
        const roleBadge = u.role === "master"
            ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-extrabold">FOUNDER • PRIVAT</span>`
            : u.role === "administrasi"
                ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-extrabold">ADMIN CS</span>`
                : u.role === "cabang"
                    ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-600 font-extrabold">CABANG</span>`
                    : (isMaster ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-500/15 app-muted font-bold">USER</span>` : `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-500/15 app-muted font-bold">FOLLOWING</span>`);
        const subLine = presenceTxt === "Online"
            ? `<span class="text-emerald-600 font-bold">● Online</span>${u.bio ? ` • ${escHtml(u.bio)}` : ""}`
            : presenceTxt
                ? `${escHtml(presenceTxt)}${u.bio ? ` • ${escHtml(u.bio)}` : ""}`
                : (u.bio ? escHtml(u.bio) : (isAdminRole ? "Layanan Resmi Lembarku" : (canSeeHandle ? `@${escHtml(u.username)}` : "Pengguna Lembarku")));

        return `
            <div onclick="startDirectChatWithContact('${esc(u.username)}')" class="px-4 py-3 hover:bg-black/5 active:bg-black/10 cursor-pointer flex items-center gap-3.5 transition">
                <div class="relative shrink-0">
                    <img src="${u.avatar || DEFAULT_AVATAR}" class="w-12 h-12 rounded-full object-cover bg-zinc-800 border gold-border">
                    ${onlineDot}
                </div>
                <div class="flex-1 min-w-0 border-b border-black/5 pb-3 -mb-3">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-1.5 min-w-0">
                            <strong class="text-sm font-bold truncate">${escHtml(u.name || u.username)}</strong>
                            ${u.isPro ? '<i class="fa-solid fa-circle-check text-blue-500 text-xs shrink-0"></i>' : ""}
                            ${roleBadge}
                        </div>
                        ${canSeeHandle ? `<span class="text-[10px] app-muted shrink-0">@${escHtml(u.username)}</span>` : ""}
                    </div>
                    <p class="text-xs app-muted truncate mt-0.5">${subLine}</p>
                </div>
            </div>
        `;
    }).join("");
}

function startDirectChatWithContact(username) {
    const cleanTarget = _normChatKey(username);
    const curU = getCurrentUserObj();
    const targetObj = (db.users || []).find(x => _normChatKey(x.username) === cleanTarget);

    if (curU && !isStaffUserObj(curU)) {
        const myBlocked = typeof getBlockedUsersList === "function" ? getBlockedUsersList(curU) : [];
        if (myBlocked.includes(cleanTarget)) {
            return showToast("Anda telah memblokir akun ini. Buka blokir di Pengaturan Privasi terlebih dahulu.", "error");
        }
        if (targetObj && targetObj.blockedViewer) {
            return showToast("Anda tidak dapat mengirim pesan ke akun ini.", "error");
        }
        if (targetObj && targetObj.role !== "master" && targetObj.role !== "administrasi") {
            const priv = typeof getUserPrivacy === "function" ? getUserPrivacy(targetObj) : { allowDirectChat: true };
            if (!priv.allowDirectChat) {
                return showToast("Pengguna ini membatasi pesan langsung dari pengguna lain.", "info");
            }
        }
    }

    document.getElementById("modal-chat-contacts")?.classList.add("hide");
    if (typeof _mrDropTopModalById === "function") _mrDropTopModalById("modal-chat-contacts");

    if (curU && curU.role === "master") {
        _masterChatBoxTab = "private";
        openFullChatOverlay(_buildFounderPrivateThreadId(cleanTarget));
    } else if (curU && curU.role === "administrasi") {
        openFullChatOverlay(cleanTarget);
    } else if (curU) {
        if (_isFounderKey(targetObj || cleanTarget)) {
            openFullChatOverlay(_buildFounderPrivateThreadId(curU.username));
        } else if (_isAdminStaffKey(targetObj || cleanTarget)) {
            openFullChatOverlay("admin_support");
        } else {
            openFullChatOverlay(_buildPeerDmThreadId(curU.username, cleanTarget));
        }
    }
}

async function deleteChatThreadHistory(targetThread) {
    const curU = getCurrentUserObj();
    if (!curU || curU.role !== "master") return showToast("Hanya Founder yang dapat menghapus riwayat chat.", "error");
    const tUser = String(targetThread || activeMasterChatThread || "");
    if (!tUser) return;
    if (!(await showConfirm("Hapus Riwayat Chat", `Hapus seluruh riwayat pesan ini secara permanen?`, "fa-solid fa-trash", "Ya, Hapus Riwayat"))) return;

    showLoading("Menghapus riwayat chat...");
    const res = await apiAction({ action: "delete_chat_thread", threadUser: tUser });
    hideLoading();
    if (res && res.ok) {
        db.chats = (db.chats || []).filter(c => String(c.threadUser || c.sender || "") !== tUser);
        if (activeMasterChatThread === tUser) activeMasterChatThread = null;
        renderFullChatOverlay();
        updateChatBadges();
        showToast("Riwayat chat berhasil dihapus!", "info");
    } else {
        showToast((res && res.message) || "Gagal menghapus riwayat chat.", "error");
    }
}

function _renderUserProfileModalFallback(uObj) {
    const mod = document.getElementById("modal-view-user-profile");
    if (!mod || !uObj) return false;
    const roleLabel = uObj.role === "master" ? "Founder" : (uObj.role || "user");
    const priv = typeof getUserPrivacy === "function" ? getUserPrivacy(uObj) : { showContact: false };
    const canSeeHandle = typeof canSeeUserHandle === "function" ? canSeeUserHandle(uObj) : true;
    const body = mod.querySelector("#mvp-body");
    if (body) {
        body.innerHTML = `
            <div class="p-5 space-y-3 text-xs">
                <div class="flex items-center gap-3.5">
                    <img src="${uObj.avatar || DEFAULT_AVATAR}" class="w-16 h-16 rounded-full object-cover border-2 gold-border bg-zinc-800 shrink-0">
                    <div class="min-w-0">
                        <strong class="text-base font-extrabold block truncate">${escHtml(uObj.name || uObj.username)}</strong>
                        ${canSeeHandle ? `<span class="app-accent font-semibold block truncate">@${escHtml(uObj.username)}</span>` : ""}
                        <span class="text-[10px] app-muted uppercase font-bold">Role: ${escHtml(roleLabel)}</span>
                    </div>
                </div>
                ${uObj.bio ? `<p class="app-card-soft border rounded-2xl p-3">${escHtml(uObj.bio)}</p>` : ""}
                ${(priv.showContact && (uObj.phone || uObj.address)) ? `<div class="app-card-soft border rounded-2xl p-3 space-y-1">
                    ${uObj.phone ? `<div><strong>No. HP/WA:</strong> ${escHtml(uObj.phone)}</div>` : ""}
                    ${uObj.address ? `<div><strong>Alamat:</strong> ${escHtml(uObj.address)}</div>` : ""}
                </div>` : ""}
            </div>
        `;
    }
    mod.classList.remove("hide");
    mod.style.zIndex = "135";
    _pushChatNavStep({ type: "user_profile", username: _normChatKey(uObj.username) });
    return true;
}

function _openUserProfileFromChat(threadUser) {
    const cleanUser = _extractFounderThreadUser(threadUser);
    if (!cleanUser || cleanUser.startsWith("tamu_") || cleanUser === "admin_support") {
        showToast("Layanan CS resmi Tim Administrasi Lembarku.", "info");
        return;
    }

    window.openedFromChatThread = activeMasterChatThread || cleanUser;

    if (typeof viewUserProfileModal === "function") {
        viewUserProfileModal(cleanUser);
        return;
    }

    const uObj = (db.users || []).find(x => _normChatKey(x.username) === cleanUser);
    if (uObj && _renderUserProfileModalFallback(uObj)) {
        return;
    }

    window.openedFromChatThread = null;
    showToast("Profil pengguna tidak ditemukan.", "info");
}

function exitChatThreadToList() {
    activeMasterChatThread = null;
    tempChatAttachment = "";
    renderFullChatOverlay();
}

function _syncWaChatHeader(mode = "list", title = "", avatarUrl = "", profileUsername = "", customSub = "") {
    const ov = document.getElementById("full-chat-overlay");
    if (!ov) return;

    ov.style.cssText = "display:flex !important;position:fixed !important;inset:0 !important;width:100vw !important;height:100vh !important;max-width:100vw !important;max-height:100vh !important;padding:0 !important;margin:0 !important;z-index:110 !important;background:#000000 !important;opacity:1 !important;visibility:visible !important;";

    const cardBox = ov.querySelector(".app-card");
    if (cardBox) {
        cardBox.style.cssText = "display:flex !important;flex-direction:column !important;width:100% !important;height:100% !important;max-width:100% !important;max-height:100% !important;border-radius:0 !important;border:none !important;padding:0 !important;margin:0 !important;background:var(--app-card,#ffffff) !important;color:var(--app-text,#0f172a) !important;";
    }

    const topBar = ov.querySelector(".gold-gradient");
    if (topBar) {
        topBar.style.cssText = "display:flex !important;align-items:center !important;justify-content:space-between !important;gap:0.5rem !important;padding:0.75rem 0.9rem !important;border-radius:0 !important;";

        const isRealUser = mode === "thread" && profileUsername && !String(profileUsername).startsWith("tamu_") && profileUsername !== "admin_support";
        const targetProfileObj = isRealUser ? (db.users || []).find(x => _normChatKey(x.username) === _normChatKey(profileUsername)) : null;
        const headerOnlineDot = targetProfileObj && typeof buildOnlineDotHtml === "function" ? buildOnlineDotHtml(targetProfileObj, "sm") : "";
        const headerPresence = targetProfileObj && typeof getUserPresenceText === "function" ? getUserPresenceText(targetProfileObj) : "";
        const headerSubLine = customSub || (isRealUser
            ? (headerPresence === "Online"
                ? `<span class="text-emerald-300 font-bold">● Online</span> • Ketuk lihat profil`
                : headerPresence
                    ? `${escHtml(headerPresence)} • Ketuk lihat profil`
                    : "Ketuk untuk lihat profil")
            : "Layanan Resmi Tim Administrasi");
        const clickCall = isRealUser ? `onclick="_openUserProfileFromChat('${esc(profileUsername)}'); event.stopPropagation();"` : "";
        const backAction = mode === "thread" ? "exitChatThreadToList()" : "closeFullChatOverlay()";

        topBar.innerHTML = `
            <div class="flex items-center gap-2.5 w-full min-w-0">
                <button type="button" onclick="${backAction}" class="w-9 h-9 rounded-full bg-black/15 hover:bg-black/25 text-white flex items-center justify-center text-sm shrink-0 active:scale-95 transition" title="Kembali">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <div id="wa-chat-profile-bar" class="flex items-center gap-2.5 flex-1 min-w-0 ${isRealUser ? "cursor-pointer active:opacity-75" : ""}" ${clickCall}>
                    ${mode === "thread"
                        ? `<div class="relative shrink-0">
                               <img id="wa-thread-avatar" src="${avatarUrl || DEFAULT_AVATAR}" class="w-10 h-10 rounded-full object-cover border border-white/60 bg-zinc-800">
                               ${headerOnlineDot}
                           </div>
                           <div class="min-w-0 flex-1">
                               <h3 id="wa-thread-name" class="text-base font-extrabold text-white tracking-tight truncate">${escHtml(title || "Pengguna")}</h3>
                               <span class="text-[10px] text-white/85 block -mt-0.5 truncate">${headerSubLine}</span>
                           </div>`
                        : `<img src="./lembarku-logo.png" class="w-9 h-9 rounded-xl bg-white p-1 object-contain border border-black/10 shrink-0">
                           <div class="min-w-0 flex-1">
                               <h3 class="text-lg font-extrabold text-white tracking-tight">${escHtml(title || "Obrolan")}</h3>
                               <span class="text-[10px] text-white/80 block -mt-0.5">${escHtml(customSub || "Pilih obrolan atau ketuk + untuk mulai chat")}</span>
                           </div>`
                    }
                </div>
            </div>
        `;
    }

    const body = document.getElementById("fchat-body");
    if (body) {
        body.style.cssText = "display:flex !important;flex-direction:column !important;flex:1 1 auto !important;min-height:0 !important;background:var(--app-bg,#f8fafc) !important;position:relative !important;";
    }

    if (cardBox) {
        Array.from(cardBox.children).forEach(child => {
            if (child !== topBar && child !== body) {
                child.style.setProperty("display", "none", "important");
            }
        });
    }
}

async function openFullChatOverlay(targetThread = null, skipHistoryPush = false) {
    const curUserCheck = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!curUserCheck) {
        showToast("Silakan masuk / daftar akun terlebih dahulu untuk menggunakan Live Chat.", "info");
        if (typeof openAuthModal === "function") openAuthModal();
        return;
    }
    const ov = document.getElementById("full-chat-overlay"); if (!ov) return;
    if (ov.classList.contains("hide") && typeof currentViewName !== "undefined") {
        window._chatOriginView = currentViewName;
    }

    const u = curUserCheck;
    if (targetThread) {
        const rawT = String(targetThread).trim();
        if (u.role === "master") {
            if (rawT.startsWith("founder__") || rawT.startsWith("dm_")) {
                activeMasterChatThread = rawT;
            } else {
                activeMasterChatThread = _masterChatBoxTab === "cs" ? _normChatKey(rawT) : _buildFounderPrivateThreadId(rawT);
            }
        } else if (u.role === "administrasi") {
            if (rawT.startsWith("founder__")) {
                return showToast("Percakapan ini bersifat privat milik Founder.", "error");
            }
            activeMasterChatThread = _normChatKey(rawT);
        } else {
            if (rawT === "founder_private" || _isFounderKey(rawT)) {
                activeMasterChatThread = _buildFounderPrivateThreadId(u.username);
            } else if (rawT === "admin_support" || _isAdminStaffKey(rawT)) {
                activeMasterChatThread = u.role === "cabang" ? _buildFounderPrivateThreadId(u.username) : "admin_support";
            } else if (rawT.startsWith("dm_") || rawT.startsWith("founder__")) {
                activeMasterChatThread = rawT;
            } else {
                activeMasterChatThread = _buildPeerDmThreadId(u.username, rawT);
            }
        }
    } else if (ov.classList.contains("hide")) {
        activeMasterChatThread = null;
    }

    tempChatAttachment = "";
    document.body.style.overflow = "hidden";
    ov.classList.remove("hide");

    if (!skipHistoryPush) {
        if (activeMasterChatThread) {
            _pushChatNavStep({ type: "chat_thread", threadUser: activeMasterChatThread });
        } else {
            _pushChatNavStep({ type: "chat_list" });
        }
    }

    if (isStaffUserObj(u) && typeof fetchFullCloud === "function") {
        fetchFullCloud().then((ok) => {
            if (ok && !ov.classList.contains("hide")) {
                renderFullChatContentSmart();
                updateChatBadges();
            }
        });
    }

    renderFullChatOverlay();
    if (typeof scheduleAdaptivePoll === "function") scheduleAdaptivePoll();
}

function closeFullChatOverlay(fromHistory = false) {
    const ov = document.getElementById("full-chat-overlay"); if (!ov) return;
    ov.style.cssText = "";
    ov.classList.add("hide");
    document.body.style.overflow = "";
    tempChatAttachment = "";
    activeMasterChatThread = null;
    window.openedFromChatThread = null;
    window._chatOriginView = null;
    if (typeof scheduleAdaptivePoll === "function") scheduleAdaptivePoll();
}

async function pickChatAttachment(inp) {
    const file = inp.files && inp.files[0]; if (!file) return; inp.value = "";
    showLoading("Menyiapkan lampiran...");
    const b64 = await quickResizeImage(file, 820, 0.80);
    const up = await apiAction({ action: "upload_media", dataUrl: b64, prefix: "chat_att" });
    hideLoading();
    tempChatAttachment = (up && up.ok && up.url) ? up.url : b64;
    const bar = document.getElementById("chat-att-preview-bar");
    const img = document.getElementById("chat-att-preview-img");
    if (img) img.src = tempChatAttachment;
    if (bar) bar.classList.remove("hide");
}

function clearChatAttachment() {
    tempChatAttachment = "";
    document.getElementById("chat-att-preview-bar")?.classList.add("hide");
}

function buildChatComposerHtml(onSubmitFn, inputId, btnId, placeholderText) {
    return `
        <div id="chat-att-preview-bar" class="hide px-3 py-2 app-card border-t gold-border flex items-center justify-between gap-2 shrink-0">
            <div class="flex items-center gap-2">
                <img id="chat-att-preview-img" src="" class="w-10 h-10 rounded-lg object-cover border gold-border">
                <span class="text-[11px] font-semibold app-accent">Foto lampiran siap dikirim</span>
            </div>
            <button type="button" onclick="clearChatAttachment()" class="w-7 h-7 rounded-full bg-red-600/15 text-red-500 text-xs"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form onsubmit="${onSubmitFn}" class="px-3 py-2.5 app-card border-t gold-border flex items-center gap-2 shrink-0 w-full">
            <label class="w-10 h-10 rounded-full app-btn-sec flex items-center justify-center text-sm app-accent cursor-pointer shrink-0" title="Lampirkan Foto / Bukti">
                <i class="fa-solid fa-paperclip"></i>
                <input type="file" accept="image/*" class="hide" onchange="pickChatAttachment(this)">
            </label>
            <input type="text" id="${inputId}" placeholder="${placeholderText}" class="app-input !rounded-full !py-2.5 !px-4 flex-1 text-xs">
            <button type="submit" id="${btnId}" class="w-10 h-10 rounded-full gold-pill-btn flex items-center justify-center text-xs shrink-0 shadow" title="Kirim Pesan"><i class="fa-solid fa-paper-plane"></i></button>
        </form>
    `;
}

function _buildPlusContactButtonHtml() {
    return `
        <button type="button" id="btn-chat-plus-contact" onclick="event.preventDefault();event.stopPropagation();openChatContactsModal();" style="position:fixed;bottom:24px;right:24px;z-index:125;width:52px;height:52px;border-radius:9999px;" class="gold-gradient shadow-2xl flex items-center justify-center text-xl font-extrabold active:scale-95 transition" title="Mulai Chat Baru (Daftar Kontak)">
            <i class="fa-solid fa-plus"></i>
        </button>
    `;
}

function renderFullChatOverlay() {
    const body = document.getElementById("fchat-body"); if (!body) return;
    const u = getCurrentUserObj();
    const isStaff = isStaffUserObj(u);
    const isMaster = !!(u && u.role === "master");
    const isAdminOnly = !!(u && u.role === "administrasi");
    const threads = getChatThreads();

    // 1. HALAMAN UTAMA CHAT LUAR (TANPA KOLOM MENGETIK, TAMPIL TOMBOL +)
    if (!activeMasterChatThread) {
        const hdrTitle = isMaster ? "Obrolan Founder" : isAdminOnly ? "CS Tim Administrasi" : "Obrolan";
        const hdrSub = isMaster
            ? (_masterChatBoxTab === "cs" ? "Pantau CS bersama Tim Administrasi" : "Kotak masuk privat khusus Founder")
            : isAdminOnly
                ? "Kotak masuk bersama seluruh staf (Sinkron Overshift)"
                : "Pilih obrolan atau ketuk + untuk mulai chat";
        _syncWaChatHeader("list", hdrTitle, "", "", hdrSub);
        const plusHtml = u ? _buildPlusContactButtonHtml() : "";

        const masterTabsBar = isMaster ? `
            <div class="px-3.5 py-2.5 app-card border-b gold-border flex gap-2 shrink-0">
                <button type="button" onclick="setMasterChatBoxTab('private')" class="flex-1 py-2 rounded-xl text-xs font-extrabold transition ${_masterChatBoxTab !== "cs" ? "gold-pill-btn shadow-sm" : "app-btn-sec"}">
                    <i class="fa-solid fa-lock mr-1"></i>Chat Privat Founder
                </button>
                <button type="button" onclick="setMasterChatBoxTab('cs')" class="flex-1 py-2 rounded-xl text-xs font-extrabold transition ${_masterChatBoxTab === "cs" ? "gold-pill-btn shadow-sm" : "app-btn-sec"}">
                    <i class="fa-solid fa-headset mr-1"></i>CS Tim Admin
                </button>
            </div>
        ` : (isAdminOnly ? `
            <div class="px-3.5 py-2 bg-emerald-500/10 border-b border-emerald-500/25 text-[10.5px] text-emerald-700 font-semibold shrink-0 flex items-center gap-2">
                <i class="fa-solid fa-users-gear"></i>
                <span>Mode Overshift Aktif: Semua staf Administrasi melihat riwayat chat CS yang sama.</span>
            </div>
        ` : "");

        body.innerHTML = `
            ${masterTabsBar}
            <div class="flex-1 overflow-y-auto divide-y divide-black/10 pb-24">${threads.length ? threads.map(th => {
                const last = th.messages.length ? th.messages[th.messages.length - 1] : null;
                const lastStaff = last && (last.role === "master" || last.role === "administrasi");
                const roleBadge = th.role === "master"
                    ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 font-bold">FOUNDER</span>`
                    : th.role === "administrasi"
                        ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 font-bold">TIM CS</span>`
                        : th.role === "cabang"
                            ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 font-bold">CABANG</span>`
                            : th.role === "tamu"
                                ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-500/15 app-muted font-bold">TAMU</span>`
                                : "";
                const lastSenderPrefix = (isStaff && lastStaff) ? `✓✓ ${escHtml(last.senderName || "Admin")}: ` : "";
                const previewText = last
                    ? `${lastSenderPrefix}${last.image ? "📷 [Lampiran] " : ""}${escHtml(last.text)}`
                    : "Ketuk untuk mulai berkirim pesan";

                const thUserObj = (db.users || []).find(x => _normChatKey(x.username) === _normChatKey(th.contactUsername || th.threadUser));
                const thOnlineDot = thUserObj && typeof buildOnlineDotHtml === "function" ? buildOnlineDotHtml(thUserObj, "md") : "";
                return `<div onclick="openMasterChatThread('${esc(th.threadUser)}')" class="p-3.5 hover:bg-black/5 cursor-pointer flex items-center gap-3">
                    <div class="relative shrink-0">
                        <img src="${th.avatar}" class="w-12 h-12 rounded-full object-cover bg-zinc-800 border gold-border">
                        ${thOnlineDot}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-center gap-2">
                            <strong class="text-sm truncate flex items-center gap-1">${escHtml(th.displayName)} ${th.isPro ? '<i class="fa-solid fa-circle-check text-blue-500 text-xs"></i>' : ""} ${roleBadge}</strong>
                            <span class="text-[11px] app-muted shrink-0">${(last && last.time) || ""}</span>
                        </div>
                        <div class="flex justify-between items-center mt-1 gap-2">
                            <p class="text-xs app-muted truncate">${previewText}</p>
                            <div class="flex items-center gap-1.5 shrink-0">
                                ${th.unread > 0 ? `<span class="min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center">${th.unread}</span>` : ""}
                                ${isMaster && !String(th.threadUser).startsWith("dm_") ? `<button type="button" onclick="event.stopPropagation();deleteChatThreadHistory('${esc(th.threadUser)}');" class="w-7 h-7 rounded-lg bg-red-600/12 text-red-500 hover:bg-red-600/25 flex items-center justify-center text-[11px]" title="Hapus Riwayat Chat"><i class="fa-solid fa-trash"></i></button>` : ""}
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join("") : '<div class="p-12 text-center space-y-2"><i class="fa-regular fa-comments text-3xl app-muted opacity-50"></i><p class="text-xs app-muted">Belum ada percakapan di kotak ini.<br>Ketuk tombol <strong>+</strong> di kanan bawah untuk memilih kontak.</p></div>'}</div>
            ${plusHtml}
        `;
        return;
    }

    // 2. HALAMAN ISI CHAT DENGAN SESEORANG (ADA KOLOM MENGETIK, TANPA TOMBOL +)
    if (isStaff) {
        const contactKey = _extractFounderThreadUser(activeMasterChatThread);
        const uObj = (db.users || []).find(x => _normChatKey(x.username) === contactKey);
        const th = threads.find(t => t.threadUser === activeMasterChatThread) || {
            threadUser: activeMasterChatThread,
            contactUsername: contactKey,
            displayName: (uObj && uObj.name) || contactKey,
            avatar: (uObj && uObj.avatar) || DEFAULT_AVATAR
        };
        const privTag = String(activeMasterChatThread).startsWith("founder__") ? "🔒 Privat Founder • " : "";
        _syncWaChatHeader("thread", th.displayName, th.avatar, th.contactUsername || contactKey, privTag ? `${privTag}Ketuk lihat profil` : "");
        const quickBar = `<div class="px-3 py-1.5 app-card border-t gold-border flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">${QUICK_REPLIES_STAFF.map(txt => `<button type="button" onclick="fillQuickReply('${esc(txt)}')" class="px-2.5 py-1 rounded-full app-card-soft border text-[10px] font-semibold whitespace-nowrap hover:brightness-95">${escHtml(txt.slice(0, 34))}...</button>`).join("")}</div>`;

        body.innerHTML = `
            <div id="fchat-messages-scroll" class="flex-1 overflow-y-auto p-3.5 space-y-2.5"></div>
            ${quickBar}
            ${buildChatComposerHtml("sendMasterThreadReply(event)", "master-wa-input", "btn-wa-send", `Ketik pesan ke ${esc(th.displayName)}...`)}
        `;
        renderFullChatMessagesOnly();
    } else {
        const isFounderDirect = String(activeMasterChatThread).startsWith("founder__");
        const isSupport = activeMasterChatThread === "admin_support";
        let targetName = "Tim Administrasi (CS)";
        let targetAv = "./lembarku-logo.png";
        let profileUname = "";
        let customSub = "Layanan CS Bersama Tim Administrasi";

        if (isFounderDirect) {
            const fObj = (db.users || []).find(x => x.role === "master");
            targetName = (fObj && fObj.name) ? `${fObj.name} (Founder)` : "Founder Lembarku";
            targetAv = (fObj && fObj.avatar) || "./lembarku-logo.png";
            profileUname = (fObj && fObj.username) || FOUNDER_USERNAME;
            customSub = "🔒 Obrolan Privat dengan Founder";
        } else if (!isSupport && String(activeMasterChatThread).startsWith("dm_")) {
            const myKey = _normChatKey(currentSessionUser || guestChatId);
            const parts = String(activeMasterChatThread).slice(3).split("__");
            const peerKey = parts[0] === myKey ? parts[1] : parts[0];
            const peerObj = (db.users || []).find(x => _normChatKey(x.username) === peerKey);
            targetName = (peerObj && peerObj.name) || peerKey || "Pengguna";
            targetAv = (peerObj && peerObj.avatar) || DEFAULT_AVATAR;
            profileUname = peerKey || "";
            customSub = "";
        }

        _syncWaChatHeader("thread", targetName, targetAv, profileUname, customSub);
        body.innerHTML = `
            <div id="fchat-messages-scroll" class="flex-1 overflow-y-auto p-3.5 space-y-2.5"></div>
            ${buildChatComposerHtml("sendUserChatMessage(event)", "chat-input-text", "btn-chat-send", `Ketik pesan ke ${esc(targetName)}...`)}
        `;
        renderFullChatMessagesOnly();
        if (isSupport || isFounderDirect) {
            const markTarget = isFounderDirect ? String(activeMasterChatThread) : _normChatKey(currentSessionUser || guestChatId);
            apiAction({ action: "mark_chat_read", threadUser: markTarget, by: "user" }).then(updateChatBadges);
        }
    }
}

function fillQuickReply(txt) {
    const inp = document.getElementById("master-wa-input");
    if (inp) { inp.value = txt; inp.focus(); }
}

function renderFullChatMessagesOnly() {
    const el = document.getElementById("fchat-messages-scroll"); if (!el) return;
    const u = getCurrentUserObj(), isStaff = isStaffUserObj(u);
    const myKey = _normChatKey(currentSessionUser || guestChatId);

    let msgs = [];
    if (isStaff) {
        const curTh = String(activeMasterChatThread || "");
        if (curTh.startsWith("founder__")) {
            const innerU = _extractFounderThreadUser(curTh);
            const innerObj = (db.users || []).find(x => _normChatKey(x.username) === innerU);
            const isCab = !!(innerObj && innerObj.role === "cabang");
            msgs = (db.chats || []).filter(c => {
                const ct = String(c.threadUser || "");
                return ct === curTh || (isCab && _normChatKey(ct || c.sender) === innerU);
            });
        } else {
            msgs = (db.chats || []).filter(c => !String(c.threadUser || "").startsWith("founder__") && _normChatKey(c.threadUser || c.sender) === _normChatKey(curTh));
        }
    } else if (activeMasterChatThread && (String(activeMasterChatThread).startsWith("dm_") || String(activeMasterChatThread).startsWith("founder__"))) {
        const curTh = String(activeMasterChatThread);
        const isCabSelf = !!(u && u.role === "cabang" && curTh.startsWith("founder__"));
        msgs = (db.chats || []).filter(c => String(c.threadUser || "") === curTh || (isCabSelf && !String(c.threadUser || "").startsWith("dm_") && _normChatKey(c.threadUser || c.sender) === myKey));
    } else {
        msgs = (db.chats || []).filter(c => !String(c.threadUser || "").startsWith("dm_") && !String(c.threadUser || "").startsWith("founder__") && _normChatKey(c.threadUser || c.sender) === myKey);
    }

    let lastStaffReplyTs = 0;
    msgs.forEach(m => {
        if ((m.role === "master" || m.role === "administrasi") && !m._pending) {
            if ((m.ts || 0) > lastStaffReplyTs) lastStaffReplyTs = m.ts || 0;
        }
    });

    el.innerHTML = msgs.length ? msgs.map(m => {
        const msgIsStaff = (m.role === "master" || m.role === "administrasi");
        const isMe = isStaff
            ? msgIsStaff
            : (m.sender ? (_normChatKey(m.sender) === myKey) : !msgIsStaff);

        let tickHtml = "";
        if (isMe) {
            if (m._pending) {
                tickHtml = `<i class="fa-solid fa-check text-[10px] opacity-65 ml-1" title="Mengirim..."></i>`;
            } else if (!isStaff && (m.repliedByAdmin || (lastStaffReplyTs > 0 && (m.ts || 0) <= lastStaffReplyTs))) {
                tickHtml = `<i class="fa-solid fa-check-double text-[10px] chat-tick-replied ml-1" title="Sudah dibalas Admin"></i>`;
            } else {
                tickHtml = `<i class="fa-solid fa-check-double text-[10px] opacity-60 ml-1" title="Terkirim"></i>`;
            }
        }

        const bubbleCls = isMe ? "app-card border-2 gold-border rounded-br-sm" : "app-card border rounded-bl-sm";
        const senderLbl = (isMe && isStaff && m.senderName)
            ? m.senderName
            : isMe
                ? "Anda"
                : (m.role === "master" ? "Founder" : m.role === "administrasi" ? (m.senderName || "Tim Administrasi") : (m.senderName || "Pengguna"));

        return `<div class="flex ${isMe ? "justify-end" : "justify-start"}">
            <div class="max-w-[84%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${bubbleCls}">
                <span class="block text-[9px] font-bold app-accent mb-0.5">${escHtml(senderLbl)}</span>
                ${m.image ? `<a href="${m.image}" target="_blank" class="block mb-1.5"><img src="${m.image}" class="max-h-48 rounded-xl border gold-border object-contain"></a>` : ""}
                ${m.text ? `<p class="whitespace-pre-wrap break-words">${escHtml(m.text)}</p>` : ""}
                <div class="flex items-center justify-end gap-0.5 mt-1 text-[9px] app-muted">
                    <span>${m.time || ""}</span>
                    ${tickHtml}
                </div>
            </div>
        </div>`;
    }).join("") : `<p class="text-center app-muted py-16 text-xs">Belum ada percakapan. Kirim pesan pertama Anda sekarang!</p>`;
    el.scrollTop = el.scrollHeight;
}

function renderFullChatContentSmart() {
    if (!activeMasterChatThread) renderFullChatOverlay();
    else renderFullChatMessagesOnly();
}

async function openMasterChatThread(tUser) {
    const raw = String(tUser || "");
    const clean = (raw.startsWith("dm_") || raw.startsWith("founder__") || raw === "admin_support") ? raw : _normChatKey(raw);
    activeMasterChatThread = clean;
    _pushChatNavStep({ type: "chat_thread", threadUser: clean });
    renderFullChatOverlay();
    const u = getCurrentUserObj();
    if (isStaffUserObj(u)) {
        await apiAction({ action: "mark_chat_read", threadUser: clean, by: (u && u.role) || "master" });
    } else if (clean === "admin_support" || clean.startsWith("founder__")) {
        const markKey = clean.startsWith("founder__") ? clean : _normChatKey(currentSessionUser || guestChatId);
        await apiAction({ action: "mark_chat_read", threadUser: markKey, by: "user" });
    }
    updateChatBadges();
}

async function sendMasterThreadReply(e) {
    e.preventDefault();
    const inp = document.getElementById("master-wa-input");
    const text = inp.value.trim();
    const image = tempChatAttachment || "";
    if (!text && !image) return;
    const u = getCurrentUserObj();
    const isFounderPriv = String(activeMasterChatThread || "").startsWith("founder__");
    const cid = "cm_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    const localMsg = {
        clientMsgId: cid,
        threadUser: activeMasterChatThread,
        channel: isFounderPriv ? "founder_private" : "cs_desk",
        sender: _normChatKey((u && u.username) || FOUNDER_USERNAME),
        senderName: u && u.role === "administrasi" ? `Admin (${u.name || u.username})` : "Founder",
        role: (u && u.role) || "master",
        text,
        image,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        ts: Date.now(),
        readByMaster: true,
        _pending: true
    };
    db.chats.push(localMsg);
    inp.value = "";
    clearChatAttachment();
    renderFullChatMessagesOnly();

    const res = await apiAction({ action: "send_chat", message: localMsg });
    if (res && res.ok) {
        delete localMsg._pending;
        if (res.savedMsg && res.savedMsg.id) localMsg.id = res.savedMsg.id;
        renderFullChatMessagesOnly();
        updateChatBadges();
    } else {
        showToast("Pesan tertunda, periksa koneksi internet.", "error");
    }
}

async function sendUserChatMessage(e) {
    e.preventDefault();
    const inp = document.getElementById("chat-input-text");
    const text = inp.value.trim();
    const image = tempChatAttachment || "";
    if (!text && !image) return;
    const u = getCurrentUserObj();
    const myKey = _normChatKey(currentSessionUser || guestChatId);
    const curTh = String(activeMasterChatThread || "");
    const isDmPeer = curTh.startsWith("dm_");
    const isFounderPriv = curTh.startsWith("founder__") || (u && u.role === "cabang");
    const targetThreadUser = isDmPeer ? curTh : isFounderPriv ? _buildFounderPrivateThreadId(myKey) : myKey;

    const cid = "cm_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    const localMsg = {
        clientMsgId: cid,
        threadUser: targetThreadUser,
        channel: isFounderPriv ? "founder_private" : isDmPeer ? "peer_dm" : "cs_desk",
        sender: myKey,
        senderName: (u && u.name) || "Pengunjung",
        role: (u && u.role) || "user",
        text,
        image,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        ts: Date.now(),
        readByUser: true,
        repliedByAdmin: false,
        _pending: true
    };
    db.chats.push(localMsg);
    inp.value = "";
    clearChatAttachment();
    renderFullChatMessagesOnly();

    const res = await apiAction({ action: "send_chat", message: localMsg });
    if (res && res.ok) {
        delete localMsg._pending;
        if (res.savedMsg && res.savedMsg.id) localMsg.id = res.savedMsg.id;
        renderFullChatMessagesOnly();
        updateChatBadges();
    } else {
        showToast("Pesan tertunda, periksa koneksi internet.", "error");
    }
}

function updateChatBadges() {
    const badge = document.getElementById("floating-chat-badge");
    const staffPill = document.getElementById("staff-chat-pill-cnt");
    const u = getCurrentUserObj();
    let count = 0;

    if (isStaffUserObj(u)) {
        const isAdministrasiOnly = u.role === "administrasi";
        count = (db.chats || []).filter(c => {
            const rawTh = String(c.threadUser || "");
            if (rawTh.startsWith("dm_")) return false;
            if (c.readByMaster || c.role === "master" || c.role === "administrasi") return false;
            if (isAdministrasiOnly) {
                if (rawTh.startsWith("founder__") || c.channel === "founder_private") return false;
                const key = _normChatKey(rawTh || c.sender || "");
                const owner = (db.users || []).find(x => _normChatKey(x.username) === key);
                if (owner && (owner.role === "cabang" || owner.role === "master")) return false;
            }
            return true;
        }).length;
    } else if (u) {
        const myKey = _normChatKey(currentSessionUser || guestChatId);
        const myFounderTh = _buildFounderPrivateThreadId(myKey);
        count = (db.chats || []).filter(c => {
            const rawTh = String(c.threadUser || "");
            const isMine = rawTh === myFounderTh || _normChatKey(rawTh) === myKey;
            return isMine && !c.readByUser && (c.role === "master" || c.role === "administrasi");
        }).length;
    }

    if (_lastKnownChatCount >= 0 && count > _lastKnownChatCount) {
        playSoftChatNotification();
    }
    _lastKnownChatCount = count;

    const floatWrap = document.getElementById("floating-chat-wrap");
    if (floatWrap) {
        const inPortal = typeof clientPortalState !== "undefined" && clientPortalState.active;
        floatWrap.classList.toggle("hide", !u || inPortal);
    }
    if (badge) {
        badge.innerText = count;
        badge.classList.toggle("hide", !u || count === 0);
    }
    if (staffPill) {
        staffPill.innerText = count;
        staffPill.classList.toggle("hide", count === 0);
    }
    if (typeof updateNotificationBellBadge === "function") {
        updateNotificationBellBadge();
    }
}
