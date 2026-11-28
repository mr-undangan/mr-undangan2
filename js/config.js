// =========================================================================
// LEMBARKU & TITIK GOWES — CORE CONFIG, CATALOGS & SHARED ENGINE (js/config.js)
// Versi: V14.10 (Privasi Permanen, Kunci Edit 3 Mgg + Add-On CV, Scanner Warna 4-Sudut, Live Sepeda + Denda 20m, Struk Print/WA & Chat Privat Master)
// =========================================================================
const CLOUD_API_URL = "https://script.google.com/macros/s/AKfycbyHsITJ02tiA59p0QIXkOQaO3VnBFQmDBp-7iUHcUkmrYjlOtRVwxhlGZCzL4RLKKNW/exec";
const FOUNDER_USERNAME = "kausar.af";

const SESSION_KEY = "MR_UNDANGAN_SESSION";
const SESSION_TOKEN_KEY = "MR_UNDANGAN_SESSION_TOKEN";
const DISPLAY_NAME_KEY = "MR_UNDANGAN_DISPLAY_NAME";
const APP_THEME_KEY = "MR_UNDANGAN_APP_THEME";
const APP_MODE_KEY = "MR_APP_MODE"; // 'lembarku' | 'titik_gowes'
const GOWES_BRANCH_KEY = "GOWES_ACTIVE_BRANCH_ID";
const PWA_REMIND_KEY = "MR_PWA_REMIND_TS";
const LOGIN_REMIND_KEY = "MR_LOGIN_REMIND_TS";
const DRAFT_INV_KEY = "MR_DRAFT_INV";
const DRAFT_PF_KEY = "MR_DRAFT_PF";
const GUEST_CHAT_KEY = "MR_GUEST_CHAT_ID";
const APP_DEVICE_ID_KEY = "LBK_PWA_DEVICE_ID";
const APP_INSTALLED_REPORTED_KEY = "LBK_PWA_STATUS_REPORTED";
const NOTIF_READ_TS_KEY = "LBK_NOTIF_LAST_READ_TS";

const DEFAULT_PRIVACY = {
    showProjects: true,
    showFollowers: true,
    showFollowing: true,
    showUsername: true,
    allowSearchDiscovery: true,
    showOnlineStatus: true,
    showContact: false,
    showInChatContacts: true,
    allowDirectChat: true
};

const DEFAULT_AVATAR = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#1e293b"/><circle cx="60" cy="44" r="22" fill="#94a3b8"/><path d="M22 110c4-24 22-36 38-36s34 12 38 36" fill="#94a3b8"/></svg>`
);

const LEMBARKU_LOGO_PATH = "./lembarku-logo.png";
const GOWES_LOGO_PATH = "./titik-gowes-logo.png";
const GOWES_LOGO_FALLBACK = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%"><circle cx="256" cy="220" r="160" fill="none" stroke="#000000" stroke-width="26"/><path d="M120 280 L256 460 L392 280" fill="none" stroke="#000000" stroke-width="26" stroke-linejoin="round"/><circle cx="180" cy="240" r="46" fill="none" stroke="#000000" stroke-width="18"/><circle cx="332" cy="240" r="46" fill="none" stroke="#000000" stroke-width="18"/><path d="M180 240 L235 240 L280 160 L215 160 Z" fill="none" stroke="#000000" stroke-width="18" stroke-linejoin="round"/><path d="M235 240 L210 120 M332 240 L280 160 L270 125 L300 125" fill="none" stroke="#000000" stroke-width="18" stroke-linecap="round"/><circle cx="256" cy="380" r="18" fill="#000000"/></svg>`
);

const DEFAULT_WA_TEMPLATE =
`Kepada Yth. *[NAMA_TAMU]*,

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara *[JUDUL]*.

Info lengkap, peta lokasi & RSVP:
[LINK]

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

_[BRAND_FOOTER]_`;

const IMG = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=75`;

const BANK_LOGOS = {
    BCA: { bg: "#0060af", text: "#ffffff", label: "BCA" },
    BRI: { bg: "#00529c", text: "#ffffff", label: "BRI" },
    BNI: { bg: "#f15a23", text: "#ffffff", label: "BNI" },
    Mandiri: { bg: "#003d79", text: "#facc15", label: "MANDIRI" },
    BSI: { bg: "#00a39d", text: "#ffffff", label: "BSI" },
    DANA: { bg: "#118eea", text: "#ffffff", label: "DANA" },
    OVO: { bg: "#4c3494", text: "#ffffff", label: "OVO" },
    GoPay: { bg: "#00aed6", text: "#ffffff", label: "GOPAY" },
    ShopeePay: { bg: "#ee4d2d", text: "#ffffff", label: "SHOPEEPAY" },
    SeaBank: { bg: "#ff6600", text: "#ffffff", label: "SEABANK" }
};

// ================= ORNAMEN SVG UNDANGAN =================
const SVG_LEAF_SHADOW = `<svg viewBox="0 0 240 260" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M210 10C150 40 105 90 78 160c-12 30-20 62-25 90 15-20 35-42 58-58 45-32 82-78 99-182z" opacity="0.55"/><path d="M180 45C130 62 80 108 55 170c22-18 52-35 84-55 28-18 42-42 41-70z" opacity="0.35"/></svg>`;
const SVG_BATIK_SHADOW = `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="btkPat" width="44" height="44" patternUnits="userSpaceOnUse"><circle cx="22" cy="22" r="16" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.4"/><circle cx="22" cy="22" r="5" fill="currentColor" opacity="0.35"/><path d="M0 22h44M22 0v44" stroke="currentColor" stroke-width="0.6" opacity="0.2"/></pattern></defs><rect width="100%" height="100%" fill="url(#btkPat)"/></svg>`;
const SVG_ROSES_MONO = `<svg viewBox="0 0 430 70" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-14 opacity-50"><path d="M0 0h430v12c-70 28-140 42-215 42S70 40 0 12V0z" fill="rgba(255,255,255,0.12)"/><circle cx="215" cy="24" r="14" stroke="#fff" stroke-width="1.2" opacity="0.7"/><circle cx="180" cy="18" r="9" stroke="#fff" stroke-width="1" opacity="0.5"/><circle cx="250" cy="18" r="9" stroke="#fff" stroke-width="1" opacity="0.5"/></svg>`;
const SVG_GUNUNGAN_JAWA = `<svg viewBox="0 0 120 120" class="w-16 h-16 mx-auto text-amber-300" fill="currentColor"><path d="M60 6L18 96h84L60 6zm0 18l27 58H33l27-58z" opacity="0.9"/><rect x="56" y="88" width="8" height="24" rx="2"/></svg>`;
const SVG_RUMAH_SULAWESI = `<svg viewBox="0 0 140 70" class="w-20 h-10 mx-auto text-yellow-300" fill="currentColor"><path d="M10 38L70 8l60 30-14 4-46-22-46 22-14-4z"/><rect x="34" y="42" width="72" height="20" rx="2" opacity="0.85"/></svg>`;

// ================= VISUAL PRESETS UNDANGAN =================
const VISUAL_PRESETS = {
    "maroon-gold": {
        vars: { "--th-bg":"#5c0a12","--th-card-bg":"rgba(74,8,15,0.82)","--th-card-border":"1px solid rgba(243,210,133,0.38)","--th-card-radius":"1.5rem","--th-backdrop":"blur(8px)","--th-shadow":"0 16px 38px rgba(0,0,0,0.45)","--th-text":"#fdf6ec","--th-accent":"#f3d285","--th-btn-bg":"linear-gradient(90deg,#f3d285,#d4af37)","--th-btn-text":"#1f0a0c","--th-btn-radius":"9999px","--th-font-heading":"'Great Vibes',cursive","--th-font-body":"'Plus Jakarta Sans',sans-serif" },
        coverOverlay: "linear-gradient(180deg,rgba(45,4,8,0.45) 0%,rgba(92,10,18,0.88) 100%)", ambient: "batik"
    },
    "premium-black": {
        vars: { "--th-bg":"#070709","--th-card-bg":"rgba(20,20,24,0.88)","--th-card-border":"1px solid rgba(255,255,255,0.18)","--th-card-radius":"1.5rem","--th-backdrop":"blur(10px)","--th-shadow":"0 18px 42px rgba(0,0,0,0.65)","--th-text":"#f4f4f5","--th-accent":"#ffffff","--th-btn-bg":"#ffffff","--th-btn-text":"#09090b","--th-btn-radius":"9999px","--th-font-heading":"'Great Vibes',cursive","--th-font-body":"'Plus Jakarta Sans',sans-serif" },
        coverOverlay: "linear-gradient(180deg,rgba(0,0,0,0.38) 0%,rgba(7,7,9,0.92) 100%)", ambient: "leaf"
    },
    "dark-gold": {
        vars: { "--th-bg":"#0f1117","--th-card-bg":"rgba(24,27,36,0.88)","--th-card-border":"1px solid rgba(234,179,8,0.35)","--th-card-radius":"1.5rem","--th-backdrop":"blur(8px)","--th-shadow":"0 16px 36px rgba(0,0,0,0.5)","--th-text":"#f8fafc","--th-accent":"#eab308","--th-btn-bg":"linear-gradient(90deg,#f0d58c,#d4af37)","--th-btn-text":"#111827","--th-btn-radius":"9999px","--th-font-heading":"'Playfair Display',serif","--th-font-body":"'Plus Jakarta Sans',sans-serif" },
        coverOverlay: "linear-gradient(180deg,rgba(10,12,18,0.35) 0%,rgba(15,17,23,0.9) 100%)", ambient: "batik"
    },
    "emerald-gold": {
        vars: { "--th-bg":"#04362a","--th-card-bg":"rgba(7,71,56,0.86)","--th-card-border":"1px solid rgba(250,204,21,0.38)","--th-card-radius":"1.5rem","--th-backdrop":"blur(8px)","--th-shadow":"0 16px 36px rgba(0,0,0,0.45)","--th-text":"#ecfdf5","--th-accent":"#facc15","--th-btn-bg":"linear-gradient(90deg,#fde047,#eab308)","--th-btn-text":"#052e16","--th-btn-radius":"9999px","--th-font-heading":"'Cormorant Garamond',serif","--th-font-body":"'Plus Jakarta Sans',sans-serif" },
        coverOverlay: "linear-gradient(180deg,rgba(4,40,30,0.4) 0%,rgba(4,54,42,0.9) 100%)", ambient: "leaf"
    },
    "ivory-sage": {
        vars: { "--th-bg":"#f7f4ef","--th-card-bg":"rgba(255,255,255,0.92)","--th-card-border":"1px solid rgba(140,118,88,0.28)","--th-card-radius":"1.5rem","--th-backdrop":"blur(6px)","--th-shadow":"0 12px 30px rgba(0,0,0,0.08)","--th-text":"#3b352f","--th-accent":"#8c7658","--th-btn-bg":"linear-gradient(90deg,#8c7658,#6b583e)","--th-btn-text":"#ffffff","--th-btn-radius":"9999px","--th-font-heading":"'Playfair Display',serif","--th-font-body":"'Plus Jakarta Sans',sans-serif" },
        coverOverlay: "linear-gradient(180deg,rgba(0,0,0,0.25) 0%,rgba(59,53,47,0.82) 100%)", extra: "linen-pattern", ambient: "leaf"
    },
    "navy-silver": {
        vars: { "--th-bg":"#172433","--th-card-bg":"rgba(31,49,70,0.88)","--th-card-border":"1px solid rgba(191,219,254,0.32)","--th-card-radius":"1.5rem","--th-backdrop":"blur(8px)","--th-shadow":"0 16px 36px rgba(0,0,0,0.48)","--th-text":"#f1f5f9","--th-accent":"#bfdbfe","--th-btn-bg":"linear-gradient(90deg,#93c5fd,#3b82f6)","--th-btn-text":"#0f172a","--th-btn-radius":"9999px","--th-font-heading":"'Cormorant Garamond',serif","--th-font-body":"'Plus Jakarta Sans',sans-serif" },
        coverOverlay: "linear-gradient(180deg,rgba(15,23,42,0.35) 0%,rgba(23,36,51,0.9) 100%)", ambient: "leaf"
    },
    "pastel-pink": {
        vars: { "--th-bg":"#fff1f2","--th-card-bg":"rgba(255,255,255,0.94)","--th-card-border":"1px solid rgba(244,114,182,0.35)","--th-card-radius":"1.6rem","--th-backdrop":"blur(6px)","--th-shadow":"0 12px 28px rgba(244,114,182,0.16)","--th-text":"#3f2a30","--th-accent":"#db2777","--th-btn-bg":"linear-gradient(90deg,#f472b6,#db2777)","--th-btn-text":"#ffffff","--th-btn-radius":"9999px","--th-font-heading":"'Fredoka',sans-serif","--th-font-body":"'Plus Jakarta Sans',sans-serif" },
        coverOverlay: "linear-gradient(180deg,rgba(0,0,0,0.22) 0%,rgba(131,24,67,0.78) 100%)", ambient: "leaf"
    }
};

