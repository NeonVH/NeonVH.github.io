// =========================================================================
// NEONVH SUPREME CORE V30 - BẢN PHỤC HỒI HOÀN HẢO (FULL UI + SECURITY)
// =========================================================================

// --- 1. HỆ THỐNG BẢO VỆ CHỐNG SOI ---
document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = e => {
    if(e.keyCode == 123 || (e.ctrlKey && e.shiftKey && e.keyCode == 73)) return false;
    if(e.ctrlKey && [85, 67, 74].includes(e.keyCode)) return false;
};
setInterval(() => {
    let start = new Date().getTime(); debugger;
    if (new Date().getTime() - start > 100) document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:20%; font-family:sans-serif;'>SECURITY ALERT: F12 DETECTED!</h1>";
}, 1000);

// --- 2. BIẾN TOÀN CỤC & CONFIG ---
const fallbackImg = "https://i.imgur.com/8N4N89n.png";
const VERCEL_API = "https://neon-vh-github-io.vercel.app/api";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

let gamesDB = [], isLoginMode = true, db = null, isOnline = false;
let lastActionTime = 0; const COOLDOWN_MS = 3000;

// --- 3. KHỞI TẠO HỆ THỐNG ---
async function initApp() {
    const statusEl = document.getElementById('networkStatus');
    if(statusEl) { statusEl.innerText = "Đang kết nối..."; statusEl.className = "text-[10px] text-yellow-400 animate-pulse"; }

    try {
        const res = await fetch(`${VERCEL_API}?type=get_gate`);
        const config = await res.json();
        if(config && config.apiKey) {
            firebase.initializeApp(config);
            db = firebase.firestore();
            db.settings({ experimentalForceLongPolling: true });
            isOnline = true;
        }
    } catch(e) { console.warn("Offline Mode"); }

    if(statusEl) {
        statusEl.innerText = isOnline ? "☁️ SECURED CLOUD" : "⚠️ OFFLINE";
        statusEl.className = isOnline ? "text-[10px] font-black text-[#00f0ff] ml-2 border border-[#00f0ff]/30 px-2 py-0.5 rounded-full" : "text-[10px] text-red-500 ml-2";
    }

    await loadGamesFromStorage();
    renderGameGrid();
    checkAuthState();
    initParticles();

    const savedView = localStorage.getItem('nv_current_view') || 'homeView';
    switchView(savedView === 'detailView' ? 'homeView' : savedView);
}

async function loadGamesFromStorage() {
    if(isOnline) {
        try {
            const snap = await db.collection('games').orderBy('createdAt', 'desc').get();
            gamesDB = snap.docs.map(doc => ({ dbId: doc.id, ...doc.data() }));
        } catch(e) { gamesDB = JSON.parse(localStorage.getItem('nv_custom_games')) || []; }
    } else { gamesDB = JSON.parse(localStorage.getItem('nv_custom_games')) || []; }
}