// ================= KATALOG 5 KATEGORI UNDANGAN =================
const THEME_CATALOG = {
    "Pernikahan": [
        { name:"Adat Kalimantan", preset:"maroon-gold", style:"kalimantan_story", ornament:"batik", price:99000, origPrice:175000, badge:"TERLARIS", img:IMG("1519741497674-611481863552") },
        { name:"Premium Black Mono", preset:"premium-black", style:"premium_black", ornament:"floral_mono", photoFilter:"mono", price:109000, origPrice:185000, badge:"VIP", img:IMG("1511285560929-80b456fea0bc") },
        { name:"Adat Jawa Klasik", preset:"dark-gold", style:"jawa", ornament:"jawa", coupleMode:"combined", price:99000, origPrice:175000, badge:"BARU", img:IMG("1515934751635-c81c6bc9a2d8") },
        { name:"Adat Sulawesi Emas", preset:"emerald-gold", style:"sulawesi", ornament:"sulawesi", price:99000, origPrice:165000, img:IMG("1522673607200-164d1b6ce486") },
        { name:"Ivory Sage Minimalis", preset:"ivory-sage", style:"editorial", ornament:"leaf", price:89000, origPrice:150000, badge:"PROMO", img:IMG("1520854221256-17451cc331bf") },
        { name:"Royal Navy Silver", preset:"navy-silver", style:"kalimantan_story", ornament:"leaf", price:95000, origPrice:160000, img:IMG("1519225421980-715cb0215aed") },
        { name:"Batik Keraton Gold", preset:"dark-gold", style:"batik", ornament:"batik", coupleMode:"combined", price:99000, origPrice:170000, img:IMG("1532712938310-34cb3982ef74") }
    ],
    "Ulang Tahun": [
        { name:"Sweet Pastel Party", preset:"pastel-pink", style:"classic_card", ornament:"leaf", price:59000, origPrice:99000, badge:"TERLARIS", img:IMG("1530103862676-de8c9debad1d") },
        { name:"Golden Sweet 17th", preset:"dark-gold", style:"classic_card", ornament:"none", price:69000, origPrice:120000, badge:"VIP", img:IMG("1464349095431-e9a21285b5f3") },
        { name:"Kids Rainbow Fun", preset:"pastel-pink", style:"classic_card", ornament:"leaf", price:55000, origPrice:95000, img:IMG("1558636508-e0db3814bd1d") }
    ],
    "Aqiqah": [
        { name:"Aqiqah Sage Islami", preset:"ivory-sage", style:"classic_card", ornament:"islami", faith:"islami", price:59000, origPrice:99000, badge:"TERLARIS", img:IMG("1519689680058-324335c77eba") },
        { name:"Aqiqah Emerald Gold", preset:"emerald-gold", style:"classic_card", ornament:"islami", faith:"islami", price:65000, origPrice:110000, img:IMG("1544126592-807ade215a0b") }
    ],
    "Syukuran": [
        { name:"Walimatul Khitan", preset:"emerald-gold", style:"classic_card", ornament:"islami", faith:"islami", isKhitan:true, price:59000, origPrice:99000, badge:"BARU", img:IMG("1513151233558-d860c5398176") },
        { name:"Syukuran Rumah Baru", preset:"ivory-sage", style:"classic_card", ornament:"leaf", faith:"islami", price:55000, origPrice:95000, img:IMG("1560518883-ce09059eeffa") },
        { name:"Syukuran Umum / Doa", preset:"navy-silver", style:"classic_card", ornament:"none", faith:"kristen", price:55000, origPrice:95000, img:IMG("1511795409834-ef04bbd61622") }
    ],
    "Lainnya": [
        { name:"Undangan Rapat & Event", preset:"navy-silver", style:"classic_card", ornament:"none", price:49000, origPrice:89000, demoTitle:"Rapat Koordinasi Tahunan", demoSub:"Pertemuan & Silaturahmi", demoOrg:"Panitia Pelaksana", img:IMG("1505373877841-8d25f7d46678") },
        { name:"Grand Opening Usaha", preset:"dark-gold", style:"classic_card", ornament:"none", price:59000, origPrice:99000, badge:"PROMO", demoTitle:"Grand Opening Store", demoSub:"Peresmian & Ramah Tamah", demoOrg:"Manajemen", img:IMG("1540575467063-178a50c2df87") }
    ]
};

// ================= KATALOG PORTOFOLIO (9 TEMA CV + 3 SURAT LAMARAN) =================
const PORTFOLIO_CATALOG = {
    cv: [
        { id:"cv_emerald", name:"Emerald Fresh", tag:"2 Kolom Modern", accent:"#1b7a49", price:20000, origPrice:40000, badge:"TERLARIS" },
        { id:"cv_charcoal", name:"Charcoal Timeline", tag:"Timeline Vertikal", accent:"#3f3f42", price:22000, origPrice:45000, badge:"BARU" },
        { id:"cv_peach", name:"Pastel Peach Gen-Z", tag:"Estetik & Kreatif", accent:"#e29d93", price:19000, origPrice:38000 },
        { id:"cv_navy", name:"Deep Navy Corporate", tag:"Profesional Kantor", accent:"#131c4e", price:25000, origPrice:50000, badge:"VIP" },
        { id:"cv_royal", name:"Royal Blue Executive", tag:"Korporat Tanpa Foto", accent:"#295594", price:25000, origPrice:50000 },
        { id:"cv_teal", name:"Ocean Teal Formal", tag:"Tabel & Data Lengkap", accent:"#0e5f82", price:22000, origPrice:45000 },
        { id:"cv_slate", name:"Slate Fresh Grad", tag:"Lulusan Baru Rapi", accent:"#24414d", price:18000, origPrice:35000, badge:"PROMO" },
        { id:"cv_clean", name:"Clean Minimalist", tag:"Putih Bersih Elegan", accent:"#18181b", price:18000, origPrice:35000 },
        { id:"cv_ats", name:"ATS Classic Pro", tag:"1 Kolom Standar HRD", accent:"#111827", price:25000, origPrice:55000, badge:"TERLARIS" }
    ],
    lamaran: [
        { id:"lam_formal", name:"Surat Lamaran Formal", tag:"Standar BUMN & PT", accent:"#18181b", price:15000, origPrice:30000, badge:"TERLARIS" },
        { id:"lam_modern", name:"Lamaran Modern Navy", tag:"Elegan & Tegas", accent:"#0f4c81", price:18000, origPrice:35000 },
        { id:"lam_fresh", name:"Lamaran Fresh Grad", tag:"Lulusan Baru & Magang", accent:"#065f46", price:15000, origPrice:30000, badge:"PROMO" }
    ]
};

// ================= ETALASE 3: 6 DESAIN SERTIFIKAT PROFESIONAL =================
const CERT_SHOWCASE = [
    {
        id: "cert_formal_qr",
        orientation: "portrait",
        styleVariant: "navy_ornament_qr",
        cat: "Pelatihan Kompetensi",
        code: "No: 2026110845A2",
        title: "Sertifikat",
        course: "Program Pelatihan Komputer Perkantoran & Presentasi Profesional",
        holder: "Rendra Mahendra",
        org: "Balai Pengembangan Kompetensi Mandiri",
        signer: "Drs. Hendra Wijaya, M.M.",
        role: "Pimpinan Penyelenggara",
        bg: "#ffffff",
        accent: "#16324f"
    },
    {
        id: "cert_gold_mandala",
        orientation: "landscape",
        styleVariant: "champagne_mandala",
        cat: "Tata Rambut & Kecantikan",
        code: "ID: 77492018",
        title: "Certificate of Completion",
        course: "Modern Hair Styling & Coloring Masterclass",
        holder: "Nadia Putri Larasati",
        org: "Aurelia Hair & Beauty Academy",
        signer: "Clara Amanda",
        role: "Lead Instructor",
        bg: "linear-gradient(135deg, #fdfbf7 0%, #ead8b1 100%)",
        accent: "#78350f"
    },
    {
        id: "cert_rose_aesthetic",
        orientation: "landscape",
        styleVariant: "rose_gold_glitter",
        cat: "Estetika & Studio",
        code: "ID: 50419283",
        title: "Certificate of Achievement",
        course: "Eyelash Extension & Brow Styling Course",
        holder: "Sabrina Maharani",
        org: "Lumina Esthetic Studio",
        signer: "Keisha Anindita",
        role: "Senior Trainer",
        bg: "linear-gradient(135deg, #fffafa 0%, #f5e6e8 100%)",
        accent: "#831843"
    },
    {
        id: "cert_navy_ribbon",
        orientation: "landscape",
        styleVariant: "geometric_ribbon",
        cat: "Pelatihan Operasional",
        code: "Reg No. 373/DDT-LV/XI/2026",
        title: "CERTIFICATE",
        course: "Defensive Driving Training (DDT) — Light Vehicle",
        holder: "Dimas Saputra",
        org: "Cakrawala Safety Academy",
        signer: "Bagus Prakoso",
        role: "Training & Development Manager",
        bg: "#ffffff",
        accent: "#0f294a"
    },
    {
        id: "cert_wave_seal",
        orientation: "landscape",
        styleVariant: "wave_round_seal",
        cat: "Keselamatan Kerja",
        code: "No: 029/BST-XI/2026",
        title: "CERTIFICATE OF APPRECIATION",
        course: "Pembekalan Basic Safety Training (BST) & Identifikasi Bahaya",
        holder: "Aulia Rahmawati",
        org: "Sentra Diklat Keselamatan",
        signer: "Fajar Nugroho, S.T.",
        role: "Direktur Pelatihan",
        bg: "#ffffff",
        accent: "#0f4c5c"
    },
    {
        id: "cert_firstaid_modern",
        orientation: "landscape",
        styleVariant: "blue_angle_dual",
        cat: "Pertolongan Pertama",
        code: "Certificate ID: 3407976309",
        title: "FIRST AID TRAINING CERTIFICATE",
        course: "Save-a-Life Emergency & Basic First Aid",
        holder: "Bima Sakti Pratama",
        org: "Medika Tanggap Center",
        signer: "dr. Ratna Kusuma",
        role: "Koordinator Medis",
        bg: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
        accent: "#1d4ed8"
    }
];

// ================= KATALOG BAWAAN TITIK GOWES =================
const DEFAULT_GOWES_SHELTERS = [
    {
        id: "sh_smd_1",
        city: "Samarinda",
        name: "Titik Gowes Shelter Utama — Samarinda",
        address: "Jl. Mulawarman No. 88, Samarinda (Dekat Taman Kota)",
        mapsUrl: "https://maps.google.com/?q=-0.502,117.153",
        mapsQuery: "-0.502,117.153",
        operationalHours: "Setiap Hari: 05.30 - 20.00 WITA",
        csPhone: "085117488828",
        isClosed: false,
        closedReason: "Garasi Titik Gowes Samarinda sedang istirahat / tutup sementara. Kami siap melayani kembali besok pukul 05.30 WITA."
    },
    {
        id: "sh_sanga_1",
        city: "Sanga-Sanga",
        name: "Titik Gowes Cabang Sanga-Sanga",
        address: "Jl. Jenderal Sudirman No. 12, Sanga-Sanga, Kutai Kartanegara",
        mapsUrl: "https://maps.google.com/?q=-0.598,117.268",
        mapsQuery: "-0.598,117.268",
        operationalHours: "Setiap Hari: 06.00 - 19.30 WITA",
        csPhone: "085117488828",
        isClosed: false,
        closedReason: "Garasi Titik Gowes Sanga-Sanga sedang istirahat sementara. Buka kembali besok pukul 06.00 WITA."
    },
    {
        id: "sh_mj_1",
        city: "Muara Jawa",
        name: "Titik Gowes Cabang Muara Jawa",
        address: "Jl. Ahmad Yani No. 45, Muara Jawa Pesisir, Kutai Kartanegara",
        mapsUrl: "https://maps.google.com/?q=-0.817,117.234",
        mapsQuery: "-0.817,117.234",
        operationalHours: "Setiap Hari: 06.00 - 19.00 WITA",
        csPhone: "085117488828",
        isClosed: false,
        closedReason: "Garasi Titik Gowes Muara Jawa sedang tutup sementara. Buka kembali besok pagi."
    }
];

const DEFAULT_GOWES_SHELTER = DEFAULT_GOWES_SHELTERS[0];

// 5 SLIDE BANNER PROMOSI RAMPING 16:5
const DEFAULT_GOWES_BANNERS = [
    {
        id: "gb_1",
        badge: "TITIK GOWES OFFICIAL",
        title: "SEHAT & BAHAGIA DENGAN BERSEPEDA!",
        subtitle: "RASAKAN MANFAATNYA! Sewa unit prima & jelajahi rute favoritmu hari ini.",
        ctaText: "",
        targetSection: "gowes-showcase-track",
        img: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=1200&q=80"
    },
    {
        id: "gb_2",
        badge: "GOWES BARENG KOMUNITAS",
        title: "ENERGI PAGI, STAMINA MAKSIMAL!",
        subtitle: "Gratis Helm SNI, Kunci Spiral & Lampu di setiap peminjaman unit.",
        ctaText: "",
        targetSection: "open_booking",
        img: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80"
    },
    {
        id: "gb_3",
        badge: "RENTAL PRAKTIS QRIS",
        title: "BOOKING CEPAT TANPA RIBET!",
        subtitle: "Pilih durasi fleksibel, konfirmasi instan & ambil di gerai terdekat.",
        ctaText: "",
        targetSection: "sec-gowes-shelter",
        img: "https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?auto=format&fit=crop&w=1200&q=80"
    },
    {
        id: "gb_4",
        badge: "ARMADA TERAWAT",
        title: "SIAP TAKLUKKAN SETIAP RUTE!",
        subtitle: "MTB, Roadbike & Sepeda Lipat rutin diservis mekanik profesional.",
        ctaText: "",
        targetSection: "gowes-showcase-track",
        img: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=1200&q=80"
    },
    {
        id: "gb_5",
        badge: "SUNSET RIDE",
        title: "NIKMATI SORE SANTAI BERSEPEDA!",
        subtitle: "Tersedia di Samarinda, Sanga-Sanga & Muara Jawa. Cek peta gerai sekarang.",
        ctaText: "",
        targetSection: "sec-gowes-shelter",
        img: "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=1200&q=80"
    }
];

const DEFAULT_GOWES_CATEGORIES = [
    { id: "all", name: "Semua Unit", active: true },
    { id: "MTB (Gunung)", name: "MTB (Gunung)", active: true },
    { id: "Roadbike (Balap)", name: "Roadbike (Balap)", active: true },
    { id: "Sepeda Lipat (Folding)", name: "Sepeda Lipat", active: true },
    { id: "Fixie", name: "Fixie", active: true },
    { id: "Touring", name: "Touring / Gravel", active: true }
];

const DEFAULT_GOWES_BIKES = [
    {
        id: "bike_1",
        branchId: "all",
        name: "Polygon Xtrada 6",
        type: "MTB (Gunung)",
        frameSize: "M (165-175 cm)",
        gears: "1x11 Speed Shimano Deore",
        brakes: "Hydraulic Disc Brake Shimano",
        label2Hours: "2 Jam",
        label6Hours: "6 Jam",
        labelFullDay: "Full Day",
        price2Hours: 40000,
        price6Hours: 75000,
        priceFullDay: 120000,
        lateFeePerHour: 15000,
        status: "Tersedia",
        description: "Suspensi empuk air fork, rem hidrolik pakem, sangat tangguh untuk rute aspal maupun tanah berkerikil.",
        freeAccessories: ["Helm Sepeda", "Kunci Gembok Spiral", "Lampu Malam Depan/Belakang"],
        image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75",
        totalRentedCount: 28,
        createdAt: 1700000000000
    },
    {
        id: "bike_2",
        branchId: "all",
        name: "United Milano Roadbike",
        type: "Roadbike (Balap)",
        frameSize: "S/M (160-172 cm)",
        gears: "2x9 Speed Shimano Sora",
        brakes: "Caliper Dual-Pivot Rim Brake",
        label2Hours: "2 Jam",
        label6Hours: "6 Jam",
        labelFullDay: "Full Day",
        price2Hours: 50000,
        price6Hours: 95000,
        priceFullDay: 150000,
        lateFeePerHour: 20000,
        status: "Tersedia",
        description: "Bobot alloy super ringan, posisi aerodinamis mantap untuk latihan kecepatan dan endurance keliling kota.",
        freeAccessories: ["Helm Aero", "Pompa Mini Portabel", "Bottle Cage"],
        image: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=75",
        totalRentedCount: 42,
        createdAt: 1700000000001
    },
    {
        id: "bike_3",
        branchId: "all",
        name: "Pacific Noris Pro Lipat",
        type: "Sepeda Lipat (Folding)",
        frameSize: "All Size (Adjustable)",
        gears: "8 Speed Shimano Tourney",
        brakes: "Mechanical Disc Brake",
        label2Hours: "2 Jam",
        label6Hours: "6 Jam",
        labelFullDay: "Full Day",
        price2Hours: 35000,
        price6Hours: 60000,
        priceFullDay: 90000,
        lateFeePerHour: 12000,
        status: "Tersedia",
        description: "Sangat ringkas dan elegan, mudah dilipat ke bagasi mobil, cocok untuk Car Free Day santai keluarga.",
        freeAccessories: ["Helm Casual", "Tas Stang Depan", "Kunci Gembok"],
        image: "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=800&q=75",
        totalRentedCount: 56,
        createdAt: 1700000000002
    },
    {
        id: "bike_4",
        branchId: "all",
        name: "Thrill Fervent T120",
        type: "MTB (Gunung)",
        frameSize: "L (175-185 cm)",
        gears: "1x12 Speed SRAM SX Eagle",
        brakes: "Hydraulic Disc Brake",
        label2Hours: "2 Jam",
        label6Hours: "6 Jam",
        labelFullDay: "Full Day",
        price2Hours: 45000,
        price6Hours: 85000,
        priceFullDay: 135000,
        lateFeePerHour: 15000,
        status: "Tersedia",
        description: "Full suspension (dual suspension) empuk, sangat stabil meredam getaran jalan berlubang atau tanjakan curam.",
        freeAccessories: ["Helm Trail", "Kunci Spiral", "Lampu Malam"],
        image: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=800&q=75",
        totalRentedCount: 19,
        createdAt: 1700000000003
    }
];

// ================= STATE GLOBAL & FALLBACK DB =================
function getLocalFallbackDB() {
    return {
        users: [],
        invitations: [],
        portfolios: [],
        chats: [],
        adminLogs: [],
        customThemes: [],
        hiddenThemes: [],
        themeOverrides: {},
        cvPriceOverrides: {},
        musicLibrary: [],
        gowesBikes: [...DEFAULT_GOWES_BIKES],
        gowesRentals: [],
        gowesUpcomingBookings: [],
        gowesShelters: DEFAULT_GOWES_SHELTERS.map(s => Object.assign({}, s)),
        gowesShelter: Object.assign({}, DEFAULT_GOWES_SHELTER),
        gowesBanners: [...DEFAULT_GOWES_BANNERS],
        gowesCategories: [...DEFAULT_GOWES_CATEGORIES],
        gowesAnalytics: null,
        appStats: {
            activeInstalled: 0,
            totalInstalled: 0,
            totalUninstalled: 0,
            history: []
        },
        testimonials: [
            { id: 1, name: "Rina & Dimas", category: "Undangan Pernikahan", rating: 5, text: "Undangan Adat Kalimantannya mewah banget, tamu-tamu pada puji animasi buka kertasnya!" },
            { id: 2, name: "Fajar Pratama", category: "CV & Lamaran PDF", rating: 5, text: "Fitur Sempurnakan + Auto-Scan KTP & Ijazah jadi 1 PDF di bawah 2 MB bikin lamaran saya langsung dipanggil HRD." }
        ],
        promoBanners: [
            { id: 1, badge: "PROMO SPESIAL", title: "Undangan Digital, CV & Lamaran Siap PDF", subtitle: "Pilih Desain → Isi Data & Konfirmasi → Bagikan / Unduh PDF langsung dari HP.", ctaText: "Lihat Desain", targetType: "section", targetSection: "sec-undangan", img: IMG("1519741497674-611481863552") },
            { id: 2, badge: "SIAP KERJA", title: "9 Desain CV Modern + Auto-Scan PDF", subtitle: "Gabungkan CV, Surat Lamaran, KTP & Ijazah dalam 1 file PDF bersih seperti scanner.", ctaText: "Pilih Tema CV", targetType: "section", targetSection: "sec-portofolio", img: IMG("1586281380349-632531db7ed4") },
            { id: 3, badge: "SEGERA HADIR", title: "Desain Sertifikat: Sekali Buat, Nama Otomatis Berbeda", subtitle: "Input nama pemegang sertifikat seperti daftar tamu undangan, lalu bagikan dengan hasil berbeda-beda.", ctaText: "Lihat Contoh", targetType: "section", targetSection: "sec-sertifikat", img: IMG("1523240795612-9a054b0db644") }
        ],
        masterSettings: {
            qrisMode: "static",
            qrisImage: "",
            qrisDynamicString: "",
            qrisUniqueCode: true,
            priceText: "Rp 99.000",
            banks: [{ bank: "DANA", no: "085117488828", holder: "Lembarku" }]
        }
    };
}

let db = getLocalFallbackDB();
let currentAppMode = localStorage.getItem(APP_MODE_KEY) || "lembarku";
let currentSessionUser = localStorage.getItem(SESSION_KEY) || null;
if (currentSessionUser && String(currentSessionUser).trim().toLowerCase() === "master") {
    currentSessionUser = FOUNDER_USERNAME;
    localStorage.setItem(SESSION_KEY, FOUNDER_USERNAME);
}
let currentSessionToken = localStorage.getItem(SESSION_TOKEN_KEY) || "";
let guestChatId = localStorage.getItem(GUEST_CHAT_KEY);
if (!guestChatId) {
    guestChatId = "tamu_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(GUEST_CHAT_KEY, guestChatId);
}
let currentViewName = "landing";
let currentMasterWorkspace = "overview";
let activeMasterChatThread = null;
let previewOpenCount = 0;
let clientPortalState = { active: false, invId: null, key: "", brandName: "", invitation: null };

// ================= UTILITAS UMUM =================
const esc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, " ");
const escHtml = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slugify = (s) => String(s || "berkas").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "berkas";
const fmtRp = (n) => "Rp " + Math.round(Number(n) || 0).toLocaleString("id-ID");
const fmtBytes = (b) => {
    const n = Number(b) || 0;
    if (n <= 0) return "0 MB";
    if (n >= 1073741824) return (n / 1073741824).toFixed(2) + " GB";
    if (n >= 1048576) return (n / 1048576).toFixed(1) + " MB";
    return Math.max(1, Math.round(n / 1024)) + " KB";
};
const getCleanBaseUrl = () => {
    const cleanPath = (window.location.pathname || "/").replace(/\/index\.html$/i, "/");
    return window.location.origin + (cleanPath.endsWith("/") ? cleanPath : cleanPath + "/");
};
const imgFbAttr = (fb) => `onerror="if(this.dataset.fb&&this.src!==this.dataset.fb){this.src=this.dataset.fb;this.dataset.fb='';}" data-fb="${esc(fb || IMG("1519741497674-611481863552"))}"`;

function getDeterministicUniqueCode(docId) {
    const num = Math.abs(parseInt(String(docId || "100").replace(/\D/g, ""), 10) || 100);
    return (num % 899) + 101;
}

const _loadedScripts = {};
function loadScriptOnce(url) {
    if (_loadedScripts[url]) return _loadedScripts[url];
    _loadedScripts[url] = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = url; s.async = true;
        s.onload = () => resolve(true);
        s.onerror = () => {
            delete _loadedScripts[url];
            reject(new Error("Gagal memuat " + url));
        };
        document.head.appendChild(s);
    });
    return _loadedScripts[url];
}

// ================= UI FEEDBACK: LOADING, TOAST, CONFIRM, SPLASH, TEMA =================
let _toastTimer = null;
function showLoading(txt = "Memproses...") {
    const bar = document.getElementById("global-loading-bar"), el = document.getElementById("global-loading-text");
    if (el) el.innerText = txt;
    if (bar) bar.classList.remove("hide");
}
function hideLoading() { document.getElementById("global-loading-bar")?.classList.add("hide"); }

function showToast(msg, type = "success") {
    const el = document.getElementById("app-toast"), txt = document.getElementById("app-toast-msg"), ic = document.getElementById("app-toast-icon");
    if (!el || !txt) return;
    txt.innerText = msg;
    if (ic) {
        ic.className = type === "error"
            ? "fa-solid fa-circle-exclamation text-red-500 text-base"
            : type === "info"
                ? "fa-solid fa-circle-info app-accent text-base"
                : "fa-solid fa-circle-check text-emerald-500 text-base";
    }
    el.classList.remove("hide");
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.add("hide"), 3200);
}

function showConfirm(title, msg, icon = "fa-solid fa-circle-question", okText = "Ya, Lanjutkan") {
    return new Promise((resolve) => {
        const m = document.getElementById("app-confirm-modal"); if (!m) return resolve(confirm(msg));
        document.getElementById("app-confirm-title").innerText = title || "Konfirmasi";
        document.getElementById("app-confirm-msg").innerText = msg || "";
        document.getElementById("app-confirm-icon").className = icon;
        const okBtn = document.getElementById("app-confirm-ok"), canBtn = document.getElementById("app-confirm-cancel");
        okBtn.innerText = okText;
        const done = (val) => { m.classList.add("hide"); resolve(val); };
        okBtn.onclick = () => done(true);
        canBtn.onclick = () => done(false);
        m.classList.remove("hide");
    });
}

function setBtnLoading(btnOrId, isLoading, text = "Memproses...") {
    const el = typeof btnOrId === "string" ? document.getElementById(btnOrId) : btnOrId;
    if (!el) return;
    if (isLoading) {
        if (!el.dataset.origHtml) el.dataset.origHtml = el.innerHTML;
        el.disabled = true;
        el.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-1"></i>${text}`;
    } else {
        el.disabled = false;
        if (el.dataset.origHtml) { el.innerHTML = el.dataset.origHtml; delete el.dataset.origHtml; }
    }
}

function togglePassVis(id, btn) {
    const inp = document.getElementById(id); if (!inp) return;
    const isP = inp.type === "password";
    inp.type = isP ? "text" : "password";
    if (btn) btn.innerHTML = `<i class="fa-regular fa-${isP ? "eye-slash" : "eye"}"></i>`;
}

function hideHelloSplash() {
    const sp = document.getElementById("ios-hello-splash");
    if (!sp || sp.classList.contains("hide")) return;
    sp.classList.add("splash-out");
    setTimeout(() => sp.classList.add("hide"), 520);
}
function showEnvelopeLoader(txt = "Membuka Undangan...") {
    const el = document.getElementById("envelope-loader"), t = document.getElementById("envelope-loader-text");
    if (t) t.innerText = txt;
    if (el) el.classList.remove("hide");
}
function hideEnvelopeLoader() { document.getElementById("envelope-loader")?.classList.add("hide"); }