// --- 4. RENDER GIAO DIỆN KHO GAME (PHỤC HỒI BẢN ĐẸP) ---
function renderGameGrid(data = gamesDB) {
    const container = document.getElementById('gameGridContainer');
    if(!container) return;
    if(data.length === 0) { container.innerHTML = '<p class="text-gray-500 italic py-10 text-center w-full">Kho game trống.</p>'; return; }

    container.innerHTML = data.map(game => {
        // Render Tags dạng Badge
        const tagList = game.genre.split(',').slice(0, 4).map(t => `<span class="bg-[#bc13fe]/10 text-[#bc13fe] text-[8px] md:text-[9px] px-2 py-0.5 rounded border border-[#bc13fe]/20 uppercase font-bold mr-1 mb-1 inline-block">${t.trim()}</span>`).join('');
        
        return `
        <div onclick="openGameDetail('${game.id}')" class="card-3d glass-panel rounded-2xl overflow-hidden flex flex-row items-stretch h-[160px] md:h-[190px] border border-white/5 hover:border-[#bc13fe]/50 transition-all duration-300 group mb-4">
            <div class="w-32 md:w-52 flex-shrink-0 relative overflow-hidden">
                <div class="shine"></div>
                ${game.is18 ? `<div class="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_red] z-10 animate-pulse">18+</div>` : ''}
                <img src="${game.cover}" onerror="this.src=fallbackImg" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
            </div>
            <div class="flex-1 p-4 md:p-6 bg-gradient-to-br from-[#0a0a0a] to-[#111] flex flex-col min-w-0">
                <h3 class="logo-font font-black text-white text-base md:text-xl truncate mb-1 group-hover:text-[#bc13fe] transition">${game.title}</h3>
                <div class="flex items-center gap-2 text-[10px] text-gray-500 mb-2 font-bold">
                    <span class="text-white">${game.author || 'NeonVH'}</span> | <span class="text-[#00f0ff]">${game.version || 'v1.0'}</span>
                </div>
                <div class="flex-1 overflow-hidden pointer-events-none">${tagList}</div>
                <div class="mt-auto pt-3 border-t border-white/5 flex justify-between items-center">
                    <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest"><i class="fa-solid fa-users text-[#bc13fe] mr-1"></i>${game.team}</span>
                    <span class="text-[10px] font-black text-yellow-400 uppercase tracking-tighter"><i class="fa-solid fa-spinner fa-spin mr-1"></i>${game.progress || '100%'}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

// --- 5. ĐIỀU HƯỚNG & MENU (FIX LỖI 3 GẠCH) ---
function toggleDrawer() {
    const drawer = document.getElementById('mobileDrawer');
    if (drawer.classList.contains('translate-x-full')) {
        drawer.classList.remove('translate-x-full');
        drawer.classList.add('translate-x-0');
    } else {
        drawer.classList.remove('translate-x-0');
        drawer.classList.add('translate-x-full');
    }
}

function switchView(viewId) {
    localStorage.setItem('nv_current_view', viewId);
    const views = ['homeView', 'detailView', 'adminView', 'profileView'];
    views.forEach(id => {
        const el = document.getElementById(id);
        if(!el) return;
        if(id === viewId) {
            el.classList.remove('view-hidden');
            el.classList.add('view-active');
        } else {
            el.classList.remove('view-active');
            el.classList.add('view-hidden');
        }
    });
    if(viewId === 'adminView') renderAdminManageList();
    if(viewId === 'profileView') updateProfileView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 6. CHI TIẾT GAME (CHỐNG XSS) ---
function openGameDetail(gameId) {
    const game = gamesDB.find(g => g.id == gameId);
    if(!game) return;
    localStorage.setItem('nv_current_game', gameId);

    document.getElementById('detailCover').src = game.cover;
    document.getElementById('detailTitle').innerText = game.title;
    document.getElementById('detailAuthor').innerText = game.author || "N/A";
    document.getElementById('detailVersion').innerText = game.version || "1.0";
    document.getElementById('detailGenre').innerText = game.genre;
    document.getElementById('detailDesc').innerText = game.desc;
    
    const l = game.links || { android: {}, pc: {} };
    const renderBtn = (u, n, c) => u ? `<a href="${u}" target="_blank" class="w-full py-3 ${c} text-white font-black rounded-xl flex items-center justify-center gap-2 text-sm transition hover:scale-95"><i class="fa-solid fa-download"></i> TẢI QUA ${n}</a>` : '';
    
    document.getElementById('detailAndroidLinks').innerHTML = renderBtn(l.android?.terabox, 'TERABOX', 'bg-blue-600') + renderBtn(l.android?.mediafire, 'MEDIAFIRE', 'bg-red-500');
    document.getElementById('detailPcLinks').innerHTML = renderBtn(l.pc?.terabox, 'TERABOX', 'bg-blue-600') + renderBtn(l.pc?.mediafire, 'MEDIAFIRE', 'bg-red-500');

    switchView('detailView');
}

// --- 7. XỬ LÝ AUTH (BẢO MẬT BACKEND) ---
async function handleAuth(e) {
    e.preventDefault();
    const u = document.getElementById('authUsername').value.trim(), p = document.getElementById('authPassword').value;
    const btn = document.getElementById('authSubmitBtn');
    btn.innerHTML = "ĐANG XỬ LÝ..."; btn.disabled = true;

    try {
        const res = await (await fetch(`${VERCEL_API}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ u, p, action: isLoginMode ? 'login' : 'register' })
        })).json();

        if (res.error) throw new Error(res.error);

        if (res.roleHash === "adm_x99") {
            localStorage.setItem('nv_current_user', 'Admin');
            localStorage.setItem('nv_role', 'admin');
            localStorage.setItem('nv_token', res.token);
            location.reload();
        } else {
            const secureP = res.hashedPass;
            if(isLoginMode) {
                const snap = await db.collection('users').where('u', '==', u).where('p', '==', secureP).get();
                if(snap.empty) throw new Error("Sai tài khoản hoặc mật khẩu!");
                localStorage.setItem('nv_current_user', u); localStorage.setItem('nv_role', 'user');
                location.reload();
            } else {
                await db.collection('users').add({u, p: secureP, avatar: '', vipLevel: 'none', lastLogin: Date.now()});
                showToast("Đăng ký thành công!"); toggleAuthMode();
            }
        }
    } catch(err) { showToast(err.message, "error"); }
    btn.innerHTML = isLoginMode ? "VÀO HỆ THỐNG" : "TẠO TÀI KHOẢN"; btn.disabled = false;
}