function applyAppTheme(theme, save = true) {
    const valid = ["light", "dark", "gold", "blue", "black", "orange"];
    const t = valid.includes(theme) ? theme : "light";
    document.documentElement.setAttribute("data-app-theme", t);
    if (save) localStorage.setItem(APP_THEME_KEY, t);
    document.querySelectorAll(".theme-opt-row").forEach(row => {
        const chk = row.querySelector(".theme-chk");
        if (chk) chk.classList.toggle("hide", row.dataset.topt !== t);
    });
}
function cycleAppThemeQuick() {
    const order = ["light", "dark", "gold", "blue", "black", "orange"];
    const cur = localStorage.getItem(APP_THEME_KEY) || "light";
    applyAppTheme(order[(order.indexOf(cur) + 1) % order.length], true);
}

// ================= PENGALIH EKOSISTEM (LEMBARKU <-> TITIK GOWES) =================
function toggleEcosystemDrawer(show) {
    const el = document.getElementById("drawer-ecosystem");
    const btn = document.getElementById("header-threads-btn");
    if (!el) return;
    if (show) {
        renderEcosystemDrawerUser();
        if (typeof renderEcoUserSearchBox === "function") renderEcoUserSearchBox();
        el.classList.add("open");
        if (btn) btn.classList.add("is-active");
        if (typeof mrNavPush === "function") mrNavPush({ type: "modal", id: "drawer-ecosystem" });
    } else {
        el.classList.remove("open");
        if (btn) btn.classList.remove("is-active");
        if (typeof _mrDropTopModalById === "function") _mrDropTopModalById("drawer-ecosystem");
    }
}

function renderEcosystemDrawerUser() {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    const avEl = document.getElementById("drawer-eco-avatar");
    const nmEl = document.getElementById("drawer-eco-name");
    const rlEl = document.getElementById("drawer-eco-role");
    const defAv = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "./lembarku-logo.png";

    if (!u) {
        if (avEl) avEl.src = defAv;
        if (nmEl) nmEl.innerText = "Tamu Pengunjung";
        if (rlEl) rlEl.innerText = "Masuk akun untuk akses penuh";
        return;
    }

    if (avEl) avEl.src = u.avatar || defAv;
    if (nmEl) nmEl.innerText = u.name || u.username;
    if (rlEl) {
        const roleLabel = u.role === "master" ? "Founder Lembarku"
            : u.role === "administrasi" ? "Tim Administrasi"
            : u.role === "cabang" ? `Mitra Cabang (${u.brandName || "Resmi"})`
            : "Pengguna Terdaftar";
        rlEl.innerText = `@${u.username} • ${roleLabel}`;
    }
}

function updateAppModeUI() {
    const isGowes = currentAppMode === "titik_gowes";
    const logoEl = document.getElementById("header-app-logo");
    const brandMainEl = document.getElementById("header-brand-main");
    const brandSubEl = document.getElementById("header-brand-sub");

    const optLbk = document.getElementById("eco-opt-lembarku");
    const optGws = document.getElementById("eco-opt-gowes");
    const chkLbk = document.getElementById("eco-chk-lembarku");
    const chkGws = document.getElementById("eco-chk-gowes");

    if (optLbk && optGws) {
        optLbk.classList.toggle("is-active", !isGowes);
        optGws.classList.toggle("is-active-gowes", isGowes);
    }
    if (chkLbk && chkGws) {
        chkLbk.classList.toggle("hide", isGowes);
        chkGws.classList.toggle("hide", !isGowes);
    }

    if (isGowes) {
        if (logoEl) {
            logoEl.src = GOWES_LOGO_PATH;
            logoEl.onerror = function() { this.src = GOWES_LOGO_FALLBACK; };
        }
        if (brandMainEl) brandMainEl.innerText = "Titik Gowes";
        if (brandSubEl) {
            brandSubEl.innerText = "Rental Sepeda";
            brandSubEl.classList.remove("hide");
        }
        document.body.classList.add("mode-gowes");
    } else {
        if (logoEl) {
            logoEl.src = LEMBARKU_LOGO_PATH;
            logoEl.onerror = null;
        }
        if (brandMainEl) brandMainEl.innerText = "Lembarku";
        if (brandSubEl) {
            brandSubEl.innerText = "";
            brandSubEl.classList.add("hide");
        }
        document.body.classList.remove("mode-gowes");
    }

    if (currentViewName === "landing") {
        const vLbk = document.getElementById("view-landing");
        const vGws = document.getElementById("view-gowes");
        if (vLbk && vGws) {
            vLbk.classList.toggle("hide", isGowes);
            vGws.classList.toggle("hide", !isGowes);
        }
        if (isGowes && typeof renderGowesLandingPage === "function") {
            try { renderGowesLandingPage(); } catch (e) { console.warn(e); }
        } else if (!isGowes && typeof renderLandingPage === "function") {
            try { renderLandingPage(); } catch (e) { console.warn(e); }
        }
    }
}

function switchAppMode(mode) {
    if (mode !== "lembarku" && mode !== "titik_gowes") mode = "lembarku";
    currentAppMode = mode;
    localStorage.setItem(APP_MODE_KEY, mode);
    toggleEcosystemDrawer(false);
    updateAppModeUI();

    const toastMsg = mode === "titik_gowes"
        ? "Beralih ke Titik Gowes (Rental Sepeda)"
        : "Beralih ke Lembarku (Undangan & Berkas)";
    if (typeof showToast === "function") showToast(toastMsg, "info");
}
// ================= HELPER USER, PRIVASI, BLOKIR, TEMA & HARGA =================
function getCurrentUserObj() {
    if (!currentSessionUser) return null;
    const curKey = String(currentSessionUser).trim().toLowerCase();
    const targetKey = curKey === "master" ? FOUNDER_USERNAME : curKey;
    return (db.users || []).find(u => String(u.username || "").trim().toLowerCase() === targetKey)
        || (curKey === "master" || curKey === FOUNDER_USERNAME
            ? (db.users || []).find(u => String(u.role || "").toLowerCase() === "master")
            : null)
        || null;
}

function _getLocalPrivacyCache(username) {
    const k = String(username || "").trim().toLowerCase();
    if (!k) return null;
    try {
        const obj = JSON.parse(localStorage.getItem("LBK_USER_PRIVACY_" + k) || "null");
        return (obj && typeof obj === "object") ? obj : null;
    } catch { return null; }
}

function _saveLocalPrivacyCache(username, privacyObj) {
    const k = String(username || "").trim().toLowerCase();
    if (!k || !privacyObj || typeof privacyObj !== "object") return;
    try {
        localStorage.setItem("LBK_USER_PRIVACY_" + k, JSON.stringify(privacyObj));
    } catch {}
}

function getUserPrivacy(uObj) {
    const serverRaw = (uObj && uObj.privacy && typeof uObj.privacy === "object") ? uObj.privacy : {};
    const uname = uObj && uObj.username ? String(uObj.username).trim().toLowerCase() : "";
    const curKey = currentSessionUser ? String(currentSessionUser).trim().toLowerCase() : "";
    // Gabungkan cache lokal khusus milik akun yang sedang login agar field privasi baru tidak pernah ter-reset oleh server lama
    const localRaw = (uname && curKey && uname === curKey) ? (_getLocalPrivacyCache(uname) || {}) : {};
    const raw = Object.assign({}, serverRaw, localRaw);
    return {
        showProjects: raw.showProjects !== false,
        showFollowers: raw.showFollowers !== false,
        showFollowing: raw.showFollowing !== false,
        showUsername: raw.showUsername !== false,
        allowSearchDiscovery: raw.allowSearchDiscovery !== false,
        showOnlineStatus: raw.showOnlineStatus !== false,
        showContact: raw.showContact === true,
        showInChatContacts: raw.showInChatContacts !== false,
        allowDirectChat: raw.allowDirectChat !== false
    };
}

function canSeeUserHandle(targetUserObj) {
    if (!targetUserObj || !targetUserObj.username) return false;
    const priv = getUserPrivacy(targetUserObj);
    if (priv.showUsername) return true;
    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!curU || !curU.username) return false;
    const myKey = String(curU.username).trim().toLowerCase();
    const tKey = String(targetUserObj.username).trim().toLowerCase();
    if (myKey === tKey) return true;
    if (curU.role === "master") return true;
    return false;
}

function buildGoldLembarkuCoinHtml(size = "sm") {
    const szCls = size === "lg" ? "lbk-gold-coin-lg" : size === "md" ? "lbk-gold-coin-md" : "lbk-gold-coin-sm";
    const fbTxtCls = size === "lg" ? "text-3xl" : size === "md" ? "text-sm" : "text-[11px]";
    return `<span class="lbk-gold-coin ${szCls}" aria-hidden="true"><img src="./lembarku-logo.png" alt="Coin" class="lbk-gold-coin-logo" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.classList.remove('hide');"><span class="hide lbk-gold-coin-fallback ${fbTxtCls}">L</span></span>`;
}

function isUserOnlineNow(uObj) {
    if (!uObj || !uObj.username) return false;
    const priv = getUserPrivacy(uObj);
    if (!priv.showOnlineStatus) return false;
    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (curU && String(curU.username || "").trim().toLowerCase() === String(uObj.username || "").trim().toLowerCase()) {
        return true;
    }
    const ls = Number(uObj.lastSeen || 0);
    if (!ls) return false;
    return (Date.now() - ls) <= 180000; // Aktif dalam 3 menit terakhir
}

function getUserPresenceText(uObj) {
    if (!uObj || !uObj.username) return "";
    const priv = getUserPrivacy(uObj);
    if (!priv.showOnlineStatus) return "";
    if (isUserOnlineNow(uObj)) return "Online";
    const ls = Number(uObj.lastSeen || 0);
    if (!ls) return "";
    const diffMins = Math.max(1, Math.floor((Date.now() - ls) / 60000));
    if (diffMins < 60) return `Aktif ${diffMins} mnt lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Aktif ${diffHours} jam lalu`;
    const d = new Date(ls);
    if (isNaN(d.getTime())) return "";
    return `Aktif ${d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}`;
}

function buildOnlineDotHtml(uObj, size = "sm") {
    if (!isUserOnlineNow(uObj)) return "";
    const szCls = size === "lg" ? "lbk-online-dot-lg" : size === "md" ? "lbk-online-dot-md" : "lbk-online-dot-sm";
    return `<span class="lbk-online-dot ${szCls}" title="Sedang Online"></span>`;
}

function getBlockedUsersList(uObj) {
    if (!uObj || !Array.isArray(uObj.blockedUsers)) return [];
    return Array.from(new Set(uObj.blockedUsers.map(x => String(x || "").trim().toLowerCase()).filter(Boolean)));
}

function isUserBlockedByMe(username) {
    const me = getCurrentUserObj();
    if (!me) return false;
    const key = String(username || "").trim().toLowerCase();
    return getBlockedUsersList(me).includes(key);
}

function getMasterBanksList() {
    const ms = db.masterSettings || {};
    if (Array.isArray(ms.banks) && ms.banks.length) return ms.banks;
    if (ms.bankNo) return [{ bank: ms.bankName || "DANA", no: ms.bankNo, holder: ms.bankHolder || "Lembarku" }];
    return [{ bank: "DANA", no: "085117488828", holder: "Lembarku" }];
}

function getInvBrandInfo(inv) {
    const b = (inv && inv.brandName && String(inv.brandName).trim()) ? String(inv.brandName).trim() : "";
    if (b) return { topLabel: b, footerMain: b, footerSub: "Powered by Lembarku", waFooter: `${b} — Powered by Lembarku` };
    return { topLabel: "LEMBARKU", footerMain: "Lembarku", footerSub: "", waFooter: "Lembarku" };
}

function deepCloneSafe(obj) {
    try { return JSON.parse(JSON.stringify(obj)); } catch { return Object.assign({}, obj); }
}

function getMergedThemes(cat, includeHidden = false) {
    const builtIn = (THEME_CATALOG[cat] || []).map(t => {
        const baseT = deepCloneSafe(t);
        const key = `${cat}::${baseT.name}`;
        const ov = deepCloneSafe((db.themeOverrides && db.themeOverrides[key]) || {});
        const isHidden = (db.hiddenThemes || []).includes(key);
        const merged = Object.assign({}, baseT, ov, { cat, key, isCustom: false, isHidden });
        merged.demoPhotos = Object.assign({}, baseT.demoPhotos || {}, ov.demoPhotos || {});
        merged.demoData = Object.assign({}, baseT.demoData || {}, ov.demoData || {});
        return merged;
    });
    const custom = (db.customThemes || []).filter(t => t.category === cat).map(t => {
        const baseT = deepCloneSafe(t);
        const merged = Object.assign({}, baseT, { cat, key: `custom::${baseT.id}`, isCustom: true, isHidden: false });
        merged.demoPhotos = Object.assign({}, baseT.demoPhotos || {});
        merged.demoData = Object.assign({}, baseT.demoData || {});
        return merged;
    });
    const all = [...custom, ...builtIn];
    return includeHidden ? all : all.filter(t => !t.isHidden);
}

function findThemeObject(cat, name) {
    const list = getMergedThemes(cat || "Pernikahan", true);
    return list.find(t => String(t.name).toLowerCase() === String(name || "").toLowerCase()) || list[0] || deepCloneSafe(THEME_CATALOG["Pernikahan"][0]);
}

const DEFAULT_COIN_PACKAGES = [
    { id: "starter", name: "Starter (Coba Mitra)", paidCoins: 20, bonusCoins: 0, price: 100000, badge: "" },
    { id: "reguler", name: "Reguler (Hemat)", paidCoins: 50, bonusCoins: 5, price: 250000, badge: "HEMAT 9%" },
    { id: "bisnis", name: "Bisnis (Terlaris)", paidCoins: 100, bonusCoins: 15, price: 500000, badge: "TERLARIS" },
    { id: "juragan", name: "Juragan (Grosir VIP)", paidCoins: 200, bonusCoins: 50, price: 1000000, badge: "HEMAT 20%" }
];

const DEFAULT_PRO_UPGRADE = {
    price: 49000,
    bonusCoins: 5
};

const DEFAULT_PROMO_VOUCHERS = [
    {
        id: "vch_default_1",
        code: "HEMAT10",
        type: "percent", // 'percent' | 'fixed'
        value: 10,
        scope: "all", // 'all' | 'inv' | 'pf' | 'gowes'
        maxUses: 100,
        usedCount: 0,
        expiresAt: "2027-12-31",
        active: true,
        label: "Diskon Pembukaan 10%"
    }
];

function getProUpgradeConfig() {
    const ms = (db && db.masterSettings) || {};
    const price = Number(ms.proUpgradePrice);
    const bonusCoins = Number(ms.proUpgradeBonusCoins);
    return {
        price: (!isNaN(price) && price >= 1000) ? Math.round(price) : DEFAULT_PRO_UPGRADE.price,
        bonusCoins: (!isNaN(bonusCoins) && bonusCoins >= 0) ? Math.round(bonusCoins) : DEFAULT_PRO_UPGRADE.bonusCoins
    };
}

function getVouchersList() {
    const ms = (db && db.masterSettings) || {};
    if (Array.isArray(ms.vouchers)) return ms.vouchers;
    return DEFAULT_PROMO_VOUCHERS.map(v => Object.assign({}, v));
}

function evaluateVoucherCode(rawCode, scope, basePrice) {
    const clean = String(rawCode || "").trim().toUpperCase();
    if (!clean) return { ok: false, message: "Masukkan kode voucher terlebih dahulu." };
    const list = getVouchersList();
    const v = list.find(x => x && String(x.code || "").trim().toUpperCase() === clean);
    if (!v) return { ok: false, message: `Kode voucher "${clean}" tidak ditemukan.` };
    if (v.active === false) return { ok: false, message: `Kode voucher "${clean}" sedang tidak aktif.` };

    const vScope = String(v.scope || "all").toLowerCase();
    if (vScope !== "all" && vScope !== String(scope || "").toLowerCase()) {
        const scopeMap = { inv: "Undangan Digital", pf: "CV & Surat Lamaran", gowes: "Titik Gowes" };
        return { ok: false, message: `Voucher "${clean}" hanya berlaku untuk ${scopeMap[vScope] || vScope}.` };
    }

    if (v.expiresAt) {
        const expDate = new Date(String(v.expiresAt) + "T23:59:59");
        if (!isNaN(expDate.getTime()) && Date.now() > expDate.getTime()) {
            return { ok: false, message: `Voucher "${clean}" sudah melewati masa berlaku.` };
        }
    }

    const maxU = Number(v.maxUses || 0);
    const usedU = Number(v.usedCount || 0);
    if (maxU > 0 && usedU >= maxU) {
        return { ok: false, message: `Kuota pemakaian voucher "${clean}" sudah habis.` };
    }

    const base = Math.max(0, Math.round(Number(basePrice || 0)));
    let disc = 0;
    if (v.type === "percent") {
        const pct = Math.max(1, Math.min(90, Number(v.value || 0)));
        disc = Math.round((base * pct) / 100);
    } else {
        disc = Math.max(0, Math.round(Number(v.value || 0)));
    }
    disc = Math.min(Math.max(0, base - 1000), disc);
    const finalPrice = Math.max(1000, base - disc);

    return {
        ok: true,
        voucher: v,
        code: clean,
        discount: disc,
        finalPrice,
        message: `Voucher ${clean} aktif! Hemat ${fmtRp(disc)}.`
    };
}

function isSystemCoinOrder(doc) {
    if (!doc) return false;
    return doc.docType === "coin_topup" || doc.docType === "pro_upgrade" || doc.docType === "cv_edit_addon";
}

// ================= PERBAIKAN 2: ATURAN EDIT 3 MINGGU (UNDANGAN/LAMARAN) & ADD-ON +2X EDIT CV =================
const PROJECT_EDIT_WINDOW_DAYS = 21; // 3 Minggu

function getProjectEditRuleInfo(doc, isCabangOwner = false) {
    if (!doc) {
        return { isCv: false, isExpired: true, daysLeft: 0, maxEdits: 2, editCount: 0, editsLeft: 0, canEdit: false, canBuyCvAddon: false, addonHalfPrice: 10000 };
    }
    const isPf = doc._kind === "pf" || doc.docType === "cv" || doc.docType === "lamaran";
    const isCv = isPf && doc.docType !== "lamaran";
    const isAktif = doc.status === "Aktif";
    const editCount = Math.max(0, Number(doc.editCount || 0));
    const maxEdits = Math.max(2, Number(doc.maxEdits || 2));
    const editsLeft = Math.max(0, maxEdits - editCount);

    const createdTs = Number(doc.createdAt || doc.id || Date.now());
    const elapsedMs = Math.max(0, Date.now() - createdTs);
    const limitMs = PROJECT_EDIT_WINDOW_DAYS * 86400000;
    const isExpired = !isCv && (elapsedMs > limitMs);
    const daysLeft = isCv ? 999 : Math.max(0, Math.ceil((limitMs - elapsedMs) / 86400000));

    const canEdit = isExpired ? false : (isCabangOwner ? true : (isAktif && editsLeft > 0));
    const basePrice = Number(doc.price || (isCv ? 20000 : 15000));
    const addonHalfPrice = Math.max(1000, Math.round(basePrice * 0.5));
    const canBuyCvAddon = isCv && isAktif && !isCabangOwner && editsLeft <= 0;

    return {
        isCv,
        isExpired,
        daysLeft,
        maxEdits,
        editCount,
        editsLeft,
        canEdit,
        canBuyCvAddon,
        addonHalfPrice
    };
}

// ================= PERBAIKAN 4: HITUNG DENDA TOLERANSI 20 MENIT PER JAM =================
const GOWES_LATE_TOLERANCE_MINS = 20;
const DEFAULT_GOWES_LATE_FEE_PER_HOUR = 15000;

function getBikeLateFeePerHour(bikeOrId) {
    let bike = (typeof bikeOrId === "object" && bikeOrId) ? bikeOrId : null;
    if (!bike && bikeOrId) {
        const list = Array.isArray(db.gowesBikes) && db.gowesBikes.length ? db.gowesBikes : DEFAULT_GOWES_BIKES;
        bike = list.find(b => String(b.id) === String(bikeOrId)) || null;
    }
    const val = Number(bike && bike.lateFeePerHour);
    return (!isNaN(val) && val > 0) ? Math.round(val) : DEFAULT_GOWES_LATE_FEE_PER_HOUR;
}

function calculateGowesLateFee(lateMinutes, bikeOrRate = null, qty = 1) {
    const mins = Math.max(0, Math.floor(Number(lateMinutes || 0)));
    const rate = typeof bikeOrRate === "number"
        ? Math.max(0, Math.round(bikeOrRate))
        : getBikeLateFeePerHour(bikeOrRate);
    const unitQty = Math.max(1, Math.round(Number(qty || 1)));
    // Toleransi 20 menit per jam: 0-20 mnt = 0 jam; 21-80 mnt (01:20) = 1 jam; 81-140 mnt (01:21-02:20) = 2 jam
    if (mins <= GOWES_LATE_TOLERANCE_MINS) {
        return { lateMinutes: mins, billableHours: 0, ratePerHour: rate, totalFine: 0, withinTolerance: mins > 0 };
    }
    const billableHours = Math.ceil((mins - GOWES_LATE_TOLERANCE_MINS) / 60);
    return {
        lateMinutes: mins,
        billableHours,
        ratePerHour: rate,
        totalFine: billableHours * rate * unitQty,
        withinTolerance: false
    };
}

// ================= PERBAIKAN 5: METADATA PETUGAS PENANGANAN TRANSAKSI (handledBy) =================
function buildHandledByMeta() {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u || !u.username) return null;
    return {
        username: String(u.username).trim().toLowerCase(),
        name: u.name || u.username,
        role: u.role || "administrasi",
        at: Date.now()
    };
}

function formatHandledByBadgeHtml(item) {
    const hb = item && item.handledBy;
    const fallbackName = item && item.cashierName;
    if (!hb && !fallbackName) return "";
    const nameStr = (hb && hb.name) || fallbackName || "-";
    const userStr = (hb && hb.username) ? ` (@${hb.username})` : "";
    const roleTag = (hb && hb.role === "master") ? "Founder" : "Admin";
    const dtStr = (hb && hb.at)
        ? " • " + new Date(Number(hb.at)).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
        : "";
    return `<span class="inline-flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded-full bg-indigo-500/12 text-indigo-600 font-bold"><i class="fa-solid fa-user-check text-[8.5px]"></i>${roleTag}: ${escHtml(nameStr + userStr)}${escHtml(dtStr)}</span>`;
}

function getCoinHistoryForUser(uObj) {
    if (!uObj || !uObj.username) return [];
    const key = String(uObj.username).trim().toLowerCase();
    const cloudList = Array.isArray(uObj.coinHistory) ? uObj.coinHistory : [];
    let localList = [];
    try {
        localList = JSON.parse(localStorage.getItem("LBK_COIN_HIST_" + key) || "[]");
        if (!Array.isArray(localList)) localList = [];
    } catch { localList = []; }

    const map = new Map();
    [...cloudList, ...localList].forEach(item => {
        if (!item) return;
        const id = String(item.id || `${item.ts}_${item.delta}_${item.title}`);
        if (!map.has(id)) map.set(id, item);
    });
    return Array.from(map.values()).sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0));
}

function recordCoinMutation(uObj, delta, title, note = "", balanceAfterOverride = null) {
    if (!uObj || !uObj.username) return [];
    const key = String(uObj.username).trim().toLowerCase();
    const curList = getCoinHistoryForUser(uObj);
    const bal = balanceAfterOverride !== null ? Number(balanceAfterOverride) : Number(uObj.quota || 0);
    const entry = {
        id: "cmut_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        ts: Date.now(),
        delta: Math.round(Number(delta || 0)),
        balanceAfter: Math.max(0, Math.round(bal)),
        title: String(title || (delta >= 0 ? "Isi Ulang Coin" : "Pemakaian Coin")),
        note: String(note || "")
    };
    const nextList = [entry, ...curList].slice(0, 100);
    uObj.coinHistory = nextList;
    try {
        localStorage.setItem("LBK_COIN_HIST_" + key, JSON.stringify(nextList));
    } catch {}
    return nextList;
}

function getCoinPackagesList() {
    const ms = (db && db.masterSettings) || {};
    if (Array.isArray(ms.coinPackages) && ms.coinPackages.length) {
        return ms.coinPackages.map((p, idx) => ({
            id: p.id || ("pkg_" + idx),
            name: p.name || ("Paket " + (idx + 1)),
            paidCoins: Math.max(1, Math.round(Number(p.paidCoins || 10))),
            bonusCoins: Math.max(0, Math.round(Number(p.bonusCoins || 0))),
            price: Math.max(1000, Math.round(Number(p.price || 50000))),
            badge: p.badge || ""
        }));
    }
    return DEFAULT_COIN_PACKAGES.map(p => Object.assign({}, p));
}

function getThemeCoinCost(cat, tObj) {
    if (tObj && Number(tObj.coinCost) > 0) return Math.max(1, Math.round(Number(tObj.coinCost)));
    const resolvedCat = cat || (tObj && (tObj.cat || tObj.category)) || "Pernikahan";
    return resolvedCat === "Pernikahan" ? 12 : 7;
}

function getPortfolioCoinCost(docType, tObj) {
    if (tObj && Number(tObj.coinCost) > 0) return Math.max(1, Math.round(Number(tObj.coinCost)));
    const dt = docType || (tObj && tObj.docType) || "cv";
    return dt === "lamaran" ? 2 : 3;
}

function getThemePricing(tObj) {
    const price = Number((tObj && tObj.price) || 99000);
    const origPrice = Number((tObj && tObj.origPrice) || 0);
    const hasDisc = origPrice > price && price > 0;
    const discPct = hasDisc ? Math.round(((origPrice - price) / origPrice) * 100) : 0;
    const coinCost = getThemeCoinCost(tObj && (tObj.cat || tObj.category), tObj);
    return { price, origPrice, hasDisc, discPct, coinCost };
}

function getThemeCoverPair(cat, tObj) {
    const fb = (tObj && tObj.img) || IMG("1519741497674-611481863552");
    const src = (tObj && tObj.demoPhotos && tObj.demoPhotos.cover) || (tObj && tObj.customCover) || fb;
    return { src, fb };
}