// --- 8. HIỆU ỨNG HẠT BAY ---
function initParticles() {
    const c = document.getElementById("particleCanvas"); if(!c) return;
    const ctx = c.getContext("2d");
    c.width = window.innerWidth; c.height = window.innerHeight;
    let p = Array.from({length: 30}, () => ({x: Math.random()*c.width, y: Math.random()*c.height, r: Math.random()*1.5, dx: (Math.random()-0.5)*0.5, dy: (Math.random()-0.5)*0.5}));
    function draw() {
        ctx.clearRect(0,0,c.width,c.height); ctx.fillStyle = "rgba(188, 19, 254, 0.4)";
        p.forEach(i => {
            ctx.beginPath(); ctx.arc(i.x, i.y, i.r, 0, 7); ctx.fill();
            i.x += i.dx; i.y += i.dy;
            if(i.x<0 || i.x>c.width) i.dx*=-1; if(i.y<0 || i.y>c.height) i.dy*=-1;
        });
        requestAnimationFrame(draw);
    } draw();
}

// --- 9. TIỆN ÍCH KHÁC ---
function showToast(msg, type="success") {
    const c = document.getElementById('toastContainer'), t = document.createElement('div');
    t.className = `glass-panel px-6 py-3 rounded-2xl border ${type==='error'?'border-red-500 shadow-[0_0_10px_red]':'border-[#00f0ff] shadow-[0_0_10px_#00f0ff]'} text-white font-bold text-xs mb-2 animate-bounce`;
    t.innerText = msg; c.appendChild(t); setTimeout(() => t.remove(), 3000);
}

function handleSearch(q) {
    const s = q.toLowerCase().trim();
    renderGameGrid(gamesDB.filter(g => g.title.toLowerCase().includes(s) || g.genre.toLowerCase().includes(s)));
}

function checkAuthState() {
    const u = localStorage.getItem('nv_current_user'), r = localStorage.getItem('nv_role');
    document.getElementById('authContainer').style.display = u ? 'none' : 'flex';
    document.getElementById('userContainer').style.display = u ? 'flex' : 'none';
    if(u) {
        document.getElementById('userNameDisplay').innerText = u;
        if(r === 'admin') {
            document.getElementById('navAdminBtn').classList.remove('hidden');
            document.getElementById('mobileAdminBtn').classList.remove('hidden');
        }
    }
}

// --- 10. PHỤC HỒI CÁC HÀM CŨ ---
function toggleAuthMode() { isLoginMode = !isLoginMode; document.getElementById('authTitle').innerText = isLoginMode ? "ĐĂNG NHẬP" : "ĐĂNG KÝ"; }
function toggleAuthModal(m) { isLoginMode = (m === 'login'); toggleAuthMode(); toggleAuthMode(); document.getElementById('authModal').classList.remove('hidden'); setTimeout(() => document.getElementById('authModal').classList.add('opacity-100'), 10); }
function closeAuthModal() { document.getElementById('authModal').classList.add('hidden'); }
function logout() { localStorage.clear(); location.reload(); }
function openLightbox(s) { document.getElementById('lightboxImage').src = s; document.getElementById('imageLightbox').classList.remove('hidden'); }
function closeLightbox() { document.getElementById('imageLightbox').classList.add('hidden'); }

window.onload = initApp;