function getThemeSlotPair(tObj, slotKey, _file, fallback) {
    const dp = (tObj && tObj.demoPhotos) || {};
    if (dp[slotKey]) return { src: dp[slotKey], fb: fallback };
    if (slotKey === "pria") return { src: "./assets/model-pria.jpg", fb: fallback };
    if (slotKey === "wanita") return { src: "./assets/model-wanita.jpg", fb: fallback };
    return { src: fallback, fb: fallback };
}

function getPortfolioThemeObj(docType, id) {
    const list = PORTFOLIO_CATALOG[docType] || PORTFOLIO_CATALOG.cv;
    const base = list.find(x => x.id === id) || list[0];
    const ov = (db.cvPriceOverrides && db.cvPriceOverrides[base.id]) || {};
    const merged = Object.assign({}, base, ov);
    merged.coinCost = getPortfolioCoinCost(docType, merged);
    return merged;
}

function isItemFavorited(favKey) {
    const u = getCurrentUserObj();
    if (u && Array.isArray(u.favorites)) return u.favorites.some(f => f.favKey === favKey);
    try { return JSON.parse(localStorage.getItem("MR_LOCAL_FAVS") || "[]").some(f => f.favKey === favKey); } catch { return false; }
}

async function toggleFavoriteItem(ev, favObj) {
    if (ev) ev.stopPropagation();
    const u = getCurrentUserObj();
    let list = u ? [...(u.favorites || [])] : JSON.parse(localStorage.getItem("MR_LOCAL_FAVS") || "[]");
    const idx = list.findIndex(f => f.favKey === favObj.favKey);
    const added = idx === -1;
    if (added) list.unshift(favObj); else list.splice(idx, 1);

    document.querySelectorAll(`[data-fav-btn="${CSS.escape(favObj.favKey)}"]`).forEach(btn => {
        btn.classList.toggle("is-fav", added);
        btn.innerHTML = `<i class="fa-${added ? "solid" : "regular"} fa-heart"></i>`;
    });

    if (u) {
        u.favorites = list;
        if (typeof renderProfileFavoritesShelf === "function") renderProfileFavoritesShelf();
        apiAction({ action: "upsert_user", oldUsername: u.username, user: Object.assign({}, u, { favorites: list }) });
    } else {
        localStorage.setItem("MR_LOCAL_FAVS", JSON.stringify(list));
    }
    showToast(added ? "Disimpan ke Favorit!" : "Dihapus dari Favorit.", "info");
}

function _formatMiniCoverDate(dateStr, fallbackStr) {
    if (!dateStr) return fallbackStr;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr).toUpperCase();
    return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase();
}

// KARTU PROMOSI UNDANGAN BERANDA ASLI LEMBARKU (LENGKAP DENGAN ORNAMEN & FONT)
function buildMiniCoverCardHtml(cat, tObj, showFavBtn = true) {
    const cov = getThemeCoverPair(cat, tObj);
    const favKey = `inv::${cat}::${tObj.name}`;
    const isFav = isItemFavorited(favKey);
    const favObjStr = esc(JSON.stringify({ favKey, kind: "inv", cat, name: tObj.name }));

    const preset = VISUAL_PRESETS[tObj.preset] || VISUAL_PRESETS["dark-gold"];
    const dm = tObj.demoData || {};
    const styleKey = tObj.layout || tObj.style || "";
    const isMono = tObj.photoFilter === "mono" || styleKey === "premium_black";
    const isVintage = tObj.photoFilter === "vintage";
    const filterCss = isMono ? "filter:grayscale(100%) contrast(1.08);" : isVintage ? "filter:sepia(24%) contrast(1.04);" : "";

    const headingFont = tObj.font || (preset.vars && preset.vars["--th-font-heading"]) || "'Great Vibes',cursive";
    const accentCol = (tObj.customColors && tObj.customColors.accent) || (preset.vars && preset.vars["--th-accent"]) || "#f3d285";
    const btnBg = (tObj.customColors && tObj.customColors.accent) || (preset.vars && preset.vars["--th-btn-bg"]) || "linear-gradient(90deg,#f3d285,#d4af37)";
    const btnTxt = isMono ? "#09090b" : ((preset.vars && preset.vars["--th-btn-text"]) || "#1f0a0c");
    const overlayBg = preset.coverOverlay || "linear-gradient(180deg,rgba(0,0,0,0.35) 0%,rgba(12,12,15,0.9) 100%)";

    const badgeTop = cat === "Pernikahan" ? "THE WEDDING OF"
        : cat === "Ulang Tahun" ? "BIRTHDAY INVITATION"
        : cat === "Aqiqah" ? "TASYAKURAN AQIQAH"
        : cat === "Syukuran" ? (tObj.isKhitan ? "WALIMATUL KHITAN" : "UNDANGAN SYUKURAN")
        : "UNDANGAN RESMI";

    const sampleTitle = dm.title || (
        cat === "Pernikahan" ? "Aqila & Fauzi"
        : cat === "Ulang Tahun" ? "Arsyilla Fadillah"
        : cat === "Aqiqah" ? "Ahmad Fathallah"
        : cat === "Syukuran" ? (tObj.isKhitan ? "M. Al-Fatih" : "Syukuran Rumah")
        : (tObj.demoTitle || "Acara Spesial")
    );
    const defaultDateMap = {
        "Pernikahan": "SABTU, 20 FEBRUARI 2027",
        "Ulang Tahun": "MINGGU, 14 MARET 2027",
        "Aqiqah": "SENIN, 18 JANUARI 2027",
        "Syukuran": "SABTU, 30 JANUARI 2027",
        "Lainnya": "RABU, 10 FEBRUARI 2027"
    };
    const sampleDate = _formatMiniCoverDate(dm.date, defaultDateMap[cat] || "SABTU, 20 FEBRUARI 2027");
    const isScriptFont = /vibes|brush/i.test(headingFont);
    const titleSizeCls = isScriptFont ? "text-[22px] leading-[1.05]" : "text-[16px] leading-[1.15] font-bold";

    return `
        <div class="mini-inv-cover-stage bg-zinc-950 p-2.5 text-white">
            <img src="${cov.src}" ${imgFbAttr(cov.fb)} loading="lazy" style="${filterCss}" class="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition duration-500">
            <div class="absolute inset-0" style="background:${overlayBg};"></div>

            ${tObj.badge ? `<span class="absolute top-2 left-2 z-20 text-[7.5px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-400 text-black uppercase shadow">${escHtml(tObj.badge)}</span>` : ""}
            ${showFavBtn ? `<button type="button" data-fav-btn="${esc(favKey)}" onclick="toggleFavoriteItem(event, JSON.parse('${favObjStr}'))" class="fav-heart-btn ${isFav ? "is-fav" : ""}" title="Simpan ke Favorit"><i class="fa-${isFav ? "solid" : "regular"} fa-heart"></i></button>` : ""}

            <div class="relative z-10 pt-1">
                <span class="text-[6.5px] uppercase tracking-[0.28em] text-white/85 font-semibold drop-shadow">LEMBARKU</span>
            </div>

            <div class="relative z-10 my-auto px-1 space-y-0.5">
                <span class="block text-[6px] uppercase tracking-[0.22em] font-bold drop-shadow" style="color:${accentCol};">${badgeTop}</span>
                <p class="${titleSizeCls} text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] line-clamp-2" style="font-family:${headingFont};">${escHtml(sampleTitle)}</p>
                <span class="block text-[6px] uppercase tracking-[0.14em] text-white/90 font-semibold pt-0.5 truncate">${escHtml(sampleDate)}</span>
            </div>

            <div class="relative z-10 space-y-1.5 pb-0.5">
                <div class="bg-black/48 backdrop-blur-sm border border-white/25 rounded-lg px-2 py-1.5 leading-tight">
                    <span class="block text-[5.2px] uppercase tracking-wider text-white/75">Kepada Yth. Bapak/Ibu/Saudara/i</span>
                    <strong class="block text-[8px] font-bold truncate mt-0.5" style="color:${accentCol};">Tamu Kehormatan</strong>
                    <span class="block text-[5px] text-white/65">di Tempat</span>
                </div>
                <div class="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-[6.5px] font-extrabold uppercase tracking-wider shadow-md" style="background:${btnBg};color:${btnTxt};">
                    <i class="fa-solid fa-envelope-open-text text-[6px]"></i> Buka Undangan
                </div>
            </div>
        </div>
    `;
}

function buildPriceStripHtml(tObj, compact = true) {
    const isPfObj = !!(tObj && tObj.id && (String(tObj.id).startsWith("cv_") || String(tObj.id).startsWith("lam_")));
    const pr = getThemePricing(tObj);
    const resolvedCoin = isPfObj
        ? getPortfolioCoinCost(String(tObj.id).startsWith("lam_") ? "lamaran" : "cv", tObj)
        : pr.coinCost;
    const showInvMeta = !!(tObj && tObj.cat && tObj.name);
    const coinBadgeHtml = `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-[9.5px] font-extrabold whitespace-nowrap shrink-0" title="Beli lebih hemat dengan Coin">${buildGoldLembarkuCoinHtml("sm")}<span>${resolvedCoin} Coin</span></span>`;

    return `
        <div class="px-2.5 py-2 bg-[#111115] text-white border-t border-white/10 space-y-1.5">
            ${showInvMeta ? `<div class="flex items-center justify-between gap-1"><h4 class="font-bold text-[11px] text-white truncate">${escHtml(tObj.name)}</h4><span class="text-[7.5px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/12 text-zinc-200 shrink-0">${escHtml(tObj.cat)}</span></div>` : ""}
            <div class="flex items-end justify-between gap-1.5">
                <div class="leading-tight min-w-0">
                    ${pr.hasDisc ? `<div class="flex items-center gap-1"><span class="text-[8.5px] text-zinc-400 line-through">${fmtRp(pr.origPrice)}</span><span class="text-[7.5px] px-1 py-0.2 rounded bg-red-600 text-white font-extrabold">-${pr.discPct}%</span></div>` : ""}
                    <strong class="text-[11.5px] text-white font-extrabold block">${fmtRp(pr.price)}</strong>
                </div>
                ${coinBadgeHtml}
            </div>
        </div>
    `;
}

// ================= PELACAKAN INSTALL & UNINSTALL PWA =================
function getOrCreateAppDeviceId() {
    let id = localStorage.getItem(APP_DEVICE_ID_KEY);
    if (!id) {
        id = "dev_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
        localStorage.setItem(APP_DEVICE_ID_KEY, id);
    }
    return id;
}

async function reportAppInstallState(eventType) {
    const evt = eventType === "uninstalled" ? "uninstalled" : "installed";
    const lastReported = localStorage.getItem(APP_INSTALLED_REPORTED_KEY) || "";
    if (lastReported === evt) return;
    localStorage.setItem(APP_INSTALLED_REPORTED_KEY, evt);
    const ua = navigator.userAgent || "";
    const platform = /iPad|iPhone|iPod/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : "Desktop";
    try {
        const res = await fetchJsonWithTimeout(CLOUD_API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "track_app_event",
                deviceId: getOrCreateAppDeviceId(),
                eventType: evt,
                platform
            })
        }, 12000);
        if (res && res.ok && res.appStats) db.appStats = res.appStats;
    } catch {}
}

// ================= INDEXEDDB CACHE ASLI LEMBARKU =================
function openMrIdb() {
    return new Promise((resolve) => {
        if (!window.indexedDB) return resolve(null);
        const req = indexedDB.open("MR_UNDANGAN_DB", 1);
        req.onupgradeneeded = () => req.result.createObjectStore("kv");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    });
}
async function idbGet(key) {
    const dbi = await openMrIdb(); if (!dbi) return null;
    return new Promise((resolve) => {
        const tx = dbi.transaction("kv", "readonly");
        const req = tx.objectStore("kv").get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
    });
}
async function idbSet(key, val) {
    const dbi = await openMrIdb(); if (!dbi) return;
    return new Promise((resolve) => {
        const tx = dbi.transaction("kv", "readwrite");
        tx.objectStore("kv").put(val, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
    });
}
async function idbRemove(key) {
    const dbi = await openMrIdb(); if (!dbi) return;
    return new Promise((resolve) => {
        const tx = dbi.transaction("kv", "readwrite");
        tx.objectStore("kv").delete(key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
    });
}

// ================= CLOUD SYNC & API (DIPERLUAS UNTUK TITIK GOWES) =================
function applyPublicDb(data) {
    if (!data || typeof data !== "object") return;
    ["customThemes", "hiddenThemes", "themeOverrides", "cvPriceOverrides", "musicLibrary", "testimonials", "promoBanners", "masterSettings"].forEach(k => {
        if (data[k] !== undefined) db[k] = data[k];
    });

    if (data.gowesPublic && typeof data.gowesPublic === "object") {
        if (Array.isArray(data.gowesPublic.bikes)) db.gowesBikes = data.gowesPublic.bikes;
        if (Array.isArray(data.gowesPublic.shelters) && data.gowesPublic.shelters.length) {
            db.gowesShelters = data.gowesPublic.shelters;
            db.gowesShelter = data.gowesPublic.shelters[0];
        } else if (data.gowesPublic.shelterLocation) {
            db.gowesShelter = data.gowesPublic.shelterLocation;
            if (!Array.isArray(db.gowesShelters) || !db.gowesShelters.length) db.gowesShelters = [Object.assign({ id: "sh_smd_1", city: "Samarinda" }, db.gowesShelter)];
        }
        if (Array.isArray(data.gowesPublic.todayBookings)) db.gowesTodayBookings = data.gowesPublic.todayBookings;
        if (Array.isArray(data.gowesPublic.upcomingBookings)) db.gowesUpcomingBookings = data.gowesPublic.upcomingBookings;
        if (Array.isArray(data.gowesPublic.banners)) db.gowesBanners = data.gowesPublic.banners;
        if (Array.isArray(data.gowesPublic.categories)) db.gowesCategories = data.gowesPublic.categories;
    }
}

function applyServerDb(data) {
    if (!data || typeof data !== "object") return;
    applyPublicDb(data);
    ["users", "invitations", "portfolios", "chats", "adminLogs"].forEach(k => {
        if (Array.isArray(data[k])) db[k] = data[k];
    });
    if (currentSessionUser && Array.isArray(db.users)) {
        const curKey = String(currentSessionUser).trim().toLowerCase();
        const savedPriv = _getLocalPrivacyCache(curKey);
        if (savedPriv) {
            const me = db.users.find(u => u && String(u.username || "").trim().toLowerCase() === curKey);
            if (me) me.privacy = Object.assign({}, me.privacy || {}, savedPriv);
        }
    }
    if (data.appStats && typeof data.appStats === "object") {
        db.appStats = data.appStats;
    }

    if (data.gowesData && typeof data.gowesData === "object") {
        if (Array.isArray(data.gowesData.allBikes)) db.gowesBikes = data.gowesData.allBikes;
        else if (Array.isArray(data.gowesData.bikes)) db.gowesBikes = data.gowesData.bikes;

        if (Array.isArray(data.gowesData.rentals)) db.gowesRentals = data.gowesData.rentals;
        else if (Array.isArray(data.gowesData.myRentals)) db.gowesRentals = data.gowesData.myRentals;

        if (Array.isArray(data.gowesData.shelters) && data.gowesData.shelters.length) {
            db.gowesShelters = data.gowesData.shelters;
            db.gowesShelter = data.gowesData.shelters[0];
        } else if (data.gowesData.shelterLocation) {
            db.gowesShelter = data.gowesData.shelterLocation;
            if (!Array.isArray(db.gowesShelters) || !db.gowesShelters.length) db.gowesShelters = [Object.assign({ id: "sh_smd_1", city: "Samarinda" }, db.gowesShelter)];
        }
        if (Array.isArray(data.gowesData.todayBookings)) db.gowesTodayBookings = data.gowesData.todayBookings;
        if (Array.isArray(data.gowesData.upcomingBookings)) db.gowesUpcomingBookings = data.gowesData.upcomingBookings;
        if (Array.isArray(data.gowesData.banners)) db.gowesBanners = data.gowesData.banners;
        if (Array.isArray(data.gowesData.categories)) db.gowesCategories = data.gowesData.categories;
        if (data.gowesData.analytics) db.gowesAnalytics = data.gowesData.analytics;
    }

    idbSet("db_snapshot", db);
    idbSet("public_snapshot", {
        customThemes: db.customThemes,
        hiddenThemes: db.hiddenThemes,
        themeOverrides: db.themeOverrides,
        cvPriceOverrides: db.cvPriceOverrides,
        musicLibrary: db.musicLibrary,
        testimonials: db.testimonials,
        promoBanners: db.promoBanners,
        masterSettings: db.masterSettings
    });
}

async function fetchJsonWithTimeout(url, opts = {}, ms = 18000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
        const res = await fetch(url, Object.assign({}, opts, { signal: ctrl.signal, cache: "no-store" }));
        clearTimeout(t);
        return await res.json();
    } catch {
        clearTimeout(t);
        return null;
    }
}

async function fetchPublicCloud() {
    const j = await fetchJsonWithTimeout(`${CLOUD_API_URL}?action=get_public&t=${Date.now()}`, {}, 14000);
    if (j && j.ok && j.data) {
        applyPublicDb(j.data);
        idbSet("public_snapshot", j.data);
        return true;
    }
    return false;
}

async function fetchFullCloud() {
    const url = `${CLOUD_API_URL}?action=get_full&username=${encodeURIComponent(currentSessionUser || "")}&token=${encodeURIComponent(currentSessionToken || "")}&guestId=${encodeURIComponent(guestChatId || "")}&t=${Date.now()}`;
    const j = await fetchJsonWithTimeout(url, {}, 18000);
    if (j && j.ok && j.data) {
        applyServerDb(j.data);
        return true;
    }
    return false;
}

async function fetchPublicUserProjects(username) {
    const url = `${CLOUD_API_URL}?action=get_public_projects&username=${encodeURIComponent(username || "")}&token=${encodeURIComponent(currentSessionToken || "")}&t=${Date.now()}`;
    const j = await fetchJsonWithTimeout(url, {}, 14000);
    return (j && j.ok) ? j : { ok: false, hidden: false, projects: [] };
}

async function fetchSingleInvitationFast(id) {
    const j = await fetchJsonWithTimeout(`${CLOUD_API_URL}?action=get_invitation&id=${encodeURIComponent(id)}&t=${Date.now()}`, {}, 12000);
    return (j && j.ok && j.invitation) ? j.invitation : null;
}

async function fetchClientPortalData(invId, key) {
    return await fetchJsonWithTimeout(`${CLOUD_API_URL}?action=get_client_portal&client=${encodeURIComponent(invId)}&key=${encodeURIComponent(key || "")}&t=${Date.now()}`, {}, 14000);
}

async function apiAction(payload) {
    const u = getCurrentUserObj();
    const enriched = Object.assign({
        actor: currentSessionUser || "",
        actorRole: (u && u.role) || "user",
        token: currentSessionToken || "",
        guestId: guestChatId || ""
    }, payload);
    const j = await fetchJsonWithTimeout(CLOUD_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(enriched)
    }, 35000);

    if (j && j.ok) {
        if (j.data) {
            applyServerDb(j.data);
        } else if (j.user) {
            const idx = (db.users || []).findIndex(x => String(x.username || "").toLowerCase() === String(j.user.username || "").toLowerCase());
            if (idx >= 0) db.users[idx] = Object.assign({}, db.users[idx], j.user);
            else db.users.push(j.user);
            idbSet("db_snapshot", db);
        }
    }
    return j || { ok: false, message: "Koneksi server sedang sibuk, coba lagi." };
}

let _pollTimer = null;
function scheduleAdaptivePoll() {
    clearTimeout(_pollTimer);
    const chatOpen = !document.getElementById("full-chat-overlay")?.classList.contains("hide");
    if (!currentSessionUser && !chatOpen) return;
    const delay = chatOpen ? 6000 : 20000;
    _pollTimer = setTimeout(async () => {
        if (!document.hidden && (currentSessionUser || chatOpen)) {
            const ok = await fetchFullCloud();
            if (ok && typeof refreshActiveViewSmart === "function") refreshActiveViewSmart();
        }
        scheduleAdaptivePoll();
    }, delay);
}

// ================= IMAGE RESIZER, AUDIO FALLBACK & CROPPER =================
function quickResizeImage(file, maxSide = 820, quality = 0.80) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let w = img.width, h = img.height;
                if (w > maxSide || h > maxSide) {
                    const sc = maxSide / Math.max(w, h);
                    w = Math.round(w * sc); h = Math.round(h * sc);
                }
                const c = document.createElement("canvas");
                c.width = w; c.height = h;
                const ctx = c.getContext("2d");
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(img, 0, 0, w, h);
                resolve(c.toDataURL("image/jpeg", quality));
            };
            img.onerror = () => resolve(e.target.result);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

const _audioBlobCache = new Map();
const _audioPreloadJobs = new Map();

function extractGoogleDriveAudioId(url) {
    if (!url) return "";
    const s = String(url).trim();
    const m1 = s.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
    if (m1) return m1[1];
    const m2 = s.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
    if (m2) return m2[1];
    return "";
}

function getAudioUrlCandidates(url) {
    if (!url) return [];
    const raw = String(url).trim();
    if (!raw) return [];
    if (raw.startsWith("data:audio/") || raw.startsWith("blob:")) return [raw];
    const id = extractGoogleDriveAudioId(raw);
    if (id) {
        return [
            `${CLOUD_API_URL}?action=stream_audio&id=${encodeURIComponent(id)}`,
            `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
            `https://docs.google.com/uc?export=download&id=${id}`,
            `https://drive.google.com/uc?export=download&id=${id}`
        ];
    }
    return [raw];
}

function dataUrlToBlobUrl(dataUrl) {
    if (!dataUrl || typeof dataUrl !== "string") return "";
    if (dataUrl.startsWith("blob:")) return dataUrl;
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return dataUrl;
    const mime = match[1] || "audio/mpeg";
    const bin = atob(match[2]);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
}

async function fetchAudioAsBlobUrl(rawUrl, candidates) {
    const cacheKey = String(rawUrl || (candidates && candidates[0]) || "");
    if (!cacheKey) return "";
    if (_audioBlobCache.has(cacheKey)) {
        const cachedVal = _audioBlobCache.get(cacheKey);
        if (cachedVal && cachedVal.startsWith("data:")) {
            const bUrl = dataUrlToBlobUrl(cachedVal);
            _audioBlobCache.set(cacheKey, bUrl);
            return bUrl;
        }
        return cachedVal;
    }

    const idbKey = "audio_data_" + encodeURIComponent(cacheKey);
    const idbCachedData = await idbGet(idbKey);
    if (idbCachedData && typeof idbCachedData === "string" && idbCachedData.startsWith("data:")) {
        const bUrl = dataUrlToBlobUrl(idbCachedData);
        if (bUrl) {
            _audioBlobCache.set(cacheKey, bUrl);
            return bUrl;
        }
    }

    if (_audioPreloadJobs.has(cacheKey)) {
        return await _audioPreloadJobs.get(cacheKey);
    }

    const job = (async () => {
        const driveId = extractGoogleDriveAudioId(rawUrl) || extractGoogleDriveAudioId((candidates && candidates[0]) || "");
        if (driveId) {
            try {
                const streamJson = await fetchJsonWithTimeout(`${CLOUD_API_URL}?action=stream_audio&id=${encodeURIComponent(driveId)}&t=${Date.now()}`, {}, 25000);
                if (streamJson && streamJson.ok && streamJson.dataUrl) {
                    idbSet(idbKey, streamJson.dataUrl);
                    const bUrl = dataUrlToBlobUrl(streamJson.dataUrl);
                    if (bUrl) {
                        _audioBlobCache.set(cacheKey, bUrl);
                        return bUrl;
                    }
                }
            } catch {}
        }

        const list = (candidates && candidates.length) ? candidates : getAudioUrlCandidates(rawUrl);
        for (const u of list) {
            if (u.indexOf("action=stream_audio") !== -1) continue;
            try {
                const resp = await fetch(u, { mode: "cors", cache: "force-cache", redirect: "follow" });
                if (!resp.ok) continue;
                const buf = await resp.arrayBuffer();
                if (!buf || buf.byteLength < 1024) continue;

                const headStr = new TextDecoder().decode(buf.slice(0, 128)).trim().toLowerCase();
                if (headStr.startsWith("<!doctype") || headStr.startsWith("<html") || headStr.includes("google-site-verification")) {
                    continue;
                }

                let mime = (resp.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
                if (!mime || mime === "application/octet-stream") {
                    const sig = new Uint8Array(buf.slice(0, 4));
                    if (sig[0] === 0x52 && sig[1] === 0x49 && sig[2] === 0x46 && sig[3] === 0x46) mime = "audio/wav";
                    else if (sig[0] === 0x4F && sig[1] === 0x67 && sig[2] === 0x67 && sig[3] === 0x53) mime = "audio/ogg";
                    else mime = "audio/mpeg";
                }
                const blob = new Blob([buf], { type: mime });
                const blobUrl = URL.createObjectURL(blob);
                _audioBlobCache.set(cacheKey, blobUrl);
                return blobUrl;
            } catch {}
        }
        return "";
    })().finally(() => {
        _audioPreloadJobs.delete(cacheKey);
    });

    _audioPreloadJobs.set(cacheKey, job);
    return await job;
}

function preloadAudioInBackground(rawUrl) {
    const cleanRaw = String(rawUrl || "").trim();
    if (!cleanRaw) return;
    fetchAudioAsBlobUrl(cleanRaw, getAudioUrlCandidates(cleanRaw)).catch(() => {});
}

async function resolveAudioUrl(url) {
    const list = getAudioUrlCandidates(url);
    const blobUrl = await fetchAudioAsBlobUrl(url, list);
    return blobUrl || list[0] || "";
}

let _cropperInst = null, _cropCfg = { outW: 600, outH: 600, onDone: null };
function openImageCropper(file, ratio = 1, title = "Atur Rasio Foto", outW = 600, outH = 600, onDone = null) {
    _cropCfg = { outW, outH, onDone };
    document.getElementById("crop-modal-title").innerHTML = `<i class="fa-solid fa-crop-simple app-accent mr-1.5"></i>${escHtml(title)}`;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.getElementById("crop-source-img");
        img.src = e.target.result;
        document.getElementById("modal-image-cropper").classList.remove("hide");
        if (_cropperInst) { _cropperInst.destroy(); _cropperInst = null; }
        if (window.Cropper) {
            _cropperInst = new window.Cropper(img, { aspectRatio: ratio, viewMode: 1, dragMode: "move", autoCropArea: 0.92, background: false });
        }
    };
    reader.readAsDataURL(file);
}
function cropperZoom(d) { if (_cropperInst) _cropperInst.zoom(d); }
function closeImageCropper() {
    if (_cropperInst) { _cropperInst.destroy(); _cropperInst = null; }
    document.getElementById("modal-image-cropper")?.classList.add("hide");
}
function applyImageCrop() {
    let dataUrl = "";
    if (_cropperInst) {
        const c = _cropperInst.getCroppedCanvas({ width: _cropCfg.outW, height: _cropCfg.outH, imageSmoothingQuality: "high" });
        dataUrl = c ? c.toDataURL("image/jpeg", 0.85) : "";
    } else {
        dataUrl = document.getElementById("crop-source-img")?.src || "";
    }
    const cb = _cropCfg.onDone;
    closeImageCropper();
    if (cb && dataUrl) cb(dataUrl);
}

// ================= AUDIO CROPPER INTERAKTIF (WIZARD & STOK MUSIK FOUNDER) =================
let _acFile = null, _acBlobUrl = "", _acDuration = 45, _acTotalDur = 60, _acStartSec = 0, _acAudio = null, _acPlayTimer = null;
let _acTargetMode = "wizard";

function _fmtSec(s) {
    const n = Math.max(0, Math.floor(s || 0));
    return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}

function _updateAcBoxUI() {
    const win = document.getElementById("ac-select-window");
    const lbl = document.getElementById("ac-clip-range-lbl");
    const dur = Math.max(1, _acTotalDur);
    const clipLen = Math.min(dur, _acDuration);
    if (_acStartSec + clipLen > dur) _acStartSec = Math.max(0, dur - clipLen);

    const leftPct = (_acStartSec / dur) * 100;
    const widthPct = Math.max(12, (clipLen / dur) * 100);
    if (win) {
        win.style.left = `${leftPct}%`;
        win.style.width = `${Math.min(100 - leftPct, widthPct)}%`;
    }
    if (lbl) lbl.innerText = `${_fmtSec(_acStartSec)} — ${_fmtSec(_acStartSec + clipLen)}`;
}

function _bindAcDrag() {
    const track = document.getElementById("ac-wave-track");
    const win = document.getElementById("ac-select-window");
    if (!track || !win || track.dataset.dragBound) return;
    track.dataset.dragBound = "1";

    let dragging = false, startX = 0, origStartSec = 0;
    const onDown = (clientX) => { dragging = true; startX = clientX; origStartSec = _acStartSec; };
    const onMove = (clientX) => {
        if (!dragging) return;
        const rect = track.getBoundingClientRect();
        const dx = clientX - startX;
        const deltaSec = (dx / Math.max(1, rect.width)) * _acTotalDur;
        const maxStart = Math.max(0, _acTotalDur - Math.min(_acTotalDur, _acDuration));
        _acStartSec = Math.max(0, Math.min(maxStart, origStartSec + deltaSec));
        _updateAcBoxUI();
    };
    const onUp = () => {
        if (!dragging) return;
        dragging = false;
        if (_acAudio && !_acAudio.paused) _acAudio.currentTime = _acStartSec;
    };

    win.addEventListener("mousedown", (e) => { e.preventDefault(); onDown(e.clientX); });
    window.addEventListener("mousemove", (e) => onMove(e.clientX));
    window.addEventListener("mouseup", onUp);

    win.addEventListener("touchstart", (e) => { onDown(e.touches[0].clientX); }, { passive: true });
    window.addEventListener("touchmove", (e) => { if (dragging) onMove(e.touches[0].clientX); }, { passive: true });
    window.addEventListener("touchend", onUp);
}

function openAudioCropperFromInput(inp, mode = "wizard") {
    const file = inp.files && inp.files[0]; if (!file) return; inp.value = "";
    if (file.size > 25 * 1024 * 1024) return showToast("Ukuran lagu maksimal 25 MB.", "error");
    _acTargetMode = mode === "library" ? "library" : "wizard";
    _acFile = file;
    _acStartSec = 0;
    document.getElementById("ac-song-title").value = file.name.replace(/\.[^/.]+$/, "");
    const catWrap = document.getElementById("ac-cat-wrap");
    const catInp = document.getElementById("ac-song-cat");
    if (catWrap) catWrap.classList.toggle("hide", _acTargetMode !== "library");
    if (catInp && !catInp.value) catInp.value = "Pernikahan";

    if (_acBlobUrl) { try { URL.revokeObjectURL(_acBlobUrl); } catch {} _acBlobUrl = ""; }
    _acBlobUrl = URL.createObjectURL(file);
    if (_acAudio) { _acAudio.pause(); _acAudio = null; }
    _acAudio = new Audio(_acBlobUrl);
    _acAudio.onloadedmetadata = () => {
        _acTotalDur = Math.max(10, Math.floor(_acAudio.duration || 60));
        document.getElementById("ac-total-dur").innerText = _fmtSec(_acTotalDur);
        _updateAcBoxUI();
    };
    const bars = document.getElementById("ac-wave-bars");
    if (bars) bars.innerHTML = Array.from({ length: 40 }, () => `<span class="w-1 bg-blue-400/75 rounded-full" style="height:${20 + Math.floor(Math.random()*70)}%"></span>`).join("");
    _bindAcDrag();
    _updateAcBoxUI();
    document.getElementById("modal-audio-cropper").classList.remove("hide");
    if (typeof pushBackGuard === "function") pushBackGuard();
}

function setAudioClipDuration(sec) {
    _acDuration = sec;
    document.querySelectorAll(".ac-dur-btn").forEach(b => {
        b.className = `ac-dur-btn px-2.5 py-1 rounded-lg text-[11px] font-bold ${Number(b.dataset.dur) === sec ? "gold-pill-btn" : "app-btn-sec"}`;
    });
    _updateAcBoxUI();
}

function toggleAudioCropPreview() {
    if (!_acAudio) return;
    if (_acAudio.paused) {
        _acAudio.currentTime = _acStartSec;
        _acAudio.play().catch(() => {});
        clearInterval(_acPlayTimer);
        _acPlayTimer = setInterval(() => {
            if (!_acAudio || _acAudio.paused) return;
            const clipLen = Math.min(_acTotalDur, _acDuration);
            const rel = _acAudio.currentTime - _acStartSec;
            if (rel >= clipLen) _acAudio.currentTime = _acStartSec;
            const ph = document.getElementById("ac-playhead");
            if (ph) ph.style.left = `${Math.max(0, Math.min(100, (rel / Math.max(1, clipLen)) * 100))}%`;
        }, 120);
    } else {
        _acAudio.pause();
        clearInterval(_acPlayTimer);
    }
}

function closeAudioCropper() {
    clearInterval(_acPlayTimer);
    if (_acAudio) { _acAudio.pause(); _acAudio = null; }
    if (_acBlobUrl) { try { URL.revokeObjectURL(_acBlobUrl); } catch {} _acBlobUrl = ""; }
    document.getElementById("modal-audio-cropper")?.classList.add("hide");
}

async function _ensureLameJsReady() {
    if (window.lamejs && window.lamejs.Mp3Encoder) return true;
    const cdns = [
        "https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js",
        "https://unpkg.com/lamejs@1.2.1/lame.min.js"
    ];
    for (const url of cdns) {
        try {
            await loadScriptOnce(url);
            if (window.lamejs && window.lamejs.Mp3Encoder) return true;
        } catch {}
    }
    return false;
}

async function _sliceAudioFileDataUrl(file, startSec, clipSec) {
    try {
        await _ensureLameJsReady();
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) throw new Error("No AudioContext");
        const arrBuf = await file.arrayBuffer();
        const ctx = new AudioCtx();
        const decoded = await ctx.decodeAudioData(arrBuf);
        const origSr = decoded.sampleRate;
        const hasMp3 = !!(window.lamejs && window.lamejs.Mp3Encoder);
        const targetSr = hasMp3 ? 22050 : 11025;
        const ratio = origSr / targetSr;
        const startIdx = Math.max(0, Math.min(decoded.length - 1, Math.floor(startSec * origSr)));
        const endIdx = Math.max(startIdx + origSr, Math.min(decoded.length, Math.floor((startSec + clipSec) * origSr)));
        const outLen = Math.max(1, Math.floor((endIdx - startIdx) / ratio));

        const ch0 = decoded.getChannelData(0);
        const ch1 = decoded.numberOfChannels > 1 ? decoded.getChannelData(1) : ch0;
        const monoSamples = new Int16Array(outLen);
        for (let i = 0; i < outLen; i++) {
            const srcIdx = Math.min(decoded.length - 1, startIdx + Math.floor(i * ratio));
            const mixed = ((ch0[srcIdx] || 0) + (ch1[srcIdx] || 0)) * 0.5;
            const s = Math.max(-1, Math.min(1, mixed));
            monoSamples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        if (ctx.close) ctx.close().catch(() => {});

        if (hasMp3) {
            const mp3enc = new window.lamejs.Mp3Encoder(1, targetSr, 80);
            const mp3Data = [];
            const sampleBlockSize = 1152;
            for (let i = 0; i < monoSamples.length; i += sampleBlockSize) {
                const chunk = monoSamples.subarray(i, i + sampleBlockSize);
                const mp3buf = mp3enc.encodeBuffer(chunk);
                if (mp3buf.length > 0) mp3Data.push(mp3buf);
            }
            const endBuf = mp3enc.flush();
            if (endBuf.length > 0) mp3Data.push(endBuf);

            let totalBytes = 0;
            mp3Data.forEach(b => totalBytes += b.length);
            const merged = new Uint8Array(totalBytes);
            let pos = 0;
            mp3Data.forEach(b => { merged.set(b, pos); pos += b.length; });

            let bin = "";
            const step = 0x8000;
            for (let i = 0; i < merged.length; i += step) {
                bin += String.fromCharCode.apply(null, merged.subarray(i, i + step));
            }
            return "data:audio/mpeg;base64," + btoa(bin);
        }

        const wavLen = 44 + monoSamples.length * 2;
        const outBuf = new ArrayBuffer(wavLen);
        const view = new DataView(outBuf);
        const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
        writeStr(0, "RIFF");
        view.setUint32(4, 36 + monoSamples.length * 2, true);
        writeStr(8, "WAVE");
        writeStr(12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, targetSr, true);
        view.setUint32(28, targetSr * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeStr(36, "data");
        view.setUint32(40, monoSamples.length * 2, true);
        let offset = 44;
        for (let i = 0; i < monoSamples.length; i++) {
            view.setInt16(offset, monoSamples[i], true);
            offset += 2;
        }
        const bytes = new Uint8Array(outBuf);
        let bin = "";
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return "data:audio/wav;base64," + btoa(bin);
    } catch {
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }
}

async function processAndUploadCroppedAudio() {
    if (!_acFile) return;
    setBtnLoading("btn-save-audio-crop", true, "Memotong & Kompresi MP3...");
    const clipLen = Math.min(_acTotalDur, _acDuration);
    const songTitle = (document.getElementById("ac-song-title")?.value || "").trim() || _acFile.name.replace(/\.[^/.]+$/, "");
    const songCat = _acTargetMode === "library"
        ? ((document.getElementById("ac-song-cat")?.value || "").trim() || "Pernikahan")
        : ((typeof wizardState !== "undefined" && wizardState.category) || "Pernikahan");

    const audioDataUrl = await _sliceAudioFileDataUrl(_acFile, _acStartSec, clipLen);
    setBtnLoading("btn-save-audio-crop", true, "Mengunggah Lagu...");
    const up = await apiAction({ action: "upload_media", dataUrl: audioDataUrl, prefix: "audio_clip" });
    setBtnLoading("btn-save-audio-crop", false);
    if (up && up.ok && up.url) {
        idbSet("audio_data_" + encodeURIComponent(up.url), audioDataUrl);
        const localBlobUrl = dataUrlToBlobUrl(audioDataUrl) || audioDataUrl;
        _audioBlobCache.set(up.url, localBlobUrl);

        if (!Array.isArray(db.musicLibrary)) db.musicLibrary = [];
        if (!db.musicLibrary.some(m => m.url === up.url)) {
            db.musicLibrary.unshift({
                id: Date.now(),
                title: songTitle,
                category: songCat,
                url: up.url
            });
            await apiAction({ action: "update_section", section: "musicLibrary", value: db.musicLibrary });
            if (typeof populateMusicDropdown === "function") populateMusicDropdown(up.url);
        }

        if (_acTargetMode === "wizard") {
            if (typeof wizardState !== "undefined") {
                wizardState.customAudioUrl = up.url;
                wizardState.customAudioTitle = songTitle;
            }
            const st = document.getElementById("audio-upload-status");
            if (st) {
                st.innerText = `✓ Lagu "${songTitle}" (${_fmtSec(_acStartSec)}–${_fmtSec(_acStartSec + clipLen)}) siap & masuk stok lagu!`;
                st.classList.remove("hide");
            }
        } else {
            if (typeof renderMasterWorkspaceContent === "function") renderMasterWorkspaceContent();
        }

        closeAudioCropper();
        showToast(`Lagu "${songTitle}" berhasil diunggah ke Stok Lagu!`);
    } else {
        showToast("Gagal mengunggah lagu. Pastikan koneksi stabil atau pilih durasi lebih singkat.", "error");
    }
}
